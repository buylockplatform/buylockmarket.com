import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Percent, Save } from "lucide-react";
import { adminApiRequest, queryClient, getAdminQueryFn } from "@/lib/queryClient";

interface CommissionSettings {
  platformCommissionPercentage: number;
  vendorCommissionPercentage: number;
}

export function CommissionSettings() {
  const { toast } = useToast();
  const [newCommission, setNewCommission] = useState<string>("");

  // Fetch current commission settings
  const { data: commissionSettings, isLoading } = useQuery<CommissionSettings>({
    queryKey: ['/api/admin/commission-settings'],
    queryFn: getAdminQueryFn({ on401: "returnNull" }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update commission settings mutation
  const updateCommissionMutation = useMutation({
    mutationFn: async (platformCommissionPercentage: number) => {
      return await adminApiRequest('/api/admin/commission-settings', 'POST', {
        platformCommissionPercentage
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Commission Updated",
        description: `Platform commission set to ${data.platformCommissionPercentage}% (vendors get ${data.vendorCommissionPercentage}%)`,
      });
      setNewCommission("");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commission-settings'] });
      // Also refresh other admin data that might be affected
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-earnings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendor-earnings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update commission settings",
        variant: "destructive",
      });
    },
  });

  const handleUpdateCommission = () => {
    const commission = parseFloat(newCommission);
    
    if (isNaN(commission) || commission < 0 || commission > 100) {
      toast({
        title: "Invalid Commission",
        description: "Commission must be a number between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    updateCommissionMutation.mutate(commission);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Commission Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Commission Settings
        </CardTitle>
        <CardDescription>
          Configure platform and vendor commission percentages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Settings Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Platform Commission</Label>
            <div className="flex items-center space-x-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Platform Gets</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-2xl font-bold text-blue-600">
                      {commissionSettings?.platformCommissionPercentage}
                    </span>
                    <Percent className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Vendor Commission</Label>
            <div className="flex items-center space-x-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Vendors Get</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-2xl font-bold text-green-600">
                      {commissionSettings?.vendorCommissionPercentage}
                    </span>
                    <Percent className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Update Commission Form */}
        <div className="border-t pt-6">
          <div className="space-y-4">
            <Label className="text-sm font-medium">Update Platform Commission Percentage</Label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  type="number"
                  placeholder="Enter new commission percentage"
                  value={newCommission}
                  onChange={(e) => setNewCommission(e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="pr-8"
                />
                <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Button
                onClick={handleUpdateCommission}
                disabled={updateCommissionMutation.isPending || !newCommission}
                className="flex items-center space-x-2"
              >
                {updateCommissionMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Update</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Setting platform commission to {newCommission || '0'}% means vendors will receive {newCommission ? (100 - parseFloat(newCommission || '0')).toFixed(1) : '100'}%
            </p>
          </div>
        </div>

        {/* Commission Impact Information */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Commission Impact</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p>• Platform commission applies to all completed orders</p>
            <p>• Vendor earnings are calculated automatically based on these settings</p>
            <p>• Changes apply to future orders and earnings calculations</p>
            <p>• Existing payout requests are not affected by commission changes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}