import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { ServiceCard } from "@/components/service-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Star, X } from "lucide-react";
import type { Product, Service, Category } from "@shared/schema";

export default function Shop() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["products", "services"]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [inStock, setInStock] = useState(false);
  const [availableToday, setAvailableToday] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [
      "/api/products",
      [
        debouncedSearch && `search=${encodeURIComponent(debouncedSearch)}`,
        selectedCategories.length > 0 && `categoryIds=${selectedCategories.join(",")}`,
        `limit=50`,
      ].filter(Boolean).join("&")
    ],
    enabled: selectedTypes.includes("products"),
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: [
      "/api/services",
      [
        debouncedSearch && `search=${encodeURIComponent(debouncedSearch)}`,
        selectedCategories.length > 0 && `categoryIds=${selectedCategories.join(",")}`,
        availableToday && "availableToday=true",
        `limit=50`,
      ].filter(Boolean).join("&")
    ],
    enabled: selectedTypes.includes("services"),
  });

  // Get unique brands from products
  const brands = Array.from(new Set((products as Product[]).map(p => p.brand).filter(Boolean)));

  // Filter and sort logic
  const filteredProducts = (products as Product[]).filter(product => {
    if (selectedBrand && product.brand !== selectedBrand) return false;
    if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
    if (selectedRating && (product.rating || 0) < selectedRating) return false;
    if (inStock && (product.stockCount || 0) <= 0) return false;
    return true;
  });

  const filteredServices = (services as Service[]).filter(service => {
    if (service.price < priceRange[0] || service.price > priceRange[1]) return false;
    if (selectedRating && (service.rating || 0) < selectedRating) return false;
    return true;
  });

  const sortItems = (items: (Product | Service)[]) => {
    switch (sortBy) {
      case "price-low":
        return [...items].sort((a, b) => a.price - b.price);
      case "price-high":
        return [...items].sort((a, b) => b.price - a.price);
      case "rating":
        return [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "newest":
        return [...items].sort((a, b) => {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate;
        });
      default:
        return items;
    }
  };

  const allItems = selectedTypes.includes("products") && selectedTypes.includes("services") ? 
                   [...filteredProducts, ...filteredServices] :
                   selectedTypes.includes("products") ? filteredProducts : filteredServices;

  const sortedItems = sortItems(allItems);



  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(categoryId);
      if (isSelected) {
        return prev.filter(c => c !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const clearAllCategories = () => {
    setSelectedCategories([]);
  };

  const clearFilters = () => {
    setSelectedTypes(["products", "services"]);
    setSelectedCategories([]);
    setSelectedBrand("all");
    setPriceRange([0, 500000]);
    setSelectedRating(null);
    setInStock(false);
    setAvailableToday(false);
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
        <span className="text-sm text-gray-600">& up</span>
      </div>
    );
  };

  const activeFiltersCount = [
    selectedTypes.length < 2, // Only count if not all types selected
    selectedCategories.length > 0,
    selectedBrand && selectedBrand !== "all",
    selectedRating,
    inStock,
    availableToday,
    priceRange[0] > 0 || priceRange[1] < 500000,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Shop</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-80 ${showFilters ? "block" : "hidden lg:block"}`}>
            {/* Type Filter Above Filters */}
            <div className="mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Product Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-products"
                        checked={selectedTypes.includes("products")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTypes(prev => [...prev, "products"]);
                          } else {
                            setSelectedTypes(prev => prev.filter(t => t !== "products"));
                          }
                        }}
                      />
                      <label htmlFor="type-products" className="text-sm text-gray-700 cursor-pointer">
                        Products
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-services"
                        checked={selectedTypes.includes("services")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTypes(prev => [...prev, "services"]);
                          } else {
                            setSelectedTypes(prev => prev.filter(t => t !== "services"));
                          }
                        }}
                      />
                      <label htmlFor="type-services" className="text-sm text-gray-700 cursor-pointer">
                        Services
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filters</CardTitle>
                  <div className="flex items-center space-x-2">
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-buylock-primary hover:text-buylock-primary/80"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category Filter */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Category</h3>
                    {selectedCategories.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearAllCategories}
                        className="text-xs text-buylock-primary hover:text-buylock-primary/80"
                      >
                        Clear All ({selectedCategories.length})
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categories.map((category) => {
                      const categoryProducts = filteredProducts.filter(p => p.categoryId === category.id);
                      const categoryServices = filteredServices.filter(s => s.categoryId === category.id);
                      const categoryTotal = categoryProducts.length + categoryServices.length;
                      const isSelected = selectedCategories.includes(category.id);
                      
                      return (
                        <div 
                          key={category.id}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={isSelected}
                            onCheckedChange={() => handleCategoryToggle(category.id)}
                          />
                          <label 
                            htmlFor={`category-${category.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-700">
                                  {category.name}
                                </span>
                                {categoryProducts.length > 0 && categoryServices.length > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {categoryProducts.length}p, {categoryServices.length}s
                                  </span>
                                )}
                              </div>
                              <Badge 
                                variant={categoryTotal > 0 ? "secondary" : "outline"} 
                                className={`text-xs ${categoryTotal === 0 ? "text-gray-400" : ""}`}
                              >
                                {categoryTotal}
                              </Badge>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Brand Filter (only for products) */}
                {selectedTypes.includes("products") && brands.length > 0 && (
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Brand</h3>
                      <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Brands" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Brands</SelectItem>
                          {brands.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Price Range */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
                  <div className="space-y-4">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={500000}
                      min={0}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>₦{priceRange[0].toLocaleString()}</span>
                      <span>₦{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Rating Filter */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Rating</h3>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <Checkbox
                          id={`rating-${rating}`}
                          checked={selectedRating === rating}
                          onCheckedChange={(checked) => setSelectedRating(checked ? rating : null)}
                        />
                        <label htmlFor={`rating-${rating}`} className="cursor-pointer">
                          {renderStarRating(rating)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Availability Filters */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Availability</h3>
                  <div className="space-y-2">
                    {selectedTypes.includes("products") && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="in-stock"
                          checked={inStock}
                          onCheckedChange={(checked) => setInStock(checked === true)}
                        />
                        <label htmlFor="in-stock" className="text-sm text-gray-700 cursor-pointer">
                          In Stock
                        </label>
                      </div>
                    )}
                    {selectedTypes.includes("services") && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="available-today"
                          checked={availableToday}
                          onCheckedChange={(checked) => setAvailableToday(checked === true)}
                        />
                        <label htmlFor="available-today" className="text-sm text-gray-700 cursor-pointer">
                          Available Today
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Area */}
          <div className="flex-1">
            {/* Search Bar Above Results */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search products and services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-buylock-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Controls Bar with Results Counter and Sort */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                
                <p className="text-sm text-gray-600">
                  {sortedItems.length} result{sortedItems.length !== 1 ? "s" : ""} found
                </p>
              </div>

              {/* Sort Filter */}
              <div className="w-full sm:w-auto sm:min-w-[200px]">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {(productsLoading || servicesLoading) ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border">
                    <Skeleton className="w-full h-48 rounded-t-xl" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))
              ) : sortedItems.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">No items found</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                </div>
              ) : (
                sortedItems.map((item) => (
                  "stockCount" in item ? (
                    <ProductCard key={item.id} product={item as Product} />
                  ) : (
                    <ServiceCard key={item.id} service={item as Service} />
                  )
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}