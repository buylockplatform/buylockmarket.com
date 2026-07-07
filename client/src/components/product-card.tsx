import { useState } from "react";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { addToGuestCart } = useGuestCart();
  const queryClient = useQueryClient();

  // Fetch wishlist to know if this product is wishlisted
  const { data: wishlist = [] } = useQuery<Array<{ id: string; productId: string | null }>>({ 
    queryKey: ["/api/wishlist"],
    enabled: isAuthenticated,
  });
  const isWished = wishlist.some((w) => w.productId === product.id);
  const wishlistEntry = wishlist.find((w) => w.productId === product.id);

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
        setTimeout(() => { window.location.href = "/login"; }, 1500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      if (isWished && wishlistEntry) {
        await apiRequest(`/api/wishlist/${wishlistEntry.id}`, "DELETE");
      } else {
        await apiRequest("/api/wishlist", "POST", { productId: product.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: isWished ? "Removed from wishlist" : "Added to wishlist",
        description: isWished ? `${product.name} removed` : `${product.name} saved to wishlist`,
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update wishlist", variant: "destructive" });
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      addToGuestCart({ productId: product.id, quantity: 1, product });
      toast({ title: "Added to cart", description: `${product.name} has been added to your cart` });
      return;
    }
    addToCartMutation.mutate();
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({ title: "Login required", description: "Please log in to save items", variant: "destructive" });
      return;
    }
    wishlistMutation.mutate();
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(numPrice);
  };

  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((parseFloat(product.originalPrice!) - parseFloat(product.price)) / parseFloat(product.originalPrice!)) * 100)
    : 0;

  return (
    <Link href={`/products/${product.slug}`}>
      <div
        className="group relative bg-white border border-[#F1F5F9] rounded-2xl overflow-hidden cursor-pointer"
        style={{
          boxShadow: "0 8px 30px rgba(15,23,42,.05)",
          transition: "transform 180ms ease-out, box-shadow 180ms ease-out",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px) scale(1.015)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 15px 45px rgba(15,23,42,.08)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0) scale(1)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 30px rgba(15,23,42,.05)";
        }}
      >
        {/* Image wrapper — 65% of card */}
        <div className="relative overflow-hidden" style={{ height: "192px" }}>
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&h=300"}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
          />

          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 bl-pill bg-[#FF5A1F] text-white text-[10px]">
              -{discountPercent}%
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <Heart className={`w-4 h-4 transition-colors ${isWished ? "fill-[#FF5A1F] text-[#FF5A1F]" : "text-[#9CA3AF]"}`} />
          </button>

          {/* Quick-add overlay — slides up on hover */}
          <div
            className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm px-3 py-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200"
          >
            <Button
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending || product.stock === 0}
              className="w-full bg-[#FF5A1F] text-white text-[13px] font-semibold rounded-xl py-2 hover:bg-[#e64e17] transition-colors disabled:opacity-50"
              style={{ height: "36px" }}
            >
              {addToCartMutation.isPending ? "Adding…" : product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          {/* Name */}
          <h3 className="text-[14px] font-semibold text-[#111827] line-clamp-2 mb-1.5 group-hover:text-[#FF5A1F] transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(parseFloat(product.rating || "0")) ? "fill-yellow-400 text-yellow-400" : "text-[#E5E7EB]"}`} />
              ))}
            </div>
            <span className="text-[11px] text-[#9CA3AF]">({product.reviewCount || 0})</span>
          </div>

          {/* Price row */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[16px] font-bold text-[#FF5A1F]">{formatPrice(product.price)}</span>
              {hasDiscount && (
                <span className="text-[12px] text-[#9CA3AF] line-through">{formatPrice(product.originalPrice!)}</span>
              )}
            </div>
            {/* Cart icon button (visible on desktop before hover) */}
            <button
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending || product.stock === 0}
              className="w-8 h-8 rounded-full bg-[#FF5A1F]/10 flex items-center justify-center hover:bg-[#FF5A1F] group/btn transition-colors disabled:opacity-40"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-[#FF5A1F] group-hover/btn:text-white transition-colors" />
            </button>
          </div>

          {showDistanceBadge && <ProximityBadge distance={product.distance} className="mt-2" />}
        </div>
      </div>
    </Link>
  );
}
