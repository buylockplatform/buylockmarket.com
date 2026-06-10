import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  Loader2,
} from "lucide-react";

interface ViewUserModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (userId: string) => void;
  onMessage?: (userId: string) => void;
}

interface UserDetails {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  suburb?: string;
  building?: string;
  postalCode?: string;
  country?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalOrders: number;
    completedOrders: number;
    totalSpent: number;
  };
  recentOrders: Array<{
    id: string;
    status: string;
    totalAmount: number | string;
    vendorName?: string | null;
    createdAt: string;
    orderType?: string | null;
  }>;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number | string) {
  const value = typeof amount === "number" ? amount : parseFloat(String(amount || 0));
  return `KSh ${(isNaN(value) ? 0 : value).toLocaleString()}`;
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
    case "fulfilled":
      return "bg-green-100 text-green-800";
    case "paid":
    case "ready_for_pickup":
      return "bg-blue-100 text-blue-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function ViewUserModal({ userId, isOpen, onClose, onEdit, onMessage }: ViewUserModalProps) {
  const { data: user, isLoading, error } = useQuery<UserDetails>({
    queryKey: ["/api/admin/users", userId],
    enabled: isOpen && !!userId,
    retry: false,
  });

  const fullName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Anonymous User"
    : "";

  const addressParts = user
    ? [user.building, user.address, user.suburb, user.city, user.postalCode, user.country].filter(Boolean)
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Profile</DialogTitle>
          <DialogDescription>View account details and order activity</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : error || !user ? (
          <div className="text-center py-8 text-red-600">
            Failed to load user details. Please try again.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt={fullName} className="w-16 h-16 object-cover" />
                ) : (
                  <Users className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">{fullName}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{user.email || "No email"}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <ShoppingBag className="w-4 h-4 mx-auto text-gray-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">{user.stats.totalOrders}</p>
                <p className="text-xs text-gray-500">Total Orders</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <DollarSign className="w-4 h-4 mx-auto text-gray-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">{formatCurrency(user.stats.totalSpent)}</p>
                <p className="text-xs text-gray-500">Total Spent</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Calendar className="w-4 h-4 mx-auto text-gray-500 mb-1" />
                <p className="text-sm font-bold text-gray-900">{formatDate(user.createdAt)}</p>
                <p className="text-xs text-gray-500">Joined</p>
              </div>
            </div>

            {addressParts.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4" />
                  Delivery Address
                </div>
                <p className="text-sm text-gray-600">{addressParts.join(", ")}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Orders</h4>
              {user.recentOrders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No orders yet</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {user.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border rounded-lg text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {order.vendorName || "Unknown vendor"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(order.createdAt)} · #{order.id.slice(-8)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </span>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {onMessage && userId && (
                <Button variant="outline" onClick={() => onMessage(userId)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              )}
              {onEdit && userId && (
                <Button onClick={() => onEdit(userId)}>Edit User</Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
