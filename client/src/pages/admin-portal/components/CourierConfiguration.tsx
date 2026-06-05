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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Truck,
  Mail,
  MessageSquare,
  Webhook,
  Edit,
  Zap,
  CheckCircle2,
  Radio,
  Bike,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeliveryProvider {
  id: string;
  name: string;
  type: string;
  logo?: string;
  isActive: boolean;
  notificationMethod: "email" | "sms" | "webhook" | "api";
  webhookNotificationUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  baseRate: string;
  distanceRate?: string;
  estimatedDeliveryTime: string;
  supportedRegions?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function CourierConfiguration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery<DeliveryProvider[]>({
    queryKey: ["/api/delivery/providers/config"],
  });

  // Sort: internal/active courier first, then others
  const sortedProviders = [...providers].sort((a, b) => {
    if (a.type === "internal" && b.type !== "internal") return -1;
    if (b.type === "internal" && a.type !== "internal") return 1;
    if (a.isActive && !b.isActive) return -1;
    if (b.isActive && !a.isActive) return 1;
    return a.name.localeCompare(b.name);
  });

  const activeProvider = providers.find((p) => p.isActive);

  const updateProviderMutation = useMutation({
    mutationFn: async (data: {
      providerId: string;
      updates: Partial<DeliveryProvider>;
    }) => {
      return await apiRequest(
        `/api/delivery/providers/${data.providerId}/config`,
        "PUT",
        data.updates
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/delivery/providers/config"],
      });
      toast({
        title: "Configuration saved",
        description: "Provider settings updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update provider configuration.",
        variant: "destructive",
      });
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: async (providerId: string) => {
      return await apiRequest(
        `/api/delivery/providers/${providerId}/set-active`,
        "POST"
      );
    },
    onSuccess: (_, providerId) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/delivery/providers/config"],
      });
      const provider = providers.find((p) => p.id === providerId);
      toast({
        title: "✅ Active courier updated",
        description: `${provider?.name ?? "Courier"} is now the active courier. All other providers have been deactivated.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set active courier.",
        variant: "destructive",
      });
    },
  });

  const getNotificationIcon = (method: string) => {
    switch (method) {
      case "email":
        return <Mail className="w-3 h-3" />;
      case "sms":
        return <MessageSquare className="w-3 h-3" />;
      case "webhook":
        return <Webhook className="w-3 h-3" />;
      case "api":
        return <Radio className="w-3 h-3" />;
      default:
        return <Mail className="w-3 h-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Truck className="w-6 h-6 text-buylock-primary" />
          <h2 className="text-2xl font-bold">Courier Configuration</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Truck className="w-6 h-6 text-buylock-primary" />
          <div>
            <h2 className="text-2xl font-bold">Courier Configuration</h2>
            <p className="text-sm text-gray-500">
              Only one courier can be active at a time — it handles all order dispatch.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeProvider && (
            <Badge className="bg-green-100 text-green-800 border border-green-200 px-3 py-1.5 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 inline" />
              Active: {activeProvider.name}
            </Badge>
          )}
          <Badge variant="outline" className="text-sm">
            {providers.length} Providers
          </Badge>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProviders.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onSetActive={() => setActiveMutation.mutate(provider.id)}
            onUpdate={(updates) =>
              updateProviderMutation.mutate({
                providerId: provider.id,
                updates,
              })
            }
            isSettingActive={setActiveMutation.isPending}
            isUpdating={updateProviderMutation.isPending}
            getNotificationIcon={getNotificationIcon}
          />
        ))}
      </div>

      {providers.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No courier providers configured</p>
          <p className="text-gray-400 text-sm mt-1">
            Run the seed script to add Buylock Delivery and other couriers.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Provider Card ─────────────────────────────────────────────────────────────

interface ProviderCardProps {
  provider: DeliveryProvider;
  onSetActive: () => void;
  onUpdate: (updates: Partial<DeliveryProvider>) => void;
  isSettingActive: boolean;
  isUpdating: boolean;
  getNotificationIcon: (method: string) => React.ReactNode;
}

function ProviderCard({
  provider,
  onSetActive,
  onUpdate,
  isSettingActive,
  isUpdating,
  getNotificationIcon,
}: ProviderCardProps) {
  const isInternal = provider.type === "internal";

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
        provider.isActive
          ? "ring-2 ring-green-400 shadow-green-50 shadow-lg"
          : "hover:shadow-md"
      } ${isInternal ? "border-buylock-primary/30" : ""}`}
    >
      {/* Active glow strip */}
      {provider.isActive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
      )}

      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl flex-shrink-0">{provider.logo ?? "🚚"}</span>
            <div className="min-w-0">
              <CardTitle className="text-base leading-tight truncate">
                {provider.name}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {isInternal && (
                  <Badge className="bg-[#FF4605]/10 text-[#FF4605] border-[#FF4605]/20 text-[10px] px-1.5 py-0.5 font-semibold">
                    <Bike className="w-2.5 h-2.5 mr-1" />
                    IN-HOUSE FLEET
                  </Badge>
                )}
                <Badge
                  variant={provider.isActive ? "default" : "secondary"}
                  className={`text-[10px] px-1.5 py-0.5 ${
                    provider.isActive
                      ? "bg-green-500 hover:bg-green-600"
                      : ""
                  }`}
                >
                  {provider.isActive ? "● Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Base Rate</p>
            <p className="font-semibold text-gray-900 mt-0.5">
              KSh {Number(provider.baseRate).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Est. Time</p>
            <p className="font-semibold text-gray-900 mt-0.5 text-xs">
              {provider.estimatedDeliveryTime}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Notification</p>
            <div className="flex items-center gap-1 mt-0.5">
              {getNotificationIcon(provider.notificationMethod)}
              <span className="font-medium capitalize text-xs">
                {provider.notificationMethod}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Phone</p>
            <p className="font-medium text-gray-900 mt-0.5 text-xs truncate">
              {provider.contactPhone || "—"}
            </p>
          </div>
        </div>

        {/* Supported regions */}
        {provider.supportedRegions && provider.supportedRegions.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-1.5">
              Coverage
            </p>
            <div className="flex flex-wrap gap-1">
              {provider.supportedRegions.slice(0, 4).map((region) => (
                <span
                  key={region}
                  className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-medium"
                >
                  {region}
                </span>
              ))}
              {provider.supportedRegions.length > 4 && (
                <span className="text-[10px] text-gray-400">
                  +{provider.supportedRegions.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Active indicator banner */}
        {provider.isActive && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700 font-medium">
              This is your active courier for all orders
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {/* Set as Active button */}
          {!provider.isActive && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 gap-1.5 bg-[#FF4605] hover:bg-[#e03d04] text-white text-xs"
                  disabled={isSettingActive}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Set as Active
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Switch to {provider.name}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will deactivate all other courier providers and make{" "}
                    <strong>{provider.name}</strong> the exclusive active
                    courier for all new orders. This action takes effect
                    immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onSetActive}
                    className="bg-[#FF4605] hover:bg-[#e03d04]"
                  >
                    Yes, switch courier
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Configure dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`gap-1.5 text-xs ${provider.isActive ? "flex-1" : ""}`}
              >
                <Edit className="w-3.5 h-3.5" />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{provider.logo}</span>
                  Configure {provider.name}
                </DialogTitle>
              </DialogHeader>
              <CourierConfigForm
                provider={provider}
                onUpdate={onUpdate}
                isLoading={isUpdating}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Config Form ───────────────────────────────────────────────────────────────

interface CourierConfigFormProps {
  provider: DeliveryProvider;
  onUpdate: (updates: Partial<DeliveryProvider>) => void;
  isLoading: boolean;
}

function CourierConfigForm({
  provider,
  onUpdate,
  isLoading,
}: CourierConfigFormProps) {
  const [formData, setFormData] = useState({
    notificationMethods: provider.notificationMethod
      ? [provider.notificationMethod]
      : [],
    webhookNotificationUrl: provider.webhookNotificationUrl || "",
    contactEmail: provider.contactEmail || "",
    contactPhone: provider.contactPhone || "",
    isActive: provider.isActive,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const primaryMethod = formData.notificationMethods[0] || "email";
    onUpdate({
      ...formData,
      notificationMethod: primaryMethod as any,
    });
  };

  const toggleNotificationMethod = (
    method: "email" | "sms" | "webhook" | "api"
  ) => {
    const current = formData.notificationMethods;
    const updated = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method];
    setFormData({ ...formData, notificationMethods: updated });
  };

  const notificationOptions = [
    { value: "email", label: "Email Notifications", icon: "📧" },
    { value: "sms", label: "SMS Notifications", icon: "📱" },
    { value: "webhook", label: "Webhook API", icon: "🔗" },
    ...(provider.type === "internal"
      ? [{ value: "api", label: "Internal API (Rider App)", icon: "🏍️" }]
      : []),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {provider.type === "internal" && (
        <div className="bg-[#FF4605]/5 border border-[#FF4605]/20 rounded-lg p-3 text-sm text-[#FF4605]">
          <strong>In-House Fleet:</strong> This courier uses the Buylock rider
          app and delivery_jobs system — no external API required.
        </div>
      )}

      <div className="space-y-3">
        <Label>Notification Methods</Label>
        <div className="space-y-2">
          {notificationOptions.map((method) => (
            <div key={method.value} className="flex items-center space-x-3">
              <input
                type="checkbox"
                id={`notify-${method.value}`}
                checked={formData.notificationMethods.includes(method.value as any)}
                onChange={() =>
                  toggleNotificationMethod(method.value as any)
                }
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor={`notify-${method.value}`}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 cursor-pointer"
              >
                <span>{method.icon}</span>
                <span>{method.label}</span>
              </label>
            </div>
          ))}
        </div>
        {formData.notificationMethods.length === 0 && (
          <p className="text-xs text-amber-600">
            ⚠️ Select at least one notification method
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactEmail">Contact Email</Label>
        <Input
          id="contactEmail"
          type="email"
          value={formData.contactEmail}
          onChange={(e) =>
            setFormData({ ...formData, contactEmail: e.target.value })
          }
          placeholder="dispatch@buylockmarket.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactPhone">Contact Phone</Label>
        <Input
          id="contactPhone"
          type="tel"
          value={formData.contactPhone}
          onChange={(e) =>
            setFormData({ ...formData, contactPhone: e.target.value })
          }
          placeholder="+254712345678"
        />
      </div>

      {formData.notificationMethods.includes("webhook") && (
        <div className="space-y-2">
          <Label htmlFor="webhookUrl">Webhook Notification URL</Label>
          <Textarea
            id="webhookUrl"
            value={formData.webhookNotificationUrl}
            onChange={(e) =>
              setFormData({
                ...formData,
                webhookNotificationUrl: e.target.value,
              })
            }
            placeholder="https://courier-api.example.com/notifications"
            rows={3}
          />
          <p className="text-xs text-gray-500">
            URL where order notifications are sent to the courier
          </p>
        </div>
      )}

      <div className="flex items-center space-x-2 pt-1">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isActive: checked })
          }
        />
        <Label htmlFor="isActive">Active Provider</Label>
      </div>

      <Button
        type="submit"
        disabled={isLoading || formData.notificationMethods.length === 0}
        className="w-full bg-[#FF4605] hover:bg-[#e03d04]"
      >
        {isLoading ? "Saving..." : "Save Configuration"}
      </Button>
    </form>
  );
}