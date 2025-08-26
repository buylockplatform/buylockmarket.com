import { Router, Route, Switch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Services from "@/pages/services";
import Settings from "@/pages/settings";
import type { Vendor } from "@shared/schema";

function App() {
  const { data: vendor, isLoading } = useQuery<Vendor>({
    queryKey: ["/api/auth/vendor"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-buylock-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Switch>
          {!vendor ? (
            <>
              <Route path="/register" component={Register} />
              <Route path="*" component={Login} />
            </>
          ) : (
            <>
              <Route path="/" component={Dashboard} />
              <Route path="/products" component={Products} />
              <Route path="/services" component={Services} />
              <Route path="/settings" component={Settings} />
              <Route component={() => <div>Page not found</div>} />
            </>
          )}
        </Switch>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;