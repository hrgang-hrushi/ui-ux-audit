import React from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface MetricCardProps {
  title: string;
  score: number;
  icon: LucideIcon;
  issuesCount: number;
  recommendationsCount: number;
  onClick: () => void;
  isActive: boolean;
}

export default function MetricCard({
  title,
  score,
  icon: Icon,
  issuesCount,
  recommendationsCount,
  onClick,
  isActive,
}: MetricCardProps) {
  // Determine score color accent
  let scoreColorClass = "text-white";
  let bgBarClass = "bg-white";
  if (score >= 80) {
    scoreColorClass = "text-emerald-400";
    bgBarClass = "bg-emerald-500";
  } else if (score >= 50) {
    scoreColorClass = "text-amber-400";
    bgBarClass = "bg-amber-500";
  } else {
    scoreColorClass = "text-red-400";
    bgBarClass = "bg-red-500";
  }

  return (
    <button
      onClick={onClick}
      id={`metric-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className={`w-full text-left p-5 border transition-all duration-300 rounded-xl focus:outline-hidden ${
        isActive
          ? "bg-black border-white shadow-xl"
          : "bg-[#141416] hover:bg-black/40 border-[#2A2A2D]"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-black rounded-md border border-[#2A2A2D]">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="text-right">
          <span className={`font-display font-semibold text-2xl ${scoreColorClass}`}>
            {score}
          </span>
          <span className="text-[#6B6B6F] text-xs font-mono ml-0.5">/100</span>
        </div>
      </div>

      <h3 className="font-sans font-semibold text-sm text-white mb-1">
        {title}
      </h3>

      <div className="h-1.5 w-full bg-black border border-[#2A2A2D] rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${bgBarClass} rounded-full`}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-[11px] font-mono text-[#6B6B6F]">
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${issuesCount > 0 ? "bg-amber-400" : "bg-green-400"}`}></span>
          {issuesCount} {issuesCount === 1 ? "issue" : "issues"}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          {recommendationsCount} {recommendationsCount === 1 ? "suggestion" : "suggestions"}
        </span>
      </div>
    </button>
  );
}
