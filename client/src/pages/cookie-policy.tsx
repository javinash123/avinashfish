import { useEffect } from "react";

export default function CookiePolicy() {
  useEffect(() => {
    document.title = "Cookie Policy | Peg Slam";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6" data-testid="text-cookie-title">Cookie Policy</h1>
        <p className="text-muted-foreground mb-8" data-testid="text-cookie-updated">Last updated: October 10, 2025</p>

        <div className="space-y-6 text-foreground">
          <section data-testid="section-cookie-what">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-cookie-what-heading">1. What Are Cookies</h2>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-cookie-what-content">
              Cookies are small text files that are placed on your computer or mobile device when you visit 
              our website. They are widely used to make websites work more efficiently and provide information 
              to the owners of the site.
            </p>
          </section>

          <section data-testid="section-cookie-how">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-cookie-how-heading">2. How We Use Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-3" data-testid="text-cookie-how-content">
              We use cookies for several reasons detailed below. Unfortunately, in most cases there are no 
              industry standard options for disabling cookies without completely disabling the functionality 
              and features they add to this site.
            </p>
          </section>

          <section data-testid="section-cookie-types">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-cookie-types-heading">3. Types of Cookies We Use</h2>
            
            <div className="space-y-4 mt-4" data-testid="container-cookie-types">
              <div data-testid="section-cookie-essential">
                <h3 className="text-lg font-semibold mb-2" data-testid="text-cookie-essential-heading">Essential Cookies</h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-cookie-essential-content">
                  These cookies are necessary for the website to function properly. They enable basic functions 
                  like page navigation, access to secure areas, and processing of competition bookings. The 
                  website cannot function properly without these cookies.
                </p>
              </div>

              <div data-testid="section-cookie-performance">
                <h3 className="text-lg font-semibold mb-2" data-testid="text-cookie-performance-heading">Performance Cookies</h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-cookie-performance-content">
                  These cookies allow us to count visits and traffic sources so we can measure and improve the 
                  performance of our site. They help us know which pages are the most and least popular and see 
                  how visitors move around the site.
                </p>
              </div>

              <div data-testid="section-cookie-functionality">
                <h3 className="text-lg font-semibold mb-2" data-testid="text-cookie-functionality-heading">Functionality Cookies</h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-cookie-functionality-content">
                  These cookies enable the website to provide enhanced functionality and personalization. They 
                  may be set by us or by third-party providers whose services we have added to our pages. If you 
                  do not allow these cookies, some or all of these services may not function properly.
                </p>
              </div>

              <div data-testid="section-cookie-targeting">
                <h3 className="text-lg font-semibold mb-2" data-testid="text-cookie-targeting-heading">Targeting Cookies</h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-cookie-targeting-content">
                  These cookies may be set through our site by our advertising partners. They may be used by 
                  those companies to build a profile of your interests and show you relevant advertisements on 
                  other sites.
                </p>
              </div>
            </div>
          </section>

          <section data-testid="section-cookie-third-party">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-cookie-third-party-heading">4. Third-Party Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-3" data-testid="text-cookie-third-party-intro">
              In some special cases, we also use cookies provided by trusted third parties. The following 
              section details which third-party cookies you might encounter through this site:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4" data-testid="list-cookie-third-party">
              <li>Google Analytics - helps us understand how you use the site</li>
              <li>Social media cookies - for sharing content on social platforms</li>
              <li>Payment processing cookies - for secure transaction processing</li>
              <li>Advertising cookies - to deliver relevant advertisements</li>
            </ul>
          </section>

          <section data-testid="section-cookie-managing">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-cookie-managing-heading">5. Managing Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-3" data-testid="text-cookie-managing-intro">
              You can prevent the setting of cookies by adjusting the settings on your browser. Be aware that 
              disabling cookies will affect the functionality of this and many other websites that you visit. 
              Disabling cookies will usually result in also disabling certain functionality and features of 
              this site.
            </p>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-cookie-managing-browsers">
              Most browsers allow you to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-2" data-testid="list-cookie-managing-options">
              <li>See what cookies you have and delete them on an individual basis</li>
              <li>Block third-party cookies</li>
              <li>Block cookies from particular sites</li>
              <li>Block all cookies from being set</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
          </section>

          <section data-testid="section-cookie-duration">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-cookie-duration-heading">6. Cookie Duration</h2>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-cookie-duration-content">
              Some cookies are session cookies, which means they are deleted when you close your browser. 
              Others are persistent cookies that remain on your device for a set period or until you delete them.
            </p>
          </section>

          <section data-testid="section-cookie-updates">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-cookie-updates-heading">7. Updates to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-cookie-updates-content">
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation, 
              or our business operations. We will notify you of any significant changes by posting a notice on 
              our website.
            </p>
          </section>

          <section data-testid="section-cookie-contact">
            <h2 className="text-2xl font-semibold mb-3" data-testid="text-cookie-contact-heading">8. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-cookie-contact-intro">
              If you have any questions about our use of cookies, please contact us at:
            </p>
            <p className="text-muted-foreground mt-2" data-testid="text-cookie-contact-info">
              Email: cookies@pegslam.co.uk<br />
              Phone: +44 1234 567890
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
