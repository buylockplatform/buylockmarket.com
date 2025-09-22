import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, Minus, Plus, ShoppingCart, Truck, Shield, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { PriceDisplay } from "@/components/PriceDisplay";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Product } from "@shared/schema";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const [isWished, setIsWished] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${slug}`],
    enabled: !!slug,
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/cart", "POST", {
        productId: product!.id,
        quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product!.name} has been added to your cart`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        // Store the pending cart action
        const pendingAction = {
          type: 'addToCart',
          productId: product!.id,
          quantity,
        };
        localStorage.setItem('pendingCartAction', JSON.stringify(pendingAction));
        
        toast({
          title: "Login required",
          description: "Please log in to add items to cart",
          variant: "destructive",
        });
        
        // Redirect to login with current URL as returnTo parameter
        const currentUrl = `/products/${slug}`;
        const returnToParam = encodeURIComponent(currentUrl);
        setTimeout(() => {
          window.location.href = `/login?returnTo=${returnToParam}`;
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

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      // Store the pending cart action
      const pendingAction = {
        type: 'addToCart',
        productId: product!.id,
        quantity,
      };
      localStorage.setItem('pendingCartAction', JSON.stringify(pendingAction));
      
      toast({
        title: "Login required",
        description: "Please log in to add items to cart",
        variant: "destructive",
      });
      
      // Redirect to login with current URL as returnTo parameter
      const currentUrl = `/products/${slug}`;
      const returnToParam = encodeURIComponent(currentUrl);
      setTimeout(() => {
        window.location.href = `/login?returnTo=${returnToParam}`;
      }, 1500);
      return;
    }

    addToCartMutation.mutate();
  };

  // Handle pending cart actions after login
  useEffect(() => {
    if (isAuthenticated && product) {
      const pendingAction = localStorage.getItem('pendingCartAction');
      if (pendingAction) {
        try {
          const action = JSON.parse(pendingAction);
          // Check if the pending action is for the current product
          if (action.type === 'addToCart' && action.productId === product.id) {
            // Update the quantity if it was different when the action was stored
            if (action.quantity !== quantity) {
              setQuantity(action.quantity);
            }
            
            // Execute the cart action
            setTimeout(() => {
              addToCartMutation.mutate();
            }, 500); // Small delay to ensure everything is loaded
            
            // Clear the pending action
            localStorage.removeItem('pendingCartAction');
            
            toast({
              title: "Welcome back!",
              description: "Adding your selected item to cart...",
            });
          }
        } catch (error) {
          console.error('Error parsing pending cart action:', error);
          localStorage.removeItem('pendingCartAction');
        }
      }
    }
  }, [isAuthenticated, product, addToCartMutation, quantity, toast]);

  const { formatPrice } = useCurrency();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="w-full h-96 rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h1>
            <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
  const discountPercent = hasDiscount 
    ? Math.round(((parseFloat(product.originalPrice!) - parseFloat(product.price)) / parseFloat(product.originalPrice!)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={product.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600"} 
                alt={product.name}
                className="w-full h-96 object-cover rounded-xl"
              />
              {hasDiscount && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                  -{discountPercent}% OFF
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsWished(!isWished)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/80 hover:bg-white rounded-full"
              >
                <Heart className={`w-5 h-5 ${isWished ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </Button>
            </div>
            
            {/* Thumbnail images would go here */}
            {product.imageUrls && product.imageUrls.length > 0 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.imageUrls.slice(0, 4).map((url, index) => (
                  <img 
                    key={index}
                    src={url}
                    alt={`${product.name} ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg cursor-pointer border-2 border-transparent hover:border-buylock-primary"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <div className="flex text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${i < Math.floor(parseFloat(product.rating || "0")) ? 'fill-current' : ''}`} 
                      />
                    ))}
                  </div>
                  <span className="text-gray-600 ml-2">({product.reviewCount || 0} reviews)</span>
                </div>
                <Badge variant={product.stock && product.stock > 0 ? "default" : "destructive"}>
                  {product.stock && product.stock > 0 ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <PriceDisplay 
                price={product.price} 
                originalPrice={product.originalPrice}
                size="xl"
                className="text-buylock-primary"
              />
              {hasDiscount && (
                <p className="text-green-600 font-semibold">You save {formatPrice(parseFloat(product.originalPrice!) - parseFloat(product.price))}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description || product.shortDescription || "No description available."}
              </p>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-semibold text-gray-900">Quantity:</span>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={!product.stock || quantity >= product.stock}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {product.stock && (
                  <span className="text-sm text-gray-500">
                    {product.stock} items available
                  </span>
                )}
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending || !product.stock || product.stock === 0}
                  className="flex-1 bg-buylock-primary hover:bg-buylock-primary/90 text-white font-semibold py-3"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 border-buylock-primary text-buylock-primary hover:bg-buylock-primary hover:text-white"
                >
                  Buy Now
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3 pt-6 border-t">
              <div className="flex items-center space-x-3 text-gray-600">
                <Truck className="w-5 h-5 text-buylock-primary" />
                <span>Free delivery on orders over KES 25,000</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600">
                <Shield className="w-5 h-5 text-buylock-primary" />
                <span>Secure payment & buyer protection</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600">
                <RotateCcw className="w-5 h-5 text-buylock-primary" />
                <span>Easy returns within 30 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
