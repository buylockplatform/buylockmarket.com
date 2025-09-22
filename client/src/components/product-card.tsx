import { useState } from "react";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useGuestCart } from "@/hooks/useGuestCart";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import { ProximityBadge } from "@/components/ProximityBadge";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product & { distance?: number };
  showDistanceBadge?: boolean;
}

export function ProductCard({ product, showDistanceBadge = false }: ProductCardProps) {
  console.log("ProductCard received product:", product.name, "distance:", product.distance, "showDistanceBadge:", showDistanceBadge);
  
  const [isWished, setIsWished] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { addToGuestCart } = useGuestCart();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/cart", "POST", {
        productId: product.id,
        quantity: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Login required",
          description: "Please log in to add items to cart",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      // Add to guest cart for unauthenticated users
      addToGuestCart({
        productId: product.id,
        quantity: 1,
        product: product,
      });
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
      return;
    }

    addToCartMutation.mutate();
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWished(!isWished);
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
  const discountPercent = hasDiscount 
    ? Math.round(((parseFloat(product.originalPrice!) - parseFloat(product.price)) / parseFloat(product.originalPrice!)) * 100)
    : 0;

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border group cursor-pointer">
        <div className="relative">
          <img 
            src={product.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"} 
            alt={product.name} 
            className="w-full h-48 object-cover rounded-t-xl group-hover:scale-105 transition-transform"
          />
          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-buylock-orange text-buylock-white px-2 py-1 rounded text-xs font-semibold">
              -{discountPercent}%
            </div>
          )}
          <button 
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 w-8 h-8 bg-buylock-white rounded-full flex items-center justify-center shadow-md hover:bg-buylock-gray transition-colors"
          >
            <Heart className={`w-4 h-4 ${isWished ? 'fill-buylock-orange text-buylock-orange' : 'text-buylock-charcoal'}`} />
          </button>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
          <div className="flex items-center mb-2">
            <div className="flex text-yellow-400 text-sm">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < Math.floor(parseFloat(product.rating || "0")) ? 'fill-current' : ''}`} 
                />
              ))}
            </div>
            <span className="text-gray-500 text-sm ml-2">({product.reviewCount || 0})</span>
          </div>
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-buylock-orange font-bold text-lg">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-gray-500 line-through text-sm">
                {formatPrice(product.originalPrice!)}
              </span>
            )}
          </div>
          {showDistanceBadge && <ProximityBadge distance={product.distance} className="mb-3" />}
          <Button 
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending || product.stock === 0}
            className="w-full bg-buylock-orange text-buylock-white hover:bg-buylock-orange/90 font-semibold transition-colors"
          >
            {addToCartMutation.isPending 
              ? "Adding..." 
              : product.stock === 0 
                ? "Out of Stock" 
                : "Add to Cart"
            }
          </Button>
        </div>
      </div>
    </Link>
  );
}
