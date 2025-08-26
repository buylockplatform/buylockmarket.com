import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import { Store, ArrowLeft } from "lucide-react";
import type { LoginVendorInput } from "@shared/schema";

export default function Login() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<LoginVendorInput>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<string>("");
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (data: LoginVendorInput) =>
      apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (vendor) => {
      queryClient.setQueryData(["/api/auth/vendor"], vendor);
      setLocation("/");
    },
    onError: (error: any) => {
      setErrors(error.message || "Login failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors("");
    loginMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-buylock-primary/10 via-white to-buylock-secondary/20 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-buylock-primary text-white p-3 rounded-xl">
              <Store className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BuyLock Vendor</h1>
          <p className="text-gray-600 mt-2">Manage your business with ease</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your vendor account to manage your products and services
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errors && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                  {errors}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="vendor@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setLocation("/register")}
                  className="text-buylock-primary hover:underline font-medium"
                >
                  Register here
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Demo Account</h3>
          <p className="text-sm text-blue-700 mb-2">Try the demo with these credentials:</p>
          <div className="text-sm text-blue-800 font-mono bg-blue-100 p-2 rounded">
            <div>Email: vendor@buylock.com</div>
            <div>Password: password123</div>
          </div>
        </div>

        {/* Back to main site */}
        <div className="text-center mt-6">
          <button
            onClick={() => window.location.href = "/"}
            className="inline-flex items-center text-sm text-gray-600 hover:text-buylock-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to BuyLock Marketplace
          </button>
        </div>
      </div>
    </div>
  );
}