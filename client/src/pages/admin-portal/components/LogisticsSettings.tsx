import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApiRequest, getAdminQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Truck,
  Zap,
  Clock,
  MapPin,
  DollarSign,
  Save,
  RotateCcw,
  Info,
  Package,
  Navigation,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface PlatformSetting {
  settingKey: string;
  settingValue: string;
  description?: string;
  updatedAt?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b last:border-0">
      <div className="sm:w-56 shrink-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2.5 rounded-xl bg-indigo-100">{icon}</div>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LogisticsSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all platform settings from backend
  const { data: rawSettings = [], isLoading } = useQuery<PlatformSetting[]>({
    queryKey: ["/api/admin/platform-settings"],
    queryFn: getAdminQueryFn({ on401: "throw" }),
  });

  // Map settings into a key→value object for easy access
  const settingsMap = (rawSettings || []).reduce<Record<string, string>>((acc, s) => {
    acc[s.settingKey] = s.settingValue;
    return acc;
  }, {});

  // ── Local form state (pre-filled from API) ──
  const defaults = {
    base_delivery_fee:         settingsMap["base_delivery_fee"]         ?? "300",
    per_km_rate:               settingsMap["per_km_rate"]               ?? "15",
    max_delivery_radius_km:    settingsMap["max_delivery_radius_km"]    ?? "50",
    free_delivery_threshold:   settingsMap["free_delivery_threshold"]   ?? "5000",
    surge_enabled:             settingsMap["surge_enabled"]             ?? "false",
    surge_multiplier:          settingsMap["surge_multiplier"]          ?? "1.5",
    surge_start_hour:          settingsMap["surge_start_hour"]          ?? "18",
    surge_end_hour:            settingsMap["surge_end_hour"]            ?? "21",
    weekend_surcharge_pct:     settingsMap["weekend_surcharge_pct"]     ?? "10",
    rain_surcharge_pct:        settingsMap["rain_surcharge_pct"]        ?? "20",
    express_multiplier:        settingsMap["express_multiplier"]        ?? "2",
    vendor_unresponsive_hours: settingsMap["vendor_unresponsive_hours"] ?? "2",
    auto_cancel_unresponsive:  settingsMap["auto_cancel_unresponsive"]  ?? "true",
    min_order_for_delivery:    settingsMap["min_order_for_delivery"]    ?? "500",
  };

  const [form, setForm] = useState(defaults);
  const [dirty, setDirty] = useState(false);

  // Update a single field and mark form as dirty
  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  // ── Save mutation: fires one PUT per changed key ──
  const saveMutation = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      await Promise.all(
        Object.entries(updates).map(([key, value]) =>
          adminApiRequest(`/api/admin/platform-settings/${key}`, "PUT", { settingValue: value })
        )
      );
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Logistics settings updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-settings"] });
      setDirty(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  function handleSave() {
    saveMutation.mutate(form);
  }

  function handleReset() {
    setForm(defaults);
    setDirty(false);
  }

  // Derived preview of the fee formula
  const exampleKm    = 5;
  const baseFee      = parseFloat(form.base_delivery_fee) || 0;
  const perKm        = parseFloat(form.per_km_rate) || 0;
  const exampleTotal = baseFee + perKm * exampleKm;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-40" />
                <div className="h-4 bg-gray-200 rounded w-72" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" />
            Logistics &amp; Delivery Settings
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure delivery fees, surge pricing, and fulfillment rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dirty && (
            <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
              Unsaved changes
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!dirty || saveMutation.isPending}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!dirty || saveMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Save className="w-4 h-4 mr-1" />
            {saveMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* ── Section 1: Base Delivery Fees ── */}
      <Card>
        <CardHeader className="pb-0">
          <SectionHeader
            icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
            title="Base Delivery Fee Formula"
            subtitle="Fee = Base Fee + (Per-km Rate × Distance)"
          />
        </CardHeader>
        <CardContent>
          <SettingRow label="Base Delivery Fee (KSh)" hint="Flat charge applied to every order">
            <Input
              id="base_delivery_fee"
              type="number"
              min={0}
              value={form.base_delivery_fee}
              onChange={(e) => setField("base_delivery_fee", e.target.value)}
              className="max-w-xs"
            />
          </SettingRow>

          <SettingRow label="Per-km Rate (KSh)" hint="Added for every km beyond the vendor">
            <Input
              id="per_km_rate"
              type="number"
              min={0}
              step={0.5}
              value={form.per_km_rate}
              onChange={(e) => setField("per_km_rate", e.target.value)}
              className="max-w-xs"
            />
          </SettingRow>

          <SettingRow label="Max Delivery Radius (km)" hint="Orders outside this radius are rejected">
            <Input
              id="max_delivery_radius_km"
              type="number"
              min={1}
              value={form.max_delivery_radius_km}
              onChange={(e) => setField("max_delivery_radius_km", e.target.value)}
              className="max-w-xs"
            />
          </SettingRow>

          <SettingRow label="Free Delivery Threshold (KSh)" hint="Orders above this amount get free delivery">
            <Input
              id="free_delivery_threshold"
              type="number"
              min={0}
              value={form.free_delivery_threshold}
              onChange={(e) => setField("free_delivery_threshold", e.target.value)}
              className="max-w-xs"
            />
          </SettingRow>

          <SettingRow label="Min Order for Delivery (KSh)" hint="Orders below this are not eligible for delivery">
            <Input
              id="min_order_for_delivery"
              type="number"
              min={0}
              value={form.min_order_for_delivery}
              onChange={(e) => setField("min_order_for_delivery", e.target.value)}
              className="max-w-xs"
            />
          </SettingRow>

          {/* Live preview */}
          <div className="mt-5 rounded-xl bg-indigo-50 border border-indigo-100 p-4 flex items-center gap-3">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <p className="text-sm text-indigo-700">
              <strong>Formula preview:</strong> A {exampleKm}-km delivery costs{" "}
              <strong>KSh {exampleTotal.toLocaleString("en-KE")}</strong>{" "}
              (KSh {baseFee} base + KSh {perKm}/km × {exampleKm} km).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Surge Pricing ── */}
      <Card>
        <CardHeader className="pb-0">
          <SectionHeader
            icon={<Zap className="w-5 h-5 text-indigo-600" />}
            title="Surge Pricing"
            subtitle="Automatically increase delivery fees during peak demand"
          />
        </CardHeader>
        <CardContent>
          <SettingRow label="Enable Surge Pricing" hint="Toggle peak-hour surcharges on or off">
            <Switch
              id="surge_enabled"
              checked={form.surge_enabled === "true"}
              onCheckedChange={(v) => setField("surge_enabled", String(v))}
            />
          </SettingRow>

          <SettingRow
            label="Surge Multiplier"
            hint="e.g. 1.5 means 50% higher than the standard fee"
          >
            <Input
              id="surge_multiplier"
              type="number"
              min={1}
              step={0.1}
              max={5}
              disabled={form.surge_enabled !== "true"}
              value={form.surge_multiplier}
              onChange={(e) => setField("surge_multiplier", e.target.value)}
              className="max-w-xs"
            />
          </SettingRow>

          <SettingRow label="Surge Start Hour (24h)" hint="Hour of day when surge begins">
            <Input
              id="surge_start_hour"
              type="number"
              min={0}
              max={23}
              disabled={form.surge_enabled !== "true"}
              value={form.surge_start_hour}
              onChange={(e) => setField("surge_start_hour", e.target.value)}
              className="max-w-xs"
            />
          </SettingRow>

          <SettingRow label="Surge End Hour (24h)" hint="Hour of day when surge ends">
            <Input
              id="surge_end_hour"
              type="number"
              min={0}
              max={23}
              disabled={form.surge_enabled !== "true"}
              value={form.surge_end_hour}
              onChange={(e) => setField("surge_end_hour", e.target.value)}
              className="max-w-xs"
            />
          </SettingRow>

          <SettingRow
            label="Weekend Surcharge (%)"
            hint="Additional % applied on Saturdays and Sundays"
          >
            <Input
              id="weekend_surcharge_pct"
              type="number"
              min={0}
              max={100}
              value={form.weekend_surcharge_pct}
              onChange={(e) => setField("weekend_surcharge_pct", e.target.value)}
              className="max-w-xs"
            />
          </SettingRow>

          <SettingRow
            label="Rain / Weather Surcharge (%)"
            hint="Extra % added when adverse weather is detected"
          >
            <Input
              id="rain_surcharge_pct"
              type="number"
              min={0}
              max={100}
              value={form.rain_surcharge_pct}
              onChange={(e) => setField("rain_surcharge_pct", e.target.value)}
              className="max-w-xs"
            />
          </SettingRow>

          <SettingRow
            label="Express Delivery Multiplier"
            hint="Multiplier applied when buyer selects express delivery"
          >
            <Input
              id="express_multiplier"
              type="number"
              min={1}
              step={0.5}
              value={form.express_multiplier}
              onChange={(e) => setField("express_multiplier", e.target.value)}
              className="max-w-xs"
            />
          </SettingRow>
        </CardContent>
      </Card>

      {/* ── Section 3: Fulfillment Rules ── */}
      <Card>
        <CardHeader className="pb-0">
          <SectionHeader
            icon={<Clock className="w-5 h-5 text-indigo-600" />}
            title="Fulfillment &amp; Vendor Rules"
            subtitle="Control how unresponsive vendors are handled"
          />
        </CardHeader>
        <CardContent>
          <SettingRow
            label="Vendor Unresponsive Timeout (hours)"
            hint="Time after payment before an order is considered abandoned"
          >
            <Input
              id="vendor_unresponsive_hours"
              type="number"
              min={1}
              max={72}
              value={form.vendor_unresponsive_hours}
              onChange={(e) => setField("vendor_unresponsive_hours", e.target.value)}
              className="max-w-xs"
            />
          </SettingRow>

          <SettingRow
            label="Auto-cancel Unresponsive Orders"
            hint="Automatically cancel and refund orders past the timeout"
          >
            <Switch
              id="auto_cancel_unresponsive"
              checked={form.auto_cancel_unresponsive === "true"}
              onCheckedChange={(v) => setField("auto_cancel_unresponsive", String(v))}
            />
          </SettingRow>

          {/* Explanation box */}
          <div className="mt-5 rounded-xl bg-amber-50 border border-amber-100 p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-700">
              <p className="font-semibold mb-1">How auto-cancel works</p>
              <p>
                A background cron job checks every 5 minutes for paid orders where the vendor
                has not responded within{" "}
                <strong>{form.vendor_unresponsive_hours} hour{form.vendor_unresponsive_hours !== "1" ? "s" : ""}</strong>.
                {form.auto_cancel_unresponsive === "true"
                  ? " Eligible orders are marked cancelled and a Paystack refund is initiated automatically."
                  : " Auto-cancel is disabled — orders will only be flagged for manual review."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Summary Preview ── */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-indigo-800 uppercase tracking-wider flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            Current Configuration Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <p className="text-gray-500 text-xs mb-1">Base Fee</p>
              <p className="font-bold text-gray-900">KSh {parseFloat(form.base_delivery_fee).toLocaleString("en-KE")}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <p className="text-gray-500 text-xs mb-1">Rate per km</p>
              <p className="font-bold text-gray-900">KSh {form.per_km_rate}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <p className="text-gray-500 text-xs mb-1">Free Delivery</p>
              <p className="font-bold text-gray-900">KSh {parseFloat(form.free_delivery_threshold).toLocaleString("en-KE")}+</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <p className="text-gray-500 text-xs mb-1">Surge</p>
              <p className="font-bold text-gray-900">
                {form.surge_enabled === "true"
                  ? `${form.surge_multiplier}× (${form.surge_start_hour}h–${form.surge_end_hour}h)`
                  : "Disabled"}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <p className="text-gray-500 text-xs mb-1">Vendor Timeout</p>
              <p className="font-bold text-gray-900">{form.vendor_unresponsive_hours}h</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <p className="text-gray-500 text-xs mb-1">Auto-cancel</p>
              <p className={`font-bold ${form.auto_cancel_unresponsive === "true" ? "text-emerald-700" : "text-red-600"}`}>
                {form.auto_cancel_unresponsive === "true" ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Save footer ── */}
      {dirty && (
        <div className="sticky bottom-0 bg-white border-t shadow-lg px-6 py-4 -mx-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">You have unsaved changes</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={saveMutation.isPending}>
              Discard
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
