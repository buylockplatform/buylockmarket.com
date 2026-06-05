import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface WishlistItem {
  id: string;
  userId: string;
  productId: string | null;
  serviceId: string | null;
  createdAt: string;
}

export default function Wishlist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlist = [], isLoading } = useQuery<WishlistItem[]>({
    queryKey: ["/api/wishlist"],
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/wishlist/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({ title: "Removed from wishlist" });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <Heart className="w-8 h-8 text-buylock-orange fill-buylock-orange" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600">Items you've saved for later</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <Skeleton className="h-48 w-full rounded-t-xl" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Heart className="w-20 h-20 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-6">Save items you love by tapping the heart icon on any product.</p>
              <Button asChild className="bg-buylock-orange hover:bg-buylock-orange/90">
                <Link href="/shop">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <Card key={item.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">
                        {item.productId ? "Product" : "Service"}
                      </p>
                      <p className="text-xs text-gray-400 font-mono mt-1">
                        {(item.productId || item.serviceId || "").slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => removeMutation.mutate(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Link href={item.productId ? `/products/${item.productId}` : `/services/${item.serviceId}`}>
                        View Item
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
