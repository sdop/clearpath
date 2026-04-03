import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import InsuranceVerification from "./pages/InsuranceVerification";
import ReEngagement from "./pages/ReEngagement";
import ReferralPortal from "./pages/ReferralPortal";
import VirtualCare from "./pages/VirtualCare";
import CenterNetwork from "./pages/CenterNetwork";
import NotFound from "./pages/not-found";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/insurance" component={InsuranceVerification} />
            <Route path="/reengagement" component={ReEngagement} />
            <Route path="/referrals" component={ReferralPortal} />
            <Route path="/virtual" component={VirtualCare} />
            <Route path="/centers" component={CenterNetwork} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
