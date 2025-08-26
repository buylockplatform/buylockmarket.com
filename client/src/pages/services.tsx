import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
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
import { Filter, Search, Star } from "lucide-react";
import type { Service, Category } from "@shared/schema";

export default function Services() {
  const search = useSearch();
  const [location, navigate] = useLocation();
  const params = new URLSearchParams(search);
  
  const [searchQuery, setSearchQuery] = useState(params.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(params.get("category") || "all");
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [availableToday, setAvailableToday] = useState(params.get("available") === "true");
  const [sortBy, setSortBy] = useState(params.get("sort") || "newest");
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

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: [
      "/api/services",
      [
        debouncedSearch && `search=${encodeURIComponent(debouncedSearch)}`,
        selectedCategory && selectedCategory !== "all" && `categoryId=${selectedCategory}`,
        availableToday && "availableToday=true",
        `limit=50`,
      ].filter(Boolean).join("&")
    ],
  });

  useEffect(() => {
    const newParams = new URLSearchParams();
    if (searchQuery) newParams.set("search", searchQuery);
    if (selectedCategory) newParams.set("category", selectedCategory);
    if (availableToday) newParams.set("available", "true");
    if (sortBy !== "newest") newParams.set("sort", sortBy);
    
    const newSearch = newParams.toString();
    const newPath = `/services${newSearch ? `?${newSearch}` : ""}`;
    
    if (location !== newPath) {
      navigate(newPath, { replace: true });
    }
  }, [searchQuery, selectedCategory, availableToday, sortBy, location, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Filter and sort logic
  const filteredServices = (services as Service[]).filter(service => {
    if (service.price < priceRange[0] || service.price > priceRange[1]) return false;
    if (selectedRating && (service.rating || 0) < selectedRating) return false;
    return true;
  });

  const sortItems = (items: Service[]) => {
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

  const sortedServices = sortItems(filteredServices);

  const clearFilters = () => {
    setSelectedCategory("");
    setPriceRange([0, 500000]);
    setSelectedRating(null);
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
    selectedCategory,
    selectedRating,
    availableToday,
    priceRange[0] > 0 || priceRange[1] < 500000,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Services</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-80 ${showFilters ? "block" : "hidden lg:block"}`}>
            {/* Dropdown Controls Above Filters */}
            <div className="space-y-4 mb-6">
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Filter */}
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

                {/* Customer Rating */}
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

                {/* Availability */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Availability</h3>
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
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-buylock-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Controls Bar */}
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
                  {sortedServices.length} result{sortedServices.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {isLoading ? (
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
              ) : sortedServices.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">No services found</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                </div>
              ) : (
                sortedServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
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