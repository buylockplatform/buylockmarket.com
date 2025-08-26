import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, AlertCircle, DollarSign, TrendingUp, Users, CreditCard } from "lucide-react";

interface PayoutRequest {
  id: string;
  vendorId: string;
  businessName: string;
  contactEmail: string;
  amount: string;
  status: string;
  bankAccountDetails: string;
  requestDate: string;
  processedDate?: string;
  paymentReference?: string;
  failureReason?: string;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800"
};

const statusIcons = {
  pending: Clock,
  processing: TrendingUp,
  completed: CheckCircle,
  rejected: XCircle,
  failed: AlertCircle
};

function ProcessPayoutDialog({ 
  payoutRequest, 
  isOpen, 
  onClose 
}: { 
  payoutRequest: PayoutRequest | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const processMutation = useMutation({
    mutationFn: async ({ requestId, action, paymentReference, notes }: {
      requestId: string;
      action: 'approve' | 'reject';
      paymentReference?: string;
      notes?: string;
    }) => {
      return await apiRequest('POST', `/api/admin/payout-requests/${requestId}/process`, {
        action,
        paymentReference,
        notes
      });
    },
    onSuccess: () => {
      toast({
        title: "Payout Processed",
        description: `Payout request has been ${action}d successfully.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payout-requests'] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Processing Failed",
        description: `Failed to ${action} payout request: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setAction('approve');
    setPaymentReference('');
    setNotes('');
  };

  const handleSubmit = () => {
    if (!payoutRequest) return;
    
    if (action === 'approve' && !paymentReference.trim()) {
      toast({
        title: "Payment Reference Required",
        description: "Please provide a payment reference for approval.",
        variant: "destructive"
      });
      return;
    }

    processMutation.mutate({
      requestId: payoutRequest.id,
      action,
      paymentReference: paymentReference.trim() || undefined,
      notes: notes.trim() || undefined
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Process Payout Request</DialogTitle>
          <DialogDescription>
            {payoutRequest && (
              <>
                Vendor: {payoutRequest.businessName}<br />
                Amount: {formatCurrency(parseFloat(payoutRequest.amount))}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Select value={action} onValueChange={(value: 'approve' | 'reject') => setAction(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === 'approve' && (
            <div className="space-y-2">
              <Label htmlFor="paymentReference">Payment Reference *</Label>
              <Input
                id="paymentReference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Enter payment reference number"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          {payoutRequest && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium">Bank Details:</p>
              <p className="text-sm text-gray-600">{payoutRequest.bankAccountDetails}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={processMutation.isPending}
            className={action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {processMutation.isPending ? 'Processing...' : `${action === 'approve' ? 'Approve' : 'Reject'} Payout`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PayoutManagement() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: payoutRequests = [], isLoading } = useQuery({
    queryKey: ['/api/admin/payout-requests', selectedStatus],
    queryFn: async () => {
      const params = selectedStatus !== 'all' ? `?status=${selectedStatus}` : '';
      const response = await apiRequest('GET', `/api/admin/payout-requests${params}`);
      return response.json();
    }
  });

  const completeMutation = useMutation({
    mutationFn: async ({ requestId, paymentReference }: {
      requestId: string;
      paymentReference: string;
    }) => {
      return await apiRequest('POST', `/api/admin/payout-requests/${requestId}/complete`, {
        paymentReference
      });
    },
    onSuccess: () => {
      toast({
        title: "Payout Completed",
        description: "Payout request marked as completed successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payout-requests'] });
    },
    onError: (error) => {
      toast({
        title: "Completion Failed",
        description: `Failed to complete payout: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleProcessPayout = (payoutRequest: PayoutRequest) => {
    setSelectedPayout(payoutRequest);
    setIsProcessDialogOpen(true);
  };

  const getStatusSummary = () => {
    const summary = payoutRequests.reduce((acc: any, request: PayoutRequest) => {
      acc[request.status] = (acc[request.status] || 0) + 1;
      acc.totalAmount = (acc.totalAmount || 0) + parseFloat(request.amount);
      return acc;
    }, {});

    return {
      pending: summary.pending || 0,
      processing: summary.processing || 0,
      completed: summary.completed || 0,
      rejected: summary.rejected || 0,
      total: payoutRequests.length,
      totalAmount: summary.totalAmount || 0
    };
  };

  const statusSummary = getStatusSummary();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Vendor Payout Management</h2>
          <p className="text-gray-600">Manage vendor disbursement requests and earnings</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <div className="text-2xl font-bold">{statusSummary.pending}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <div className="text-2xl font-bold">{statusSummary.processing}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <div className="text-2xl font-bold">{statusSummary.completed}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <div className="text-2xl font-bold">{formatCurrency(statusSummary.totalAmount)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
        <TabsList>
          <TabsTrigger value="all">All ({statusSummary.total})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({statusSummary.pending})</TabsTrigger>
          <TabsTrigger value="processing">Processing ({statusSummary.processing})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({statusSummary.completed})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({statusSummary.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout Requests</CardTitle>
              <CardDescription>
                {selectedStatus === 'all' 
                  ? 'All payout requests from vendors'
                  : `${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} payout requests`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutRequests.map((request: PayoutRequest) => {
                    const StatusIcon = statusIcons[request.status as keyof typeof statusIcons];
                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.businessName}</div>
                            <div className="text-sm text-gray-500">{request.contactEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(parseFloat(request.amount))}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[request.status as keyof typeof statusColors]} flex items-center gap-1 w-fit`}>
                            <StatusIcon className="h-3 w-3" />
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(request.requestDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={request.bankAccountDetails}>
                            {request.bankAccountDetails}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {request.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleProcessPayout(request)}
                              >
                                Process
                              </Button>
                            )}
                            {request.status === 'processing' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const ref = prompt('Enter payment reference to complete:');
                                  if (ref?.trim()) {
                                    completeMutation.mutate({
                                      requestId: request.id,
                                      paymentReference: ref.trim()
                                    });
                                  }
                                }}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {payoutRequests.length === 0 && (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No payout requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedStatus === 'all' 
                      ? 'No payout requests have been submitted yet.'
                      : `No ${selectedStatus} payout requests found.`
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProcessPayoutDialog
        payoutRequest={selectedPayout}
        isOpen={isProcessDialogOpen}
        onClose={() => {
          setIsProcessDialogOpen(false);
          setSelectedPayout(null);
        }}
      />
    </div>
  );
}