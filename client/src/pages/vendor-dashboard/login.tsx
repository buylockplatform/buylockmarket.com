import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Store, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function VendorLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await fetch("/api/vendor/login", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Login failed");
      }
      return response.json();
    },
    onSuccess: (vendorData) => {
      // Store vendor data in localStorage for session management
      localStorage.setItem('vendorData', JSON.stringify(vendorData));
      toast({
        title: "Login successful",
        description: "Welcome to your vendor dashboard!",
      });
      setLocation("/vendor-dashboard");
    },
    onError: (error: any) => {
      console.error("Login error:", error);
      
      // Handle approval status error specifically
      if (error.message && error.message.includes("403")) {
        toast({
          title: "Account Not Approved",
          description: "Your vendor account is pending approval by our admin team. You will be notified once your account is verified.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: error.message || "Please check your credentials and try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#FFF4E6] to-[#FAFAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl border-[#F1F5F9] shadow-[0_15px_45px_rgba(15,23,42,0.06)] bg-white overflow-hidden p-2">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-[#FF5A1F]/10 text-[#FF5A1F] p-3 rounded-2xl border border-[#FF5A1F]/10">
              <Store className="w-8 h-8 text-[#FF5A1F]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-extrabold text-gray-900 tracking-tight">Vendor Login</CardTitle>
          <p className="text-gray-500 text-sm mt-1">Access your BuyLock vendor dashboard</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-gray-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="vendor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 rounded-xl border-gray-200 focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/20"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-semibold text-gray-700">Password</Label>
                <button
                  type="button"
                  onClick={() => setLocation("/vendor-dashboard/forgot-password")}
                  className="text-xs text-[#FF5A1F] hover:text-[#e64e17] font-semibold transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 rounded-xl border-gray-200 focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/20"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#FF5A1F] hover:bg-[#e64e17] text-white font-semibold rounded-[14px] py-6 shadow-sm hover:shadow-[0_8px_24px_rgba(255,90,31,0.3)] transition-all hover:-translate-y-0.5 flex items-center justify-center border-none mt-2"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2.5">
            <p className="text-sm text-gray-500">
              Don't have a vendor account?
            </p>
            <Button
              variant="outline"
              className="w-full border-2 border-[#FF5A1F] text-[#FF5A1F] hover:bg-[#FF5A1F] hover:text-white rounded-[14px] font-semibold transition-all py-5 flex items-center justify-center"
              onClick={() => setLocation("/vendor/registration")}
            >
              Register as Vendor
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              className="text-sm text-gray-400 hover:text-gray-600"
              onClick={() => setLocation("/")}
            >
              ← Back to Main Site
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}