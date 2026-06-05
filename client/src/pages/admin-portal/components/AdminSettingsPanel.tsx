import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApiRequest, getAdminQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  DollarSign,
  Shield,
  Truck,
  Clock,
  MapPin,
  ToggleLeft,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface PlatformSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  description?: string;
  settingType?: string;
  updatedAt?: string;
}

// ─── Known setting definitions ────────────────────────────────────────────────
const SETTING_DEFS: Record<
  string,
  {
    label: string;
    description: string;
    type: "number" | "boolean" | "string";
    icon: React.ElementType;
    section: string;
    unit?: string;
    min?: number;
    max?: number;
  }
> = {
  platform_commission_percent: {
    label: "Platform Commission",
    description: "Percentage of each order retained by BuyLock as platform fee.",
    type: "number",
    icon: DollarSign,
    section: "financials",
    unit: "%",
    min: 0,
    max: 50,
  },
  vendor_commission_percent: {
    label: "Vendor Net Commission",
    description: "Percentage of order value paid out to vendors (100 − platform fee).",
    type: "number",
    icon: DollarSign,
    section: "financials",
    unit: "%",
    min: 0,
    max: 100,
  },
  enable_store_hours_check: {
    label: "Enforce Store Hours",
    description: "Block checkout when a vendor is outside their configured operating hours.",
    type: "boolean",
    icon: Clock,
    section: "gates",
  },
  enable_delivery_zone_check: {
    label: "Enforce Delivery Zone",
    description: "Block checkout if the delivery address falls outside the vendor's active delivery zone.",
    type: "boolean",
    icon: MapPin,
    section: "gates",
  },
  enable_kyc_required: {
    label: "Require KYC for Vendors",
    description: "Vendors must have approved KYC documents before listing products.",
    type: "boolean",
    icon: Shield,
    section: "gates",
  },
  enable_auto_settlement: {
    label: "Automated Weekly Settlement",
    description: "Automatically process vendor payouts every Monday at 08:00 EAT.",
    type: "boolean",
    icon: Truck,
    section: "automation",
  },
};

// ─── Single Setting Row ────────────────────────────────────────────────────────
function SettingRow({
  def,
  setting,
  onSave,
  isSaving,
}: {
  def: (typeof SETTING_DEFS)[string];
  setting?: PlatformSetting;
  onSave: (key: string, value: string) => void;
  isSaving: boolean;
}) {
  const Icon = def.icon;
  const currentValue = setting?.settingValue ?? (def.type === "boolean" ? "false" : "0");
  const [localValue, setLocalValue] = useState(currentValue);
  const isDirty = localValue !== currentValue;

  // Reset if external data changes
  const valueKey = setting?.settingValue;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const _ = valueKey; // suppress warning — intentional sync

  if (def.type === "boolean") {
    const boolVal = localValue === "true";
    return (
      <div className="flex items-center justify-between py-3">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 p-1.5 rounded-lg ${boolVal ? "bg-green-100" : "bg-gray-100"}`}>
            <Icon className={`w-4 h-4 ${boolVal ? "text-green-600" : "text-gray-400"}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{def.label}</p>
            <p className="text-xs text-gray-500 mt-0.5 max-w-md">{def.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4 shrink-0">
          <Badge
            variant="outline"
            className={`text-xs ${boolVal ? "border-green-300 text-green-700 bg-green-50" : "border-gray-200 text-gray-500"}`}
          >
            {boolVal ? "Enabled" : "Disabled"}
          </Badge>
          <Switch
            checked={boolVal}
            onCheckedChange={(checked) => {
              const newVal = checked ? "true" : "false";
              setLocalValue(newVal);
              onSave(setting?.settingKey || Object.entries(SETTING_DEFS).find(([, v]) => v === def)?.[0] || "", newVal);
            }}
            disabled={isSaving}
          />
        </div>
      </div>
    );
  }

  // Number or string
  const settingKey = Object.entries(SETTING_DEFS).find(([, v]) => v === def)?.[0] || "";
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-0.5 p-1.5 rounded-lg bg-blue-100">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{def.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{def.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <Input
            type={def.type === "number" ? "number" : "text"}
            min={def.min}
            max={def.max}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="w-28 pr-7 text-right"
          />
          {def.unit && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
              {def.unit}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant={isDirty ? "default" : "outline"}
          disabled={!isDirty || isSaving}
          onClick={() => onSave(settingKey, localValue)}
          className={isDirty ? "bg-buylock-primary hover:bg-buylock-primary/90 text-white" : ""}
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-gray-100">{children}</div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminSettingsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // ── Fetch all settings ──
  const { data: settings = [], isLoading, isError, refetch } = useQuery<PlatformSetting[]>({
    queryKey: ["/api/admin/platform-settings"],
    queryFn: getAdminQueryFn({ on401: "throw" }),
    retry: 2,
  });

  // ── Upsert mutation ──
  const upsertMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) =>
      adminApiRequest("/api/admin/platform-settings", "POST", {
        settingKey: key,
        settingValue: value,
      }),
    onMutate: ({ key }) => setSavingKey(key),
    onSuccess: (_, { key }) => {
      toast({
        title: "Setting saved",
        description: `"${SETTING_DEFS[key]?.label ?? key}" has been updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-settings"] });
    },
    onError: (_, { key }) => {
      toast({
        title: "Save failed",
        description: `Could not update "${SETTING_DEFS[key]?.label ?? key}".`,
        variant: "destructive",
      });
    },
    onSettled: () => setSavingKey(null),
  });

  const handleSave = (key: string, value: string) => {
    if (!key) return;
    upsertMutation.mutate({ key, value });
  };

  const getSettingByKey = (key: string) => settings.find((s) => s.settingKey === key);

  // ─── Group defs by section ───────────────────────────────────────────────
  const sections: Record<string, { title: string; description: string }> = {
    financials: {
      title: "💰 Financial Settings",
      description: "Configure commission percentages and revenue split between the platform and vendors.",
    },
    gates: {
      title: "🔒 Checkout Gates",
      description: "Enable or disable validation checks that run at order placement time.",
    },
    automation: {
      title: "⚙️ Automation",
      description: "Toggle background jobs and automated processes.",
    },
  };

  const defsBySection = Object.entries(SETTING_DEFS).reduce<
    Record<string, Array<[string, (typeof SETTING_DEFS)[string]]>>
  >((acc, entry) => {
    const [, def] = entry;
    if (!acc[def.section]) acc[def.section] = [];
    acc[def.section].push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-buylock-primary" />
            Platform Settings
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Control commission rates, checkout enforcement rules and automated jobs.
            Changes take effect immediately on the next relevant request.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Status banner */}
      {isError && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Failed to load settings. Check network connectivity or try refreshing.
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading settings…
        </div>
      ) : (
        <>
          {Object.entries(sections).map(([sectionKey, sectionMeta]) => {
            const sectionDefs = defsBySection[sectionKey] ?? [];
            return (
              <SectionCard key={sectionKey} title={sectionMeta.title} description={sectionMeta.description}>
                {sectionDefs.map(([key, def]) => (
                  <SettingRow
                    key={key}
                    def={def}
                    setting={getSettingByKey(key)}
                    onSave={handleSave}
                    isSaving={savingKey === key}
                  />
                ))}
              </SectionCard>
            );
          })}

          {/* Raw settings table for any non-mapped keys */}
          {settings.filter((s) => !SETTING_DEFS[s.settingKey]).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">🗂️ Other Settings</CardTitle>
                <CardDescription>Additional platform settings stored in the database.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-gray-100">
                  {settings
                    .filter((s) => !SETTING_DEFS[s.settingKey])
                    .map((s) => (
                      <div key={s.id} className="flex items-center justify-between py-3 gap-4">
                        <div>
                          <p className="text-sm font-mono text-gray-700">{s.settingKey}</p>
                          {s.description && <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            defaultValue={s.settingValue}
                            className="w-40 text-sm"
                            onBlur={(e) => {
                              if (e.target.value !== s.settingValue) {
                                handleSave(s.settingKey, e.target.value);
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live summary */}
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Settings are live</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Commission rates are applied to new orders instantly. Feature flags take effect on the next
                    checkout request — no server restart required.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
