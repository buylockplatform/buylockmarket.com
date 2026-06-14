import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

type Job = {
  id: string;
  orderId: string;
  orderNumber: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLatitude?: string;
  pickupLongitude?: string;
  dropoffLatitude?: string;
  dropoffLongitude?: string;
  status: string;
  jobType: string;
  totalAmount?: string;
  deliveryFee?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
};

type EarningsStats = { pending: number; approved: number; paid: number; totalJobs: number };

const STATUS_COLORS: Record<string, string> = {
  AWAITING_ACCEPTANCE: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  ASSIGNING: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  ASSIGNED: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  PICKED_UP: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  OUT_FOR_DELIVERY: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  DELIVERED: "bg-green-500/10 text-green-400 border-green-500/30",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/30",
};

function getToken() { return localStorage.getItem("rider_token"); }
function getUser() {
  try { return JSON.parse(localStorage.getItem("rider_user") ?? "null"); } catch { return null; }
}

export default function RiderDashboard() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"active" | "history" | "earnings">("active");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [earnings, setEarnings] = useState<EarningsStats>({ pending: 0, approved: 0, paid: 0, totalJobs: 0 });
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const user = getUser();
  const token = getToken();

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchJobs = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/delivery/orders/${user.id}`, { headers });
      if (res.ok) setJobs(await res.json());
    } catch {}
  }, [user?.id]);

  const fetchEarnings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/rider-earnings/stats?driverId=${user.id}`, { headers });
      if (res.ok) setEarnings(await res.json());
    } catch {}
  }, [user?.id]);

  useEffect(() => {
    if (!token || !user) { setLocation("/delivery/login"); return; }
    setIsOnline(user.isOnline ?? false);
    Promise.all([fetchJobs(), fetchEarnings()]).finally(() => setLoading(false));
    const timer = setInterval(fetchJobs, 30000);
    return () => clearInterval(timer);
  }, []);

  const toggleOnline = async () => {
    try {
      await fetch("/api/delivery/status", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ userId: user.id, isOnline: !isOnline }),
      });
      const updated = { ...user, isOnline: !isOnline };
      localStorage.setItem("rider_user", JSON.stringify(updated));
      setIsOnline(!isOnline);
    } catch {}
  };

  const updateStatus = async (jobId: string, status: string) => {
    setActionLoading(jobId + status);
    try {
      await fetch(`/api/delivery-jobs/${jobId}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });
      await fetchJobs();
    } finally {
      setActionLoading(null);
    }
  };

  const acceptJob = async (jobId: string) => {
    setActionLoading(jobId + "accept");
    try {
      await fetch(`/api/delivery/jobs/${jobId}/accept`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ riderId: user.id }),
      });
      await fetchJobs();
    } finally {
      setActionLoading(null);
    }
  };

  const declineJob = async (jobId: string) => {
    setActionLoading(jobId + "decline");
    try {
      await fetch(`/api/delivery/jobs/${jobId}/decline`, { method: "PATCH", headers, body: "{}" });
      await fetchJobs();
    } finally {
      setActionLoading(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("rider_token");
    localStorage.removeItem("rider_user");
    setLocation("/delivery/login");
  };

  const activeJobs = jobs.filter((j) => !["DELIVERED", "CANCELLED"].includes(j.status));
  const historyJobs = jobs.filter((j) => ["DELIVERED", "CANCELLED"].includes(j.status));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#FF4705] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      {/* Header */}
      <header className="bg-black/30 border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🏍️</span>
          <div>
            <h1 className="font-bold text-white">Buylock Rider</h1>
            <p className="text-xs text-gray-400">{user?.fullName || user?.firstName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleOnline}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${isOnline ? "bg-green-500 text-white" : "bg-gray-600 text-white"}`}
          >
            {isOnline ? "● ONLINE" : "○ OFFLINE"}
          </button>
          <button onClick={logout} className="text-gray-400 hover:text-white text-sm">
            Sign Out
          </button>
        </div>
      </header>

      {/* Earnings Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
        {[
          { label: "Pending", value: `KES ${earnings.pending.toFixed(0)}`, color: "text-amber-400" },
          { label: "Approved", value: `KES ${earnings.approved.toFixed(0)}`, color: "text-blue-400" },
          { label: "Paid Out", value: `KES ${earnings.paid.toFixed(0)}`, color: "text-green-400" },
          { label: "Total Jobs", value: String(earnings.totalJobs), color: "text-[#FF4705]" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-gray-400 text-xs">{label}</p>
            <p className={`text-xl font-bold ${color} mt-1`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-4">
        {[
          { key: "active" as const, label: `Active (${activeJobs.length})` },
          { key: "history" as const, label: `History (${historyJobs.length})` },
          { key: "earnings" as const, label: "Earnings" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === key ? "border-[#FF4705] text-[#FF4705]" : "border-transparent text-gray-400 hover:text-white"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        {tab === "earnings" ? (
          <EarningsPanel userId={user?.id} token={token!} />
        ) : (
          (tab === "active" ? activeJobs : historyJobs).length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">📦</p>
              <p>No {tab === "active" ? "active assignments" : "completed deliveries"} yet</p>
            </div>
          ) : (
            (tab === "active" ? activeJobs : historyJobs).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isHistory={tab === "history"}
                expanded={expandedJob === job.id}
                onExpand={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                onAccept={acceptJob}
                onDecline={declineJob}
                onUpdateStatus={updateStatus}
                actionLoading={actionLoading}
              />
            ))
          )
        )}
      </div>
    </div>
  );
}

function JobCard({ job, isHistory, expanded, onExpand, onAccept, onDecline, onUpdateStatus, actionLoading }: {
  job: Job;
  isHistory: boolean;
  expanded: boolean;
  onExpand: () => void;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  actionLoading: string | null;
}) {
  const statusClass = STATUS_COLORS[job.status] ?? "bg-gray-500/10 text-gray-400 border-gray-500/30";

  const gmapsUrl = (lat?: string, lng?: string) =>
    lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Accent bar */}
      <div className={`h-1 ${job.status === "DELIVERED" ? "bg-green-500" : job.status === "PICKED_UP" ? "bg-purple-500" : "bg-[#FF4705]"}`} />

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-white">Order #{job.orderNumber}</p>
            <p className="text-xs text-gray-400">{new Date(job.createdAt).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium border ${statusClass}`}>
              {job.status.replace(/_/g, " ")}
            </span>
            {job.deliveryFee && <p className="text-[#FF4705] font-semibold text-sm mt-1">KES {job.deliveryFee}</p>}
          </div>
        </div>

        {/* Pickup row */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 mb-2">
          <p className="text-xs font-semibold text-amber-400 mb-1">📍 PICKUP</p>
          <p className="text-sm text-white">{job.pickupAddress}</p>
        </div>

        {/* Dropoff row */}
        <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-3 mb-3">
          <p className="text-xs font-semibold text-sky-400 mb-1">🏁 DROPOFF</p>
          <p className="text-sm text-white">{job.dropoffAddress}</p>
          {job.customerName && <p className="text-xs text-gray-400 mt-1">👤 {job.customerName}</p>}
          {job.customerPhone && (
            <a href={`tel:${job.customerPhone}`} className="text-xs text-[#FF4705] hover:underline">
              📞 {job.customerPhone}
            </a>
          )}
        </div>

        {/* Maps toggle */}
        <button onClick={onExpand} className="w-full text-sm text-gray-400 hover:text-white py-1 text-center">
          {expanded ? "▲ Hide Maps" : "▼ View Maps"}
        </button>

        {expanded && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { label: "Pickup", lat: job.pickupLatitude, lng: job.pickupLongitude },
              { label: "Dropoff", lat: job.dropoffLatitude, lng: job.dropoffLongitude },
            ].map(({ label, lat, lng }) => {
              const url = gmapsUrl(lat, lng);
              return (
                <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-2">{label}</p>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="text-[#FF4705] text-xs hover:underline">
                      Open in Google Maps →
                    </a>
                  ) : (
                    <p className="text-gray-500 text-xs">No coordinates</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        {!isHistory && (
          <div className="mt-4 space-y-2">
            {job.status === "AWAITING_ACCEPTANCE" && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-3">
                <p className="text-amber-400 text-sm font-semibold text-center">⚡ New Job Assigned — Accept or Decline</p>
              </div>
            )}
            {(job.status === "AWAITING_ACCEPTANCE" || job.status === "ASSIGNING") && (
              <div className="flex gap-2">
                <button
                  onClick={() => onDecline(job.id)}
                  disabled={actionLoading !== null}
                  className="flex-1 py-3 border border-red-500/50 text-red-400 rounded-xl font-semibold text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  onClick={() => onAccept(job.id)}
                  disabled={actionLoading !== null}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {actionLoading === job.id + "accept" ? "..." : "Accept"}
                </button>
              </div>
            )}
            {job.status === "ASSIGNED" && (
              <button
                onClick={() => onUpdateStatus(job.id, "PICKED_UP")}
                disabled={actionLoading !== null}
                className="w-full py-3 bg-[#FF4705] hover:bg-[#e03d04] text-white rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                {actionLoading === job.id + "PICKED_UP" ? "Updating..." : "✅ Picked Up from Vendor"}
              </button>
            )}
            {job.status === "PICKED_UP" && (
              <button
                onClick={() => onUpdateStatus(job.id, "DELIVERED")}
                disabled={actionLoading !== null}
                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                {actionLoading === job.id + "DELIVERED" ? "Updating..." : "🏁 Delivered to Customer"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EarningsPanel({ userId, token }: { userId: string; token: string }) {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/rider-earnings?driverId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setEarnings)
      .finally(() => setLoading(false));
  }, [userId]);

  const statusColor: Record<string, string> = {
    PENDING: "text-amber-400",
    APPROVED: "text-blue-400",
    PAID: "text-green-400",
    DECLINED: "text-red-400",
  };

  if (loading) return <div className="text-center py-8 text-gray-400">Loading earnings...</div>;
  if (!earnings.length) return <div className="text-center py-8 text-gray-500">No earnings records yet</div>;

  return (
    <div className="space-y-3">
      {earnings.map((e) => (
        <div key={e.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white font-semibold">KES {parseFloat(e.driverPayout).toFixed(2)}</p>
              <p className="text-xs text-gray-400">Fee: KES {parseFloat(e.deliveryFee).toFixed(2)} · Commission: KES {parseFloat(e.platformCommission).toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">{new Date(e.createdAt).toLocaleDateString()}</p>
            </div>
            <span className={`text-sm font-semibold ${statusColor[e.status] ?? "text-gray-400"}`}>{e.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
