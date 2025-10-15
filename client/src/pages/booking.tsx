import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CalendarDays, MapPin, Users, Ticket, CreditCard, 
  ShieldCheck, Trophy, Info, CheckCircle2, AlertCircle
} from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface Competition {
  id: string;
  name: string;
  date: string;
  venue: string;
  pegsTotal: number;
  pegsAvailable: number;
  entryFee: string;
  prizePool: string;
  description: string;
}

function PaymentForm({ 
  competition, 
  totalAmount, 
  onSuccess 
}: { 
  competition: Competition; 
  totalAmount: number; 
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
      } else {
        toast({
          title: "Payment Successful",
          description: "Your peg has been booked!",
        });
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

  const competition: Competition = {
    id: params?.id || "1",
    name: "Spring Carp Qualifier",
    date: "15th March 2024, 6:00 AM - 4:00 PM",
    venue: "Willow Lake Fishery, Oxfordshire",
    pegsTotal: 40,
    pegsAvailable: 12,
    entryFee: "£45.00",
    prizePool: "£1,200",
    description: "Join us for the Spring Carp Qualifier at the prestigious Willow Lake Fishery. This qualifier event features 40 pegs across two lakes with excellent carp stocks.",
  };

  const entryFee = 45.00;
  const bookingFee = 2.00;
  const totalAmount = entryFee + bookingFee;

  useEffect(() => {
    if (acceptTerms && !clientSecret && !paymentError) {
      // Don't send amount - server calculates it from authoritative pricing data
      apiRequest("POST", "/api/create-payment-intent", {
        competitionId: competition.id,
        competitionName: competition.name,
      })
        .then((res) => res.json())
        .then((data: { clientSecret?: string; amount?: number; message?: string }) => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
            // Server returns the calculated amount for verification/display
            if (data.amount && Math.abs(data.amount - totalAmount) > 0.01) {
              console.warn("Client amount doesn't match server amount", {
                client: totalAmount,
                server: data.amount,
              });
            }
          } else {
            throw new Error(data.message || "Failed to initialize payment");
          }
        })
        .catch((error) => {
          const errorMessage = error.message || "Payment processing is not configured. Please contact support.";
          setPaymentError(errorMessage);
          toast({
            title: "Payment Setup Error",
            description: errorMessage,
            variant: "destructive",
          });
        });
    }
  }, [acceptTerms, clientSecret, paymentError, competition.id, competition.name, totalAmount, toast]);

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
                  {competition.date.split(',')[0]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Venue</span>
                <span className="font-semibold" data-testid="text-confirmation-venue">
                  {competition.venue}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Peg Assignment</span>
                <Badge data-testid="badge-peg-assignment">
                  To be confirmed 24hrs before event
                </Badge>
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

  const showPaymentForm = acceptTerms && clientSecret && stripePromise;
  const showStripeNotConfigured = acceptTerms && paymentError && !stripePromise;

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
                          {competition.date}
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
                          {competition.pegsAvailable} of {competition.pegsTotal} pegs available
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Trophy className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Prize Pool</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-competition-prize">
                          {competition.prizePool}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Peg numbers will be assigned randomly 24 hours before the competition and sent to your email.
                    </AlertDescription>
                  </Alert>
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

              {showPaymentForm && (
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
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <PaymentForm 
                        competition={competition}
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
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Booking Fee</span>
                      <span className="font-semibold">£{bookingFee.toFixed(2)}</span>
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
