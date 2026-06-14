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

const REJECTION_REASONS = {
  "NATIONAL ID ISSUES": [
    "ID photos are blurry",
    "ID Number mismatch",
    "ID Expired",
    "Name mismatch",
  ],
  "LICENSE ISSUES": [
    "License photos blurry",
    "License Expired",
    "Invalid License Class",
  ],
  "INSURANCE ISSUES": [
    "Insurance photo blurry",
    "Insurance Expired",
    "Vehicle match issue",
  ],
  "CERTIFICATE OF GOOD CONDUCT ISSUES": [
    "Certificate photo blurry",
    "Certificate Expired",
    "Not a valid certificate",
    "Major offences listed",
  ],
};

export default function VerifyRiders() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<Application | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  const fetch_ = () => {
    setLoading(true);
    fetch("/api/admin/rider-applications", { headers: { "x-admin-auth": "true" } })
      .then((r) => r.json())
      .then(setApplications)
      .finally(() => setLoading(false));
  };

  useEffect(fetch_, []);

  const openReview = (app: Application) => {
    setReviewing(app);
    setSelectedReasons([]);
    setNotes("");
    setConfirmReject(false);
  };

  const closeReview = () => {
    setReviewing(null);
    setSelectedReasons([]);
    setNotes("");
    setConfirmReject(false);
  };

  const toggleReason = (r: string) =>
    setSelectedReasons((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );

  const handleApprove = async () => {
    if (!reviewing) return;
    setSubmitting(true);
    try {
      await fetch(`/api/admin/rider-applications/${reviewing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-auth": "true" },
        body: JSON.stringify({ action: "approve" }),
      });
      closeReview();
      fetch_();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reviewing) return;
    setSubmitting(true);
    try {
      await fetch(`/api/admin/rider-applications/${reviewing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-auth": "true" },
        body: JSON.stringify({ action: "reject", reasons: selectedReasons, notes }),
      });
      closeReview();
      fetch_();
    } finally {
      setSubmitting(false);
    }
  };

  const name = (a: Application) =>
    a.fullName || `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || a.email;

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
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Pending</span>
                <button
                  onClick={() => openReview(app)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewing && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl my-4 shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Review Application</h2>
                <p className="text-gray-500 text-sm">Verify documents for {name(reviewing)}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">ID Number</p>
                  <p className="font-bold text-gray-900">{reviewing.idNumber}</p>
                </div>
                <button onClick={closeReview} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">✕</button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 gap-8">
              {/* Left column */}
              <div className="space-y-6">
                {/* National ID */}
                <div>
                  <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <span className="w-1 h-4 bg-orange-500 rounded-full inline-block" /> National ID Card
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ label: "Front", url: reviewing.idFrontUrl }, { label: "Back", url: reviewing.idBackUrl }].map(({ label, url }) => (
                      <div key={label}>
                        <p className="text-xs text-gray-400 uppercase mb-1">{label}</p>
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={`ID ${label}`} className="w-full h-28 object-cover rounded-xl border hover:opacity-90 transition-opacity cursor-zoom-in" />
                          </a>
                        ) : (
                          <div className="w-full h-28 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xs">Not provided</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Driving License */}
                <div>
                  <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <span className="w-1 h-4 bg-orange-500 rounded-full inline-block" /> Driving License
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ label: "Front", url: reviewing.licenseFrontUrl }, { label: "Back", url: reviewing.licenseBackUrl }].map(({ label, url }) => (
                      <div key={label}>
                        <p className="text-xs text-gray-400 uppercase mb-1">{label}</p>
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={`License ${label}`} className="w-full h-28 object-cover rounded-xl border hover:opacity-90 transition-opacity cursor-zoom-in" />
                          </a>
                        ) : (
                          <div className="w-full h-28 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xs">Not provided</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rejection reasons */}
                <div>
                  <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    ⚠ Rejection Reasons
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(REJECTION_REASONS).map(([category, reasons]) => (
                      <div key={category}>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{category}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {reasons.map((r) => (
                            <label key={r} className="flex items-center gap-2 cursor-pointer group">
                              <div
                                onClick={() => toggleReason(r)}
                                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors cursor-pointer ${
                                  selectedReasons.includes(r)
                                    ? "border-orange-500 bg-orange-500"
                                    : "border-gray-300 group-hover:border-orange-300"
                                }`}
                              >
                                {selectedReasons.includes(r) && (
                                  <svg className="w-full h-full text-white p-0.5" viewBox="0 0 12 12" fill="currentColor">
                                    <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm text-gray-700">{r}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                {/* Good Conduct */}
                <div>
                  <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <span className="w-1 h-4 bg-orange-500 rounded-full inline-block" /> Certificate of Good Conduct
                  </h3>
                  {reviewing.goodConductUrl ? (
                    <a href={reviewing.goodConductUrl} target="_blank" rel="noopener noreferrer">
                      <img src={reviewing.goodConductUrl} alt="Good Conduct" className="w-full h-52 object-cover rounded-xl border hover:opacity-90 transition-opacity cursor-zoom-in" />
                    </a>
                  ) : (
                    <div className="w-full h-52 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-sm">Not provided</div>
                  )}
                </div>

                {/* Motor Insurance */}
                <div>
                  <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <span className="w-1 h-4 bg-orange-500 rounded-full inline-block" /> Motor Insurance
                  </h3>
                  {reviewing.insuranceUrl ? (
                    <a href={reviewing.insuranceUrl} target="_blank" rel="noopener noreferrer">
                      <img src={reviewing.insuranceUrl} alt="Insurance" className="w-full h-52 object-cover rounded-xl border hover:opacity-90 transition-opacity cursor-zoom-in" />
                    </a>
                  ) : (
                    <div className="w-full h-52 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-sm">Not provided</div>
                  )}
                </div>

                {/* Additional Notes */}
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Additional Notes</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-none"
                    placeholder="Add any specific comments or instructions here..."
                  />
                </div>

                <p className="text-xs text-blue-500 flex items-center gap-1">
                  🛡 Applicant will be notified automatically via SMS of your decision.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t">
              {confirmReject ? (
                <div className="space-y-3">
                  <p className="text-sm text-red-600 font-medium">
                    {selectedReasons.length === 0
                      ? "⚠ No reasons selected. The rider will receive a generic rejection SMS."
                      : `Rejecting with ${selectedReasons.length} reason(s). The rider's account will be deleted and they'll be notified via SMS.`}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmReject(false)}
                      disabled={submitting}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={submitting}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                    >
                      {submitting ? "Rejecting..." : "⊗ Confirm Reject & Send SMS"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmReject(true)}
                    disabled={submitting}
                    className="flex-1 py-3 border-2 border-red-400 text-red-600 hover:bg-red-50 rounded-xl font-semibold text-sm transition-colors"
                  >
                    ⊗ Reject Applicant
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Approving..." : "⊙ Approve Rider"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
