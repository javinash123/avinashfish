import { useEffect } from "react";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy | Peg Slam";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6" data-testid="text-privacy-title">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8" data-testid="text-privacy-updated">Last updated: October 10, 2025</p>

        <div className="space-y-6 text-foreground">
          <section data-testid="section-privacy-introduction">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-privacy-intro-heading">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-privacy-intro-content">
              Welcome to Peg Slam. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you visit our 
              website and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section data-testid="section-privacy-info-collect">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-privacy-info-heading">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3" data-testid="text-privacy-info-intro">
              We may collect, use, store and transfer different kinds of personal data about you which we have 
              grouped together as follows:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4" data-testid="list-privacy-info-types">
              <li>Identity Data: first name, last name, username or similar identifier</li>
              <li>Contact Data: email address and telephone numbers</li>
              <li>Technical Data: internet protocol (IP) address, browser type and version</li>
              <li>Usage Data: information about how you use our website and services</li>
              <li>Marketing and Communications Data: your preferences in receiving marketing from us</li>
            </ul>
          </section>

          <section data-testid="section-privacy-use-info">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-privacy-use-heading">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3" data-testid="text-privacy-use-intro">
              We will only use your personal data when the law allows us to. Most commonly, we will use your 
              personal data in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4" data-testid="list-privacy-use-cases">
              <li>To register you as a new competitor</li>
              <li>To process and deliver your competition bookings</li>
              <li>To manage our relationship with you</li>
              <li>To improve our website, products/services, marketing or customer relationships</li>
              <li>To make recommendations to you about competitions or services that may be of interest to you</li>
            </ul>
          </section>

          <section data-testid="section-privacy-security">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-privacy-security-heading">4. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-privacy-security-content">
              We have put in place appropriate security measures to prevent your personal data from being 
              accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, 
              we limit access to your personal data to those employees, agents, contractors and other third 
              parties who have a business need to know.
            </p>
          </section>

          <section data-testid="section-privacy-retention">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-privacy-retention-heading">5. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-privacy-retention-content">
              We will only retain your personal data for as long as necessary to fulfil the purposes we 
              collected it for, including for the purposes of satisfying any legal, accounting, or reporting 
              requirements.
            </p>
          </section>

          <section data-testid="section-privacy-rights">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-privacy-rights-heading">6. Your Legal Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3" data-testid="text-privacy-rights-intro">
              Under certain circumstances, you have rights under data protection laws in relation to your 
              personal data, including the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4" data-testid="list-privacy-rights">
              <li>Request access to your personal data</li>
              <li>Request correction of your personal data</li>
              <li>Request erasure of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing your personal data</li>
              <li>Request transfer of your personal data</li>
              <li>Right to withdraw consent</li>
            </ul>
          </section>

          <section data-testid="section-privacy-contact">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-privacy-contact-heading">7. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-privacy-contact-intro">
              If you have any questions about this privacy policy or our privacy practices, please contact us at:
            </p>
            <p className="text-muted-foreground mt-2" data-testid="text-privacy-contact-info">
              Email: privacy@pegslam.co.uk<br />
              Phone: +44 1234 567890
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
