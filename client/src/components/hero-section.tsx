import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-buylock-orange to-buylock-cyan text-buylock-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Shop with Confidence</h2>
            <p className="text-xl mb-6 opacity-90">
              Discover amazing products and services with fast delivery to your doorstep
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Link href="/shop?product_type=products">
                <Button size="lg" className="bg-buylock-white text-buylock-orange hover:bg-buylock-gray font-semibold transition-colors">
                  Shop Now
                </Button>
              </Link>
              <Link href="/shop?product_type=services">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-buylock-white bg-transparent text-buylock-white hover:bg-buylock-white hover:text-buylock-orange font-semibold transition-all duration-200"
                >
                  Explore Services
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Shopping bags and products" 
              className="rounded-xl shadow-2xl w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
