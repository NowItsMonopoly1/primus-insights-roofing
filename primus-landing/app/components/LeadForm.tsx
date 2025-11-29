"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Terminal } from "lucide-react";

type FormState = "idle" | "submitting" | "success" | "error";

interface LeadResponse {
  status: string;
  leadId: number;
}

export default function LeadForm() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [leadId, setLeadId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("submitting");
    setErrorMessage("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.primushomepro.com";
      const response = await fetch(
        `${API_URL}/lead`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: LeadResponse = await response.json();

      if (data.status === "ok") {
        setLeadId(data.leadId);
        setFormState("success");
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Lead submission error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Network error. Please try again."
      );
      setFormState("error");
    }
  };

  const handleReset = () => {
    setFormState("idle");
    setLeadId(null);
    setErrorMessage("");
    setFormData({ name: "", phone: "", message: "" });
  };

  if (formState === "success") {
    return (
      <div className="border border-emerald-500/40 bg-slate-900/60 rounded-xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-emerald-400 mb-2">
              Lead Captured
            </h3>
            <div className="font-mono text-sm space-y-1">
              <p className="text-slate-300">
                <span className="text-slate-500">LEAD_ID:</span> {leadId !== null ? `#${String(leadId).padStart(4, '0')}` : 'N/A'}
              </p>
              <p className="text-slate-300">
                <span className="text-slate-500">STATUS:</span> SMS_DISPATCHING
              </p>
              <p className="text-slate-300">
                <span className="text-slate-500">PHONE:</span> {formData.phone}
              </p>
            </div>
            <div className="mt-4 p-3 bg-slate-950/50 border border-slate-800 rounded-md">
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span>AI agent assigned. Homeowner will receive SMS within 10 seconds.</span>
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors text-sm font-medium border border-slate-700"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-100 mb-2">
          Request Roof Inspection
        </h3>
        <p className="text-sm text-slate-400 uppercase tracking-wide font-mono">
          AUTOMATED LEAD CAPTURE
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            required
            disabled={formState === "submitting"}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            placeholder="John Smith"
            suppressHydrationWarning
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            required
            disabled={formState === "submitting"}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            placeholder="+1 (555) 123-4567"
            suppressHydrationWarning
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Roofing Issue
          </label>
          <textarea
            id="message"
            required
            rows={3}
            disabled={formState === "submitting"}
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all resize-none"
            placeholder="I need a roof inspection after storm damage..."
            suppressHydrationWarning
          />
        </div>

        {formState === "error" && (
          <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-md">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={formState === "submitting"}
          className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-slate-950 disabled:text-slate-500 rounded-md transition-all font-semibold flex items-center justify-center gap-2 disabled:cursor-not-allowed"
        >
          {formState === "submitting" ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            "Request roof inspection"
          )}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 font-mono">
          SYSTEM STATUS: <span className="text-emerald-400">OPERATIONAL</span>
        </p>
      </div>
    </div>
  );
}
