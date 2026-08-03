import React from "react";
import { AlertCircle, ArrowRight, ShieldAlert, Zap } from "lucide-react";

interface SlopAlertProps {
  key?: React.Key;
  issue: string;
  severity: string;
  description: string;
  fix: string;
}

export default function SlopAlertItem({ issue, severity, description, fix }: SlopAlertProps) {
  const isHigh = severity.toLowerCase() === "high";
  const isMed = severity.toLowerCase() === "medium";

  return (
    <div className="p-5 border border-[#2A2A2D] bg-[#141416] rounded-xl transition-all duration-300 hover:border-[#3E3E42]">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          {isHigh ? (
            <ShieldAlert className="h-4.5 w-4.5 text-red-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4.5 w-4.5 text-amber-400 shrink-0" />
          )}
          <h4 className="font-sans font-semibold text-white text-sm md:text-base">
            {issue}
          </h4>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase border ${
            isHigh
              ? "bg-red-950/20 text-red-400 border-red-900/50"
              : isMed
              ? "bg-amber-950/20 text-amber-400 border-amber-900/50"
              : "bg-black text-[#E0E0E0] border-[#2A2A2D]"
          }`}
        >
          {severity} Severity
        </span>
      </div>

      <p className="text-[#6B6B6F] text-sm leading-relaxed mb-4 pl-6.5">
        {description}
      </p>

      <div className="pl-6.5">
        <div className="p-3.5 bg-black border border-[#2A2A2D] rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#E0E0E0] mb-2">
            <Zap className="h-3.5 w-3.5 text-[#6B6B6F]" />
            <span>Refactoring Action Needed</span>
          </div>
          <div className="text-[#E0E0E0] text-xs font-mono leading-relaxed bg-[#141416]/50 p-2.5 rounded border border-[#2A2A2D] overflow-x-auto whitespace-pre-wrap">
            {fix}
          </div>
        </div>
      </div>
    </div>
  );
}
