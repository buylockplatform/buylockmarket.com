import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle,
  User,
  Phone,
  Navigation,
  FileText,
  Calendar,
  DollarSign,
  Eye,
  Edit
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";

// Using the vendor ID from our test data
const VENDOR_ID = "74bf6c33-7f09-4844-903d-72bff3849c95";

interface Task {
  id: string;
  userId: string;
  status: string;
  totalAmount: string;
  deliveryAddress: string;
  notes?: string;
  createdAt: string;
  type: string;
  paymentStatus: string;
}

interface TaskDetails {
  order: Task;
  items: Array<{
    id: string;
    serviceId: string;
    name: string;
    duration?: number;
    appointmentDate?: string;
    appointmentTime?: string;
    serviceNotes?: string;
    serviceLatitude?: number;
    serviceLongitude?: number;
    serviceAddress?: string;
    serviceInstructions?: string;
    serviceTaskStatus?: string;
    price: string;
  }>;
}

export default function VendorTasks() {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [vendorNotes, setVendorNotes] = useState("");
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch vendor tasks
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/vendor/tasks", VENDOR_ID],
    queryFn: async () => {
      const response = await fetch(`/api/vendor/tasks?vendorId=${VENDOR_ID}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
    enabled: !!isAuthenticated,
  });

  // Fetch task details
  const { data: taskDetails } = useQuery<TaskDetails>({
    queryKey: ["/api/vendor/tasks", selectedTask],
    queryFn: async () => {
      const response = await fetch(`/api/vendor/tasks/${selectedTask}`);
      if (!response.ok) throw new Error("Failed to fetch task details");
      return response.json();
    },
    enabled: !!selectedTask,
  });

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: string; status: string; notes?: string }) => {
      return apiRequest(`/api/vendor/tasks/${orderId}/status`, "PATCH", {
        status,
        vendorNotes: notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/tasks"] });
      toast({
        title: "Status updated",
        description: "Task status has been updated successfully",
      });
      setVendorNotes("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in to continue",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Update failed",
        description: error.message || "Failed to update task status",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_acceptance':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_acceptance':
        return <AlertCircle className="w-4 h-4" />;
      case 'accepted':
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">Please log in to access vendor tasks</p>
          <Button onClick={() => window.location.href = "/api/login"}>
            Log In
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading tasks...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Tasks</h1>
          <p className="text-gray-600">Manage your service appointments and track customer requests</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Service Requests ({tasks?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!tasks || tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No service requests</h3>
                    <p className="text-gray-600">Service bookings will appear here once customers request your services.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <div 
                        key={task.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTask === task.id ? 'border-buylock-primary bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedTask(task.id)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(task.status)}>
                              {getStatusIcon(task.status)}
                              <span className="ml-1 capitalize">{task.status.replace('_', ' ')}</span>
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {format(new Date(task.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                          <span className="font-semibold text-buylock-primary">
                            {formatPrice(task.totalAmount)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{task.deliveryAddress}</span>
                        </div>

                        {task.notes && (
                          <p className="text-sm text-gray-600 truncate">
                            Note: {task.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Task Details */}
          <div className="lg:col-span-1">
            {selectedTask && taskDetails ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Task Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {taskDetails.items.map((item) => (
                    <div key={item.id} className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-lg">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          {item.duration} hours • {formatPrice(item.price)}
                        </p>
                      </div>

                      {/* Appointment Details */}
                      {item.appointmentDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>
                            {format(new Date(item.appointmentDate), "PPP")} at {item.appointmentTime}
                          </span>
                        </div>
                      )}

                      {/* Location */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Service Location</Label>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                          <span>{item.serviceAddress}</span>
                        </div>
                        {item.serviceLatitude && item.serviceLongitude && (
                          <div className="flex items-center gap-2 text-xs text-green-600">
                            <Navigation className="w-3 h-3" />
                            <span>Pin: {item.serviceLatitude?.toFixed(6)}, {item.serviceLongitude?.toFixed(6)}</span>
                          </div>
                        )}
                      </div>

                      {/* Detailed Instructions */}
                      {item.serviceInstructions && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Service Instructions</Label>
                          <div className="p-3 bg-blue-50 rounded text-sm">
                            {item.serviceInstructions}
                          </div>
                        </div>
                      )}

                      {/* Additional Notes */}
                      {item.serviceNotes && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Customer Notes</Label>
                          <div className="p-3 bg-gray-50 rounded text-sm">
                            {item.serviceNotes}
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Status Update */}
                      <div className="space-y-4">
                        <Label className="text-sm font-medium">Update Status</Label>
                        
                        <Select 
                          onValueChange={(status) => {
                            updateStatusMutation.mutate({ 
                              orderId: taskDetails.order.id, 
                              status,
                              notes: vendorNotes || undefined
                            });
                          }}
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select new status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="accepted">Accept Task</SelectItem>
                            <SelectItem value="in_progress">Mark In Progress</SelectItem>
                            <SelectItem value="completed">Mark Completed</SelectItem>
                            <SelectItem value="cancelled">Cancel Task</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="space-y-2">
                          <Label htmlFor="vendorNotes" className="text-sm">
                            Vendor Notes (Optional)
                          </Label>
                          <Textarea
                            id="vendorNotes"
                            placeholder="Add any notes for the customer..."
                            value={vendorNotes}
                            onChange={(e) => setVendorNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a task</h3>
                  <p className="text-gray-600">Choose a task from the list to view details and manage status.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}