import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight } from "lucide-react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      toast({ title: "Subscribed!", description: "You'll receive the latest deals straight to your inbox." });
      setEmail("");
    }
  };

  return (
    <section className="bg-[#FAFAFB] py-16 border-t border-[#F1F5F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#F1F5F9] rounded-2xl px-8 py-10 flex flex-col lg:flex-row items-center justify-between gap-8"
          style={{ boxShadow: "0 8px 30px rgba(15,23,42,.05)" }}>

          {/* Left — illustration + copy */}
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-[#FF5A1F]/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-8 h-8 text-[#FF5A1F]" />
            </div>
            <div>
              <h2 className="text-[1.4rem] font-bold text-[#111827] mb-1">Stay Updated</h2>
              <p className="text-[14px] text-[#6B7280] max-w-sm">
                Get the latest deals, new products, and exclusive offers delivered straight to your inbox.
              </p>
            </div>
          </div>

          {/* Right — form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-0 w-full lg:w-auto lg:min-w-[360px]">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-5 py-3 text-sm bg-[#FAFAFB] border border-r-0 rounded-l-full outline-none transition-all"
              style={{
                borderColor: focused ? "#FF5A1F" : "#E5E7EB",
                boxShadow: focused ? "0 0 0 3px rgba(255,90,31,.12)" : "none",
              }}
            />
            <button
              type="submit"
              className="bg-[#FF5A1F] text-white text-sm font-semibold px-6 py-3 rounded-r-full hover:bg-[#e64e17] transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              Subscribe
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
