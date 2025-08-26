import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@shared/schema";

export function CategoryGrid() {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
              <Skeleton className="w-full h-20 rounded-lg mb-3" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Default categories with images if no categories from API
  const defaultCategories = [
    {
      id: "1",
      name: "Electronics",
      slug: "electronics",
      imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
    },
    {
      id: "2",
      name: "Fashion",
      slug: "fashion",
      imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
    },
    {
      id: "3",
      name: "Home & Kitchen",
      slug: "home-kitchen",
      imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
    },
    {
      id: "4",
      name: "Health & Beauty",
      slug: "health-beauty",
      imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
    },
    {
      id: "5",
      name: "Services",
      slug: "services",
      imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
    },
    {
      id: "6",
      name: "Sports",
      slug: "sports",
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
    }
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Shop by Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {displayCategories.slice(0, 6).map((category) => (
          <Link
            key={category.id}
            href={category.slug === "services" ? "/shop?product_type=services" : `/shop?category=${category.slug}`}
          >
            <div className="group cursor-pointer">
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border group-hover:border-buylock-primary">
                <img 
                  src={category.imageUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"} 
                  alt={category.name} 
                  className="w-full h-20 object-cover rounded-lg mb-3"
                />
                <h3 className="font-semibold text-center text-gray-900 group-hover:text-buylock-primary">
                  {category.name}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
