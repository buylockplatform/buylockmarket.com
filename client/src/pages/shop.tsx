import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
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
import { Switch } from "@/components/ui/switch";
import { Search, Filter, Star, X, MapPin } from "lucide-react";
import type { Product, Service, Category } from "@shared/schema";

interface CustomerLocation {
  latitude: number;
  longitude: number;
  description: string;
}

export default function Shop() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  
  const [searchQuery, setSearchQuery] = useState(params.get("search") || "");
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
  const [customerLocation, setCustomerLocation] = useState<CustomerLocation | null>(null);
  const [nearestToMeEnabled, setNearestToMeEnabled] = useState(false);

  // Load customer location from localStorage
  useEffect(() => {
    const savedLocation = localStorage.getItem("buylock_customer_location");
    if (savedLocation) {
      try {
        setCustomerLocation(JSON.parse(savedLocation));
      } catch (error) {
        console.error("Error parsing saved location:", error);
      }
    }
  }, []);

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

  // Handle URL parameters for category, search, and type
  useEffect(() => {
    const categoryParam = params.get("category");
    if (categoryParam && categories.length > 0) {
      // Find category by slug (formatted as lowercase with hyphens)
      const category = categories.find(cat => 
        cat.slug === categoryParam || 
        cat.name.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-") === categoryParam
      );
      if (category) {
        setSelectedCategories([category.id]);
      }
    }
    
    const searchParam = params.get("search");
    if (searchParam) {
      setSearchQuery(searchParam);
      setDebouncedSearch(searchParam);
    }
    
    const productTypeParam = params.get("product_type");
    if (productTypeParam) {
      if (productTypeParam === "products") {
        setSelectedTypes(["products"]);
      } else if (productTypeParam === "services") {
        setSelectedTypes(["services"]);
      }
    }
  }, [search, categories]);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [
      "/api/products",
      {
        search: debouncedSearch || undefined,
        categoryIds: selectedCategories.length > 0 ? selectedCategories.join(",") : undefined,
        customerLat: customerLocation?.latitude,
        customerLng: customerLocation?.longitude,
        sortByProximity: (nearestToMeEnabled && customerLocation) || undefined,
        limit: 50,
      }
    ],
    enabled: selectedTypes.includes("products"),

  });

  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: [
      "/api/services",
      {
        search: debouncedSearch || undefined,
        categoryIds: selectedCategories.length > 0 ? selectedCategories.join(",") : undefined,
        availableToday: availableToday || undefined,
        customerLat: customerLocation?.latitude,
        customerLng: customerLocation?.longitude,
        sortByProximity: (nearestToMeEnabled && customerLocation) || undefined,
        limit: 50,
      }
    ],
    enabled: selectedTypes.includes("services"),
  });

  // Get unique brands from products (note: using brandId since brand doesn't exist on Product type)
  const brands: string[] = [];

  // Filter and sort logic
  const filteredProducts = (products as Product[]).filter(product => {
    const productPrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    if (productPrice < priceRange[0] || productPrice > priceRange[1]) return false;
    if (selectedRating && parseFloat(product.rating || "0") < selectedRating) return false;
    if (inStock && (product.stock || 0) <= 0) return false;
    return true;
  });

  // Debug the raw products data
  useEffect(() => {
    if (products.length > 0 && nearestToMeEnabled) {
      console.log("Raw products from API:", products.slice(0, 2).map(p => ({ name: p.name, distance: p.distance })));
    }
  }, [products, nearestToMeEnabled]);

  const filteredServices = (services as Service[]).filter(service => {
    const servicePrice = typeof service.price === 'string' ? parseFloat(service.price) : service.price;
    if (servicePrice < priceRange[0] || servicePrice > priceRange[1]) return false;
    if (selectedRating && parseFloat(service.rating || "0") < selectedRating) return false;
    return true;
  });

  const sortItems = (items: (Product | Service)[]) => {
    switch (sortBy) {
      case "price-low":
        return [...items].sort((a, b) => {
          const aPrice = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
          const bPrice = typeof b.price === 'string' ? parseFloat(b.price) : b.price;
          return aPrice - bPrice;
        });
      case "price-high":
        return [...items].sort((a, b) => {
          const aPrice = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
          const bPrice = typeof b.price === 'string' ? parseFloat(b.price) : b.price;
          return bPrice - aPrice;
        });
      case "rating":
        return [...items].sort((a, b) => {
          const aRating = parseFloat(a.rating || "0");
          const bRating = parseFloat(b.rating || "0");
          return bRating - aRating;
        });
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

  // Debug sorted items
  useEffect(() => {
    if (sortedItems.length > 0 && nearestToMeEnabled) {
      console.log("Sorted items before rendering:", sortedItems.slice(0, 2).map(p => ({ name: p.name, distance: p.distance })));
    }
  }, [sortedItems, nearestToMeEnabled]);

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
    setNearestToMeEnabled(false);
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
    nearestToMeEnabled,
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
            {/* Nearest To Me Toggle */}
            {customerLocation && (
              <div className="mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-buylock-primary" />
                      Nearest To Me
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700">Show closest vendors first</span>
                        <span className="text-xs text-gray-500">{customerLocation.description}</span>
                      </div>
                      <Switch
                        checked={nearestToMeEnabled}
                        onCheckedChange={setNearestToMeEnabled}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

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
                        Clear
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
                      <span>KES {priceRange[0].toLocaleString()}</span>
                      <span>KES {priceRange[1].toLocaleString()}</span>
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
                sortedItems.map((item) => {
                  // Debug log item before passing to component
                  if (nearestToMeEnabled) {
                    console.log(`Rendering item: ${item.name}, distance: ${item.distance}`);
                  }
                  return "priceType" in item ? (
                    <ServiceCard key={item.id} service={item as Service} showDistanceBadge={nearestToMeEnabled} />
                  ) : (
                    <ProductCard key={item.id} product={item as Product} showDistanceBadge={nearestToMeEnabled} />
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}