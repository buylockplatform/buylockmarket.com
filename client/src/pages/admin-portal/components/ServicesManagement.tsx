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
  Settings,
  Search,
  Eye,
  TrendingUp,
  CheckCircle,
  XCircle,
  Star,
  DollarSign,
  Users,
  Filter,
  RefreshCw,
  Store,
  Calendar,
  Tag,
  Clock,
  MapPin,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: string;
  priceType: string;
  imageUrl?: string;
  imageUrls?: string[];
  categoryId: string;
  providerId: string;
  rating: string;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  adminApproved: boolean;
  tags?: string[];
  location?: string;
  isAvailableToday: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated fields from relations
  providerName?: string;
  providerBusinessName?: string;
  categoryName?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ServicesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all services from API (admin endpoint)
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/admin/services'],
    retry: false,
  });

  // Fetch categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    retry: false,
  });

  // Toggle admin approval mutation
  const toggleApprovalMutation = useMutation({
    mutationFn: async ({ serviceId, approved }: { serviceId: string; approved: boolean }) => {
      return apiRequest("PUT", `/api/admin/services/${serviceId}/approval`, { approved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/services'] });
      toast({
        title: "Success",
        description: "Service approval status updated successfully",
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

  // Filter services based on status
  const approvedServices = (services as Service[]).filter(service => service.adminApproved);
  const pendingServices = (services as Service[]).filter(service => !service.adminApproved);
  const activeServices = (services as Service[]).filter(service => service.isActive);
  const inactiveServices = (services as Service[]).filter(service => !service.isActive);

  const currentServices = activeTab === "all" ? services as Service[] :
                         activeTab === "approved" ? approvedServices :
                         activeTab === "pending" ? pendingServices :
                         activeTab === "active" ? activeServices : inactiveServices;

  const filteredServices = currentServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.providerBusinessName && service.providerBusinessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || service.categoryId === categoryFilter;
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && service.isActive) ||
                         (statusFilter === "inactive" && !service.isActive);
    
    const matchesApproval = approvalFilter === "all" ||
                           (approvalFilter === "approved" && service.adminApproved) ||
                           (approvalFilter === "pending" && !service.adminApproved);
    
    const matchesFeatured = featuredFilter === "all" ||
                           (featuredFilter === "featured" && service.isFeatured) ||
                           (featuredFilter === "not_featured" && !service.isFeatured);
    
    return matchesSearch && matchesCategory && matchesStatus && matchesApproval && matchesFeatured;
  });

  const getStatusColor = (service: Service) => {
    if (!service.adminApproved) return 'bg-yellow-100 text-yellow-800';
    if (!service.isActive) return 'bg-gray-100 text-gray-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (service: Service) => {
    if (!service.adminApproved) return 'Pending Approval';
    if (!service.isActive) return 'Inactive';
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

  const getServiceStats = () => {
    const total = currentServices.length;
    const approved = currentServices.filter(s => s.adminApproved).length;
    const pending = currentServices.filter(s => !s.adminApproved).length;
    const active = currentServices.filter(s => s.isActive).length;
    const featured = currentServices.filter(s => s.isFeatured).length;
    
    return { total, approved, pending, active, featured };
  };

  const stats = getServiceStats();

  const handleViewDetails = (service: Service) => {
    setSelectedService(service);
    setShowDetails(true);
  };

  const handleToggleApproval = (service: Service) => {
    toggleApprovalMutation.mutate({
      serviceId: service.id,
      approved: !service.adminApproved
    });
  };

  if (showDetails && selectedService) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => setShowDetails(false)}>
            ← Back to Services
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Service Details</h2>
            <p className="text-gray-600">#{selectedService.id}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(selectedService)}>
              {getStatusText(selectedService)}
            </Badge>
            {selectedService.isFeatured && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            <Button
              onClick={() => handleToggleApproval(selectedService)}
              disabled={toggleApprovalMutation.isPending}
              className={selectedService.adminApproved ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {selectedService.adminApproved ? (
                <>
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Revoke Approval
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Approve Service
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Service Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Service Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900 font-semibold">{selectedService.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900">{selectedService.description}</p>
              </div>
              {selectedService.shortDescription && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Short Description</label>
                  <p className="text-gray-900">{selectedService.shortDescription}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Slug</label>
                <p className="text-gray-900">{selectedService.slug}</p>
              </div>
              {selectedService.location && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Service Location</label>
                  <p className="text-gray-900 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {selectedService.location}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Pricing & Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Price</label>
                <p className="text-gray-900 font-semibold text-lg">
                  {formatCurrency(selectedService.price)}
                  {selectedService.priceType === 'hourly' && '/hour'}
                  {selectedService.priceType === 'per_service' && '/service'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Price Type</label>
                <p className="text-gray-900 capitalize">{selectedService.priceType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Available Today</label>
                <p className="text-gray-900 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {selectedService.isAvailableToday ? 'Yes' : 'No'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="w-5 h-5 mr-2" />
                Provider Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Provider ID</label>
                <p className="text-gray-900">{selectedService.providerId}</p>
              </div>
              {selectedService.providerBusinessName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Business Name</label>
                  <p className="text-gray-900">{selectedService.providerBusinessName}</p>
                </div>
              )}
              {selectedService.categoryName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900">{selectedService.categoryName}</p>
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
                <p className="text-gray-900">{selectedService.rating}/5.0 ({selectedService.reviewCount} reviews)</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Admin Approval</label>
                <div className="flex items-center space-x-2">
                  <Badge className={selectedService.adminApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {selectedService.adminApproved ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(selectedService)}>
                    {getStatusText(selectedService)}
                  </Badge>
                  {selectedService.isFeatured && (
                    <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900">{formatDate(selectedService.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-gray-900">{formatDate(selectedService.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedService.imageUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Service Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <img 
                  src={selectedService.imageUrl} 
                  alt={selectedService.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
                {selectedService.imageUrls?.map((url, index) => (
                  <img 
                    key={index}
                    src={url} 
                    alt={`${selectedService.name} ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedService.tags && selectedService.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedService.tags.map((tag, index) => (
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
          <h3 className="text-xl font-semibold text-gray-900">Services Management</h3>
          <p className="text-gray-600">Monitor and manage all services across the platform</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
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
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Services</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {(categories as Category[]).map((category: Category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Approval</label>
                  <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Approval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Approval</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Featured</label>
                  <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Featured" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Featured</SelectItem>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="not_featured">Not Featured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services List */}
          <Card>
            <CardHeader>
              <CardTitle>Services ({filteredServices.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {servicesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading services...</p>
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No services found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Service</th>
                        <th className="text-left py-3 px-4">Provider</th>
                        <th className="text-left py-3 px-4">Category</th>
                        <th className="text-left py-3 px-4">Price</th>
                        <th className="text-left py-3 px-4">Rating</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Approval</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredServices.map((service: Service) => (
                        <tr key={service.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              {service.imageUrl && (
                                <img 
                                  src={service.imageUrl} 
                                  alt={service.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{service.name}</p>
                                <p className="text-sm text-gray-500">{service.shortDescription}</p>
                                {service.isFeatured && (
                                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                    <Star className="w-3 h-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm text-gray-900">{service.providerBusinessName || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{service.providerId}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-gray-900">{service.categoryName || 'N/A'}</p>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{formatCurrency(service.price)}</p>
                              <p className="text-xs text-gray-500 capitalize">{service.priceType}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm">{service.rating}</span>
                              <span className="text-xs text-gray-500">({service.reviewCount})</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(service)}>
                              {getStatusText(service)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={service.adminApproved}
                                onCheckedChange={() => handleToggleApproval(service)}
                                disabled={toggleApprovalMutation.isPending}
                              />
                              <span className="text-xs text-gray-500">
                                {service.adminApproved ? 'Approved' : 'Pending'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(service)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}