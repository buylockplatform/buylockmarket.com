import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Truck, Settings, Mail, MessageSquare, Webhook, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeliveryProvider {
  id: string;
  name: string;
  type: string;
  logo?: string;
  isActive: boolean;
  notificationMethod: 'email' | 'sms' | 'webhook';
  webhookNotificationUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  baseRate: string;
  estimatedDeliveryTime: string;
  supportedRegions?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function CourierConfiguration() {
  const [selectedProvider, setSelectedProvider] = useState<DeliveryProvider | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: providers, isLoading } = useQuery<DeliveryProvider[]>({
    queryKey: ['/api/delivery/providers/config'],
  });

  const updateProviderMutation = useMutation({
    mutationFn: async (data: { 
      providerId: string; 
      updates: Partial<DeliveryProvider> 
    }) => {
      return await apiRequest(`/api/delivery/providers/${data.providerId}/config`, 'PUT', data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/providers/config'] });
      toast({
        title: "Success",
        description: "Provider configuration updated successfully",
      });
      setIsEditing(false);
      setSelectedProvider(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update provider configuration",
        variant: "destructive",
      });
    },
  });

  const handleUpdateProvider = (updates: Partial<DeliveryProvider>) => {
    if (!selectedProvider) return;
    
    updateProviderMutation.mutate({
      providerId: selectedProvider.id,
      updates,
    });
  };

  const getNotificationIcon = (method: string) => {
    switch (method) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'webhook':
        return <Webhook className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (method: string) => {
    switch (method) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'sms':
        return 'bg-green-100 text-green-800';
      case 'webhook':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Truck className="w-6 h-6 text-buylock-primary" />
          <h2 className="text-2xl font-bold">Courier Configuration</h2>
        </div>
        <div className="text-center py-8">Loading courier configurations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Truck className="w-6 h-6 text-buylock-primary" />
          <h2 className="text-2xl font-bold">Courier Configuration</h2>
        </div>
        <Badge variant="outline" className="text-sm">
          {providers?.length || 0} Providers
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers?.map((provider) => (
          <Card key={provider.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{provider.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant={provider.isActive ? "default" : "secondary"}>
                    {provider.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge className={getNotificationColor(provider.notificationMethod)}>
                    <div className="flex items-center space-x-1">
                      {getNotificationIcon(provider.notificationMethod)}
                      <span className="capitalize">{provider.notificationMethod}</span>
                    </div>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Type</p>
                  <p className="font-medium capitalize">{provider.type}</p>
                </div>
                <div>
                  <p className="text-gray-600">Base Rate</p>
                  <p className="font-medium">KSh {Number(provider.baseRate).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Contact Email</p>
                  <p className="font-medium text-xs">{provider.contactEmail || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Contact Phone</p>
                  <p className="font-medium">{provider.contactPhone || 'Not set'}</p>
                </div>
              </div>

              {provider.notificationMethod === 'webhook' && (
                <div>
                  <p className="text-gray-600 text-sm">Webhook URL</p>
                  <p className="font-medium text-xs break-all">
                    {provider.webhookNotificationUrl || 'Not configured'}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-500">
                  Est. Delivery: {provider.estimatedDeliveryTime}
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Configure
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Configure {provider.name}</DialogTitle>
                    </DialogHeader>
                    <CourierConfigForm 
                      provider={provider}
                      onUpdate={handleUpdateProvider}
                      isLoading={updateProviderMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface CourierConfigFormProps {
  provider: DeliveryProvider;
  onUpdate: (updates: Partial<DeliveryProvider>) => void;
  isLoading: boolean;
}

function CourierConfigForm({ provider, onUpdate, isLoading }: CourierConfigFormProps) {
  const [formData, setFormData] = useState({
    notificationMethods: provider.notificationMethod ? [provider.notificationMethod] : [],
    webhookNotificationUrl: provider.webhookNotificationUrl || '',
    contactEmail: provider.contactEmail || '',
    contactPhone: provider.contactPhone || '',
    isActive: provider.isActive,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert array back to single method for compatibility
    const primaryMethod = formData.notificationMethods[0] || 'email';
    onUpdate({
      ...formData,
      notificationMethod: primaryMethod,
    });
  };

  const toggleNotificationMethod = (method: 'email' | 'sms' | 'webhook') => {
    const current = formData.notificationMethods;
    const updated = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method];
    setFormData({ ...formData, notificationMethods: updated });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <Label>Notification Methods</Label>
        <div className="space-y-2">
          {[
            { value: 'email', label: 'Email Notifications', icon: '📧' },
            { value: 'sms', label: 'SMS Notifications', icon: '📱' },
            { value: 'webhook', label: 'Webhook API', icon: '🔗' }
          ].map((method) => (
            <div key={method.value} className="flex items-center space-x-3">
              <input
                type="checkbox"
                id={method.value}
                checked={formData.notificationMethods.includes(method.value as any)}
                onChange={() => toggleNotificationMethod(method.value as any)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={method.value} className="flex items-center space-x-2 text-sm font-medium text-gray-700 cursor-pointer">
                <span>{method.icon}</span>
                <span>{method.label}</span>
              </label>
            </div>
          ))}
        </div>
        {formData.notificationMethods.length === 0 && (
          <p className="text-xs text-amber-600">⚠️ Select at least one notification method</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactEmail">Contact Email</Label>
        <Input
          id="contactEmail"
          type="email"
          value={formData.contactEmail}
          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
          placeholder="courier@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactPhone">Contact Phone</Label>
        <Input
          id="contactPhone"
          type="tel"
          value={formData.contactPhone}
          onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
          placeholder="+254712345678"
        />
      </div>

      {formData.notificationMethods.includes('webhook') && (
        <div className="space-y-2">
          <Label htmlFor="webhookUrl">Webhook Notification URL</Label>
          <Textarea
            id="webhookUrl"
            value={formData.webhookNotificationUrl}
            onChange={(e) => setFormData({ ...formData, webhookNotificationUrl: e.target.value })}
            placeholder="https://courier-api.example.com/notifications"
            rows={3}
          />
          <p className="text-xs text-gray-500">
            URL where we'll send new order notifications to the courier
          </p>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Active Provider</Label>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Updating...' : 'Update Configuration'}
      </Button>
    </form>
  );
}