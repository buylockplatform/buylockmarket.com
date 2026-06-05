import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface Dispute {
  id: string;
  orderId: string;
  customerId: string;
  reason: string;
  vendorResponse: string | null;
  adminResolution: string | null;
  resolutionType: string | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

export default function DisputeResolution() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [resolutionType, setResolutionType] = useState("");
  const [adminResolution, setAdminResolution] = useState("");
  const [filterStatus, setFilterStatus] = useState("open");

  const { data: disputes = [], isLoading } = useQuery<Dispute[]>({
    queryKey: ["/api/admin/disputes"],
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/disputes/${id}/resolve`, "POST", { resolutionType, adminResolution });
    },
    onSuccess: () => {
      toast({ title: "Dispute Resolved", description: "The dispute has been resolved successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/disputes"] });
      setSelected(null);
      setResolutionType("");
      setAdminResolution("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to resolve dispute.", variant: "destructive" });
    },
  });

  const filtered = (disputes || []).filter(d => filterStatus === "all" ? true : d.status === filterStatus);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge className="bg-red-100 text-red-800 border-0"><Clock className="w-3 h-3 mr-1" />Open</Badge>;
      case "resolved": return <Badge className="bg-green-100 text-green-800 border-0"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dispute Resolution</h2>
          <p className="text-sm text-gray-600">{(disputes || []).filter(d => d.status === 'open').length} open disputes</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No {filterStatus === 'all' ? '' : filterStatus} disputes found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((dispute) => (
            <Card key={dispute.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Order #{dispute.orderId.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Reported {dispute.createdAt ? format(new Date(dispute.createdAt), "MMM dd, yyyy") : "—"}
                    </p>
                  </div>
                  {getStatusBadge(dispute.status)}
                </div>

                <div className="bg-red-50 rounded-lg p-3 mb-3">
                  <p className="text-sm font-medium text-red-800 mb-1">Customer Reason:</p>
                  <p className="text-sm text-red-700">{dispute.reason}</p>
                </div>

                {dispute.adminResolution && (
                  <div className="bg-green-50 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium text-green-800 mb-1">Resolution ({dispute.resolutionType}):</p>
                    <p className="text-sm text-green-700">{dispute.adminResolution}</p>
                  </div>
                )}

                {dispute.status === "open" && (
                  <Button
                    size="sm"
                    onClick={() => setSelected(dispute)}
                    className="bg-buylock-orange text-white hover:bg-buylock-orange/90"
                  >
                    Resolve Dispute
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resolution Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setResolutionType(""); setAdminResolution(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolve Dispute — Order #{selected?.orderId.slice(-8).toUpperCase()}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600"><strong>Customer reason:</strong> {selected.reason}</p>
              </div>

              <div className="space-y-2">
                <Label>Resolution Type</Label>
                <Select value={resolutionType} onValueChange={setResolutionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resolution..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_refund">Full Refund</SelectItem>
                    <SelectItem value="partial_refund">Partial Refund</SelectItem>
                    <SelectItem value="dismissed">Dismiss (no action)</SelectItem>
                    <SelectItem value="replacement">Replacement / Re-delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  placeholder="Explain the resolution to the customer..."
                  value={adminResolution}
                  onChange={(e) => setAdminResolution(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button
                className="w-full bg-buylock-orange text-white hover:bg-buylock-orange/90"
                disabled={!resolutionType || resolveMutation.isPending}
                onClick={() => resolveMutation.mutate(selected.id)}
              >
                {resolveMutation.isPending ? "Resolving..." : "Confirm Resolution"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
