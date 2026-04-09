import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import { Store, ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const forgotMutation = useMutation({
    mutationFn: (email: string) =>
      apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: any) => {
      setError(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    forgotMutation.mutate(email);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-buylock-primary/10 via-white to-buylock-secondary/20 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-buylock-primary text-white p-3 rounded-xl">
                <Store className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">BuyLock Vendor</h1>
          </div>

          <Card>
            <CardContent className="pt-8 pb-6 flex flex-col items-center text-center space-y-4">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Check your email</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly. The link expires in <strong>1 hour</strong>.
              </p>
              <p className="text-gray-500 text-sm">
                Didn't receive it? Check your spam folder or try again.
              </p>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => { setSubmitted(false); setEmail(""); }}
              >
                Try a different email
              </Button>
            </CardContent>
            <CardFooter className="justify-center pb-6">
              <button
                type="button"
                onClick={() => setLocation("/login")}
                className="inline-flex items-center text-sm text-gray-600 hover:text-buylock-primary"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Sign In
              </button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-buylock-primary/10 via-white to-buylock-secondary/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-buylock-primary text-white p-3 rounded-xl">
              <Store className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BuyLock Vendor</h1>
          <p className="text-gray-600 mt-2">Reset your password</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Mail className="w-5 h-5 text-buylock-primary" />
              </div>
              <div>
                <CardTitle>Forgot Password?</CardTitle>
                <CardDescription className="mt-1">
                  Enter your email and we'll send a reset link
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="vendor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={forgotMutation.isPending}
              >
                {forgotMutation.isPending ? "Sending..." : "Send Reset Link"}
              </Button>

              <button
                type="button"
                onClick={() => setLocation("/login")}
                className="inline-flex items-center text-sm text-gray-600 hover:text-buylock-primary"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Sign In
              </button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
