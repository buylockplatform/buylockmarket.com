import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Bell } from "lucide-react";

interface MessageUserModalProps {
  userId: string | null;
  userName: string;
  userEmail?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MessageUserModal({
  userId,
  userName,
  userEmail,
  isOpen,
  onClose,
}: MessageUserModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendPush, setSendPush] = useState(true);
  const [errors, setErrors] = useState<{ subject?: string; message?: string; channels?: string }>({});

  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/admin/users/${userId}/message`, "POST", {
        subject,
        message,
        sendEmail,
        sendPush,
      });
    },
    onSuccess: (data: any) => {
      const parts: string[] = [];
      if (data?.results?.email) parts.push("email");
      if (data?.results?.push) parts.push("push notification");

      toast({
        title: "Message sent",
        description: parts.length
          ? `Delivered via ${parts.join(" and ")}`
          : "Message processed",
      });
      setSubject("");
      setMessage("");
      setSendEmail(true);
      setSendPush(true);
      setErrors({});
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!subject.trim()) newErrors.subject = "Subject is required";
    if (!message.trim()) newErrors.message = "Message is required";
    if (!sendEmail && !sendPush) {
      newErrors.channels = "Select at least one delivery channel";
    }
    if (sendEmail && !userEmail) {
      newErrors.channels = "This user has no email — use push notification instead";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      sendMessageMutation.mutate();
    }
  };

  const handleClose = () => {
    setSubject("");
    setMessage("");
    setSendEmail(true);
    setSendPush(true);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            Send a message to <strong>{userName}</strong>
            {userEmail ? ` (${userEmail})` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message-subject">Subject</Label>
            <Input
              id="message-subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject) setErrors({ ...errors, subject: undefined });
              }}
              placeholder="Message subject"
              className={errors.subject ? "border-red-500" : ""}
            />
            {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message-body">Message</Label>
            <Textarea
              id="message-body"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) setErrors({ ...errors, message: undefined });
              }}
              placeholder="Write your message to the customer..."
              rows={5}
              className={errors.message ? "border-red-500" : ""}
            />
            {errors.message && <p className="text-sm text-red-500">{errors.message}</p>}
          </div>

          <div className="space-y-3 bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700">Delivery channels</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={sendEmail}
                onCheckedChange={(checked) => {
                  setSendEmail(checked === true);
                  if (errors.channels) setErrors({ ...errors, channels: undefined });
                }}
                disabled={!userEmail}
              />
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>Email{!userEmail ? " (not available)" : ""}</span>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={sendPush}
                onCheckedChange={(checked) => {
                  setSendPush(checked === true);
                  if (errors.channels) setErrors({ ...errors, channels: undefined });
                }}
              />
              <div className="flex items-center gap-2 text-sm">
                <Bell className="w-4 h-4 text-gray-500" />
                <span>Push notification (mobile app)</span>
              </div>
            </label>
            {errors.channels && <p className="text-sm text-red-500">{errors.channels}</p>}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendMessageMutation.isPending}>
              {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
