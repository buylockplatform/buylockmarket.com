import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, Phone, Bike, CheckCircle2, Send, Clock, RefreshCw } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type Earning = {
  id: string;
  driverId: string;
  orderId: string;
  deliveryFee: string;
  platformCommission: string;
  driverPayout: string;
  status: string;
  mpesaReceiptNumber?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
};

type RiderSummary = {
  driverId: string;
  name: string;
  phone: string;
  mpesaNumber: string;
  pendingTotal: number;
  approvedTotal: number;
  pendingCount: number;
  approvedCount: number;
  earnings: Earning[];
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:  "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID:     "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
};

const adminHeaders = { "Content-Type": "application/json", "x-admin-auth": "true" };

// ── Main Component ─────────────────────────────────────────────────────────

export default function RiderEarnings() {
  const [view, setView] = useState<"riders" | "history">("riders");
  const [riders, setRiders] = useState<RiderSummary[]>([]);
  const [history, setHistory] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRider, setExpandedRider] = useState<string | null>(null);
  const [payingRider, setPayingRider] = useState<string | null>(null);
  const [approvingRider, setApprovingRider] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all pending+approved earnings, group by rider
  const loadRiders = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get all open earnings
      const res = await fetch(
        "/api/rider-earnings?status=PENDING&status=APPROVED",
        { headers: adminHeaders }
      );
      const earnings: Earning[] = await res.json();
      if (!Array.isArray(earnings)) { setRiders([]); return; }

      // 2. Get all riders to resolve names / M-Pesa numbers
      const riderRes = await fetch("/api/delivery/personnel", { headers: adminHeaders });
      const riderList: any[] = riderRes.ok ? await riderRes.json() : [];
      const riderMap = new Map(riderList.map((r) => [r.id, r]));

      // 3. Group
      const grouped = new Map<string, RiderSummary>();
      for (const e of earnings) {
        if (!grouped.has(e.driverId)) {
          const r = riderMap.get(e.driverId);
          const name =
            r?.fullName ||
            [r?.firstName, r?.lastName].filter(Boolean).join(" ") ||
            `Rider …${e.driverId.slice(-6)}`;
          grouped.set(e.driverId, {
            driverId: e.driverId,
            name,
            phone: r?.phone ?? "—",
            mpesaNumber: r?.mpesaNumber ?? r?.phone ?? "—",
            pendingTotal: 0,
            approvedTotal: 0,
            pendingCount: 0,
            approvedCount: 0,
            earnings: [],
          });
        }
        const g = grouped.get(e.driverId)!;
        const amt = parseFloat(e.driverPayout);
        if (e.status === "PENDING") { g.pendingTotal += amt; g.pendingCount++; }
        if (e.status === "APPROVED") { g.approvedTotal += amt; g.approvedCount++; }
        g.earnings.push(e);
      }

      // Sort: riders with approved earnings first
      setRiders(
        Array.from(grouped.values()).sort((a, b) => b.approvedTotal - a.approvedTotal)
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "/api/rider-earnings?status=PAID&status=DECLINED",
        { headers: adminHeaders }
      );
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "riders") loadRiders(); else loadHistory();
  }, [view]);

  // Approve all pending for one rider
  const approveAll = async (driverId: string) => {
    setApprovingRider(driverId);
    try {
      const res = await fetch("/api/rider-earnings/approve-all-for-rider", {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ driverId }),
      });
      const data = await res.json();
      if (res.ok) { showToast("All pending earnings approved ✓"); await loadRiders(); }
      else showToast(data.error ?? "Failed to approve", false);
    } finally {
      setApprovingRider(null);
    }
  };

  // Pay rider — fires Paystack M-Pesa transfer for total approved amount
  const payRider = async (rider: RiderSummary) => {
    if (!window.confirm(
      `Send KES ${rider.approvedTotal.toFixed(0)} to ${rider.name} via M-Pesa (${rider.mpesaNumber})?`
    )) return;

    setPayingRider(rider.driverId);
    try {
      const res = await fetch("/api/rider-earnings/pay-rider", {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ driverId: rider.driverId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          `✓ KES ${data.netPayout?.toFixed(0) ?? "—"} sent to ${rider.mpesaNumber}` +
            (data.transferCode ? ` · Ref: ${data.transferCode}` : "")
        );
        await loadRiders();
      } else {
        showToast(data.error ?? "Payment failed", false);
      }
    } finally {
      setPayingRider(null);
    }
  };

  // Per-row approve / decline
  const patchOne = async (id: string, action: string) => {
    setActionLoading(id + action);
    try {
      await fetch(`/api/rider-earnings/${id}/${action}`, {
        method: "PATCH",
        headers: adminHeaders,
        body: "{}",
      });
      await loadRiders();
    } finally {
      setActionLoading(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all
            ${toast.ok ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rider Payouts</h1>
          <p className="text-gray-500 mt-0.5">Approve earnings per rider and disburse via M-Pesa</p>
        </div>
        <button
          onClick={() => { if (view === "riders") loadRiders(); else loadHistory(); }}
          className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(["riders", "history"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${view === v ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            {v === "riders" ? "Riders (Pending / Approved)" : "Payment History"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading…
        </div>
      ) : view === "riders" ? (

        // ── Rider Cards ──────────────────────────────────────────────────
        riders.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl text-gray-500">
            <Bike className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No pending or approved earnings</p>
          </div>
        ) : (
          <div className="space-y-4">
            {riders.map((rider) => {
              const isExpanded = expandedRider === rider.driverId;
              const isPaying = payingRider === rider.driverId;
              const isApproving = approvingRider === rider.driverId;
              const hasPending = rider.pendingCount > 0;
              const hasApproved = rider.approvedCount > 0;

              return (
                <div
                  key={rider.driverId}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                >
                  {/* Rider header row */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* Identity */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <Bike className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{rider.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{rider.mpesaNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Totals */}
                      <div className="flex gap-4 flex-shrink-0">
                        {hasPending && (
                          <div className="text-center">
                            <p className="text-xs text-amber-600 font-medium">Pending</p>
                            <p className="text-lg font-bold text-amber-700">
                              KES {rider.pendingTotal.toFixed(0)}
                            </p>
                            <p className="text-xs text-gray-400">{rider.pendingCount} job{rider.pendingCount !== 1 ? "s" : ""}</p>
                          </div>
                        )}
                        {hasApproved && (
                          <div className="text-center">
                            <p className="text-xs text-green-600 font-medium">Approved</p>
                            <p className="text-lg font-bold text-green-700">
                              KES {rider.approvedTotal.toFixed(0)}
                            </p>
                            <p className="text-xs text-gray-400">{rider.approvedCount} job{rider.approvedCount !== 1 ? "s" : ""}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {hasPending && (
                        <button
                          onClick={() => approveAll(rider.driverId)}
                          disabled={isApproving || isPaying}
                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {isApproving ? "Approving…" : `Approve All (${rider.pendingCount})`}
                        </button>
                      )}

                      {hasApproved && (
                        <button
                          onClick={() => payRider(rider)}
                          disabled={isPaying || isApproving}
                          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-400 disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          {isPaying
                            ? "Sending…"
                            : `Pay KES ${rider.approvedTotal.toFixed(0)} via M-Pesa`}
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedRider(isExpanded ? null : rider.driverId)}
                        className="flex items-center gap-1 ml-auto px-3 py-2 border rounded-lg text-sm text-gray-500 hover:bg-gray-50"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {isExpanded ? "Hide" : "Details"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded earnings rows */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="px-4 py-2 text-left text-xs text-gray-500 font-medium">Order</th>
                            <th className="px-4 py-2 text-right text-xs text-gray-500 font-medium">Fee</th>
                            <th className="px-4 py-2 text-right text-xs text-gray-500 font-medium">Commission</th>
                            <th className="px-4 py-2 text-right text-xs text-gray-500 font-medium">Payout</th>
                            <th className="px-4 py-2 text-center text-xs text-gray-500 font-medium">Status</th>
                            <th className="px-4 py-2 text-right text-xs text-gray-500 font-medium">Date</th>
                            <th className="px-4 py-2 text-center text-xs text-gray-500 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {rider.earnings.map((e) => (
                            <tr key={e.id} className="bg-white hover:bg-gray-50">
                              <td className="px-4 py-2.5 font-medium text-gray-800">
                                #{e.orderId.slice(-8).toUpperCase()}
                              </td>
                              <td className="px-4 py-2.5 text-right text-gray-600">
                                KES {parseFloat(e.deliveryFee).toFixed(0)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-gray-400">
                                KES {parseFloat(e.platformCommission).toFixed(0)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                                KES {parseFloat(e.driverPayout).toFixed(0)}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_COLOR[e.status] ?? "bg-gray-100 text-gray-600"}`}>
                                  {e.status}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right text-gray-400 text-xs">
                                {new Date(e.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <div className="flex gap-1 justify-center">
                                  {e.status === "PENDING" && (
                                    <button
                                      onClick={() => patchOne(e.id, "approve")}
                                      disabled={!!actionLoading}
                                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500 disabled:opacity-50"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  <button
                                    onClick={() => patchOne(e.id, "decline")}
                                    disabled={!!actionLoading}
                                    className="px-2 py-1 border border-red-300 text-red-600 rounded text-xs hover:bg-red-50 disabled:opacity-50"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )

      ) : (

        // ── History Table ────────────────────────────────────────────────
        history.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl text-gray-500">No payment history yet</div>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Rider ID</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Order</th>
                  <th className="px-4 py-3 text-right text-gray-500 font-medium">Payout</th>
                  <th className="px-4 py-3 text-center text-gray-500 font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">M-Pesa Ref</th>
                  <th className="px-4 py-3 text-right text-gray-500 font-medium">Paid At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                      …{e.driverId.slice(-8)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      #{e.orderId.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      KES {parseFloat(e.driverPayout).toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_COLOR[e.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {e.mpesaReceiptNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs">
                      {e.paidAt ? new Date(e.paidAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
