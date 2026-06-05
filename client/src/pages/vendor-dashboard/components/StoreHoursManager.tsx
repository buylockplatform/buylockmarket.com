import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { vendorApiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save, CheckCircle } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface DayConfig {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export default function StoreHoursManager() {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<DayConfig[]>(
    DAYS.map((_, i) => ({
      dayOfWeek: i,
      openTime: "08:00",
      closeTime: "18:00",
      isClosed: i === 0, // Sunday closed by default
    }))
  );

  const { data: existingHours, isLoading } = useQuery<DayConfig[]>({
    queryKey: ["/api/vendor/store-hours"],
    queryFn: () => vendorApiRequest("/api/vendor/store-hours", "GET"),
  });

  useEffect(() => {
    if (existingHours && existingHours.length > 0) {
      setSchedule(prev =>
        prev.map(day => {
          const saved = existingHours.find(h => h.dayOfWeek === day.dayOfWeek);
          return saved ? { ...day, ...saved } : day;
        })
      );
    }
  }, [existingHours]);

  const saveMutation = useMutation({
    mutationFn: () => vendorApiRequest("/api/vendor/store-hours", "POST", schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/store-hours"] });
      toast({ title: "Store Hours Saved", description: "Your store hours have been updated successfully." });
    },
    onError: () => toast({ title: "Save Failed", description: "Could not save store hours.", variant: "destructive" }),
  });

  const updateDay = (dayOfWeek: number, field: keyof DayConfig, value: any) => {
    setSchedule(prev =>
      prev.map(d => d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d)
    );
  };

  const applyToWeekdays = () => {
    const monday = schedule.find(d => d.dayOfWeek === 1);
    if (!monday) return;
    setSchedule(prev =>
      prev.map(d => (d.dayOfWeek >= 1 && d.dayOfWeek <= 5) ? { ...d, openTime: monday.openTime, closeTime: monday.closeTime, isClosed: monday.isClosed } : d)
    );
    toast({ title: "Applied to Weekdays", description: "Monday's hours applied to Tue–Fri." });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {DAYS.map(d => (
          <div key={d} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-buylock-primary" />
          Store Hours
        </CardTitle>
        <p className="text-sm text-gray-500">Set your opening and closing times for each day of the week.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={applyToWeekdays}>
            Copy Mon → Tue–Fri
          </Button>
        </div>

        <div className="space-y-3">
          {schedule.map(day => (
            <div
              key={day.dayOfWeek}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                day.isClosed ? "bg-gray-50 border-gray-200" : "bg-white border-blue-100"
              }`}
            >
              {/* Day label */}
              <div className="w-28 shrink-0">
                <p className={`font-medium text-sm ${day.isClosed ? "text-gray-400" : "text-gray-800"}`}>
                  {DAYS[day.dayOfWeek]}
                </p>
              </div>

              {/* Closed toggle */}
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={!day.isClosed}
                  onCheckedChange={checked => updateDay(day.dayOfWeek, "isClosed", !checked)}
                  id={`day-${day.dayOfWeek}`}
                />
                <Label htmlFor={`day-${day.dayOfWeek}`} className="text-xs text-gray-500">
                  {day.isClosed ? "Closed" : "Open"}
                </Label>
              </div>

              {/* Time inputs */}
              {!day.isClosed ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={day.openTime}
                    onChange={e => updateDay(day.dayOfWeek, "openTime", e.target.value)}
                    className="w-32 text-sm"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <Input
                    type="time"
                    value={day.closeTime}
                    onChange={e => updateDay(day.dayOfWeek, "closeTime", e.target.value)}
                    className="w-32 text-sm"
                  />
                </div>
              ) : (
                <div className="flex-1 text-sm text-gray-400 italic">Closed all day</div>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full bg-buylock-primary hover:bg-buylock-primary/90"
        >
          {saveMutation.isPending ? (
            <span className="flex items-center gap-2"><Clock className="w-4 h-4 animate-spin" /> Saving...</span>
          ) : (
            <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Store Hours</span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
