import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Package,
  Search,
  Eye,
  TrendingUp,
  ShoppingCart,
  Star,
  DollarSign,
  Users,
  Filter,
  RefreshCw,
  Store,
  Calendar,
  Tag,
  CheckCircle,
  Clock,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: string;
  originalPrice?: string;
  imageUrl?: string;
  imageUrls?: string[];
  categoryId: string;
  subcategoryId?: string;
  brandId?: string;
  vendorId: string;
  stock: number;
  rating: string;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  adminApproved: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  // Populated fields from relations
  vendorName?: string;
  vendorBusinessName?: string;
  categoryName?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ProductsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all products from API (admin endpoint)
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/admin/products'],
    retry: false,
  });

  // Fetch categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    retry: false,
  });

  // Toggle admin approval mutation
  const toggleApprovalMutation = useMutation({
    mutationFn: async ({ productId, approved }: { productId: string; approved: boolean }) => {
      return apiRequest("PUT", `/api/admin/products/${productId}/approval`, { approved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({
        title: "Success",
        description: "Product approval status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update approval status",
        variant: "destructive",
      });
    },
  });

  // Filter products based on status
  const approvedProducts = (products as Product[]).filter(product => product.adminApproved);
  const pendingProducts = (products as Product[]).filter(product => !product.adminApproved);
  const activeProducts = (products as Product[]).filter(product => product.isActive);
  const inactiveProducts = (products as Product[]).filter(product => !product.isActive);
  const outOfStockProducts = (products as Product[]).filter(product => product.stock === 0);

  const currentProducts = activeTab === "all" ? products as Product[] :
                         activeTab === "approved" ? approvedProducts :
                         activeTab === "pending" ? pendingProducts :
                         activeTab === "active" ? activeProducts :
                         activeTab === "inactive" ? inactiveProducts : outOfStockProducts;

  const filteredProducts = currentProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.vendorBusinessName && product.vendorBusinessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || product.categoryId === categoryFilter;
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && product.isActive) ||
                         (statusFilter === "inactive" && !product.isActive) ||
                         (statusFilter === "out_of_stock" && product.stock === 0);
    
    const matchesApproval = approvalFilter === "all" ||
                           (approvalFilter === "approved" && product.adminApproved) ||
                           (approvalFilter === "pending" && !product.adminApproved);
    
    const matchesFeatured = featuredFilter === "all" ||
                           (featuredFilter === "featured" && product.isFeatured) ||
                           (featuredFilter === "not_featured" && !product.isFeatured);
    
    return matchesSearch && matchesCategory && matchesStatus && matchesApproval && matchesFeatured;
  });

  const getStatusColor = (product: Product) => {
    if (product.stock === 0) return 'bg-red-100 text-red-800';
    if (!product.isActive) return 'bg-gray-100 text-gray-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (product: Product) => {
    if (product.stock === 0) return 'Out of Stock';
    if (!product.isActive) return 'Inactive';
    return 'Active';
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE');
  };

  const getProductStats = () => {
    const total = currentProducts.length;
    const approved = currentProducts.filter(p => p.adminApproved).length;
    const pending = currentProducts.filter(p => !p.adminApproved).length;
    const active = currentProducts.filter(p => p.isActive && p.stock > 0).length;
    const outOfStock = currentProducts.filter(p => p.stock === 0).length;
    const featured = currentProducts.filter(p => p.isFeatured).length;
    const totalValue = currentProducts.reduce((sum, p) => sum + (parseFloat(p.price) * p.stock), 0);
    const totalStock = currentProducts.reduce((sum, p) => sum + p.stock, 0);
    
    return { total, approved, pending, active, outOfStock, featured, totalValue, totalStock };
  };

  const stats = getProductStats();

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowDetails(true);
  };

  const handleToggleApproval = (product: Product) => {
    toggleApprovalMutation.mutate({
      productId: product.id,
      approved: !product.adminApproved
    });
  };

  if (showDetails && selectedProduct) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => setShowDetails(false)}>
            ← Back to Products
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
            <p className="text-gray-600">#{selectedProduct.id}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(selectedProduct)}>
              {getStatusText(selectedProduct)}
            </Badge>
            {selectedProduct.isFeatured && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900 font-semibold">{selectedProduct.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900">{selectedProduct.description}</p>
              </div>
              {selectedProduct.shortDescription && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Short Description</label>
                  <p className="text-gray-900">{selectedProduct.shortDescription}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Slug</label>
                <p className="text-gray-900">{selectedProduct.slug}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Pricing & Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Price</label>
                <p className="text-gray-900 font-semibold text-lg">{formatCurrency(selectedProduct.price)}</p>
              </div>
              {selectedProduct.originalPrice && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Original Price</label>
                  <p className="text-gray-900 line-through">{formatCurrency(selectedProduct.originalPrice)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Stock</label>
                <p className="text-gray-900">{selectedProduct.stock} units</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Stock Value</label>
                <p className="text-gray-900 font-semibold">{formatCurrency((parseFloat(selectedProduct.price) * selectedProduct.stock).toString())}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="w-5 h-5 mr-2" />
                Vendor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Vendor ID</label>
                <p className="text-gray-900">{selectedProduct.vendorId}</p>
              </div>
              {selectedProduct.vendorBusinessName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Business Name</label>
                  <p className="text-gray-900">{selectedProduct.vendorBusinessName}</p>
                </div>
              )}
              {selectedProduct.categoryName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900">{selectedProduct.categoryName}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Performance & Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Rating</label>
                <p className="text-gray-900">{selectedProduct.rating}/5.0 ({selectedProduct.reviewCount} reviews)</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(selectedProduct)}>
                    {getStatusText(selectedProduct)}
                  </Badge>
                  {selectedProduct.isFeatured && (
                    <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900">{formatDate(selectedProduct.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-gray-900">{formatDate(selectedProduct.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedProduct.imageUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
                {selectedProduct.imageUrls?.map((url, index) => (
                  <img 
                    key={index}
                    src={url} 
                    alt={`${selectedProduct.name} ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedProduct.tags && selectedProduct.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Product Management</h3>
          <p className="text-gray-600">Monitor and manage all products across the platform</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <ShoppingCart className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-gray-900">{stats.featured}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search by product name, vendor, or description..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {(categories as Category[]).map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={approvalFilter} onValueChange={setApprovalFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by approval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by featured" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="featured">Featured Only</SelectItem>
                <SelectItem value="not_featured">Not Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Product Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Products ({(products as Product[]).length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedProducts.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingProducts.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeProducts.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveProducts.length})</TabsTrigger>
          <TabsTrigger value="out_of_stock">Out of Stock ({outOfStockProducts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all" ? "All Products" : 
                 activeTab === "active" ? "Active Products" :
                 activeTab === "inactive" ? "Inactive Products" : "Out of Stock Products"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                        </div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No products found matching your criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                            {product.isFeatured && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            <Badge className={product.adminApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {product.adminApproved ? 'Approved' : 'Pending'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Vendor: {product.vendorBusinessName || product.vendorId} • Stock: {product.stock}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span>{formatCurrency(product.price)}</span>
                            {product.originalPrice && (
                              <>
                                <span>•</span>
                                <span className="line-through">{formatCurrency(product.originalPrice)}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{product.rating}/5 ({product.reviewCount} reviews)</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(product)}>
                          {getStatusText(product)}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Admin Approval:</span>
                          <Switch
                            checked={product.adminApproved}
                            onCheckedChange={() => handleToggleApproval(product)}
                            disabled={toggleApprovalMutation.isPending}
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(product)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}