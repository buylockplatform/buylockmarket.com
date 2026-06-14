import { useState, useEffect } from "react";

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

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
};

export default function RiderEarnings() {
  const [tab, setTab] = useState<"due" | "history">("due");
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchEarnings = (statuses: string[]) => {
    setLoading(true);
    const params = statuses.map((s) => `status=${s}`).join("&");
    fetch(`/api/rider-earnings?${params}`, { headers: { "x-admin-auth": "true" } })
      .then((r) => r.json())
      .then((data) => setEarnings(Array.isArray(data) ? data : []))
      .catch(() => setEarnings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === "due") fetchEarnings(["PENDING", "APPROVED"]);
    else fetchEarnings(["PAID", "DECLINED"]);
    setSelected(new Set());
  }, [tab]);

  const doAction = async (path: string, body: any) => {
    setActionLoading(path);
    try {
      await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-auth": "true" },
        body: JSON.stringify(body),
      });
      fetchEarnings(tab === "due" ? ["PENDING", "APPROVED"] : ["PAID", "DECLINED"]);
    } finally {
      setActionLoading(null);
    }
  };

  const patchOne = async (id: string, action: string) => {
    setActionLoading(id + action);
    try {
      await fetch(`/api/rider-earnings/${id}/${action}`, {
        method: action === "pay-now" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-auth": "true" },
        body: "{}",
      });
      fetchEarnings(tab === "due" ? ["PENDING", "APPROVED"] : ["PAID", "DECLINED"]);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const selectedArr = Array.from(selected);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rider Earnings</h1>
        <p className="text-gray-500 mt-1">Manage rider payout approvals and disbursements</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(["due", "history"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "due" ? "Due (Pending/Approved)" : "History"}
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex gap-3 mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
          <span className="text-sm text-orange-700 font-medium">{selected.size} selected</span>
          <button onClick={() => doAction("/api/rider-earnings/bulk-approve", { ids: selectedArr })}
            disabled={!!actionLoading}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50">
            Approve All
          </button>
          <button onClick={() => doAction("/api/rider-earnings/bulk-mark-paid", { ids: selectedArr })}
            disabled={!!actionLoading}
            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500 disabled:opacity-50">
            Mark Paid
          </button>
          <button onClick={() => doAction("/api/rider-earnings/bulk-decline", { ids: selectedArr })}
            disabled={!!actionLoading}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-500 disabled:opacity-50">
            Decline All
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : earnings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl text-gray-500">No earnings records</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-left"><input type="checkbox" onChange={(e) => setSelected(e.target.checked ? new Set(earnings.map((e) => e.id)) : new Set())} /></th>
                <th className="pb-3 text-left text-gray-500 font-medium">Order</th>
                <th className="pb-3 text-right text-gray-500 font-medium">Fee</th>
                <th className="pb-3 text-right text-gray-500 font-medium">Commission</th>
                <th className="pb-3 text-right text-gray-500 font-medium">Payout</th>
                <th className="pb-3 text-center text-gray-500 font-medium">Status</th>
                <th className="pb-3 text-right text-gray-500 font-medium">Date</th>
                {tab === "due" && <th className="pb-3 text-center text-gray-500 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {earnings.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="py-3 pr-3"><input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} /></td>
                  <td className="py-3 text-gray-900 font-medium">{e.orderId.slice(-8).toUpperCase()}</td>
                  <td className="py-3 text-right text-gray-700">KES {parseFloat(e.deliveryFee).toFixed(0)}</td>
                  <td className="py-3 text-right text-gray-500">KES {parseFloat(e.platformCommission).toFixed(0)}</td>
                  <td className="py-3 text-right text-gray-900 font-semibold">KES {parseFloat(e.driverPayout).toFixed(0)}</td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLOR[e.status] ?? "bg-gray-100 text-gray-600"}`}>{e.status}</span>
                  </td>
                  <td className="py-3 text-right text-gray-400">{new Date(e.createdAt).toLocaleDateString()}</td>
                  {tab === "due" && (
                    <td className="py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        {e.status === "PENDING" && (
                          <button onClick={() => patchOne(e.id, "approve")} disabled={!!actionLoading}
                            className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-500 disabled:opacity-50">
                            Approve
                          </button>
                        )}
                        {e.status === "APPROVED" && (
                          <>
                            <button onClick={() => patchOne(e.id, "mark-paid")} disabled={!!actionLoading}
                              className="px-2 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-500 disabled:opacity-50">
                              Mark Paid
                            </button>
                            <button onClick={() => patchOne(e.id, "pay-now")} disabled={!!actionLoading}
                              className="px-2 py-1 bg-orange-500 text-white rounded-lg text-xs hover:bg-orange-400 disabled:opacity-50">
                              M-Pesa
                            </button>
                          </>
                        )}
                        <button onClick={() => patchOne(e.id, "decline")} disabled={!!actionLoading}
                          className="px-2 py-1 border border-red-300 text-red-600 rounded-lg text-xs hover:bg-red-50 disabled:opacity-50">
                          Decline
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
