import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fish, Target, Users, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
          <h1 className="text-4xl font-bold mb-4">About Peg Slam</h1>
          <p className="text-xl text-muted-foreground">
            UK's Premier Fishing Competition Platform
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
          <p className="text-lg">
            Peg Slam was founded with a simple mission: to bring the excitement
            of competitive match fishing to anglers across the United Kingdom.
            We provide a professional platform for organisers to run
            high-quality fishing competitions, from local qualifiers to national
            finals.
          </p>
          <p className="text-lg">
            Our platform enables anglers to easily discover and book
            competitions, track their performance, and compete for prizes. With
            real-time leaderboards, peg allocation systems, and integrated
            payments, we make match fishing more accessible and exciting than
            ever before.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Target className="h-5 w-5" />
                </div>
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To revolutionize competitive match fishing by providing a
                modern, user-friendly platform that connects anglers,
                organisers, and sponsors across the UK.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-2/10 text-chart-2">
                  <Users className="h-5 w-5" />
                </div>
                Community First
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We believe in building a strong fishing community where anglers
                of all skill levels can compete, learn, and share their passion
                for the sport.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-3/10 text-chart-3">
                  <Award className="h-5 w-5" />
                </div>
                Fair Competition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We ensure transparent peg allocation, live result tracking, and
                verified weigh-ins to maintain the integrity of every
                competition.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-4/10 text-chart-4">
                  <Fish className="h-5 w-5" />
                </div>
                UK Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Proudly serving the UK fishing community with competitions at
                premium venues across England.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Join Our Growing Community</h3>
            <p className="text-lg opacity-90 mb-6">
              Over 1000 registered anglers and counting. Be part of the UK's most exciting fishing competition platform.
            </p>
            <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto">
              <div>
                <div className="text-2xl sm:text-3xl font-bold">1k+</div>
                <div className="text-xs sm:text-sm opacity-80">Anglers</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold">50+</div>
                <div className="text-xs sm:text-sm opacity-80">Competitions</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold">30+</div>
                <div className="text-xs sm:text-sm opacity-80">Venues</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
