import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, ArrowLeft, KeyRound, CheckCircle, Eye, EyeOff } from "lucide-react";

function getTokenFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("token");
}

export default function VendorResetPassword() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const token = getTokenFromUrl();

  const resetMutation = useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const res = await fetch("/api/vendor/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to reset password");
      return result;
    },
    onSuccess: () => setSuccess(true),
    onError: (err: any) => setError(err.message || "Failed to reset password. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (!token) { setError("Invalid reset link. Please request a new one."); return; }
    resetMutation.mutate({ token, password });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-buylock-primary/10 via-white to-buylock-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 flex flex-col items-center text-center space-y-4">
            <div className="bg-red-100 p-4 rounded-full">
              <KeyRound className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Invalid Reset Link</h2>
            <p className="text-gray-600 text-sm">This reset link is invalid or has expired. Please request a new one.</p>
            <Button className="w-full bg-buylock-primary hover:bg-buylock-primary/90" onClick={() => setLocation("/vendor-dashboard/forgot-password")}>
              Request New Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-buylock-primary/10 via-white to-buylock-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 flex flex-col items-center text-center space-y-4">
            <div className="bg-buylock-primary text-white p-3 rounded-xl mb-2">
              <Store className="w-8 h-8" />
            </div>
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Password Reset!</h2>
            <p className="text-gray-600 text-sm">Your password has been updated. You can now sign in with your new password.</p>
            <Button className="w-full bg-buylock-primary hover:bg-buylock-primary/90" onClick={() => setLocation("/vendor-dashboard/login")}>
              Sign In Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-buylock-primary/10 via-white to-buylock-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-buylock-primary text-white p-3 rounded-xl">
              <Store className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
          <p className="text-gray-600 text-sm">Choose a strong password for your account</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-buylock-primary hover:bg-buylock-primary/90"
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setLocation("/vendor-dashboard/login")}
              className="inline-flex items-center text-sm text-gray-600 hover:text-buylock-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Sign In
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
