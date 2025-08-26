import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Store, 
  MapPin, 
  Calendar, 
  Mail, 
  Phone,
  Globe,
  Package,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  Star,
  Users,
  ShoppingCart
} from "lucide-react";

interface VendorDetails {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  website?: string;
  status: 'verified' | 'pending' | 'rejected' | 'suspended';
  category: string;
  address: string;
  city: string;
  state: string;
  country: string;
  joinDate: string;
  lastActive: string;
  businessRegistration: string;
  taxId: string;
  bankAccount: string;
  totalRevenue: number;
  totalProducts: number;
  totalServices: number;
  totalOrders: number;
  rating: number;
  reviewCount: number;
  profileImage?: string;
  businessLicense?: string;
  documents: Array<{
    type: string;
    name: string;
    uploadDate: string;
    status: 'approved' | 'pending' | 'rejected';
  }>;
}

interface VendorTransaction {
  id: string;
  type: 'product' | 'service';
  itemName: string;
  customerName: string;
  amount: number;
  status: 'completed' | 'pending' | 'refunded';
  date: string;
  fulfillmentStatus: 'fulfilled' | 'pending' | 'disputed';
}

interface FulfillmentRequest {
  id: string;
  vendorId: string;
  orderId: string;
  itemName: string;
  customerName: string;
  amount: number;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  proofFiles?: string[];
}

const mockVendorDetails: VendorDetails = {
  id: "1",
  businessName: "TechHub Electronics",
  email: "tech@techhub.com",
  phone: "+234 801 234 5678",
  website: "https://techhub.com",
  status: "verified",
  category: "Electronics",
  address: "123 Technology Street",
  city: "Nairobi",
  state: "Nairobi County",
  country: "Kenya",
  joinDate: "2025-01-15",
  lastActive: "2025-08-10",
  businessRegistration: "RC-123456789",
  taxId: "TIN-987654321",
  bankAccount: "****5678",
  totalRevenue: 0,
  totalProducts: 45,
  totalServices: 8,
  totalOrders: 156,
  rating: 4.8,
  reviewCount: 89,
  documents: [
    {
      type: "Business Registration",
      name: "CAC_Certificate.pdf",
      uploadDate: "2025-01-15",
      status: "approved"
    },
    {
      type: "Tax Identification",
      name: "TIN_Certificate.pdf", 
      uploadDate: "2025-01-15",
      status: "approved"
    },
    {
      type: "Bank Statement",
      name: "Bank_Statement_Jan2025.pdf",
      uploadDate: "2025-01-20",
      status: "pending"
    }
  ]
};

const mockTransactions: VendorTransaction[] = []; // TODO: Replace with real API data

const mockFulfillmentRequests: FulfillmentRequest[] = []; // TODO: Replace with real API data

interface VendorViewProps {
  vendorId?: string;
  onBack: () => void;
}

export default function VendorView({ vendorId, onBack }: VendorViewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const vendor = mockVendorDetails; // In real app, fetch by vendorId

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': case 'approved': case 'completed': case 'fulfilled': 
        return 'bg-green-100 text-green-800';
      case 'pending': 
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected': case 'refunded': case 'disputed':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApproveRequest = (requestId: string) => {
    console.log("Approving fulfillment request:", requestId);
    // API call to approve request
  };

  const handleRejectRequest = (requestId: string) => {
    console.log("Rejecting fulfillment request:", requestId);
    // API call to reject request
  };

  const handleApproveVendor = () => {
    console.log("Approving vendor:", vendor.id);
    // API call to approve vendor
  };

  const handleRejectVendor = () => {
    console.log("Rejecting vendor:", vendor.id);
    // API call to reject vendor
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Vendors
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{vendor.businessName}</h2>
          <p className="text-gray-600">Vendor Details & Management</p>
        </div>
        <Badge className={getStatusColor(vendor.status)}>
          {vendor.status}
        </Badge>
      </div>

      {/* Vendor Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">KES {vendor.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Products</p>
                <p className="text-2xl font-bold text-gray-900">{vendor.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{vendor.totalOrders}</p>
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
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-gray-900">{vendor.rating}/5.0</p>
                <p className="text-xs text-gray-500">({vendor.reviewCount} reviews)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="requests">Fulfillment Requests</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="w-5 h-5 mr-2" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Business Name</p>
                    <p className="text-gray-900">{vendor.businessName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Category</p>
                    <p className="text-gray-900">{vendor.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Registration No.</p>
                    <p className="text-gray-900">{vendor.businessRegistration}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tax ID</p>
                    <p className="text-gray-900">{vendor.taxId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-3 text-gray-400" />
                    <span>{vendor.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-3 text-gray-400" />
                    <span>{vendor.phone}</span>
                  </div>
                  {vendor.website && (
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-3 text-gray-400" />
                      <a href={vendor.website} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                        {vendor.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                    <span>{vendor.address}, {vendor.city}, {vendor.state}, {vendor.country}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{transaction.itemName}</h3>
                        <p className="text-sm text-gray-600">Customer: {transaction.customerName}</p>
                        <p className="text-xs text-gray-500">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">KES {transaction.amount.toLocaleString()}</p>
                      <div className="flex space-x-2">
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        <Badge className={getStatusColor(transaction.fulfillmentStatus)}>
                          {transaction.fulfillmentStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Fulfillment Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockFulfillmentRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.itemName}</h3>
                        <p className="text-sm text-gray-600">Order: {request.orderId} • Customer: {request.customerName}</p>
                        <p className="text-xs text-gray-500">Requested: {request.requestDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">KES {request.amount.toLocaleString()}</p>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {request.notes && (
                      <div className="bg-gray-50 p-3 rounded mb-3">
                        <p className="text-sm text-gray-700">{request.notes}</p>
                      </div>
                    )}

                    {request.proofFiles && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-600 mb-2">Proof Files:</p>
                        <div className="flex space-x-2">
                          {request.proofFiles.map((file, index) => (
                            <Button key={index} variant="outline" size="sm">
                              <Download className="w-3 h-3 mr-1" />
                              {file}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproveRequest(request.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:text-red-700 border-red-200"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendor.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">{doc.type}</h3>
                      <p className="text-sm text-gray-600">{doc.name}</p>
                      <p className="text-xs text-gray-500">Uploaded: {doc.uploadDate}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vendor.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Approval Required</h3>
                  <p className="text-yellow-700 mb-4">This vendor is awaiting approval. Review their documents and information before making a decision.</p>
                  <div className="flex space-x-3">
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleApproveVendor}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Vendor
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700 border-red-200"
                      onClick={handleRejectVendor}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Reject Vendor
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message to Vendor
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export Vendor Data
                </Button>
                
                {vendor.status === 'verified' && (
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Suspend Vendor
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}