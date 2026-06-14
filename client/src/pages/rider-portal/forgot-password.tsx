import { useState } from "react";

export default function RiderForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FF4705] mb-4">
            <span className="text-2xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-gray-400 mt-1">Enter your email to receive a password reset link</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <p className="text-green-400 mb-2">Check your email for a reset link.</p>
              <p className="text-gray-400 text-sm mb-4">The link expires in 1 hour.</p>
              <a href="/delivery/login" className="text-[#FF4705] hover:underline">Back to Login</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FF4705]"
                  placeholder="rider@example.com"
                />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-[#FF4705] text-white font-semibold rounded-xl disabled:opacity-50">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <a href="/delivery/login" className="block text-center text-gray-400 hover:text-white text-sm">← Back to Login</a>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
