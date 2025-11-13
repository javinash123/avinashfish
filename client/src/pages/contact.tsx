import { ContactForm } from "@/components/contact-form";
import { Mail, Phone, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Contact() {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-contact-title">Get in Touch</h1>
          <p className="text-xl text-muted-foreground">
            Have a question? We'd love to hear from you.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 mb-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Email Us</h3>
              <a
                href="mailto:info@pegslam.com"
                className="text-muted-foreground hover:text-primary"
                data-testid="link-email"
              >
                info@pegslam.com
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-chart-2/10 text-chart-2 mb-4">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Call Us</h3>
              <a
                href="tel:+441234567890"
                className="text-muted-foreground hover:text-primary"
                data-testid="link-phone"
              >
                +44 (0) 123 456 7890
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-chart-3/10 text-chart-3 mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Visit Us</h3>
              <p className="text-muted-foreground">
                United Kingdom
              </p>
            </CardContent>
          </Card>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
