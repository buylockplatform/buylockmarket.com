import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Services from "@/pages/services";
import ServiceDetail from "@/pages/service-detail";
import Cart from "@/pages/cart";
import MyOrders from "@/pages/my-orders";
import Profile from "@/pages/profile";

import Shop from "@/pages/shop";
import VendorPortal from "@/pages/vendor-portal";
import DeliveryPortal from "@/pages/delivery-portal";
import TestDeliveryWorkflow from "@/pages/test-delivery-workflow";
import AdminPortalLanding from "@/pages/admin-portal";
import VendorLogin from "@/pages/vendor-dashboard/login";

import VendorDashboard from "@/pages/vendor-dashboard/dashboard";
import VendorRegistration from "@/pages/VendorRegistration";
import AdminLogin from "@/pages/admin-portal/login";
import AdminDashboard from "@/pages/admin-portal/dashboard";
import VendorTasks from "@/pages/vendor-tasks";
import Payment from "@/pages/payment";
import DeliveryConfirmation from "@/pages/customer-portal/DeliveryConfirmation";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/products/:slug" component={ProductDetail} />
          <Route path="/services/:slug" component={ServiceDetail} />
          <Route path="/shop" component={Shop} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/products/:slug" component={ProductDetail} />
          <Route path="/services/:slug" component={ServiceDetail} />
          <Route path="/shop" component={Shop} />
          <Route path="/cart" component={Cart} />
          <Route path="/my-orders" component={MyOrders} />
          <Route path="/profile" component={Profile} />
          <Route path="/vendor-tasks" component={VendorTasks} />
          <Route path="/payment" component={Payment} />
        </>
      )}
      {/* Portal routes - accessible without authentication */}
      <Route path="/vendor-portal" component={VendorPortal} />
      <Route path="/delivery-portal" component={DeliveryPortal} />
      <Route path="/test-delivery" component={TestDeliveryWorkflow} />
      
      {/* Vendor dashboard routes */}
      <Route path="/vendor-dashboard/login" component={VendorLogin} />
      <Route path="/vendor/registration" component={VendorRegistration} />
      <Route path="/vendor-dashboard" component={VendorDashboard} />
      
      {/* Admin portal routes */}
      <Route path="/admin-portal/login" component={AdminLogin} />
      <Route path="/admin-portal/dashboard" component={AdminDashboard} />
      <Route path="/admin-portal" component={AdminPortalLanding} />
      
      {/* Customer delivery confirmation - public route */}
      <Route path="/confirm-delivery/:token" component={DeliveryConfirmation} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}

export default App;
