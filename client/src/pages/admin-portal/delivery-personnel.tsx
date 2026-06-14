import { useState, useEffect } from "react";

type Rider = {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  mpesaNumber?: string;
  isOnline: boolean;
  riderStatus?: string;
  isSuspended: boolean;
  createdAt: string;
};

export default function DeliveryPersonnel() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRiders = () => {
    setLoading(true);
    fetch("/api/delivery/personnel", { headers: { "x-admin-auth": "true" } })
      .then((r) => r.json())
      .then(setRiders)
      .finally(() => setLoading(false));
  };

  useEffect(fetchRiders, []);

  const toggleStatus = async (rider: Rider) => {
    const newStatus = rider.riderStatus === "active" ? "suspended" : "active";
    setActionLoading(rider.id);
    try {
      await fetch(`/api/users/${rider.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-auth": "true" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchRiders();
    } finally {
      setActionLoading(null);
    }
  };

  const name = (r: Rider) => r.fullName || `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || r.email;

  const filtered = riders.filter((r) => {
    const q = search.toLowerCase();
    return !q || name(r).toLowerCase().includes(q) || r.phone.includes(q) || (r.email ?? "").includes(q);
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Personnel</h1>
          <p className="text-gray-500 mt-1">Manage your rider fleet</p>
        </div>
        <a href="/admin-portal/dashboard/verify-riders"
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors">
          Review Applications
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Riders", value: riders.length, color: "text-gray-900" },
          { label: "Online Now", value: riders.filter((r) => r.isOnline).length, color: "text-green-600" },
          { label: "Suspended", value: riders.filter((r) => r.isSuspended || r.riderStatus === "suspended").length, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-gray-500 text-sm">{label}</p>
            <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone or email..."
          className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-orange-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rider) => (
            <div key={rider.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-10 rounded-full ${rider.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                <div>
                  <p className="font-semibold text-gray-900">{name(rider)}</p>
                  <p className="text-sm text-gray-500">{rider.phone} · M-Pesa: {rider.mpesaNumber || "—"}</p>
                  <p className="text-xs text-gray-400">{rider.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${rider.isOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {rider.isOnline ? "Online" : "Offline"}
                </span>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${rider.riderStatus === "active" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                  {rider.riderStatus ?? "unknown"}
                </span>
                <button
                  onClick={() => toggleStatus(rider)}
                  disabled={actionLoading === rider.id}
                  className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${rider.riderStatus === "active" ? "border border-red-300 text-red-600 hover:bg-red-50" : "bg-green-600 text-white hover:bg-green-500"}`}
                >
                  {actionLoading === rider.id ? "..." : rider.riderStatus === "active" ? "Suspend" : "Reactivate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
