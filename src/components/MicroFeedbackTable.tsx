import React from "react";
import { ArrowRight, Code, Sparkles } from "lucide-react";

interface MicroFeedbackProps {
  key?: React.Key;
  element: string;
  finding: string;
  beforeCode: string;
  afterCode: string;
  rationale: string;
}

export default function MicroFeedbackTable({
  element,
  finding,
  beforeCode,
  afterCode,
  rationale,
}: MicroFeedbackProps) {
  return (
    <div className="border border-[#2A2A2D] bg-[#141416] rounded-xl overflow-hidden transition-all duration-300 hover:border-[#3E3E42]">
      {/* Header */}
      <div className="px-5 py-3.5 bg-black border-b border-[#2A2A2D] flex flex-wrap items-center justify-between gap-2">
        <span className="font-sans font-semibold text-xs md:text-sm text-white tracking-wide uppercase">
          {element}
        </span>
        <div className="flex items-center gap-1.5 text-[#6B6B6F] text-xs font-mono">
          <Code className="h-3.5 w-3.5" />
          <span>Style Polish Refinement</span>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4">
          <h5 className="font-sans font-semibold text-white text-sm mb-1">
            Finding & Aesthetic Issue
          </h5>
          <p className="text-[#6B6B6F] text-sm leading-relaxed">
            {finding}
          </p>
        </div>

        {/* Code comparison block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Before Code */}
          <div className="flex flex-col">
            <div className="text-[11px] font-mono font-medium text-red-400 bg-red-950/20 px-2.5 py-1 border-t border-x border-red-900/30 rounded-t-xl">
              Before / AI-Style
            </div>
            <div className="p-3 bg-red-950/5 border border-red-900/30 rounded-b-xl font-mono text-xs text-red-300/90 overflow-x-auto min-h-[4.5rem] flex items-center">
              <span className="line-through decoration-red-500/50 break-all whitespace-pre-wrap">
                {beforeCode || "None or Implicit"}
              </span>
            </div>
          </div>

          {/* After Code */}
          <div className="flex flex-col">
            <div className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-950/20 px-2.5 py-1 border-t border-x border-emerald-900/30 rounded-t-xl flex items-center justify-between">
              <span>After / Professional Polish</span>
              <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" />
            </div>
            <div className="p-3 bg-emerald-950/5 border border-emerald-900/30 rounded-b-xl font-mono text-xs text-emerald-300 overflow-x-auto min-h-[4.5rem] flex items-center">
              <span className="font-semibold break-all whitespace-pre-wrap text-emerald-300">
                {afterCode}
              </span>
            </div>
          </div>
        </div>

        {/* Rationale */}
        <div className="flex items-start gap-2.5 p-3.5 bg-black rounded-xl border border-[#2A2A2D]">
          <ArrowRight className="h-4 w-4 text-[#6B6B6F] shrink-0 mt-0.5" />
          <div>
            <span className="font-mono text-[11px] font-semibold text-[#6B6B6F] block mb-0.5 uppercase tracking-wider">
              Aesthetic Impact
            </span>
            <p className="text-[#E0E0E0] text-xs md:text-sm leading-relaxed">
              {rationale}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
