import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Play, Zap, Shield, RotateCcw, Star } from "lucide-react";

export function HeroSection() {
  const trustAvatars = [
    "https://i.pravatar.cc/32?img=1",
    "https://i.pravatar.cc/32?img=2",
    "https://i.pravatar.cc/32?img=3",
    "https://i.pravatar.cc/32?img=4",
  ];

  const benefits = [
    { icon: Zap,        label: "45-Min Delivery",    sub: "Lightning fast" },
    { icon: Shield,     label: "Secure Payments",    sub: "100% protected" },
    { icon: RotateCcw,  label: "Easy Returns",       sub: "Hassle-free" },
    { icon: Star,       label: "Top Quality",        sub: "Trusted brands" },
  ];

  return (
    <section className="bg-white border-b border-[#F1F5F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid lg:grid-cols-[55%_45%] gap-8 lg:gap-12 items-center">

          {/* ── Left column ── */}
          <div className="bl-fade-up">
            {/* Trust pill */}
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="flex -space-x-2">
                {trustAvatars.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <span className="text-sm text-[#6B7280]">
                Trusted by thousands of happy customers
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#111827] leading-[1.12] tracking-[-0.03em] mb-5">
              Everything You Need,{" "}
              <span className="text-[#FF5A1F]">Delivered</span> to You.
            </h1>

            {/* Sub-headline */}
            <p className="text-[#6B7280] text-lg leading-relaxed max-w-[520px] mb-8">
              Premium products and professional services,
              delivered fast, securely and reliably.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link href="/shop?product_type=products">
                <button className="bl-btn-primary inline-flex items-center gap-2 px-7 py-3.5 text-[15px]">
                  Shop Now
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <Link href="/shop?product_type=services">
                <button className="bl-btn-outline inline-flex items-center gap-2 px-7 py-3.5 text-[15px]">
                  <Play className="w-4 h-4" />
                  Explore Services
                </button>
              </Link>
            </div>

            {/* Benefit pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {benefits.map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="flex items-start gap-2.5 bg-[#FAFAFB] rounded-xl px-3 py-3 border border-[#F1F5F9]"
                >
                  <div className="w-8 h-8 rounded-full bg-[#FF5A1F]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-[#FF5A1F]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-600 font-semibold text-[#111827] leading-tight">{label}</p>
                    <p className="text-[11px] text-[#6B7280]">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column — floating product composition ── */}
          <div className="relative flex items-center justify-center bl-fade-up bl-fade-up-2">
            {/* Decorative ring */}
            <div
              className="absolute w-[420px] h-[420px] rounded-full border-[28px] border-[#FF5A1F]/10"
              style={{ animation: "spin 30s linear infinite" }}
            />
            <div
              className="absolute w-[320px] h-[320px] rounded-full border-[16px] border-[#FF5A1F]/06"
              style={{ animation: "spin 20s linear infinite reverse" }}
            />

            {/* Hero product image */}
            <div className="relative z-10 w-[340px] h-[340px] flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600"
                alt="Featured products"
                className="w-72 h-72 object-contain drop-shadow-2xl"
                style={{ animation: "float 6s ease-in-out infinite" }}
              />
            </div>

            {/* Floating accent cards */}
            <div
              className="absolute top-6 right-2 bl-card p-3 flex items-center gap-2.5 w-[148px]"
              style={{ animation: "float 4s ease-in-out infinite 1s" }}
            >
              <div className="w-8 h-8 rounded-lg bg-[#FF5A1F] flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#111827]">Fast Delivery</p>
                <p className="text-[10px] text-[#6B7280]">Under 45 mins</p>
              </div>
            </div>

            <div
              className="absolute bottom-8 left-0 bl-card p-3 flex items-center gap-2.5 w-[156px]"
              style={{ animation: "float 5s ease-in-out infinite 0.5s" }}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#111827]">Secure & Safe</p>
                <p className="text-[10px] text-[#6B7280]">Protected checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
