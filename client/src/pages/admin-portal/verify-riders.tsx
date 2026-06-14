import { useState, useEffect } from "react";

type Application = {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  idNumber: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  licenseFrontUrl?: string;
  licenseBackUrl?: string;
  insuranceUrl?: string;
  goodConductUrl?: string;
  createdAt: string;
};

export default function VerifyRiders() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<Application | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetch_ = () => {
    setLoading(true);
    fetch("/api/admin/rider-applications", { headers: { "x-admin-auth": "true" } })
      .then((r) => r.json())
      .then(setApplications)
      .finally(() => setLoading(false));
  };

  useEffect(fetch_, []);

  const handleAction = async () => {
    if (!reviewing || !action) return;
    setSubmitting(true);
    try {
      await fetch(`/api/admin/rider-applications/${reviewing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-auth": "true" },
        body: JSON.stringify({ action, reason }),
      });
      setReviewing(null);
      setAction(null);
      setReason("");
      fetch_();
    } finally {
      setSubmitting(false);
    }
  };

  const name = (a: Application) => a.fullName || `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || a.email;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Verify Riders</h1>
        <p className="text-gray-500 mt-1">Review and approve or reject rider applications</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-500">No pending applications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="font-semibold text-gray-900">{name(app)}</p>
                <p className="text-sm text-gray-500">{app.email} · {app.phone}</p>
                <p className="text-xs text-gray-400">ID: {app.idNumber} · Applied {new Date(app.createdAt).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => setReviewing(app)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Review
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-4">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{name(reviewing)}</h2>
                  <p className="text-gray-500 text-sm">{reviewing.email} · {reviewing.phone}</p>
                  <p className="text-gray-400 text-sm">National ID: {reviewing.idNumber}</p>
                </div>
                <button onClick={() => setReviewing(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Document previews */}
              {[
                { label: "National ID — Front", url: reviewing.idFrontUrl },
                { label: "National ID — Back", url: reviewing.idBackUrl },
                { label: "Driving License — Front", url: reviewing.licenseFrontUrl },
                { label: "Driving License — Back", url: reviewing.licenseBackUrl },
                { label: "Motor Insurance", url: reviewing.insuranceUrl },
                { label: "Certificate of Good Conduct", url: reviewing.goodConductUrl },
              ].filter((d) => d.url).map(({ label, url }) => (
                <div key={label}>
                  <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={label} className="max-h-40 rounded-xl border object-contain bg-gray-50 hover:opacity-90 transition-opacity" />
                  </a>
                </div>
              ))}

              {/* Rejection reason */}
              {action === "reject" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                    placeholder="Explain why the application is being rejected..."
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => { setAction("reject"); }}
                disabled={submitting}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${action === "reject" ? "bg-red-600 text-white" : "border border-red-300 text-red-600 hover:bg-red-50"}`}
              >
                {action === "reject" ? (
                  <span onClick={handleAction} className="cursor-pointer">{submitting ? "Rejecting..." : "Confirm Reject"}</span>
                ) : "Reject Applicant"}
              </button>
              <button
                onClick={() => { setAction("approve"); handleAction(); }}
                disabled={submitting}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {submitting && action === "approve" ? "Approving..." : "✓ Approve Rider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
