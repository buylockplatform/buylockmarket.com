import { Zap, Shield, Star, Headphones } from "lucide-react";

const features = [
  {
    icon: Zap,
    gradient: "from-[#FF5A1F] to-[#FF8C42]",
    title: "Ultra-Fast Delivery",
    description: "Delivered in under 45 minutes to your door. Lightning fast, every time.",
  },
  {
    icon: Shield,
    gradient: "from-[#3B82F6] to-[#6366F1]",
    title: "Secure & Safe",
    description: "Your payments and data are 100% protected. Shop with total confidence.",
  },
  {
    icon: Star,
    gradient: "from-[#22C55E] to-[#16A34A]",
    title: "Premium Quality",
    description: "Curated products and trusted service professionals, verified for you.",
  },
  {
    icon: Headphones,
    gradient: "from-[#F59E0B] to-[#D97706]",
    title: "24/7 Customer Support",
    description: "We're always here to help, whenever you need us.",
  },
];

export function WhyChoose() {
  return (
    <section className="bg-white py-16 border-t border-[#F1F5F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="bl-section-title mb-3">Why Choose BuyLock?</h2>
          <p className="bl-section-sub max-w-md mx-auto">
            Built for speed, trust, and quality — everything you need in one place.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, gradient, title, description }, i) => (
            <div
              key={title}
              className={`bl-fade-up bl-fade-up-${i + 1} bg-[#FAFAFB] border border-[#F1F5F9] rounded-2xl p-6 group hover:bg-white transition-colors`}
              style={{
                boxShadow: "0 8px 30px rgba(15,23,42,.04)",
                transition: "transform 180ms ease-out, box-shadow 180ms ease-out, background 180ms ease-out",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 15px 45px rgba(15,23,42,.07)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 30px rgba(15,23,42,.04)";
              }}
            >
              {/* Gradient icon circle */}
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 transition-transform duration-180 group-hover:scale-110`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-[15px] font-semibold text-[#111827] mb-2">{title}</h3>
              <p className="text-[13px] text-[#6B7280] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
