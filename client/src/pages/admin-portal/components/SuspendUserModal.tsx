import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserX } from "lucide-react";

const SUSPENSION_REASONS = [
  { value: "policy_violation", label: "Violated platform terms of service" },
  { value: "fraud_suspected", label: "Suspected fraudulent activity" },
  { value: "payment_disputes", label: "Repeated payment or chargeback issues" },
  { value: "abusive_behavior", label: "Abusive behavior toward vendors or support" },
  { value: "custom", label: "Other reason (specify below)" },
];

interface SuspendUserModalProps {
  userName: string;
  userEmail?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

export function SuspendUserModal({
  userName,
  userEmail,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: SuspendUserModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customNote, setCustomNote] = useState("");

  const handleConfirm = () => {
    const reason = SUSPENSION_REASONS.find((r) => r.value === selectedReason);
    const notes =
      selectedReason === "custom"
        ? customNote.trim()
        : reason
        ? `${reason.label}${customNote.trim() ? ` — ${customNote.trim()}` : ""}`
        : customNote.trim() || "Suspended by admin";
    onConfirm(notes);
  };

  const handleClose = () => {
    setSelectedReason("");
    setCustomNote("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <UserX className="w-5 h-5" />
            Suspend User
          </DialogTitle>
          <DialogDescription>
            Suspending <strong>{userName}</strong>
            {userEmail ? ` (${userEmail})` : ""} will block them from logging in and placing orders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Reason <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {SUSPENSION_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    selectedReason === reason.value
                      ? "border-red-400 bg-red-50 text-red-800"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="user_suspend_reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={() => setSelectedReason(reason.value)}
                    className="accent-red-500"
                  />
                  <span className="text-sm">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="user_suspend_notes" className="text-sm font-medium text-gray-700 mb-1 block">
              {selectedReason === "custom" ? "Suspension reason" : "Additional notes (optional)"}
            </Label>
            <Textarea
              id="user_suspend_notes"
              placeholder="Additional context for internal records..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!selectedReason || (selectedReason === "custom" && !customNote.trim()) || isLoading}
          >
            {isLoading ? "Suspending…" : "Confirm Suspension"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
