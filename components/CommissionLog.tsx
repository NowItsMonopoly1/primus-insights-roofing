import React, { useEffect, useMemo, useState } from "react";
import { loadOrDefault, save } from "../utils/storage";
import { SEED_COMMISSIONS, SEED_LEADS } from "../constants";
import type { Commission } from "../types";
import { DollarSign, Wallet, CalendarClock, CheckCircle2 } from "lucide-react";

const COMMISSIONS_KEY = "primus_commissions";

export const CommissionLog = () => {
  const [commissions, setCommissions] = useState<Commission[]>(() =>
    loadOrDefault<Commission[]>(COMMISSIONS_KEY, SEED_COMMISSIONS)
  );

  const [leads] = useState(SEED_LEADS);

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

  const markPaid = (id: string) => {
    setCommissions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "PAID" } : c))
    );
  };

  const leadName = (leadId: string) =>
    leads.find((l) => l.id === leadId)?.name ?? leadId;

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in overflow-x-hidden w-full">
       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-100 flex items-center gap-3">
             <DollarSign className="text-emerald-500" />
             Commission Log
          </h2>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Track your earnings and payout schedules.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
         <div className="glass-panel p-3 md:p-4 flex items-center gap-3 md:gap-4 border border-slate-800">
             <div className="p-2 md:p-3 rounded-full bg-yellow-500/10 text-yellow-500">
                 <CalendarClock size={20} className="md:w-6 md:h-6" />
             </div>
             <div>
                 <p className="text-[10px] md:text-xs text-slate-500 uppercase font-bold">Pending</p>
                 <p className="text-lg md:text-2xl font-mono font-bold text-slate-200">${totals.pending.toLocaleString()}</p>
             </div>
         </div>
         <div className="glass-panel p-3 md:p-4 flex items-center gap-3 md:gap-4 border border-slate-800">
             <div className="p-2 md:p-3 rounded-full bg-emerald-500/10 text-emerald-500">
                 <Wallet size={20} className="md:w-6 md:h-6" />
             </div>
             <div>
                 <p className="text-[10px] md:text-xs text-slate-500 uppercase font-bold">Paid</p>
                 <p className="text-lg md:text-2xl font-mono font-bold text-slate-200">${totals.paid.toLocaleString()}</p>
             </div>
         </div>
         <div className="glass-panel p-3 md:p-4 flex items-center gap-3 md:gap-4 border border-slate-800">
             <div className="p-2 md:p-3 rounded-full bg-blue-500/10 text-blue-500">
                 <DollarSign size={20} className="md:w-6 md:h-6" />
             </div>
             <div>
                 <p className="text-[10px] md:text-xs text-slate-500 uppercase font-bold">Lifetime</p>
                 <p className="text-lg md:text-2xl font-mono font-bold text-slate-200">${totals.total.toLocaleString()}</p>
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
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border uppercase tracking-wider
                            ${c.status === 'PAID' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            }`}>
                            {c.status === 'PAID' && <CheckCircle2 size={10} />}
                            {c.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                        {c.expectedPayDate ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {c.status === "PENDING" && (
                        <button
                          className="secondary-btn text-xs inline-flex"
                          onClick={() => markPaid(c.id)}
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
    </div>
  );
};
