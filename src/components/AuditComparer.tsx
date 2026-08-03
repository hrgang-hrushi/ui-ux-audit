import React from "react";
import { SavedAudit } from "../types";
import { 
  ArrowLeftRight, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  BarChart2, 
  Baseline, 
  Scaling,
  Ruler, 
  LayoutGrid, 
  Palette, 
  Activity,
  FileCode,
  Globe
} from "lucide-react";

interface AuditComparerProps {
  auditA: SavedAudit | null;
  auditB: SavedAudit | null;
  onClose: () => void;
}

export default function AuditComparer({ auditA, auditB, onClose }: AuditComparerProps) {
  // If either is null, show selection instructions
  if (!auditA || !auditB) {
    return (
      <div className="border border-[#2A2A2D] bg-[#141416] p-8 rounded-xl text-center space-y-5 h-full min-h-[450px] flex flex-col items-center justify-center">
        <div className="p-4 bg-black rounded-full border border-[#2A2A2D] text-[#6B6B6F] animate-pulse">
          <ArrowLeftRight className="h-8 w-8 text-white" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="font-display font-semibold text-white text-base md:text-lg">
            Aesthetic Comparison Engine
          </h3>
          <p className="text-[#6B6B6F] text-xs md:text-sm leading-relaxed">
            Select exactly <strong className="text-white">two historical audits</strong> from the sidebar logs using the comparison checkboxes to see side-by-side score evolution, issue count reductions, and overall styling improvements.
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-white hover:bg-[#E0E0E0] text-black text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
        >
          Back to Single Audit
        </button>
      </div>
    );
  }

  // Sort them so we always compare chronologically: older vs newer
  const timeA = new Date(auditA.timestamp).getTime();
  const timeB = new Date(auditB.timestamp).getTime();
  
  const [older, newer] = timeA <= timeB ? [auditA, auditB] : [auditB, auditA];

  const dateOlderStr = new Date(older.timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateNewerStr = new Date(newer.timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Score Calculations
  const scoreOlder = older.data.overallScore;
  const scoreNewer = newer.data.overallScore;
  const scoreDiff = scoreNewer - scoreOlder;

  // Issues and Improvements Calculations
  const slopOlder = older.data.aiSlopAlerts?.length || 0;
  const slopNewer = newer.data.aiSlopAlerts?.length || 0;
  const slopDiff = slopNewer - slopOlder; // negative is good!

  const feedbackOlder = older.data.microFeedback?.length || 0;
  const feedbackNewer = newer.data.microFeedback?.length || 0;
  const feedbackDiff = feedbackNewer - feedbackOlder; // negative is good!

  // Category comparisons
  const categories = [
    { key: "typography", label: "Typography", icon: Baseline },
    { key: "typographyScale", label: "Typography Scale", icon: Scaling },
    { key: "spacing", label: "Spacing & Grids", icon: Ruler },
    { key: "hierarchy", label: "Visual Hierarchy", icon: LayoutGrid },
    { key: "colorHarmony", label: "Color Balance", icon: Palette },
    { key: "interactions", label: "Micro Interactions", icon: Activity },
  ] as const;

  // Audit issues tracking to find resolved vs new
  const olderIssuesSet = new Set(older.data.aiSlopAlerts?.map(a => a.issue) || []);
  const newerIssuesSet = new Set(newer.data.aiSlopAlerts?.map(a => a.issue) || []);

  const resolvedIssues = (older.data.aiSlopAlerts || []).filter(a => !newerIssuesSet.has(a.issue));
  const newIssues = (newer.data.aiSlopAlerts || []).filter(a => !olderIssuesSet.has(a.issue));

  const renderDeltaBadge = (diff: number, lowerIsBetter: boolean = false) => {
    if (diff === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#6B6B6F] bg-neutral-900 border border-[#2A2A2D] px-2 py-0.5 rounded-full">
          <Minus className="h-3 w-3" />
          <span>No Change</span>
        </span>
      );
    }

    const isPositiveChange = lowerIsBetter ? diff < 0 : diff > 0;
    const absDiff = Math.abs(diff);

    if (isPositiveChange) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/50 px-2 py-0.5 rounded-full">
          <TrendingUp className="h-3 w-3" />
          <span>+{absDiff} Progress</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-red-400 bg-red-950/20 border border-red-900/50 px-2 py-0.5 rounded-full">
          <TrendingDown className="h-3 w-3" />
          <span>{diff > 0 ? "+" : "-"}{absDiff} Regression</span>
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Compare Header */}
      <div className="border border-[#2A2A2D] bg-[#141416] p-5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white text-black rounded-lg">
            <ArrowLeftRight className="h-5 w-5 text-black" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider bg-black text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded-full uppercase">
              Chronological Comparison Mode
            </span>
            <h2 className="font-display font-bold text-xl md:text-2xl text-white tracking-tight mt-1">
              Aesthetic Quality Progress
            </h2>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-neutral-900 hover:bg-black border border-[#2A2A2D] text-[#6B6B6F] hover:text-white transition cursor-pointer"
          title="Exit comparison"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Hero Progress Metrics Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Score Evolution */}
        <div className="border border-[#2A2A2D] bg-[#141416] p-5 rounded-xl flex flex-col justify-between space-y-4">
          <span className="text-[10px] font-mono font-bold text-[#6B6B6F] uppercase tracking-wider">
            Overall Aesthetic Score
          </span>
          <div className="flex items-center gap-4 py-2">
            <div className="text-center">
              <p className="text-[10px] font-mono text-[#6B6B6F] mb-1">Older</p>
              <span className="text-2xl font-mono font-bold text-[#6B6B6F] bg-neutral-900 border border-[#2A2A2D] w-12 h-12 rounded-full inline-flex items-center justify-center">
                {scoreOlder}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-[#6B6B6F] shrink-0" />
            <div className="text-center">
              <p className="text-[10px] font-mono text-white mb-1 font-bold">Newer</p>
              <span className="text-2xl font-mono font-bold text-white bg-black border border-white w-12 h-12 rounded-full inline-flex items-center justify-center shadow-lg">
                {scoreNewer}
              </span>
            </div>
          </div>
          <div>
            {renderDeltaBadge(scoreDiff, false)}
          </div>
        </div>

        {/* AI Slop Clichés Counter */}
        <div className="border border-[#2A2A2D] bg-[#141416] p-5 rounded-xl flex flex-col justify-between space-y-4">
          <span className="text-[10px] font-mono font-bold text-[#6B6B6F] uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
            AI Slop Clichés Found
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-extrabold text-white">{slopNewer}</span>
            <span className="text-[#6B6B6F] text-xs font-mono">
              vs {slopOlder} originally
            </span>
          </div>
          <div>
            {renderDeltaBadge(slopDiff, true)}
          </div>
        </div>

        {/* Micro Polish Checklists */}
        <div className="border border-[#2A2A2D] bg-[#141416] p-5 rounded-xl flex flex-col justify-between space-y-4">
          <span className="text-[10px] font-mono font-bold text-[#6B6B6F] uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
            Micro Polish Targets
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-extrabold text-white">{feedbackNewer}</span>
            <span className="text-[#6B6B6F] text-xs font-mono">
              vs {feedbackOlder} originally
            </span>
          </div>
          <div>
            {renderDeltaBadge(feedbackDiff, true)}
          </div>
        </div>
      </div>

      {/* Side-by-Side Detailed Comparison Table */}
      <div className="border border-[#2A2A2D] bg-[#141416] rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-black border-b border-[#2A2A2D]">
          <h3 className="font-sans font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4" />
            Side-by-Side Specifications
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-mono">
            <thead>
              <tr className="bg-black/40 border-b border-[#2A2A2D] text-[#6B6B6F]">
                <th className="p-4 font-semibold uppercase tracking-wider">Metrics & Scope</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-[#6B6B6F] border-l border-[#2A2A2D]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Older: {dateOlderStr}</span>
                  </div>
                </th>
                <th className="p-4 font-semibold uppercase tracking-wider text-white border-l border-[#2A2A2D]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Newer: {dateNewerStr}</span>
                  </div>
                </th>
                <th className="p-4 font-semibold uppercase tracking-wider border-l border-[#2A2A2D]">Improvement Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2D]">
              {/* Project Info */}
              <tr>
                <td className="p-4 font-semibold text-white font-sans">Project Scope / Source</td>
                <td className="p-4 text-[#E0E0E0] border-l border-[#2A2A2D]">
                  <div className="font-semibold">{older.data.projectName || "HTML Code Snippet"}</div>
                  <div className="text-[10px] text-[#6B6B6F] mt-1 max-w-[200px] truncate">
                    {older.url ? older.url : "Raw paste content"}
                  </div>
                </td>
                <td className="p-4 text-white border-l border-[#2A2A2D]">
                  <div className="font-semibold">{newer.data.projectName || "HTML Code Snippet"}</div>
                  <div className="text-[10px] text-[#6B6B6F] mt-1 max-w-[200px] truncate">
                    {newer.url ? newer.url : "Raw paste content"}
                  </div>
                </td>
                <td className="p-4 border-l border-[#2A2A2D] text-[#6B6B6F]">
                  {older.data.projectName === newer.data.projectName ? "Same Project" : "Cross-project comparison"}
                </td>
              </tr>

              {/* Completion Stage */}
              <tr>
                <td className="p-4 font-semibold text-white font-sans">Completion Stage Tracker</td>
                <td className="p-4 text-[#E0E0E0] border-l border-[#2A2A2D]">
                  Stage {older.completionStage} / 10
                  <span className="block text-[10px] text-[#6B6B6F] mt-0.5">({older.data.completionStageLabel})</span>
                </td>
                <td className="p-4 text-white border-l border-[#2A2A2D]">
                  Stage {newer.completionStage} / 10
                  <span className="block text-[10px] text-[#6B6B6F] mt-0.5">({newer.data.completionStageLabel})</span>
                </td>
                <td className="p-4 border-l border-[#2A2A2D]">
                  {renderDeltaBadge(newer.completionStage - older.completionStage)}
                </td>
              </tr>

              {/* Category Scores Breakdown */}
              {categories.map((cat) => {
                const scoreOld = older.data.categories?.[cat.key]?.score ?? 0;
                const scoreNew = newer.data.categories?.[cat.key]?.score ?? 0;
                const diff = scoreNew - scoreOld;
                const CatIcon = cat.icon;

                return (
                  <tr key={cat.key} className="hover:bg-black/20 transition">
                    <td className="p-4 text-[#E0E0E0] font-semibold font-sans flex items-center gap-2">
                      <CatIcon className="h-3.5 w-3.5 text-[#6B6B6F]" />
                      <span>{cat.label} Quality</span>
                    </td>
                    <td className="p-4 text-[#6B6B6F] border-l border-[#2A2A2D]">
                      {scoreOld} / 100
                    </td>
                    <td className="p-4 text-white border-l border-[#2A2A2D] font-bold">
                      {scoreNew} / 100
                    </td>
                    <td className="p-4 border-l border-[#2A2A2D]">
                      {renderDeltaBadge(diff)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progress timeline / Resolution list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resolved issues */}
        <div className="border border-[#2A2A2D] bg-[#141416] p-5 rounded-xl space-y-3">
          <h4 className="font-sans font-bold text-xs text-green-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            Resolved Clichés ({resolvedIssues.length})
          </h4>
          <p className="text-[10px] text-[#6B6B6F] leading-relaxed">
            These design flaws were present in the older audit but have been eliminated in the newer version!
          </p>

          {resolvedIssues.length > 0 ? (
            <div className="space-y-2.5 pt-2">
              {resolvedIssues.map((item, idx) => (
                <div key={idx} className="p-3 bg-black border border-green-950/20 rounded-lg space-y-1">
                  <p className="text-xs font-semibold text-white font-sans">{item.issue}</p>
                  <p className="text-[10px] text-[#6B6B6F] leading-normal">{item.description}</p>
                  <span className="inline-block text-[9px] font-mono text-green-400 bg-green-950/20 px-1.5 py-0.5 rounded border border-green-900/30">
                    ✓ ELIMINATED
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#6B6B6F] font-mono py-4 text-center border border-dashed border-[#2A2A2D] rounded-lg">
              No previous flaws were fully resolved. Keep refining the style parameters!
            </p>
          )}
        </div>

        {/* Remaining or Newly Introduced issues */}
        <div className="border border-[#2A2A2D] bg-[#141416] p-5 rounded-xl space-y-3">
          <h4 className="font-sans font-bold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Newly Introduced or Remaining ({newIssues.length})
          </h4>
          <p className="text-[10px] text-[#6B6B6F] leading-relaxed">
            These design flaws are newly discovered or remaining in the newer audit and require attention.
          </p>

          {newIssues.length > 0 ? (
            <div className="space-y-2.5 pt-2">
              {newIssues.map((item, idx) => (
                <div key={idx} className="p-3 bg-black border border-amber-950/20 rounded-lg space-y-1">
                  <p className="text-xs font-semibold text-white font-sans">{item.issue}</p>
                  <p className="text-[10px] text-[#6B6B6F] leading-normal">{item.description}</p>
                  <div className="pt-1 text-[9px] font-mono text-amber-400">
                    Fix: {item.fix}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#6B6B6F] font-mono py-4 text-center border border-dashed border-[#2A2A2D] rounded-lg">
              No new style flaws introduced! Your changes remain clean.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
