import { useEffect } from "react";

export default function TermsConditions() {
  useEffect(() => {
    document.title = "Terms & Conditions | Peg Slam";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6" data-testid="text-terms-title">Terms & Conditions</h1>
        <p className="text-muted-foreground mb-8" data-testid="text-terms-updated">Last updated: October 10, 2025</p>

        <div className="space-y-6 text-foreground">
          <section data-testid="section-terms-agreement">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-terms-agreement-heading">1. Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-terms-agreement-content">
              By accessing and using the Peg Slam website and services, you accept and agree to be bound by 
              the terms and provision of this agreement. If you do not agree to abide by the above, please 
              do not use this service.
            </p>
          </section>

          <section data-testid="section-terms-competition">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-terms-competition-heading">2. Competition Rules</h2>
            <p className="text-muted-foreground leading-relaxed mb-3" data-testid="text-terms-competition-intro">
              All participants in Peg Slam competitions must adhere to the following rules:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4" data-testid="list-terms-competition-rules">
              <li>Participants must be 18 years of age or older</li>
              <li>All bookings are subject to availability and confirmation</li>
              <li>Participants must arrive at least 30 minutes before the competition start time</li>
              <li>All catches must be recorded and verified by competition officials</li>
              <li>The organizer's decision is final in all matters relating to the competition</li>
              <li>Participants compete at their own risk</li>
            </ul>
          </section>

          <section data-testid="section-terms-booking">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-terms-booking-heading">3. Booking and Payment</h2>
            <p className="text-muted-foreground leading-relaxed mb-3" data-testid="text-terms-booking-intro">
              When booking a peg for a competition:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4" data-testid="list-terms-booking-rules">
              <li>Full payment is required at the time of booking</li>
              <li>Bookings are non-refundable unless the competition is cancelled by the organizer</li>
              <li>Transfer of bookings to another person is permitted up to 48 hours before the event</li>
              <li>Prices are subject to change without notice</li>
              <li>All payments are processed securely through our payment partner</li>
            </ul>
          </section>

          <section data-testid="section-terms-cancellation">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-terms-cancellation-heading">4. Cancellation Policy</h2>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-terms-cancellation-content">
              In the event of competition cancellation due to weather, safety concerns, or other unforeseen 
              circumstances, full refunds will be issued. The organizer reserves the right to cancel or 
              postpone any competition at their discretion. Participants will be notified as soon as possible.
            </p>
          </section>

          <section data-testid="section-terms-liability">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-terms-liability-heading">5. Liability</h2>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-terms-liability-content">
              Peg Slam and its organizers will not be held liable for any injury, loss, or damage to persons 
              or property during competitions. All participants are advised to have appropriate insurance 
              coverage. Participants are responsible for their own equipment and belongings.
            </p>
          </section>

          <section data-testid="section-terms-ip">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-terms-ip-heading">6. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-terms-ip-content">
              All content on this website, including text, graphics, logos, images, and software, is the 
              property of Peg Slam and is protected by copyright laws. Unauthorized use or reproduction 
              is strictly prohibited.
            </p>
          </section>

          <section data-testid="section-terms-conduct">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-terms-conduct-heading">7. Code of Conduct</h2>
            <p className="text-muted-foreground leading-relaxed mb-3" data-testid="text-terms-conduct-intro">
              All participants are expected to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4" data-testid="list-terms-conduct-rules">
              <li>Treat fellow competitors, officials, and staff with respect</li>
              <li>Follow all venue rules and regulations</li>
              <li>Not engage in any unsporting behavior</li>
              <li>Respect the environment and practice catch and release responsibly</li>
              <li>Not use any prohibited techniques or equipment</li>
            </ul>
          </section>

          <section data-testid="section-terms-changes">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-terms-changes-heading">8. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-terms-changes-content">
              We reserve the right to modify these terms at any time. Changes will be effective immediately 
              upon posting to the website. Your continued use of the service constitutes acceptance of the 
              modified terms.
            </p>
          </section>

          <section data-testid="section-terms-contact">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-terms-contact-heading">9. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-terms-contact-intro">
              For questions about these Terms & Conditions, please contact us at:
            </p>
            <p className="text-muted-foreground mt-2" data-testid="text-terms-contact-info">
              Email: info@pegslam.co.uk<br />
              Phone: +44 1234 567890
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
