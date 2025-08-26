import { Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { Product } from "@shared/schema";
import { PriceDisplay } from "./PriceDisplay";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border group cursor-pointer">
        <div className="relative">
          <img 
            src={product.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250"} 
            alt={product.name} 
            className="w-full h-48 object-cover rounded-t-xl"
          />
          {product.isFeatured && (
            <div className="absolute top-3 left-3 bg-buylock-primary text-white px-2 py-1 rounded text-xs font-semibold">
              Featured
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
              Out of Stock
            </div>
          )}
        </div>
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2 text-xl">{product.name}</h3>
          <p className="text-gray-600 mb-4 line-clamp-2">{product.shortDescription}</p>
          <div className="flex items-center mb-4">
            <div className="flex text-yellow-400 text-sm">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < Math.floor(parseFloat(product.rating || "0")) ? 'fill-current' : ''}`} 
                />
              ))}
            </div>
            <span className="text-gray-500 text-sm ml-2">({product.reviewCount || 0} reviews)</span>
          </div>
          <div className="flex flex-col gap-4">
            <PriceDisplay 
              price={product.price} 
              originalPrice={product.originalPrice}
              size="lg" 
            />
            <Button 
              className="bg-buylock-primary text-white hover:bg-buylock-primary/90 font-semibold w-full"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart?.(product);
              }}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}