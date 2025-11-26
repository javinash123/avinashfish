import { useEffect } from "react";

export default function TermsConditions() {
  useEffect(() => {
    document.title = "Terms & Conditions | Peg Slam";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6" data-testid="text-terms-title">
          Peg Slam Terms and Conditions
        </h1>
        <p className="text-muted-foreground mb-8" data-testid="text-terms-updated">
          Last updated: October 2025
        </p>

        <div className="space-y-6 text-foreground">
          {/* 1. Introduction */}
          <section data-testid="section-terms-intro">
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms and Conditions govern the use of the Peg Slam website (www.pegslam.com) and participation
              in all Peg Slam-organised fishing events and competitions.
              <br />
              By accessing the website, registering for an event, or taking part in any Peg Slam activity, you agree
              to these Terms and Conditions in full.
            </p>
          </section>

          {/* 2. Organiser Information */}
          <section data-testid="section-terms-org-info">
            <h2 className="text-2xl font-semibold mb-3">2. Organiser Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              Peg Slam is a UK-based fishing competition organisation promoting angling for juniors, youth, and adults.
            </p>
          </section>

          {/* 3. Eligibility */}
          <section data-testid="section-terms-eligibility">
            <h2 className="text-2xl font-semibold mb-3">3. Eligibility</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Competitions are open to anglers in the relevant age categories as stated for each event.</li>
              <li>Entrants under 18 must have written consent from a parent or guardian.</li>
              <li>All participants must hold a valid Environment Agency Rod Licence where applicable.</li>
              <li>Peg Slam reserves the right to refuse or cancel an entry for safety, conduct, or rule-breach reasons.</li>
            </ul>
          </section>

          {/* 4. Event Registration and Fees */}
          <section data-testid="section-terms-registration">
            <h2 className="text-2xl font-semibold mb-3">4. Event Registration and Fees</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Entries must be made through official Peg Slam channels or authorised partners.</li>
              <li>Entry fees, if applicable, must be paid in full before the stated deadline.</li>
              <li>Fees are non-refundable unless an event is cancelled by Peg Slam.</li>
              <li>Proof of payment may be required at registration.</li>
            </ul>
          </section>

          {/* 5. Competition Rules */}
          <section data-testid="section-terms-competition">
            <h2 className="text-2xl font-semibold mb-3">5. Competition Rules</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>All anglers must follow venue rules, safety requirements, and bailiff instructions.</li>
              <li>Peg Slam match rules and local fishery regulations apply at all times.</li>
              <li>Any participant found cheating, endangering others, or acting disrespectfully may be disqualified.</li>
              <li>Peg Slam decisions on results, weigh-ins, or disputes are final.</li>
            </ul>
          </section>

          {/* 6. Conduct and Behaviour */}
          <section data-testid="section-terms-behaviour">
            <h2 className="text-2xl font-semibold mb-3">6. Conduct and Behaviour</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Respect towards officials, volunteers, and other competitors is mandatory.</li>
              <li>Abusive or antisocial behaviour will result in removal from the event and potential future bans.</li>
              <li>Alcohol or illegal substances are strictly prohibited during all competitions.</li>
            </ul>
          </section>

          {/* 7. Safety and Liability */}
          <section data-testid="section-terms-safety">
            <h2 className="text-2xl font-semibold mb-3">7. Safety and Liability</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>All participants attend and compete at their own risk.</li>
              <li>
                Peg Slam, event staff, and venue owners accept no responsibility for personal injury, loss, or damage to
                property unless caused by proven negligence.
              </li>
              <li>Suitable clothing, footwear, and safety equipment must be used at all times.</li>
              <li>All under-18 anglers must be accompanied by a responsible adult.</li>
            </ul>
          </section>

          {/* 8. Media and Photography */}
          <section data-testid="section-terms-media">
            <h2 className="text-2xl font-semibold mb-3">8. Media and Photography</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                Peg Slam may photograph or film events for promotional use on websites, social media, and printed materials.
              </li>
              <li>Adult competitors consent to the use of images by entering an event.</li>
              <li>Parents or guardians must provide consent for any under-18 participant to appear in media.</li>
              <li>Requests for removal of images can be made via the Contact Us page.</li>
            </ul>
          </section>

          {/* 9. Website Use */}
          <section data-testid="section-terms-website">
            <h2 className="text-2xl font-semibold mb-3">9. Website Use</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Content on www.pegslam.com is for general information only.</li>
              <li>Peg Slam does not guarantee uninterrupted or error-free website operation.</li>
              <li>Copying, redistributing, or misusing Peg Slam content or branding without permission is prohibited.</li>
            </ul>
          </section>

          {/* 10. Payments and Merchandise */}
          <section data-testid="section-terms-payments">
            <h2 className="text-2xl font-semibold mb-3">10. Payments and Merchandise</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Payments for entry fees or merchandise are processed through secure third-party providers.</li>
              <li>Peg Slam does not store card information.</li>
              <li>Prices and availability may change without notice.</li>
            </ul>
          </section>

          {/* 11. Data Protection */}
          <section data-testid="section-terms-data">
            <h2 className="text-2xl font-semibold mb-3">11. Data Protection</h2>
            <p className="text-muted-foreground leading-relaxed">
              All personal data is collected and managed in line with the Peg Slam Privacy Policy, available on the website.
            </p>
          </section>

          {/* 12. Cancellation or Event Changes */}
          <section data-testid="section-terms-cancellation">
            <h2 className="text-2xl font-semibold mb-3">12. Cancellation or Event Changes</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Peg Slam reserves the right to change event dates, venues, or schedules due to weather, safety, or operational reasons.</li>
              <li>In such cases, entrants will be notified and offered transfer or refund options where appropriate.</li>
            </ul>
          </section>

          {/* 13. Sponsorship and Prizes */}
          <section data-testid="section-terms-sponsorship">
            <h2 className="text-2xl font-semibold mb-3">13. Sponsorship and Prizes</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Sponsors may provide prizes, vouchers, or goods for Peg Slam events.</li>
                            <li>Peg Slam is not responsible for the condition, warranty, or fulfilment of third-party prizes.</li>
              <li>All prizes are non-transferable and may not be exchanged for cash.</li>
            </ul>
          </section>

          {/* 14. Intellectual Property */}
          <section data-testid="section-terms-ip">
            <h2 className="text-2xl font-semibold mb-3">14. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, logos, graphics, and materials on the Peg Slam website and event media are the property of Peg Slam and may not be reproduced without written permission.
            </p>
          </section>

          {/* 15. Disclaimers */}
          <section data-testid="section-terms-disclaimers">
            <h2 className="text-2xl font-semibold mb-3">15. Disclaimers</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Peg Slam strives for accuracy in all event details and online content but does not guarantee completeness or error-free information.</li>
              <li>Peg Slam is not liable for any indirect, incidental, or consequential losses arising from event participation or website use.</li>
            </ul>
          </section>

          {/* 16. Governing Law */}
          <section data-testid="section-terms-law">
            <h2 className="text-2xl font-semibold mb-3">16. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms and Conditions are governed by and construed in accordance with the laws of England and Wales. Any disputes will be subject to the exclusive jurisdiction of the English courts.
            </p>
          </section>

          {/* 17. Contact */}
          <section data-testid="section-terms-contact">
            <h2 className="text-2xl font-semibold mb-3">17. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For any questions regarding these Terms and Conditions, please <a href="/contact" className="text-primary hover:underline">contact us</a>.
            </p>
          </section>

         
        </div>
      </div>
    </div>
  );
}

