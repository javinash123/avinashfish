import { useEffect } from "react";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy | Peg Slam";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6" data-testid="text-privacy-title">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mb-8" data-testid="text-privacy-updated">
          Last updated: October 2025
        </p>

        <div className="space-y-6 text-foreground">
          <section data-testid="section-privacy-introduction">
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Peg Slam respects your privacy and is committed to protecting personal information for all anglers,
              volunteers, and visitors. This policy explains how personal data is collected, used, and protected
              when using the website (www.pegslam.com) or taking part in Peg Slam competitions and events.
              <br />
              By using the website or submitting entry forms, you agree to this Privacy Policy.
            </p>
          </section>

          <section data-testid="section-privacy-who-we-are">
            <h2 className="text-2xl font-semibold mb-3">2. Who We Are</h2>
            <p className="text-muted-foreground leading-relaxed">
              Peg Slam is a UK-based fishing competition organisation running events for juniors, youth, and adults
              across the United Kingdom. The purpose is to promote fair competition, skill development, and
              community engagement in angling.
              <br />
              Contact: 📧 info@pegslam.com
            </p>
          </section>

          <section data-testid="section-privacy-info-collect">
            <h2 className="text-2xl font-semibold mb-3">3. Information Collected</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Personal details: name, contact number, address, date of birth, and emergency contact.</li>
              <li>Event data: competition entries, peg numbers, category (junior, youth, adult), and results.</li>
              <li>Parent/guardian details: required for participants under 18.</li>
              <li>
                Payment information: processed through secure third-party providers; Peg Slam does not store card
                data.
              </li>
              <li>Media content: photos or videos taken during competitions or award ceremonies.</li>
              <li>
                Technical data: IP address, browser type, device type, and cookies (see section 9).
              </li>
            </ul>
          </section>

          <section data-testid="section-privacy-use-info">
            <h2 className="text-2xl font-semibold mb-3">4. Use of Information</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Register and manage competition entries.</li>
              <li>Communicate match details, updates, and results.</li>
              <li>Ensure health, safety, and safeguarding.</li>
              <li>Publish competition coverage (results, photos, or videos) where consent is given.</li>
              <li>Administer payments, prizes, and sponsorship arrangements.</li>
              <li>Improve website performance and event management.</li>
            </ul>
          </section>

          <section data-testid="section-privacy-legal-basis">
            <h2 className="text-2xl font-semibold mb-3">5. Legal Basis for Processing</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Consent – when agreeing to receive updates or appear in photos/videos.</li>
              <li>Contract – for entry registration or merchandise orders.</li>
              <li>Legal obligation – for safeguarding or insurance purposes.</li>
              <li>Legitimate interest – for safe and effective event administration.</li>
            </ul>
          </section>

          <section data-testid="section-privacy-safeguarding">
            <h2 className="text-2xl font-semibold mb-3">6. Safeguarding and Under-18s</h2>
            <p className="text-muted-foreground leading-relaxed">
              Peg Slam follows UK child protection and safeguarding standards. All competitors under 18 require
              parental or guardian consent. Emergency contact details must be provided. Personal information
              relating to children is stored securely and only accessed by authorised staff. Parents or guardians
              may withdraw consent or request deletion of personal data or images at any time.
            </p>
          </section>

          <section data-testid="section-privacy-security">
            <h2 className="text-2xl font-semibold mb-3">7. Data Security and Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              All personal information is stored securely using password-protected and encrypted systems.
              Data is kept only as long as necessary for event, legal, or insurance purposes, then securely
              deleted or anonymised.
            </p>
          </section>

          <section data-testid="section-privacy-media">
            <h2 className="text-2xl font-semibold mb-3">8. Media, Photos, and Video</h2>
            <p className="text-muted-foreground leading-relaxed">
              Peg Slam promotes events through media and photography. Consent is always sought before publishing
              identifiable images of under-18s. Adults may request not to be photographed or request image removal
              by contacting info@pegslam.com. Media content may appear on Peg Slam’s website, social channels, or
              printed materials.
            </p>
          </section>

          <section data-testid="section-privacy-cookies">
            <h2 className="text-2xl font-semibold mb-3">9. Cookies and Website Analytics</h2>
            <p className="text-muted-foreground leading-relaxed">
              The website uses cookies to enhance functionality and collect anonymous visitor data.
              Cookies can be managed or disabled in browser settings.
            </p>
          </section>

          <section data-testid="section-privacy-sharing">
            <h2 className="text-2xl font-semibold mb-3">10. Sharing of Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              Personal information is not sold or rented. Limited information may be shared with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Event staff, bailiffs, or venue operators for coordination.</li>
              <li>Sponsors or partners for prize distribution or promotional activity.</li>
              <li>Legal or regulatory bodies if required by law.</li>
            </ul>
          </section>

          <section data-testid="section-privacy-rights">
            <h2 className="text-2xl font-semibold mb-3">11. Your Rights</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Access, correct, or delete your data.</li>
              <li>Withdraw consent at any time.</li>
              <li>Object to processing.</li>
              <li>
                Lodge a complaint with the Information Commissioner’s Office (ICO) at{" "}
                <a href="https://www.ico.org.uk" className="text-primary underline" target="_blank" rel="noopener noreferrer">
                  www.ico.org.uk
                </a>.
              </li>
            </ul>
          </section>

          <section data-testid="section-privacy-updates">
            <h2 className="text-2xl font-semibold mb-3">12. Policy Updates</h2>
            <p className="text-muted-foreground leading-relaxed">
              This Privacy Policy may be updated periodically. The latest version will always be available on the website.
            </p>
          </section>

          <section data-testid="section-privacy-summary">
            <h2 className="text-2xl font-semibold mb-3">13. Summary</h2>
            <p className="text-muted-foreground leading-relaxed">
              Peg Slam is committed to protecting the privacy of all anglers, youth and adult alike.
              All information is handled securely, lawfully, and only for legitimate competition and communication purposes.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
