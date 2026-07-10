import React from "react";
import { SavedAudit } from "../types";
import { Calendar, Trash2, Globe, FileCode, ChevronRight } from "lucide-react";

interface AuditHistoryProps {
  history: SavedAudit[];
  onSelectAudit: (audit: SavedAudit) => void;
  onDeleteAudit: (id: string, e: React.MouseEvent) => void;
  activeId?: string;
}

export default function AuditHistory({
  history,
  onSelectAudit,
  onDeleteAudit,
  activeId,
}: AuditHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed border-[#2A2A2D] rounded-xl bg-black/20">
        <p className="text-[#6B6B6F] text-xs font-mono">No previous audits found</p>
        <p className="text-[#6B6B6F]/80 text-xs mt-1">Your saved style audits will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {history.map((audit) => {
        const isActive = activeId === audit.id;
        const dateString = new Date(audit.timestamp).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const score = audit.data.overallScore;
        let scoreColorClass = "bg-black text-[#E0E0E0] border-[#2A2A2D]";
        if (score >= 80) {
          scoreColorClass = "bg-emerald-950/20 text-emerald-400 border-emerald-900/50";
        } else if (score >= 50) {
          scoreColorClass = "bg-amber-950/20 text-amber-400 border-amber-900/50";
        } else {
          scoreColorClass = "bg-red-950/20 text-red-400 border-red-900/50";
        }

        return (
          <div
            key={audit.id}
            id={`history-item-${audit.id}`}
            onClick={() => onSelectAudit(audit)}
            className={`group w-full flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition text-left ${
              isActive
                ? "bg-black border-white shadow-xl"
                : "bg-[#141416] hover:bg-black/40 border-[#2A2A2D]"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="shrink-0 p-2 rounded-md bg-black border border-[#2A2A2D]">
                {audit.url ? (
                  <Globe className="h-3.5 w-3.5 text-white" />
                ) : (
                  <FileCode className="h-3.5 w-3.5 text-white" />
                )}
              </div>

              <div className="min-w-0">
                <h4 className="font-sans font-semibold text-xs md:text-sm text-white truncate">
                  {audit.data.projectName || audit.url || "Raw Code Audit"}
                </h4>
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#6B6B6F] mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {dateString}
                  </span>
                  <span>•</span>
                  <span>Stage {audit.completionStage}/10</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Score label */}
              <div className={`px-2 py-0.5 font-display font-semibold text-xs border rounded-full ${scoreColorClass}`}>
                {score}
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => onDeleteAudit(audit.id, e)}
                title="Delete history item"
                className="p-1.5 text-[#6B6B6F] hover:text-red-400 rounded-md hover:bg-red-950/20 transition opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              <ChevronRight className="h-4 w-4 text-[#6B6B6F] group-hover:text-white transition" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
