import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Zap } from "lucide-react";

export function FlashDeals() {
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 34, seconds: 48 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) { seconds--; }
        else { seconds = 59; if (minutes > 0) { minutes--; } else { minutes = 59; if (hours > 0) hours--; } }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="py-8 bg-[#FAFAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-2xl px-8 py-7"
          style={{
            background: "linear-gradient(135deg, #FF5A1F 0%, #FF3CAC 55%, #784BA0 100%)",
          }}
        >
          {/* Decorative lightning — right side */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none select-none">
            <Zap className="w-40 h-40 text-yellow-300" strokeWidth={1} />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Left text */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <span className="text-white font-bold text-xl tracking-tight">Flash Deals</span>
              </div>
              <p className="text-white/80 text-sm">Limited time offers • Up to 70% off</p>
            </div>

            {/* Right: countdown + CTA */}
            <div className="flex items-center gap-4">
              {/* Countdown */}
              <div className="flex items-center gap-2">
                {[
                  { val: pad(timeLeft.hours),   label: "Hours" },
                  { val: pad(timeLeft.minutes), label: "Mins" },
                  { val: pad(timeLeft.seconds), label: "Secs" },
                ].map(({ val, label }, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="text-center">
                      <div
                        className="bg-white/20 backdrop-blur rounded-xl px-3.5 py-2.5 min-w-[52px]"
                        style={{ boxShadow: "0 4px 12px rgba(0,0,0,.15)" }}
                      >
                        <span className="text-white font-bold text-2xl leading-none tabular-nums">{val}</span>
                      </div>
                      <p className="text-white/70 text-[11px] mt-1 font-medium">{label}</p>
                    </div>
                    {i < 2 && (
                      <span className="text-white font-bold text-xl mb-4 select-none">:</span>
                    )}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link href="/shop?featured=true">
                <button className="bg-white text-[#FF5A1F] font-bold text-sm px-5 py-2.5 rounded-full hover:bg-[#FAFAFB] transition-colors"
                  style={{ boxShadow: "0 4px 16px rgba(0,0,0,.15)" }}>
                  Shop Deals
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
