import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CalendarDays, MapPin, Users, Ticket, CreditCard, 
  ShieldCheck, Trophy, Info, CheckCircle2, AlertCircle
} from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { type Competition } from "@shared/schema";

declare global {
  interface Window {
    RUNTIME_CONFIG?: {
      VITE_STRIPE_PUBLIC_KEY?: string;
    };
  }
}

// Lazy load Stripe - keys might be injected later via window.RUNTIME_CONFIG
let stripePromise: ReturnType<typeof loadStripe> | null = null;
let stripePromiseLoaded = false;

function getStripePromise() {
  if (!stripePromiseLoaded) {
    const stripePublicKey = window.RUNTIME_CONFIG?.VITE_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (stripePublicKey) {
      console.log('[Booking] Loading Stripe with public key');
      stripePromise = loadStripe(stripePublicKey);
    } else {
      console.warn('[Booking] Stripe public key not found in RUNTIME_CONFIG or environment');
    }
    stripePromiseLoaded = true;
  }
  return stripePromise;
}

function PaymentForm({ 
  competitionId,
  teamId,
  totalAmount, 
  onSuccess 
}: { 
  competitionId: string;
  teamId?: string | null;
  totalAmount: number; 
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || isProcessing || hasProcessed) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        // Check if this is a "payment already succeeded" error (idempotent case)
        if (error.code === 'payment_intent_unexpected_state') {
          console.log('[Booking] Payment intent already succeeded (idempotent), proceeding with booking confirmation');
          // Get the payment intent ID from error details if available
          const pi = (error as any).payment_intent;
          if (pi && pi.id && pi.status === 'succeeded') {
            // Call backend to confirm payment and join competition atomically
            const requestBody: any = {
              paymentIntentId: pi.id,
              competitionId,
            };
            
            if (teamId) {
              requestBody.teamId = teamId;
            }
            
            const response = await apiRequest("POST", "/api/confirm-payment-and-join", requestBody);

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.message || "Failed to confirm booking");
            }

            setHasProcessed(true);
            toast({
              title: "Payment Successful",
              description: teamId ? "Your team peg has been booked!" : "Your peg has been booked!",
            });

            if (teamId) {
              await queryClient.invalidateQueries({ 
                queryKey: [`/api/competitions/${competitionId}/teams`] 
              });
            }

            onSuccess();
            return;
          }
        }

        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Call backend to confirm payment and join competition atomically
        const requestBody: any = {
          paymentIntentId: paymentIntent.id,
          competitionId,
        };
        
        // Include teamId if this is a team booking
        if (teamId) {
          requestBody.teamId = teamId;
        }
        
        const response = await apiRequest("POST", "/api/confirm-payment-and-join", requestBody);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to confirm booking");
        }

        setHasProcessed(true);
        toast({
          title: "Payment Successful",
          description: teamId ? "Your team peg has been booked!" : "Your peg has been booked!",
        });

        // Invalidate the teams query cache so admin panel sees updated team with peg assignment
        if (teamId) {
          await queryClient.invalidateQueries({ 
            queryKey: [`/api/competitions/${competitionId}/teams`] 
          });
        }

        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit"
        className="w-full" 
        size="lg"
        disabled={!stripe || isProcessing}
        data-testid="button-submit-payment"
      >
        {isProcessing ? (
          <>Processing...</>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            Pay £{totalAmount.toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
}

export default function Booking() {
  const [, params] = useRoute("/booking/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [bookingComplete, setBookingComplete] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);

  const competitionId = params?.id || "";

  // Fetch competition data from API
  const { data: competition, isLoading: competitionLoading } = useQuery<Competition>({
    queryKey: [`/api/competitions/${competitionId}`],
    enabled: !!competitionId,
  });

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ["/api/user/me"],
  });

  // Fetch user's team if this is a team competition
  const { data: userTeam, isLoading: teamLoading } = useQuery<any>({
    queryKey: [`/api/competitions/${competitionId}/my-team`],
    enabled: !!user && !!competition && competition.competitionMode === "team",
  });

  // IMPORTANT: Always call useEffect before any conditional returns to avoid "Rendered more hooks" error
  useEffect(() => {
    if (acceptTerms && !clientSecret && !paymentError && !isCreatingPaymentIntent && competition) {
      const entryFee = parseFloat(competition.entryFee);
      
      // For team competitions, verify user has a team
      if (competition.competitionMode === "team" && !userTeam) {
        setPaymentError("You must be part of a team to book this competition. Please create or join a team first.");
        toast({
          title: "Team Required",
          description: "Please create or join a team before booking.",
          variant: "destructive",
        });
        return;
      }

      // For team competitions, verify user is the team creator
      if (competition.competitionMode === "team" && userTeam && user && userTeam.createdBy !== (user as any).id) {
        setPaymentError("Only the team creator can make payment for the team.");
        toast({
          title: "Permission Denied",
          description: "Only the team creator can complete the booking and payment.",
          variant: "destructive",
        });
        return;
      }
      
      // Handle free competitions (no payment required)
      if (entryFee === 0) {
        console.log('[Booking] Free competition detected, joining without payment');
        setIsCreatingPaymentIntent(true);
        const requestBody: any = {
          paymentIntentId: "free-competition",
          competitionId: competition.id,
        };
        
        if (competition.competitionMode === "team" && userTeam) {
          requestBody.teamId = userTeam.id;
        }
        
        apiRequest("POST", "/api/confirm-payment-and-join", requestBody)
          .then((res) => {
            if (!res.ok) {
              return res.json().then(data => {
                throw new Error(data.message || "Failed to complete booking");
              });
            }
            return res.json();
          })
          .then((data) => {
            console.log('[Booking] Free competition booking successful:', data);
            toast({
              title: "Booking Confirmed",
              description: competition.competitionMode === "team" 
                ? `Your team has been registered${data.pegNumber ? ` to peg ${data.pegNumber}` : ''}!` 
                : "You have been registered!",
            });
            
            // Invalidate teams cache for admin panel
            if (competition.competitionMode === "team" && userTeam) {
              queryClient.invalidateQueries({ 
                queryKey: [`/api/competitions/${competition.id}/teams`] 
              });
            }
            
            setBookingComplete(true);
          })
          .catch((error) => {
            console.error('[Booking] Free booking error:', error);
            setPaymentError(error.message || "Failed to complete booking");
            toast({
              title: "Booking Error",
              description: error.message || "An unexpected error occurred",
              variant: "destructive",
            });
            setIsCreatingPaymentIntent(false);
          });
        return;
      }
      
      // Paid competitions: create payment intent
      console.log('[Booking] Creating payment intent for competition:', competition.id);
      setIsCreatingPaymentIntent(true);
      
      // Prepare payment intent request
      const requestBody: any = {
        competitionId: competition.id,
      };
      
      // Include teamId for team competitions
      if (competition.competitionMode === "team" && userTeam) {
        requestBody.teamId = userTeam.id;
      }
      
      // Don't send amount - server calculates it from authoritative pricing data
      apiRequest("POST", "/api/create-payment-intent", requestBody)
        .then((res) => {
          if (!res.ok) {
            return res.json().then(data => {
              throw new Error(data.message || "Failed to initialize payment");
            });
          }
          return res.json();
        })
        .then((data: { clientSecret?: string; amount?: number; message?: string }) => {
          console.log('[Booking] Payment intent created successfully');
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            throw new Error(data.message || "Failed to initialize payment");
          }
        })
        .catch((error) => {
          console.error('[Booking] Payment setup error:', error);
          const errorMessage = error.message || "Payment processing is not configured. Please contact support.";
          setPaymentError(errorMessage);
          toast({
            title: "Payment Setup Error",
            description: errorMessage,
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsCreatingPaymentIntent(false);
        });
    }
  }, [acceptTerms, clientSecret, paymentError, competition]);

  if (!competitionId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Competition</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No competition ID provided.</p>
            <Button className="mt-4" onClick={() => setLocation("/competitions")}>
              Browse Competitions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (competitionLoading || !competition || (competition.competitionMode === "team" && teamLoading)) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  const entryFee = parseFloat(competition.entryFee);
  const totalAmount = entryFee;

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl" data-testid="text-booking-success-title">
              Booking Confirmed!
            </CardTitle>
            <CardDescription>
              Your peg has been reserved for {competition.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                A confirmation email has been sent to your registered email address with your ticket and QR code.
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Competition</span>
                <span className="font-semibold" data-testid="text-confirmation-competition">
                  {competition.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-semibold" data-testid="text-confirmation-date">
                  {competition.date}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Venue</span>
                <span className="font-semibold" data-testid="text-confirmation-venue">
                  {competition.venue}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="flex-1" 
                onClick={() => setLocation("/competitions")}
                data-testid="button-browse-competitions"
              >
                Browse More Competitions
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setLocation("/profile")}
                data-testid="button-view-profile"
              >
                View My Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ensure stripe is loaded when needed
  const stripePromiseRef = getStripePromise();
  
  const showPaymentForm = acceptTerms && clientSecret && stripePromiseRef;
  const showStripeNotConfigured = acceptTerms && paymentError && !stripePromiseRef;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-booking-title">
              Book Your Peg
            </h1>
            <p className="text-muted-foreground">
              Complete your booking to secure your place in the competition
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Competition Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-3" data-testid="text-competition-name">
                      {competition.name}
                    </h3>
                    <p className="text-muted-foreground mb-4">{competition.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Date & Time</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-competition-date">
                          {competition.date} at {competition.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Venue</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-competition-venue">
                          {competition.venue}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Availability</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-competition-availability">
                          {competition.pegsTotal - competition.pegsBooked} of {competition.pegsTotal} pegs available
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Trophy className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Prize Type</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-competition-prize">
                          {competition.prizeType}
                        </p>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      data-testid="checkbox-terms"
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      I agree to the competition rules and terms & conditions. I understand that entry fees are non-refundable unless the event is cancelled.
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {showPaymentForm && stripePromiseRef && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Details
                    </CardTitle>
                    <CardDescription>
                      Secure payment powered by Stripe
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Elements stripe={stripePromiseRef} options={{ clientSecret }}>
                      <PaymentForm 
                        competitionId={competition.id}
                        teamId={competition.competitionMode === "team" ? userTeam?.id : null}
                        totalAmount={totalAmount}
                        onSuccess={() => setBookingComplete(true)}
                      />
                    </Elements>
                  </CardContent>
                  <CardFooter className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Your payment information is encrypted and secure</span>
                  </CardFooter>
                </Card>
              )}

              {showStripeNotConfigured && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      Payment Not Configured
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {paymentError}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}

              {acceptTerms && !clientSecret && !paymentError && (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                      <span className="ml-3 text-muted-foreground">Initializing payment...</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Entry Fee</span>
                      <span className="font-semibold" data-testid="text-entry-fee">
                        £{entryFee.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold" data-testid="text-total-price">
                        £{totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
                {!acceptTerms && (
                  <CardFooter className="flex-col gap-3">
                    <p className="text-xs text-center text-muted-foreground">
                      Please accept the terms and conditions to proceed
                    </p>
                  </CardFooter>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
