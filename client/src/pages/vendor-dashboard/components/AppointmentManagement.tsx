import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vendorApiRequest, getVendorQueryFn } from "@/lib/queryClient";
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  MessageSquare,
  Loader2,
  Play,
  Wrench,
  FileText,
  ArrowLeft,
  Settings
} from "lucide-react";

interface VendorAppointment {
  id: string;
  customerId: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  address: string;
  city: string;
  state: string;
  notes?: string;
  totalAmount: number;
  status: 'pending_acceptance' | 'accepted' | 'starting_job' | 'in_progress' | 'delayed' | 'almost_done' | 'completed' | 'declined' | 'cancelled';
  vendorNotes?: string;
  bookingDate: string;
  updatedAt: string;
}

// Helper function to get available status options based on current status
const getAvailableStatusOptions = (currentStatus: string) => {
  const allOptions = {
    'starting_job': <Play className="w-4 h-4" />,
    'in_progress': <Wrench className="w-4 h-4" />,
    'delayed': <AlertTriangle className="w-4 h-4" />,
    'almost_done': <Clock className="w-4 h-4" />,
    'completed': <CheckCircle className="w-4 h-4" />
  };

  const statusFlow = {
    'accepted': ['starting_job', 'completed'],
    'starting_job': ['in_progress', 'delayed', 'completed'],
    'in_progress': ['almost_done', 'delayed', 'completed'],
    'delayed': ['in_progress', 'completed'],
    'almost_done': ['completed', 'in_progress']
  };

  const availableStatuses = statusFlow[currentStatus as keyof typeof statusFlow] || [];
  
  return availableStatuses.map(status => ({
    value: status,
    label: getStatusLabel(status),
    icon: allOptions[status as keyof typeof allOptions]
  }));
};

// Helper function to get status label
const getStatusLabel = (status: string) => {
  const labels = {
    'pending': 'Pending',
    'accepted': 'Accepted',
    'starting_job': 'Starting Job',
    'in_progress': 'In Progress',
    'delayed': 'Delayed',
    'almost_done': 'Almost Done',
    'completed': 'Completed',
    'declined': 'Declined',
    'cancelled': 'Cancelled'
  };
  return labels[status as keyof typeof labels] || status;
};

interface AppointmentManagementProps {
  vendorId: string;
}

export default function AppointmentManagement({ vendorId }: AppointmentManagementProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<VendorAppointment | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [newStatus, setNewStatus] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch real appointments from the API
  const { data: appointments = [], isLoading } = useQuery<VendorAppointment[]>({
    queryKey: [`/api/vendor/tasks?vendorId=${vendorId}`],
    queryFn: getVendorQueryFn({ on401: "returnNull" }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Transform the appointments data to match the expected format
  const transformedAppointments = appointments.map(app => {
    const transformedAppointment = {
      ...app,
      totalAmount: parseFloat(app.totalAmount?.toString() || '0'),
      appointmentDate: app.appointmentDate ? new Date(app.appointmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      bookingDate: app.bookingDate ? new Date(app.bookingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      updatedAt: app.updatedAt ? new Date(app.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      // Map pending_acceptance to pending for UI consistency
      status: app.status === 'pending_acceptance' ? 'pending' : app.status as VendorAppointment['status'],
      // Ensure required fields
      customerId: app.customerId || app.customer_id || '',
      serviceId: app.serviceId || app.service_id || '',
      serviceName: app.serviceName || app.service_name || '',
      customerName: app.customerName || app.customer_name || '',
      customerEmail: app.customerEmail || app.customer_email || '',
      customerPhone: app.customerPhone || app.customer_phone || '',
      appointmentTime: app.appointmentTime || app.appointment_time || '',
      address: app.address || '',
      city: app.city || '',
      state: app.state || '',
      notes: app.notes || app.customerNotes || '',
      vendorNotes: app.vendorNotes || app.vendor_notes || ''
    };
    return transformedAppointment;
  }) as VendorAppointment[];

  // Mutation for updating appointment status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status, vendorNotes }: { 
      appointmentId: string, 
      status: string, 
      vendorNotes?: string 
    }) => {
      return vendorApiRequest(`/api/vendor/tasks/${appointmentId}/status`, 'PATCH', { status, vendorNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/tasks?vendorId=${vendorId}`] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': 
      case 'pending_acceptance': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'starting_job': return 'bg-indigo-100 text-indigo-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'delayed': return 'bg-orange-100 text-orange-800';
      case 'almost_done': return 'bg-teal-100 text-teal-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'declined': 
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': case 'pending_acceptance': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'starting_job': return <Play className="w-4 h-4" />;
      case 'in_progress': return <Wrench className="w-4 h-4" />;
      case 'delayed': return <AlertTriangle className="w-4 h-4" />;
      case 'almost_done': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'declined': case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleAcceptAppointment = async (appointmentId: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        appointmentId,
        status: 'accepted',
        vendorNotes: ''
      });
      setShowDetails(false);
    } catch (error) {
      console.error("Error accepting appointment:", error);
    }
  };

  const handleDeclineAppointment = async (appointmentId: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        appointmentId,
        status: 'cancelled',
        vendorNotes: ''
      });
      setShowDetails(false);
    } catch (error) {
      console.error("Error declining appointment:", error);
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        appointmentId,
        status: 'completed',
        vendorNotes: ''
      });
      setShowDetails(false);
    } catch (error) {
      console.error("Error completing appointment:", error);
    }
  };

  const handleViewDetails = (appointment: VendorAppointment) => {
    setSelectedAppointment(appointment);
    setShowDetails(true);
  };

  const getAppointmentStats = () => {
    const total = transformedAppointments.length;
    const pending = transformedAppointments.filter(a => a.status === 'pending').length;
    const accepted = transformedAppointments.filter(a => a.status === 'accepted').length;
    const completed = transformedAppointments.filter(a => a.status === 'completed').length;
    const totalEarnings = transformedAppointments
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + a.totalAmount, 0);

    return { total, pending, accepted, completed, totalEarnings };
  };

  const stats = getAppointmentStats();

  if (showDetails && selectedAppointment) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => setShowDetails(false)}>
            ← Back to Appointments
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
            <p className="text-gray-600">#{selectedAppointment.id}</p>
          </div>
          <Badge className={`${getStatusColor(selectedAppointment.status)} flex items-center gap-1`}>
            {getStatusIcon(selectedAppointment.status)}
            {selectedAppointment.status}
          </Badge>
        </div>

        {/* Appointment Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-gray-900">{selectedAppointment.customerName}</p>
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {selectedAppointment.customerEmail}
                </div>
                <div className="flex items-center mt-1 text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {selectedAppointment.customerPhone}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Service Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-gray-900">{selectedAppointment.serviceName}</p>
                <p className="text-lg font-bold text-buylock-primary">KES {selectedAppointment.totalAmount.toLocaleString()}</p>
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {selectedAppointment.appointmentDate} at {selectedAppointment.appointmentTime}
                </div>
                <div className="flex items-start mt-1 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                  {selectedAppointment.address}, {selectedAppointment.city}, {selectedAppointment.state}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Customer Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAppointment.notes ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedAppointment.notes}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No additional notes provided</p>
              )}
            </CardContent>
          </Card>

          {/* Response Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Task Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAppointment.status === 'pending' && (
                <div className="flex space-x-3">
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleAcceptAppointment(selectedAppointment.id)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {updateStatusMutation.isPending ? "Accepting..." : "Accept Appointment"}
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-red-600 hover:text-red-700 border-red-200"
                    onClick={() => handleDeclineAppointment(selectedAppointment.id)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {updateStatusMutation.isPending ? "Declining..." : "Decline Appointment"}
                  </Button>
                </div>
              )}

              {selectedAppointment.status === 'accepted' && (
                <div className="flex flex-wrap gap-3">
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => updateStatusMutation.mutate({
                      appointmentId: selectedAppointment.id,
                      status: 'starting_job',
                      vendorNotes: ''
                    })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Job
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => updateStatusMutation.mutate({
                      appointmentId: selectedAppointment.id,
                      status: 'completed',
                      vendorNotes: ''
                    })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Completed
                  </Button>
                </div>
              )}

              {/* Status Update Section - Available for accepted appointments and beyond */}
              {!['pending', 'declined', 'cancelled', 'completed'].includes(selectedAppointment.status) && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Update Status</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select new status..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableStatusOptions(selectedAppointment.status).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              {option.icon}
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {newStatus && (
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        updateStatusMutation.mutate({
                          appointmentId: selectedAppointment.id,
                          status: newStatus,
                          vendorNotes: ''
                        });
                        setNewStatus(""); // Reset selection
                      }}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          Update to {getStatusLabel(newStatus)}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}


            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Earnings</p>
                <p className="text-2xl font-bold text-gray-900">KES {stats.totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Appointments ({transformedAppointments.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-buylock-primary" />
                <span className="ml-2">Loading appointments...</span>
              </div>
            ) : transformedAppointments.map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{appointment.serviceName}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="w-3 h-3" />
                        <span>{appointment.customerName}</span>
                        <span>•</span>
                        <Phone className="w-3 h-3" />
                        <span>{appointment.customerPhone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{appointment.appointmentDate} at {appointment.appointmentTime}</span>
                        <span>•</span>
                        <MapPin className="w-3 h-3" />
                        <span>{appointment.city}, {appointment.state}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="font-bold text-buylock-primary">KES {appointment.totalAmount.toLocaleString()}</p>
                      <Badge className={`${getStatusColor(appointment.status)} flex items-center gap-1`}>
                        {getStatusIcon(appointment.status)}
                        {appointment.status}
                      </Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(appointment)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="bg-gray-50 p-3 rounded mb-2">
                    <p className="text-sm font-medium text-gray-600 mb-1">Customer Request:</p>
                    <p className="text-sm text-gray-700">{appointment.notes}</p>
                  </div>
                )}

                {/* Status Update Section - Available for accepted appointments and beyond */}
                {appointment.status !== 'pending_acceptance' && appointment.status !== 'declined' && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Update Status</label>
                      <Select 
                        value={appointment.status} 
                        onValueChange={(newStatus) => {
                          updateStatusMutation.mutate({
                            appointmentId: appointment.id,
                            status: newStatus,
                            vendorNotes: ''
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select new status..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableStatusOptions(appointment.status).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                {option.icon}
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                {/* Accept/Decline Section for pending appointments */}
                {appointment.status === 'pending_acceptance' && (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex space-x-3">
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleAcceptAppointment(appointment.id)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 border-red-200"
                        onClick={() => handleDeclineAppointment(appointment.id)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {!isLoading && transformedAppointments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No appointments found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}