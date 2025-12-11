
import React, { useEffect, useMemo, useState } from "react";
import { loadOrDefault, save } from "../utils/storage";
import { SEED_COMMISSIONS, SEED_LEADS } from "../constants";
import type { Commission, PlanId } from "../types";
import { DollarSign, Wallet, CalendarClock, CheckCircle2, Download, Clock, BadgeCheck, X } from "lucide-react";
import { notifyCommissionApproved, notify } from "../services/notifications";
import { getActiveCompanyId } from "../services/companyStore";

const COMMISSIONS_KEY = "primus_commissions";

interface CommissionLogProps {
  onRequestUpgrade: (plan: PlanId) => void;
}

export const CommissionLog: React.FC<CommissionLogProps> = ({ onRequestUpgrade }) => {
  const [commissions, setCommissions] = useState<Commission[]>(() =>
    loadOrDefault<Commission[]>(COMMISSIONS_KEY, SEED_COMMISSIONS)
  );

  const [leads] = useState(SEED_LEADS);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [payoutMethod, setPayoutMethod] = useState("ACH Transfer");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    save(COMMISSIONS_KEY, commissions);
  }, [commissions]);

  const totals = useMemo(() => {
    const pending = commissions
      .filter((c) => c.status === "PENDING")
      .reduce((sum, c) => sum + c.amountUsd, 0);
    const paid = commissions
      .filter((c) => c.status === "PAID")
      .reduce((sum, c) => sum + c.amountUsd, 0);
    return { pending, paid, total: pending + paid };
  }, [commissions]);

  // Summary metrics
  const pendingCount = commissions.filter((c) => c.status === "PENDING").length;
  const approvedCount = commissions.filter((c) => c.status === "APPROVED").length;
  const paidThisMonth = commissions.filter((c) => {
    const paidAt = (c as any).paidAt;
    if (!paidAt) return false;
    return new Date(paidAt).getMonth() === new Date().getMonth() &&
           new Date(paidAt).getFullYear() === new Date().getFullYear();
  }).length;

  // Open payment modal
  const openPaymentModal = (commission: Commission) => {
    setSelectedCommission(commission);
    setPayoutMethod("ACH Transfer");
    setPaidDate(new Date().toISOString().slice(0, 10));
    setPaymentModalOpen(true);
  };

  // Mark commission as paid with payout details
  const markCommissionPaid = () => {
    if (!selectedCommission) return;

    const updated = commissions.map((c) =>
      c.id === selectedCommission.id
        ? {
            ...c,
            status: "PAID" as const,
            payoutMethod,
            paidAt: paidDate,
          }
        : c
    );

    setCommissions(updated);
    
    // Send payment notification
    notifyCommissionApproved(
      getActiveCompanyId(),
      selectedCommission.amountUsd,
      leadName(selectedCommission.leadId)
    );
    
    setPaymentModalOpen(false);
    setSelectedCommission(null);
  };

  // Legacy simple mark paid (keep for backward compatibility)
  const markPaid = (id: string) => {
    const commission = commissions.find(c => c.id === id);
    setCommissions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "PAID" } : c))
    );
    
    // Send notification for legacy payment
    if (commission) {
      notifyCommissionApproved(
        getActiveCompanyId(),
        commission.amountUsd,
        leadName(commission.leadId)
      );
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ["Lead", "Milestone", "Amount", "Status", "PaidAt", "PayoutMethod", "ExpectedPayDate"];
    const rows = commissions.map((c) => [
      leadName(c.leadId),
      c.milestone,
      c.amountUsd.toString(),
      c.status,
      (c as any).paidAt || "",
      (c as any).payoutMethod || "",
      c.expectedPayDate || ""
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `commissions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const leadName = (leadId: string) =>
    leads.find((l) => l.id === leadId)?.name ?? leadId;

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "PAID") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          <CheckCircle2 size={10} /> Paid
        </span>
      );
    }
    if (status === "APPROVED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border uppercase tracking-wider bg-blue-500/10 text-blue-400 border-blue-500/20">
          <BadgeCheck size={10} /> Approved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
        <Clock size={10} /> Pending
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-100 flex items-center gap-3">
             <DollarSign className="text-emerald-500" />
             Commission Log
          </h2>
          <p className="text-slate-400 mt-1">Track your earnings and payout schedules.</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Payout Pipeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-yellow-500" />
            <p className="text-slate-400 text-sm">Pending</p>
          </div>
          <p className="text-yellow-300 text-2xl font-mono font-bold">{pendingCount}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <BadgeCheck size={14} className="text-blue-500" />
            <p className="text-slate-400 text-sm">Approved</p>
          </div>
          <p className="text-blue-300 text-2xl font-mono font-bold">{approvedCount}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <p className="text-slate-400 text-sm">Paid This Month</p>
          </div>
          <p className="text-emerald-300 text-2xl font-mono font-bold">{paidThisMonth}</p>
        </div>
      </div>

      {/* Totals Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="glass-panel p-4 flex items-center gap-4 border border-slate-800">
             <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-500">
                 <CalendarClock size={24} />
             </div>
             <div>
                 <p className="text-xs text-slate-500 uppercase font-bold">Pending Payouts</p>
                 <p className="text-2xl font-mono font-bold text-slate-200">${totals.pending.toLocaleString()}</p>
             </div>
         </div>
         <div className="glass-panel p-4 flex items-center gap-4 border border-slate-800">
             <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
                 <Wallet size={24} />
             </div>
             <div>
                 <p className="text-xs text-slate-500 uppercase font-bold">Total Paid</p>
                 <p className="text-2xl font-mono font-bold text-slate-200">${totals.paid.toLocaleString()}</p>
             </div>
         </div>
         <div className="glass-panel p-4 flex items-center gap-4 border border-slate-800">
             <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                 <DollarSign size={24} />
             </div>
             <div>
                 <p className="text-xs text-slate-500 uppercase font-bold">Lifetime Earnings</p>
                 <p className="text-2xl font-mono font-bold text-slate-200">${totals.total.toLocaleString()}</p>
             </div>
         </div>
      </div>

      <div className="glass-panel border border-slate-800 rounded-xl overflow-hidden">
        {commissions.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            No commissions yet. Advance projects to PTO to unlock payouts.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-slate-400 font-medium uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Lead / Deal</th>
                  <th className="px-6 py-4">Milestone</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Expected Pay</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">
                        {leadName(c.leadId)}
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{c.leadId}</div>
                    </td>
                    <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
                            {c.milestone.replace('_', ' ')}
                        </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-400">
                        ${c.amountUsd.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                        <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4">
                        {(c as any).paidAt ? (
                          <div>
                            <div className="text-emerald-400 font-mono text-xs">{(c as any).paidAt}</div>
                            {(c as any).payoutMethod && (
                              <div className="text-slate-500 text-[10px] mt-0.5">{(c as any).payoutMethod}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">{c.expectedPayDate ?? "—"}</span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {c.status !== "PAID" && (
                        <button
                          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-transparent hover:border-emerald-500/30"
                          onClick={() => openPaymentModal(c)}
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && selectedCommission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-[400px] shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-white font-display font-bold flex items-center gap-2">
                <Wallet size={20} className="text-emerald-500" />
                Record Payout
              </h2>
              <button 
                onClick={() => setPaymentModalOpen(false)}
                title="Close modal"
                aria-label="Close modal"
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 mb-4 border border-slate-700">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Commission</p>
              <p className="text-lg font-bold text-emerald-400 font-mono">${selectedCommission.amountUsd.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">{leadName(selectedCommission.leadId)} • {selectedCommission.milestone}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs uppercase tracking-wider font-bold mb-1.5">
                  Payout Method
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  title="Payout method"
                  aria-label="Payout method"
                >
                  <option>ACH Transfer</option>
                  <option>Check</option>
                  <option>Cash App</option>
                  <option>PayPal</option>
                  <option>Stripe Payout</option>
                  <option>Wire Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs uppercase tracking-wider font-bold mb-1.5">
                  Paid Date
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  title="Paid date"
                  aria-label="Paid date"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={markCommissionPaid}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-emerald-500/20"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
