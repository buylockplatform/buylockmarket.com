import { useState } from "react";
import { useLocation } from "wouter";

type Step = 0 | 1 | 2;

export default function RiderRegister() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [idNumber, setIdNumber] = useState("");

  // Step 2 files
  const [files, setFiles] = useState<Record<string, File | null>>({
    idFront: null, idBack: null, licenseFront: null, licenseBack: null, insurance: null, goodConduct: null,
  });

  const handleFileChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles((prev) => ({ ...prev, [field]: e.target.files?.[0] ?? null }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("fullName", fullName);
      fd.append("email", email);
      fd.append("phone", phone);
      fd.append("password", password);
      fd.append("idNumber", idNumber);
      Object.entries(files).forEach(([key, file]) => {
        if (file) fd.append(key, file);
      });

      const res = await fetch("/api/auth/driver/register", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
          <p className="text-gray-400 mb-6">
            Your application is under review. You'll receive an SMS once approved (typically 12–24 hours).
          </p>
          <button onClick={() => setLocation("/delivery/login")} className="px-6 py-3 bg-[#FF4705] text-white rounded-xl font-semibold">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E] p-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FF4705] mb-4">
            <span className="text-2xl">🏍️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Buylock Rider</h1>
          <p className="text-gray-400 mt-1">Join our delivery fleet</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {["Personal Info", "Documents"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step === i ? "bg-[#FF4705] text-white" : step > i ? "bg-green-500 text-white" : "bg-white/10 text-gray-400"}`}>
                {step > i ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${step === i ? "text-white" : "text-gray-500"}`}>{label}</span>
              {i < 1 && <div className="w-8 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-4">Personal Information</h2>
              {[
                { label: "Full Name", value: fullName, setter: setFullName, type: "text", placeholder: "John Doe" },
                { label: "National ID / Passport Number", value: idNumber, setter: setIdNumber, type: "text", placeholder: "12345678" },
                { label: "Email Address", value: email, setter: setEmail, type: "email", placeholder: "you@example.com" },
                { label: "Phone Number (M-Pesa)", value: phone, setter: setPhone, type: "tel", placeholder: "2547XXXXXXXX" },
                { label: "Password", value: password, setter: setPassword, type: "password", placeholder: "Min. 6 characters" },
              ].map(({ label, value, setter, type, placeholder }) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FF4705] transition-colors"
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  if (!fullName || !email || !phone || !password || !idNumber) {
                    setError("All fields are required");
                    return;
                  }
                  setError("");
                  setStep(1);
                }}
                className="w-full py-3 bg-[#FF4705] hover:bg-[#e03d04] text-white font-semibold rounded-xl transition-colors mt-2"
              >
                Next: Upload Documents →
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-4">Required Documents</h2>
              <p className="text-gray-400 text-sm mb-4">Upload clear, well-lit photos. Accepted: JPG, PNG (max 10 MB)</p>

              {[
                { key: "idFront", label: "National ID — Front", required: true },
                { key: "idBack", label: "National ID — Back", required: true },
                { key: "licenseFront", label: "Driving License — Front", required: true },
                { key: "licenseBack", label: "Driving License — Back", required: true },
                { key: "insurance", label: "Motor Insurance Certificate", required: true },
                { key: "goodConduct", label: "Certificate of Good Conduct", required: false },
              ].map(({ key, label, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {label} {required && <span className="text-red-400">*</span>}
                  </label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${files[key] ? "border-green-500/50 bg-green-500/5" : "border-white/10 bg-white/5"}`}>
                    <input type="file" accept="image/*" onChange={handleFileChange(key)} className="hidden" id={`file-${key}`} />
                    <label htmlFor={`file-${key}`} className="cursor-pointer text-[#FF4705] text-sm font-medium">
                      {files[key] ? "✓ " + (files[key] as File).name : "Choose file"}
                    </label>
                  </div>
                </div>
              ))}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 py-3 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/5 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !files.idFront || !files.idBack || !files.licenseFront || !files.licenseBack || !files.insurance}
                  className="flex-1 py-3 bg-[#FF4705] hover:bg-[#e03d04] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          Already have an account?{" "}
          <a href="/delivery/login" className="text-[#FF4705] hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
