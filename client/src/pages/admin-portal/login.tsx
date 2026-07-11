import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Shield, AlertCircle } from "lucide-react";

interface AdminLoginData {
  email: string;
  password: string;
}

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<AdminLoginData>({
    email: "",
    password: "",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: AdminLoginData) => {
      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Login failed");
        }

        return await response.json();
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      localStorage.setItem('adminData', JSON.stringify(data));
      toast({
        title: "Login Successful",
        description: "Welcome to the BuyLock Admin Portal",
      });
      setLocation("/admin-portal/dashboard");
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof AdminLoginData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#FFF4E6] to-[#FAFAFB] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/admin-portal" className="inline-block">
            <div className="mx-auto h-16 w-16 bg-[#FF5A1F]/10 text-[#FF5A1F] rounded-2xl flex items-center justify-center hover:bg-[#FF5A1F]/20 transition-all duration-300 shadow-sm border border-[#FF5A1F]/10">
              <Shield className="h-8 w-8 text-[#FF5A1F]" />
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
            Admin Portal
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to access the BuyLock admin dashboard
          </p>
          <Link 
            href="/admin-portal" 
            className="mt-3 inline-block text-sm text-[#FF5A1F] hover:text-[#e64e17] font-semibold transition-colors"
          >
            ← Back to Admin Portal
          </Link>
        </div>

        {/* Login Form */}
        <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_15px_45px_rgba(15,23,42,0.06)] bg-white overflow-hidden p-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-xl font-bold text-gray-900">Administrator Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-gray-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="admin@buylock.com"
                  className="mt-1 rounded-xl border-gray-200 focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-semibold text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1 rounded-xl border-gray-200 focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/20"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#FF5A1F] hover:bg-[#e64e17] text-white font-semibold rounded-[14px] py-6 shadow-sm hover:shadow-[0_8px_24px_rgba(255,90,31,0.3)] transition-all hover:-translate-y-0.5 flex items-center justify-center border-none"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Security Notice */}
            <Alert className="mt-6 rounded-xl border-amber-100 bg-amber-50/50 text-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                This is a secure admin area. Unauthorized access is prohibited and monitored.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <div className="bg-blue-50/60 border border-blue-100/80 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-blue-900 mb-1.5 text-[15px]">Demo Credentials</h3>
          <p className="text-sm text-blue-800 leading-relaxed">
            <strong>Email:</strong> admin@buylock.com<br />
            <strong>Password:</strong> admin123
          </p>
        </div>
      </div>
    </div>
  );
}