import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fish, Trophy, TrendingUp, Users, Heart, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ContactForm } from "@/components/contact-form";

export default function About() {
  const { data: siteSettings } = useQuery<{ logoUrl?: string }>({
    queryKey: ["/api/site-settings"],
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
            {siteSettings?.logoUrl ? (
              <img 
                src={siteSettings.logoUrl} 
                alt="Peg Slam Logo" 
                className="w-20 h-20 object-contain"
              />
            ) : (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary">
                <Fish className="h-10 w-10" />
              </div>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-4" data-testid="text-about-title">About Peg Slam</h1>
          <p className="text-xl text-muted-foreground">
            A UK-based fishing competition organisation created to inspire anglers of all ages
          </p>
        </div>

        <div className="space-y-6 mb-12">
          <p className="text-lg">
            Peg Slam is a UK-based fishing competition organisation created to inspire anglers of all ages.
            The goal is simple — to bring together juniors, youth, and adults in a fair, friendly, and competitive environment that celebrates skill, respect, and community spirit.
          </p>
          <p className="text-lg">
            What started as a small series of junior matches has grown into a national movement promoting angling as a positive outdoor activity that builds confidence, patience, and teamwork.
            Peg Slam now runs a full calendar of events, from junior development days to senior match qualifiers and grand finals held at some of the country's best fisheries.
          </p>
        </div>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle>What We Stand For</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Fair competition</strong> – every peg, every angler, same opportunity.
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Youth development</strong> – encouraging the next generation of anglers.
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Community</strong> – connecting families, clubs, and fisheries across the UK.
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Sustainability</strong> – promoting responsible fishing and environmental care.
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-lg mb-12">
          Peg Slam works alongside sponsors, fisheries, and volunteers to deliver safe, inclusive, and professionally run matches with real progression opportunities for every participant.
          Whether you're a first-time junior angler or an experienced match competitor, Peg Slam is the place to learn, compete, and belong.
        </p>

        <h2 className="text-3xl font-bold mb-6" data-testid="text-values-title">Peg Slam Values</h2>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Trophy className="h-5 w-5" />
                </div>
                Excellence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Striving for high standards in every match, every angler, and every result — promoting skill, focus, and achievement.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-2/10 text-chart-2">
                  <TrendingUp className="h-5 w-5" />
                </div>
                Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Creating opportunities for anglers of all ages to learn, progress, and build confidence both on and off the bank.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-3/10 text-chart-3">
                  <Users className="h-5 w-5" />
                </div>
                Community
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Uniting anglers, families, and fisheries across the UK through shared experiences, teamwork, and respect.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-4/10 text-chart-4">
                  <Heart className="h-5 w-5" />
                </div>
                Responsibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Championing fair play, environmental care, and integrity in everything Peg Slam represents.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-12 bg-card">
          <CardHeader>
            <CardTitle className="text-2xl" data-testid="text-volunteer-title">Join the Peg Slam Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Peg Slam is built on passion, teamwork, and community spirit. Every event relies on dedicated people who give their time to make a difference — on and off the bank.
            </p>
            
            <h3 className="text-xl font-semibold pt-2">Why Volunteer?</h3>
            <p>
              Becoming part of the Peg Slam team means helping grow angling for all ages. Volunteers keep events safe, organised, and enjoyable. Whether you can spare a day or join us regularly, your time directly supports young anglers, families, and the wider fishing community.
            </p>

            <h3 className="text-xl font-semibold pt-2">Roles Available</h3>
            <ul className="space-y-2 ml-4">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>Peg Runners</strong> – helping anglers during matches and keeping scores.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>Event Helpers</strong> – setting up, registering anglers, or managing weigh-ins.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>Media & Social Team</strong> – capturing photos, video, and updating social posts.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>Coaches & Mentors</strong> – guiding young or new anglers on match days.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>General Support</strong> – helping with logistics, catering, or admin.</span>
              </li>
            </ul>

            <h3 className="text-xl font-semibold pt-2">Who Can Join?</h3>
            <p>
              Anyone with enthusiasm, reliability, and a passion for fishing. No prior experience is required — just a willingness to get involved and support others.
            </p>

            <h3 className="text-xl font-semibold pt-2">What You'll Gain</h3>
            <ul className="space-y-2 ml-4">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Be part of a fast-growing national competition network.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Build experience in event management and community sport.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Meet sponsors, fisheries, and like-minded anglers.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Make a real impact on the future of angling.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-2xl" data-testid="text-sponsor-title">Sponsor Peg Slam</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="opacity-90">
              Peg Slam is more than a fishing competition — it's a growing national platform that inspires anglers of all ages, connects communities, and promotes responsible, competitive angling.
              Every event, prize, and opportunity exists thanks to the support of sponsors and partners who share that vision.
            </p>

            <h3 className="text-xl font-semibold pt-2">Why Sponsor Peg Slam?</h3>
            <p className="opacity-90">
              Partnering with Peg Slam gives your brand visibility, credibility, and a direct link to one of the UK's fastest-growing community angling networks.
            </p>

            <h3 className="text-xl font-semibold pt-2">How Your Support Helps</h3>
            <p className="opacity-90">
              Your sponsorship funds go directly into supporting junior, youth, and adult competitions, providing prizes, coaching, and development sessions, improving event facilities and safety, and promoting environmental awareness and responsible angling.
            </p>

            <h3 className="text-xl font-semibold pt-2">Ways to Get Involved</h3>
            <ul className="space-y-2 ml-4 opacity-90">
              <li className="flex gap-2">
                <span>•</span>
                <span><strong>Main Event Sponsor</strong> – full branding, media coverage, and lead recognition.</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span><strong>Peg Sponsor</strong> – name or company logo displayed on match pegs and event posts.</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span><strong>Prize or Product Sponsor</strong> – provide bait, tackle, or vouchers.</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span><strong>Community Partner</strong> – help us deliver youth and outreach projects.</span>
              </li>
            </ul>

            <p className="opacity-90 pt-2">
              If your company values community, youth development, and real sport, Peg Slam is the perfect partnership.
            </p>
          </CardContent>
        </Card>

        <div className="mt-12">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
