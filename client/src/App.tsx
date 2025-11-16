import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Home from "@/pages/home";
import Competitions from "@/pages/competitions";
import Leaderboard from "@/pages/leaderboard";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import VerifyEmail from "@/pages/verify-email";
import CompetitionDetails from "@/pages/competition-details";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminLogin from "@/pages/admin-login";
import Gallery from "@/pages/gallery";
import News from "@/pages/news";
import Sponsors from "@/pages/sponsors";
import Profile from "@/pages/profile";
import Booking from "@/pages/booking";
import AnglerDirectory from "@/pages/angler-directory";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsConditions from "@/pages/terms-conditions";
import CookiePolicy from "@/pages/cookie-policy";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");
  const isAuthRoute =
    location === "/login" ||
    location === "/register" ||
    location === "/forgot-password" ||
    location === "/reset-password" ||
    location === "/verify-email" ||
    location === "/admin/login";

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminRoute && !isAuthRoute && <Header />}
      <div className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/competitions" component={Competitions} />
          <Route path="/competition/:id" component={CompetitionDetails} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/angler-directory" component={AnglerDirectory} />
          <Route path="/gallery" component={Gallery} />
          <Route path="/news" component={News} />
          <Route path="/sponsors" component={Sponsors} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/profile" component={Profile} />
          <Route path="/profile/:username" component={Profile} />
          <Route path="/booking/:id" component={Booking} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-conditions" component={TermsConditions} />
          <Route path="/cookie-policy" component={CookiePolicy} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin" component={AdminDashboard} />
          <Route component={NotFound} />
        </Switch>
      </div>
      {!isAdminRoute && !isAuthRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          {/* ✅ Removed base path so routing works from root */}
          <WouterRouter>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}


export default App;
