import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function FlashDeals() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 12,
    minutes: 34,
    seconds: 56
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            }
          }
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-buylock-secondary/20 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-buylock-primary to-orange-600 rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">⚡ Flash Deals</h2>
              <p className="text-lg opacity-90">Limited time offers • Up to 70% off</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div className="text-center">
                <div className="bg-white/20 rounded-lg p-3 mb-1">
                  <span className="text-2xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</span>
                </div>
                <span className="text-sm">Hours</span>
              </div>
              <div className="text-center">
                <div className="bg-white/20 rounded-lg p-3 mb-1">
                  <span className="text-2xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                </div>
                <span className="text-sm">Minutes</span>
              </div>
              <div className="text-center">
                <div className="bg-white/20 rounded-lg p-3 mb-1">
                  <span className="text-2xl font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                </div>
                <span className="text-sm">Seconds</span>
              </div>
              <Link href="/shop?featured=true">
                <Button className="bg-white text-buylock-primary hover:bg-gray-100 font-semibold ml-4">
                  Shop Deals
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
