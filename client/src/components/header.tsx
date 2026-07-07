import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  MapPin,
  User,
  ShoppingCart,
  Menu,
  X,
  Clock,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { useQuery } from "@tanstack/react-query";
import { BuyLockLogo } from "@/lib/buylock-logo";
import { CurrencySwitch } from "@/components/CurrencySwitch";
import { useCurrency } from "@/contexts/CurrencyContext";
import { LocationPicker } from "@/components/LocationPicker";
import type { Product, Service, Category } from "@shared/schema";

interface LocationData {
  latitude: number;
  longitude: number;
  description: string;
}

export function Header() {
  const [location, navigate] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [customerLocation, setCustomerLocation] = useState<LocationData>({
    latitude: -1.2921,
    longitude: 36.8219,
    description: "Nairobi, Kenya"
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, user } = useAuth();
  const { logout, isLoggingOut } = useLogout();

  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
  });

  // Get search suggestions data
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", { limit: 100 }],
  });

  const { data: allServices = [] } = useQuery<Service[]>({
    queryKey: ["/api/services", { limit: 100 }],
  });

  // Load recent searches and customer location from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("buylock_recent_searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }

    const savedLocation = localStorage.getItem("buylock_customer_location");
    if (savedLocation) {
      setCustomerLocation(JSON.parse(savedLocation));
    }
  }, []);

  // Save search to recent searches
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;

    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(
      0,
      10,
    );
    setRecentSearches(updated);
    localStorage.setItem("buylock_recent_searches", JSON.stringify(updated));
  };

  // Handle location selection
  const handleLocationSelect = (location: LocationData) => {
    setCustomerLocation(location);
    localStorage.setItem("buylock_customer_location", JSON.stringify(location));
    setIsLocationModalOpen(false);
  };

  // Get random recommended product
  const getRecommendedProduct = () => {
    if (allProducts.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * allProducts.length);
    return allProducts[randomIndex];
  };

  // Get featured products (random selection of 6 products)
  const getFeaturedProducts = () => {
    if (allProducts.length === 0) return [];
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 6);
  };

  // Get product/service suggestions with full objects for thumbnails
  const getProductSuggestions = (query: string) => {
    if (!query.trim() || query.length < 2) return [];

    const searchTerm = query.toLowerCase();
    const productResults: Product[] = [];

    allProducts.forEach((product) => {
      if (
        product.name.toLowerCase().includes(searchTerm) ||
        product.tags?.some((tag) => tag.toLowerCase().includes(searchTerm))
      ) {
        productResults.push(product);
      }
    });

    return productResults.slice(0, 5);
  };

  const getServiceSuggestions = (query: string) => {
    if (!query.trim() || query.length < 2) return [];

    const searchTerm = query.toLowerCase();
    const serviceResults: Service[] = [];

    allServices.forEach((service) => {
      if (
        service.name.toLowerCase().includes(searchTerm) ||
        service.tags?.some((tag) => tag.toLowerCase().includes(searchTerm))
      ) {
        serviceResults.push(service);
      }
    });

    return serviceResults.slice(0, 5);
  };

  // Format price helper
  const { formatPrice } = useCurrency();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      setShowSuggestions(false);
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      searchInputRef.current?.blur();
    }
  };

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearchQuery.trim()) {
      saveRecentSearch(mobileSearchQuery.trim());
      setShowMobileSuggestions(false);
      navigate(`/shop?search=${encodeURIComponent(mobileSearchQuery.trim())}`);
      mobileSearchInputRef.current?.blur();
    }
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion: string, isMobile = false) => {
    if (isMobile) {
      setMobileSearchQuery(suggestion);
      setShowMobileSuggestions(false);
      mobileSearchInputRef.current?.blur();
    } else {
      setSearchQuery(suggestion);
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
    saveRecentSearch(suggestion);
    navigate(`/shop?search=${encodeURIComponent(suggestion)}`);
  };

  // Handle input focus and blur
  const handleInputFocus = (isMobile = false) => {
    if (isMobile) {
      setShowMobileSuggestions(true);
    } else {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (isMobile = false) => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
      if (isMobile) {
        setShowMobileSuggestions(false);
      } else {
        setShowSuggestions(false);
      }
    }, 150);
  };

  // Render suggestions dropdown with thumbnails and recommended product
  const renderSuggestions = (
    query: string,
    isVisible: boolean,
    isMobile = false,
  ) => {
    if (!isVisible) return null;

    const isShowingRecent = !query.trim() || query.length < 2;
    const recommendedProduct = getRecommendedProduct();

    // If showing recent searches, show recommended product + featured products + recent searches
    if (isShowingRecent) {
      const featuredProducts = getFeaturedProducts();

      return (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border z-50 max-h-[500px] overflow-y-auto w-full min-w-[600px]">
          <div className="flex">
            {/* Recommended Product Section */}
            {recommendedProduct && (
              <div className="w-1/4 p-4 border-r bg-gradient-to-br from-orange-50 to-red-50">
                <div className="text-xs font-medium text-gray-600 mb-3">
                  Recommended
                </div>
                <div
                  className="cursor-pointer group"
                  onClick={() =>
                    navigate(`/products/${recommendedProduct.slug}`)
                  }
                >
                  <div className="aspect-square w-full mb-3 overflow-hidden rounded-lg bg-gray-100">
                    {recommendedProduct.imageUrl ? (
                      <img
                        src={recommendedProduct.imageUrl}
                        alt={recommendedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 leading-tight">
                    {recommendedProduct.name}
                  </div>
                  <div className="text-sm font-bold text-[#FF4605]">
                    {formatPrice(recommendedProduct.price)}
                  </div>
                </div>
              </div>
            )}

            {/* Featured Products Section */}
            <div className="flex-1 p-4">
              <div className="text-xs font-medium text-gray-600 mb-3">
                Featured Products
              </div>
              {featuredProducts.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">
                  Loading products...
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {featuredProducts.map((product, index) => (
                    <div
                      key={`featured-${index}`}
                      className="cursor-pointer group p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => navigate(`/products/${product.slug}`)}
                    >
                      <div className="aspect-square w-full mb-2 overflow-hidden rounded-md bg-gray-100">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">?</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-medium text-gray-900 mb-1 line-clamp-2 leading-tight">
                        {product.name}
                      </div>
                      <div className="text-xs font-bold text-[#FF4605]">
                        {formatPrice(product.price)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Searches at bottom if available */}
              {recentSearches.length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <div className="text-xs font-medium text-gray-600 mb-2">
                    Recent Searches
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {recentSearches.slice(0, 5).map((recent, index) => (
                      <button
                        key={`recent-${index}`}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                        onClick={() => selectSuggestion(recent, isMobile)}
                      >
                        {recent}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Get product and service suggestions with full objects
    const productResults = getProductSuggestions(query);
    const serviceResults = getServiceSuggestions(query);

    if (productResults.length === 0 && serviceResults.length === 0) {
      return (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 text-sm text-gray-500 text-center">
            No suggestions found
          </div>
        </div>
      );
    }

    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border z-50 max-h-[500px] overflow-y-auto w-full min-w-[700px]">
        <div className="flex">
          {/* Recommended Product Section */}
          {recommendedProduct && (
            <div className="w-1/5 p-4 border-r bg-gradient-to-br from-orange-50 to-red-50">
              <div className="text-xs font-medium text-gray-600 mb-3">
                Recommended
              </div>
              <div
                className="cursor-pointer group"
                onClick={() => navigate(`/products/${recommendedProduct.slug}`)}
              >
                <div className="aspect-square w-full mb-3 overflow-hidden rounded-lg bg-gray-100">
                  {recommendedProduct.imageUrl ? (
                    <img
                      src={recommendedProduct.imageUrl}
                      alt={recommendedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No image</span>
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 leading-tight">
                  {recommendedProduct.name}
                </div>
                <div className="text-sm font-bold text-[#FF4605]">
                  {formatPrice(recommendedProduct.price)}
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="flex-1 grid grid-cols-2 divide-x">
            {/* Products Column */}
            <div className="p-4">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 rounded mb-3">
                Products ({productResults.length})
              </div>
              {productResults.length === 0 ? (
                <div className="px-3 py-6 text-sm text-gray-400 text-center">
                  No products found
                </div>
              ) : (
                productResults.map((product, index) => (
                  <div
                    key={`product-${index}`}
                    className="px-3 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 text-sm rounded-lg group"
                    onClick={() => navigate(`/products/${product.slug}`)}
                  >
                    <div className="w-10 h-10 overflow-hidden rounded-md bg-gray-100 flex-shrink-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">?</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-gray-900 mb-1">
                        {product.name}
                      </div>
                      <div className="text-xs text-[#FF4605] font-bold">
                        {formatPrice(product.price)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Services Column */}
            <div className="p-4">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 rounded mb-3">
                Services ({serviceResults.length})
              </div>
              {serviceResults.length === 0 ? (
                <div className="px-3 py-6 text-sm text-gray-400 text-center">
                  No services found
                </div>
              ) : (
                serviceResults.map((service, index) => (
                  <div
                    key={`service-${index}`}
                    className="px-3 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 text-sm rounded-lg group"
                    onClick={() => navigate(`/services/${service.slug}`)}
                  >
                    <div className="w-10 h-10 overflow-hidden rounded-md bg-gray-100 flex-shrink-0">
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">?</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-gray-900 mb-1">
                        {service.name}
                      </div>
                      <div className="text-xs text-[#FF4605] font-bold">
                        {formatPrice(service.price)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const headerCategories = [
    "Electronics",
    "Fashion",
    "Home & Kitchen",
    "Health & Beauty",
    "Services",
    "Sports",
    "Books",
    "Deals",
  ];

  return (
    <>
      {/* Top Banner */}
      <div className="bg-[#FF5A1F] text-white text-center py-2 text-[13px] font-medium">
        🚚 Free delivery on orders over Ksh 25,000 • Fast delivery in under 45 minutes
      </div>

      {/* Main Header — blurred sticky */}
      <header
        className="sticky top-0 z-50 border-b border-[#F1F5F9]"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <BuyLockLogo className="h-9 max-w-24" />
            </Link>

            {/* Search Bar — pill shape, centered */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products, brands or services..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => handleInputFocus(false)}
                  onBlur={() => handleInputBlur(false)}
                  autoComplete="off"
                  className="w-full pl-5 pr-12 py-2.5 text-sm border border-[#E5E7EB] rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] focus:border-[#FF5A1F] transition-all shadow-[0_2px_8px_rgba(15,23,42,.04)]"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#FF5A1F] rounded-full flex items-center justify-center hover:bg-[#e64e17] transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-white" />
                </button>
                {renderSuggestions(searchQuery, showSuggestions, false)}
              </form>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Location */}
              <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
                <DialogTrigger asChild>
                  <button className="hidden lg:flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#FF5A1F] transition-colors max-w-[140px]">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{customerLocation.description.split(',').slice(0,2).join(',') || "Nairobi"}</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                  <DialogHeader><DialogTitle>Select Your Location</DialogTitle></DialogHeader>
                  <div className="h-[60vh]">
                    <LocationPicker onLocationSelect={handleLocationSelect} initialLocation={customerLocation} />
                  </div>
                </DialogContent>
              </Dialog>

              {/* Account */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#FF5A1F]/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-[#FF5A1F]" />
                    </div>
                    <span className="hidden sm:block">{(user as any)?.firstName || "Account"}</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#F1F5F9] rounded-2xl shadow-[0_15px_45px_rgba(15,23,42,.08)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                    <Link href="/profile" className="block px-4 py-2.5 text-sm text-[#374151] hover:bg-[#FAFAFB] hover:text-[#FF5A1F] transition-colors">Profile</Link>
                    <Link href="/my-orders" className="block px-4 py-2.5 text-sm text-[#374151] hover:bg-[#FAFAFB] hover:text-[#FF5A1F] transition-colors">My Orders</Link>
                    <Link href="/wishlist" className="block px-4 py-2.5 text-sm text-[#374151] hover:bg-[#FAFAFB] hover:text-[#FF5A1F] transition-colors">My Wishlist</Link>
                    <button onClick={(e) => { e.preventDefault(); logout(); }} disabled={isLoggingOut}
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => (window.location.href = "/login")}
                  className="flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:block">Login</span>
                </button>
              )}

              {/* Become a Vendor */}
              <Link href="/vendor/registration"
                className="hidden lg:inline-flex items-center text-[13px] font-semibold text-[#FF5A1F] border-2 border-[#FF5A1F] px-4 py-1.5 rounded-full hover:bg-[#FF5A1F] hover:text-white transition-all duration-180">
                Become a Vendor
              </Link>

              {/* Currency */}
              <CurrencySwitch />

              {/* Cart */}
              <Link href="/cart" className="relative flex items-center gap-1.5 text-[13px] text-[#374151] hover:text-[#FF5A1F] transition-colors">
                <div className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {(cartItems as any)?.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#FF5A1F] text-white text-[10px] rounded-full w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center font-bold">
                      {(cartItems as any)?.length}
                    </span>
                  )}
                </div>
                <span className="hidden sm:block">Cart</span>
              </Link>

              {/* Mobile menu toggle */}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-1.5 rounded-lg hover:bg-[#FAFAFB] transition-colors">
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-3 pb-1">
            <form onSubmit={handleMobileSearch} className="relative">
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder="Search products and services..."
                value={mobileSearchQuery}
                onChange={(e) => { setMobileSearchQuery(e.target.value); setShowMobileSuggestions(true); }}
                onFocus={() => handleInputFocus(true)}
                onBlur={() => handleInputBlur(true)}
                autoComplete="off"
                className="w-full pl-5 pr-12 py-3 text-sm border border-[#E5E7EB] rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] focus:border-[#FF5A1F] transition-all"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#FF5A1F] rounded-full flex items-center justify-center">
                <Search className="w-3.5 h-3.5 text-white" />
              </button>
              {renderSuggestions(mobileSearchQuery, showMobileSuggestions, true)}
            </form>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="border-t border-[#F1F5F9]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
              {headerCategories.map((cat) => (
                <Link
                  key={cat}
                  href={`/shop?category=${cat.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
                  className="whitespace-nowrap text-[13px] font-medium text-[#374151] hover:text-[#FF5A1F] px-3 py-1.5 rounded-full hover:bg-[#FF5A1F]/08 transition-all duration-150"
                >
                  {cat === "Deals" ? <span className="flex items-center gap-1">{cat} <span className="text-[10px] bg-[#FF5A1F] text-white rounded-full px-1.5 py-0.5 font-bold">NEW</span></span> : cat}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-[#F1F5F9] bg-white">
            <div className="px-4 py-4 space-y-1">
              {["Shop", "Products", "Services"].map((item) => (
                <Link key={item} href={item === "Shop" ? "/shop" : `/shop?product_type=${item.toLowerCase()}`}
                  className="block text-[15px] font-medium text-[#374151] hover:text-[#FF5A1F] px-3 py-2.5 rounded-xl hover:bg-[#FAFAFB] transition-colors">
                  {item}
                </Link>
              ))}
              <div className="border-t border-[#F1F5F9] pt-3 mt-3">
                <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide px-3 mb-2">Business</p>
                <Link href="/vendor/registration"
                  className="block text-[14px] font-semibold text-[#FF5A1F] border border-[#FF5A1F] px-3 py-2 rounded-xl mb-2 text-center hover:bg-[#FF5A1F] hover:text-white transition-colors">
                  Become a Vendor
                </Link>
              </div>
              {isAuthenticated ? (
                <div className="border-t border-[#F1F5F9] pt-3 space-y-1">
                  <Link href="/my-orders" className="block text-[14px] text-[#374151] hover:text-[#FF5A1F] px-3 py-2 rounded-xl hover:bg-[#FAFAFB]">My Orders</Link>
                  <Link href="/wishlist" className="block text-[14px] text-[#374151] hover:text-[#FF5A1F] px-3 py-2 rounded-xl hover:bg-[#FAFAFB]">My Wishlist</Link>
                  <button onClick={(e) => { e.preventDefault(); logout(); setIsMenuOpen(false); }} disabled={isLoggingOut}
                    className="block w-full text-left text-[14px] text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 disabled:opacity-50">
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              ) : (
                <button onClick={() => (window.location.href = "/login")}
                  className="w-full mt-2 bl-btn-primary py-3 text-[15px]">
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
