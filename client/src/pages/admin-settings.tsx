import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Save, Globe, Mail, CreditCard, Bell } from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();

  const [generalSettings, setGeneralSettings] = useState({
    siteName: "Peg Slam",
    siteTagline: "UK's Premier Fishing Competitions",
    contactEmail: "info@pegslam.co.uk",
    supportEmail: "support@pegslam.co.uk",
    organizerName: "Peg Slam Events Ltd",
  });

  const [paymentSettings, setPaymentSettings] = useState({
    currency: "GBP",
    bookingFee: "2.50",
    taxRate: "0",
    stripeEnabled: true,
    paypalEnabled: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    bookingConfirmations: true,
    competitionReminders: true,
    resultNotifications: true,
  });

  const [aboutContent, setAboutContent] = useState({
    missionStatement: "To provide the UK's premier fishing competition platform, connecting anglers with exciting matches and creating memorable fishing experiences.",
    organizerBio: "Founded by passionate anglers, Peg Slam has been organizing quality fishing competitions across the UK since 2020.",
  });

  const handleSaveGeneral = () => {
    toast({
      title: "Settings saved",
      description: "General settings have been updated successfully.",
    });
  };

  const handleSavePayment = () => {
    toast({
      title: "Settings saved",
      description: "Payment settings have been updated successfully.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Settings saved",
      description: "Notification settings have been updated successfully.",
    });
  };

  const handleSaveAbout = () => {
    toast({
      title: "Settings saved",
      description: "About content has been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">
          Manage platform configuration and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>General Settings</CardTitle>
          </div>
          <CardDescription>
            Basic platform information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={generalSettings.siteName}
                onChange={(e) =>
                  setGeneralSettings({ ...generalSettings, siteName: e.target.value })
                }
                data-testid="input-site-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="siteTagline">Site Tagline</Label>
              <Input
                id="siteTagline"
                value={generalSettings.siteTagline}
                onChange={(e) =>
                  setGeneralSettings({ ...generalSettings, siteTagline: e.target.value })
                }
                data-testid="input-site-tagline"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={generalSettings.contactEmail}
                onChange={(e) =>
                  setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })
                }
                data-testid="input-contact-email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={generalSettings.supportEmail}
                onChange={(e) =>
                  setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })
                }
                data-testid="input-support-email"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="organizerName">Organizer Name</Label>
            <Input
              id="organizerName"
              value={generalSettings.organizerName}
              onChange={(e) =>
                setGeneralSettings({ ...generalSettings, organizerName: e.target.value })
              }
              data-testid="input-organizer-name"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveGeneral} data-testid="button-save-general">
              <Save className="h-4 w-4 mr-2" />
              Save General Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Payment Settings</CardTitle>
          </div>
          <CardDescription>
            Configure payment processing and fees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={paymentSettings.currency}
                onChange={(e) =>
                  setPaymentSettings({ ...paymentSettings, currency: e.target.value })
                }
                disabled
                data-testid="input-currency"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bookingFee">Booking Fee (£)</Label>
              <Input
                id="bookingFee"
                type="number"
                step="0.01"
                value={paymentSettings.bookingFee}
                onChange={(e) =>
                  setPaymentSettings({ ...paymentSettings, bookingFee: e.target.value })
                }
                data-testid="input-booking-fee"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.1"
                value={paymentSettings.taxRate}
                onChange={(e) =>
                  setPaymentSettings({ ...paymentSettings, taxRate: e.target.value })
                }
                data-testid="input-tax-rate"
              />
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Stripe Payments</Label>
                <p className="text-sm text-muted-foreground">
                  Enable credit/debit card payments via Stripe
                </p>
              </div>
              <Switch
                checked={paymentSettings.stripeEnabled}
                onCheckedChange={(checked) =>
                  setPaymentSettings({ ...paymentSettings, stripeEnabled: checked })
                }
                data-testid="switch-stripe"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>PayPal Payments</Label>
                <p className="text-sm text-muted-foreground">
                  Enable PayPal as a payment option
                </p>
              </div>
              <Switch
                checked={paymentSettings.paypalEnabled}
                onCheckedChange={(checked) =>
                  setPaymentSettings({ ...paymentSettings, paypalEnabled: checked })
                }
                data-testid="switch-paypal"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSavePayment} data-testid="button-save-payment">
              <Save className="h-4 w-4 mr-2" />
              Save Payment Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notification Settings</CardTitle>
          </div>
          <CardDescription>
            Configure automated notifications for users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email notifications to users
                </p>
              </div>
              <Switch
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                }
                data-testid="switch-email-notifications"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send SMS alerts for important updates
                </p>
              </div>
              <Switch
                checked={notificationSettings.smsNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, smsNotifications: checked })
                }
                data-testid="switch-sms-notifications"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Booking Confirmations</Label>
                <p className="text-sm text-muted-foreground">
                  Send confirmation when peg is booked
                </p>
              </div>
              <Switch
                checked={notificationSettings.bookingConfirmations}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, bookingConfirmations: checked })
                }
                data-testid="switch-booking-confirmations"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Competition Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Send reminders before competition starts
                </p>
              </div>
              <Switch
                checked={notificationSettings.competitionReminders}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, competitionReminders: checked })
                }
                data-testid="switch-competition-reminders"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Result Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Notify anglers when results are published
                </p>
              </div>
              <Switch
                checked={notificationSettings.resultNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, resultNotifications: checked })
                }
                data-testid="switch-result-notifications"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveNotifications} data-testid="button-save-notifications">
              <Save className="h-4 w-4 mr-2" />
              Save Notification Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>About Content</CardTitle>
          </div>
          <CardDescription>
            Manage content displayed on the About page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="missionStatement">Mission Statement</Label>
            <Textarea
              id="missionStatement"
              value={aboutContent.missionStatement}
              onChange={(e) =>
                setAboutContent({ ...aboutContent, missionStatement: e.target.value })
              }
              rows={3}
              data-testid="input-mission-statement"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="organizerBio">Organizer Bio</Label>
            <Textarea
              id="organizerBio"
              value={aboutContent.organizerBio}
              onChange={(e) =>
                setAboutContent({ ...aboutContent, organizerBio: e.target.value })
              }
              rows={3}
              data-testid="input-organizer-bio"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveAbout} data-testid="button-save-about">
              <Save className="h-4 w-4 mr-2" />
              Save About Content
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
