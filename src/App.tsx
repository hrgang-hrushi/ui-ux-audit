import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Globe,
  FileCode,
  Sliders,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Plus,
  History,
  Terminal,
  ArrowRight,
  ChevronDown,
  AlertCircle,
  ExternalLink,
  Loader2,
  Check,
  LayoutGrid,
  Baseline,
  Ruler,
  Palette,
  Activity,
  Trash2,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuditResponse, SavedAudit } from "./types";
import MetricCard from "./components/MetricCard";
import SlopAlertItem from "./components/SlopAlertItem";
import MicroFeedbackTable from "./components/MicroFeedbackTable";
import PromptSection from "./components/PromptSection";
import AuditHistory from "./components/AuditHistory";

export default function App() {
  // Setup inputs
  const [url, setUrl] = useState("");
  const [pastedCode, setPastedCode] = useState("");
  const [completionStage, setCompletionStage] = useState(5);
  const [showCodeInput, setShowCodeInput] = useState(false);

  // States
  const [activeAudit, setActiveAudit] = useState<AuditResponse | null>(null);
  const [activeAuditId, setActiveAuditId] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<SavedAudit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [loadingTip, setLoadingTip] = useState("");
  
  // Errors
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<"alerts" | "checklist" | "prompt">("alerts");
  const [selectedCategory, setSelectedCategory] = useState<
    "typography" | "spacing" | "hierarchy" | "colorHarmony" | "interactions"
  >("typography");

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("ui_ux_audit_history");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
        // Pre-select latest audit if available
        if (parsed.length > 0) {
          setActiveAudit(parsed[0].data);
          setActiveAuditId(parsed[0].id);
          // Set inputs to match
          setUrl(parsed[0].url || "");
          setCompletionStage(parsed[0].completionStage);
        }
      } catch (err) {
        console.error("Failed to parse audit history", err);
      }
    }
  }, []);

  // Sync history to localStorage
  const saveHistory = (newHistory: SavedAudit[]) => {
    setHistory(newHistory);
    localStorage.setItem("ui_ux_audit_history", JSON.stringify(newHistory));
  };

  // Rotating loading tips
  useEffect(() => {
    if (!isLoading) return;

    const tips = [
      "Analyzing grid alignments and flex layouts...",
      "Inspecting text tracking (letter-spacing) and line heights...",
      "Scanning for over-saturated purple-to-blue linear gradients...",
      "Evaluating negative space and padding density...",
      "Identifying unneeded telemetry telemetry lines, network status lights, or mock headers...",
      "Checking contrast ratios and shadow depths...",
      "Writing Claude & Gemini optimized developer instructions...",
      "Calculating Swiss-minimalism aesthetics score..."
    ];

    setLoadingTip(tips[0]);
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % tips.length;
      setLoadingTip(tips[index]);
    }, 2800);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Fetch URL proxy action
  const handleFetchUrl = async () => {
    if (!url) {
      setFetchError("Please enter a website link first.");
      return;
    }

    setIsFetchingUrl(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to retrieve code. Check the URL or paste HTML manually below.");
      }

      setPastedCode(data.html);
      setShowCodeInput(true);
      // Clean error, alert success
      setFetchError(null);
    } catch (err: any) {
      setFetchError(err.message || "Failed to reach url.");
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // Trigger Audit Action
  const handleRunAudit = async () => {
    if (!pastedCode && !url) {
      setAuditError("Please fetch a website URL or enter source code/HTML to begin auditing.");
      return;
    }

    setIsLoading(true);
    setAuditError(null);
    try {
      // 1. If code is empty but URL is provided, try fetching it first
      let codeToAnalyze = pastedCode;
      if (!codeToAnalyze && url) {
        try {
          const fetchRes = await fetch("/api/fetch-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
          const fetchData = await fetchRes.json();
          if (fetchRes.ok) {
            codeToAnalyze = fetchData.html;
            setPastedCode(fetchData.html);
          }
        } catch (e) {
          console.warn("Pre-fetch failed, sending empty code block:", e);
        }
      }

      // 2. Query Gemini Audit
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          pastedCode: codeToAnalyze,
          completionStage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Aesthetic audit failed. Please try again.");
      }

      const auditData: AuditResponse = data;

      // Create saved audit item
      const newAuditItem: SavedAudit = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        url: url || undefined,
        completionStage,
        data: auditData,
      };

      const updatedHistory = [newAuditItem, ...history.filter(h => h.data.projectName !== auditData.projectName)];
      saveHistory(updatedHistory);
      
      setActiveAudit(auditData);
      setActiveAuditId(newAuditItem.id);
      setActiveTab("alerts"); // focus alerts first
      
    } catch (err: any) {
      setAuditError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  // Select past audit
  const handleSelectAudit = (audit: SavedAudit) => {
    setActiveAudit(audit.data);
    setActiveAuditId(audit.id);
    setUrl(audit.url || "");
    setCompletionStage(audit.completionStage);
  };

  // Delete past audit
  const handleDeleteAudit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = history.filter((h) => h.id !== id);
    saveHistory(filtered);
    if (activeAuditId === id) {
      if (filtered.length > 0) {
        setActiveAudit(filtered[0].data);
        setActiveAuditId(filtered[0].id);
      } else {
        setActiveAudit(null);
        setActiveAuditId(undefined);
      }
    }
  };

  // Create new audit scratchpad
  const handleNewAudit = () => {
    setActiveAudit(null);
    setActiveAuditId(undefined);
    setUrl("");
    setPastedCode("");
    setCompletionStage(5);
    setShowCodeInput(false);
  };

  // Get score visual color properties
  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" };
    if (score >= 50) return { text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" };
    return { text: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/10" };
  };

  // Download raw audit data as a JSON file
  const downloadAuditJson = () => {
    if (!activeAudit) return;
    try {
      const jsonString = JSON.stringify(activeAudit, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      const filename = `${activeAudit.projectName ? activeAudit.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "aesthetic-audit"}-${new Date().toISOString().split("T")[0]}.json`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    } catch (err) {
      console.error("Failed to download JSON:", err);
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col antialiased">
      {/* Header */}
      <header className="border-b border-[#2A2A2D] bg-[#141416] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white flex items-center justify-center rounded-sm text-black font-black italic">
              A
            </div>
            <div>
              <h1 className="font-display font-semibold text-base md:text-lg tracking-tight text-white">
                Aesthetic UI/UX Auditor
              </h1>
              <p className="text-[10px] font-mono text-[#6B6B6F]">Swiss Modernist Quality Control</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeAudit && (
              <button
                onClick={handleNewAudit}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2A2A2D] rounded-md text-xs font-mono text-[#E0E0E0] hover:bg-[#2A2A2D] transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Audit</span>
              </button>
            )}
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-mono text-[#6B6B6F] tracking-wider uppercase">Auditing Engine Active</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form controls (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-[#2A2A2D] bg-[#141416] p-6 rounded-xl space-y-5">
            <div>
              <h2 className="font-display font-bold text-white text-base mb-1">
                Aesthetic Audit Workspace
              </h2>
              <p className="text-[#6B6B6F] text-xs leading-relaxed">
                Connect your AI-built interface. We fetch, parse, and analyze the elements to eliminate generic AI-design flaws.
              </p>
            </div>

            {/* URL Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-semibold text-[#6B6B6F] uppercase tracking-wider">
                1. Link Website / Web App
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-[#6B6B6F]" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setFetchError(null);
                    }}
                    placeholder="https://my-ai-site.com"
                    className="w-full pl-9 pr-3 py-2 bg-black border border-[#2A2A2D] rounded-md text-xs font-sans text-[#E0E0E0] focus:outline-hidden focus:border-white transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFetchUrl}
                  disabled={isFetchingUrl || !url}
                  className="px-3 border border-[#2A2A2D] rounded-md text-[#E0E0E0] bg-black hover:bg-[#1C1C1E] font-mono text-xs font-semibold disabled:opacity-50 transition flex items-center justify-center min-w-[70px]"
                >
                  {isFetchingUrl ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : "Fetch"}
                </button>
              </div>
              {fetchError && (
                <p className="text-[11px] font-mono text-amber-500 bg-amber-950/20 p-2 border border-amber-900/50 rounded">
                  {fetchError}
                </p>
              )}
            </div>

            {/* Code toggler / Direct Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowCodeInput(!showCodeInput)}
                  className="text-[11px] font-mono text-[#6B6B6F] hover:text-white underline flex items-center gap-1"
                >
                  {showCodeInput ? "Hide Code Sandbox" : "Paste Source Code (Localhost / Offline)"}
                </button>
                {pastedCode && (
                  <span className="text-[10px] font-mono text-green-400 bg-green-950/20 px-2 py-0.5 rounded-full border border-green-900/50 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Code Loaded
                  </span>
                )}
              </div>

              <AnimatePresence>
                {showCodeInput && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <textarea
                      value={pastedCode}
                      onChange={(e) => {
                        setPastedCode(e.target.value);
                        setAuditError(null);
                      }}
                      placeholder="Paste your raw HTML, React jsx, or styles here..."
                      className="w-full h-40 bg-black text-[#E0E0E0] p-3 rounded font-mono text-xs focus:outline-hidden border border-[#2A2A2D]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Scale Slider */}
            <div className="space-y-3 pt-2 border-t border-[#2A2A2D]">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-semibold text-[#6B6B6F] uppercase tracking-wider">
                  2. Project Completion Scale
                </label>
                <span className="text-xs font-display font-bold text-white bg-black border border-[#2A2A2D] px-2 py-0.5 rounded">
                  {completionStage} / 10
                </span>
              </div>

              {/* Range Track */}
              <div className="relative pt-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={completionStage}
                  onChange={(e) => setCompletionStage(Number(e.target.value))}
                  className="w-full h-1 bg-black rounded-lg appearance-none cursor-pointer accent-white border border-[#2A2A2D]"
                />
                <div className="flex justify-between text-[9px] font-mono text-[#6B6B6F] mt-2">
                  <span>1 (Skeleton)</span>
                  <span>5 (Prototype)</span>
                  <span>10 (Ready)</span>
                </div>
              </div>

              {/* Context text for Scale */}
              <div className="p-3 bg-black border border-[#2A2A2D] rounded-md text-xs leading-relaxed text-[#6B6B6F]">
                {completionStage <= 3 ? (
                  <p>
                    <strong className="text-white block mb-0.5">Focus: Core Architecture</strong>
                    Audits grid layouts, content structure, flow density, and responsive layouts. Spares tiny detail reviews for now.
                  </p>
                ) : completionStage <= 7 ? (
                  <p>
                    <strong className="text-white block mb-0.5">Focus: Aesthetic Balance</strong>
                    Audits typography pairings, margin rhythm, color palettes, visual hierarchies, and alignment issues.
                  </p>
                ) : (
                  <p>
                    <strong className="text-white block mb-0.5">Focus: Swiss Precision</strong>
                    Audits micro-interactions, subtle shadows, letter spacing, font weights, fine borders, and smooth page transitions.
                  </p>
                )}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunAudit}
              disabled={isLoading || (!pastedCode && !url)}
              id="run-audit-btn"
              className="w-full py-4 bg-white text-black text-[11px] font-bold uppercase tracking-tighter hover:bg-[#D1D1D1] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Auditing Aesthetics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Run Deep Analysis</span>
                </>
              )}
            </button>

            {auditError && (
              <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-md flex items-start gap-2 text-xs text-red-400 font-mono">
                <AlertCircle className="h-4 shrink-0 text-red-500 mt-0.5" />
                <p>{auditError}</p>
              </div>
            )}
          </div>

          {/* History Sidebar */}
          <div className="border border-[#2A2A2D] bg-[#141416] p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans font-bold text-xs text-[#6B6B6F] uppercase tracking-widest flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                <span>Audit History Logs ({history.length})</span>
              </h3>
            </div>
            <AuditHistory
              history={history}
              onSelectAudit={handleSelectAudit}
              onDeleteAudit={handleDeleteAudit}
              activeId={activeAuditId}
            />
          </div>
        </div>

        {/* Right Dashboard Area (lg:col-span-8) */}
        <div className="lg:col-span-8">
          {isLoading ? (
            /* Loading State Block */
            <div className="h-full min-h-[450px] flex flex-col items-center justify-center p-8 border border-[#2A2A2D] bg-[#141416] rounded-xl text-center space-y-5">
              <div className="relative">
                <div className="p-5 bg-white text-black rounded-full relative z-10 animate-bounce">
                  <Sparkles className="h-8 w-8 text-black animate-spin" />
                </div>
                <div className="absolute inset-0 bg-white/10 rounded-full blur-xl scale-125 animate-ping"></div>
              </div>

              <div className="max-w-md">
                <h3 className="font-display font-semibold text-white text-lg mb-1">
                  Aesthetic Engine Running
                </h3>
                <p className="text-[#6B6B6F] text-xs font-mono min-h-[1.5rem]">
                  {loadingTip}
                </p>
              </div>

              <div className="w-48 h-1 bg-black border border-[#2A2A2D] rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full animate-[loading-bar_2s_infinite]"></div>
              </div>
            </div>
          ) : activeAudit ? (
            /* Active Audit Dashboard Results */
            <div className="space-y-6">
              {/* Score Header Card */}
              <div className="border border-[#2A2A2D] bg-[#141416] p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono tracking-wider bg-black text-[#E0E0E0] border border-[#2A2A2D] px-2.5 py-0.5 rounded-full uppercase">
                      Audit Report
                    </span>
                    <span className="text-[#2A2A2D]">•</span>
                    <span className="text-xs text-[#6B6B6F] font-mono">Stage: {activeAudit.completionStageLabel}</span>
                  </div>
                  <h2 className="font-display font-bold text-2xl md:text-3xl text-white tracking-tight mb-1">
                    {activeAudit.projectName || "Design Audit Report"}
                  </h2>
                  <p className="text-[#6B6B6F] text-xs md:text-sm flex items-center gap-1.5">
                    {url ? (
                      <>
                        <Globe className="h-3.5 w-3.5 text-[#6B6B6F]" />
                        <span className="underline truncate max-w-sm">{url}</span>
                      </>
                    ) : (
                      <>
                        <FileCode className="h-3.5 w-3.5 text-[#6B6B6F]" />
                        <span>Analyzed via HTML sandbox snippet</span>
                      </>
                    )}
                  </p>
                  <button
                    onClick={downloadAuditJson}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-black/60 text-[11px] font-mono font-medium text-white border border-[#2A2A2D] hover:border-white transition-all duration-200 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                    <span>Download JSON Report</span>
                  </button>
                </div>

                {/* Main Score badge */}
                <div className="flex items-center gap-4 border-l border-[#2A2A2D] pl-0 md:pl-6">
                  <div className={`p-4 rounded-full border-2 flex flex-col items-center justify-center w-24 h-24 shrink-0 ${getScoreColor(activeAudit.overallScore).border} ${getScoreColor(activeAudit.overallScore).bg}`}>
                    <span className={`font-display font-extrabold text-3xl leading-none ${getScoreColor(activeAudit.overallScore).text}`}>
                      {activeAudit.overallScore}
                    </span>
                    <span className="text-[10px] font-mono text-[#6B6B6F] mt-1 uppercase tracking-wider">Aesthetic</span>
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-white mb-0.5">
                      {activeAudit.overallScore >= 80 ? "Pristine & Sophisticated" : activeAudit.overallScore >= 50 ? "Moderate Template Quality" : "Heavy AI Artifacts Detected"}
                    </h4>
                    <p className="text-[#6B6B6F] text-xs leading-normal max-w-xs">
                      {activeAudit.overallScore >= 80 
                        ? "Great Swiss aesthetic discipline, clean proportions, clean semantic structure." 
                        : activeAudit.overallScore >= 50 
                        ? "Has standard UI elements. Tweak details and remove cookie-cutter templates to make it pop."
                        : "Contains typical AI-generated clichés like status metrics, unadjusted buttons, and repetitive paddings."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-[#2A2A2D] flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab("alerts")}
                  id="tab-alerts"
                  className={`px-4 py-2.5 font-sans font-semibold text-xs md:text-sm tracking-wide border-b-2 transition -mb-0.5 flex items-center gap-2 ${
                    activeTab === "alerts"
                      ? "border-white text-white font-bold"
                      : "border-transparent text-[#6B6B6F] hover:text-white"
                  }`}
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>AI Slop Clichés ({activeAudit.aiSlopAlerts?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab("checklist")}
                  id="tab-checklist"
                  className={`px-4 py-2.5 font-sans font-semibold text-xs md:text-sm tracking-wide border-b-2 transition -mb-0.5 flex items-center gap-2 ${
                    activeTab === "checklist"
                      ? "border-white text-white font-bold"
                      : "border-transparent text-[#6B6B6F] hover:text-white"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Micro Polish Refinements ({activeAudit.microFeedback?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab("prompt")}
                  id="tab-prompt"
                  className={`px-4 py-2.5 font-sans font-semibold text-xs md:text-sm tracking-wide border-b-2 transition -mb-0.5 flex items-center gap-2 ${
                    activeTab === "prompt"
                      ? "border-white text-white font-bold"
                      : "border-transparent text-[#6B6B6F] hover:text-white"
                  }`}
                >
                  <Terminal className="h-4 w-4 animate-pulse text-green-400" />
                  <span>AI Prompt Section</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="min-h-[300px]">
                {/* 1. Alerts Tab */}
                {activeTab === "alerts" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-black border border-[#2A2A2D] rounded-xl">
                      <p className="text-xs md:text-sm text-[#E0E0E0] leading-relaxed">
                        These alert logs identify patterns in your markup and layout that trigger <strong>AI Template Clichés</strong>. Eliminating these makes your platform look highly bespoke, expensive, and professional.
                      </p>
                    </div>

                    {activeAudit.aiSlopAlerts && activeAudit.aiSlopAlerts.length > 0 ? (
                      <div className="space-y-4">
                        {activeAudit.aiSlopAlerts.map((alert, index) => (
                          <SlopAlertItem
                            key={index}
                            issue={alert.issue}
                            severity={alert.severity}
                            description={alert.description}
                            fix={alert.fix}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center border border-dashed border-[#2A2A2D] bg-[#141416] rounded-xl">
                        <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2 animate-pulse" />
                        <h4 className="font-display font-semibold text-white text-sm">
                          Pure Handcrafted Aesthetic!
                        </h4>
                        <p className="text-[#6B6B6F] text-xs mt-1">
                          Our auditor did not detect any major AI template clichés on your site! Excellent.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Checklist Tab */}
                {activeTab === "checklist" && (
                  <div className="space-y-6">
                    {/* Categories metric row */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <MetricCard
                        title="Typography"
                        score={activeAudit.categories.typography.score}
                        icon={Baseline}
                        issuesCount={activeAudit.categories.typography.issues.length}
                        recommendationsCount={activeAudit.categories.typography.recommendations.length}
                        onClick={() => setSelectedCategory("typography")}
                        isActive={selectedCategory === "typography"}
                      />

                      <MetricCard
                        title="Spacing"
                        score={activeAudit.categories.spacing.score}
                        icon={Ruler}
                        issuesCount={activeAudit.categories.spacing.issues.length}
                        recommendationsCount={activeAudit.categories.spacing.recommendations.length}
                        onClick={() => setSelectedCategory("spacing")}
                        isActive={selectedCategory === "spacing"}
                      />

                      <MetricCard
                        title="Hierarchy"
                        score={activeAudit.categories.hierarchy.score}
                        icon={LayoutGrid}
                        issuesCount={activeAudit.categories.hierarchy.issues.length}
                        recommendationsCount={activeAudit.categories.hierarchy.recommendations.length}
                        onClick={() => setSelectedCategory("hierarchy")}
                        isActive={selectedCategory === "hierarchy"}
                      />

                      <MetricCard
                        title="Color Balance"
                        score={activeAudit.categories.colorHarmony.score}
                        icon={Palette}
                        issuesCount={activeAudit.categories.colorHarmony.issues.length}
                        recommendationsCount={activeAudit.categories.colorHarmony.recommendations.length}
                        onClick={() => setSelectedCategory("colorHarmony")}
                        isActive={selectedCategory === "colorHarmony"}
                      />

                      <MetricCard
                        title="Interactions"
                        score={activeAudit.categories.interactions.score}
                        icon={Activity}
                        issuesCount={activeAudit.categories.interactions.issues.length}
                        recommendationsCount={activeAudit.categories.interactions.recommendations.length}
                        onClick={() => setSelectedCategory("interactions")}
                        isActive={selectedCategory === "interactions"}
                      />
                    </div>

                    {/* Selected Category breakdown details */}
                    <div className="border border-[#2A2A2D] bg-[#141416]/50 p-5 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-semibold text-white text-sm md:text-base capitalize">
                          {selectedCategory === "colorHarmony" ? "Color Harmony" : selectedCategory} Quality Analysis
                        </h3>
                        <span className="font-mono text-xs font-semibold text-[#6B6B6F] uppercase">
                          Score: {activeAudit.categories[selectedCategory].score}/100
                        </span>
                      </div>

                      {/* Issues & Recommendations bullets */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-black border border-[#2A2A2D] rounded-xl">
                          <h4 className="font-sans font-semibold text-amber-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            Detected Flaws
                          </h4>
                          {activeAudit.categories[selectedCategory].issues.length > 0 ? (
                            <ul className="space-y-2 text-xs text-[#E0E0E0] leading-relaxed list-disc list-inside">
                              {activeAudit.categories[selectedCategory].issues.map((issue, idx) => (
                                <li key={idx}>{issue}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-[#6B6B6F] font-mono">No flaws detected in this category!</p>
                          )}
                        </div>

                        <div className="p-4 bg-black border border-[#2A2A2D] rounded-xl">
                          <h4 className="font-sans font-semibold text-green-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                            Aesthetic Actions
                          </h4>
                          {activeAudit.categories[selectedCategory].recommendations.length > 0 ? (
                            <ul className="space-y-2 text-xs text-[#E0E0E0] leading-relaxed list-disc list-inside">
                              {activeAudit.categories[selectedCategory].recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-[#6B6B6F] font-mono font-normal">Highly polished structure!</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Before & After tables specific to this category */}
                    <div className="space-y-4">
                      <h3 className="font-display font-medium text-white text-sm">
                        Specific Target Replacements
                      </h3>
                      {activeAudit.microFeedback && activeAudit.microFeedback.length > 0 ? (
                        <div className="space-y-4">
                          {activeAudit.microFeedback
                            // Categorize table recommendations lightly based on element matching keywords
                            .filter((item) => {
                              const el = item.element.toLowerCase();
                              const find = item.finding.toLowerCase();
                              const rat = item.rationale.toLowerCase();
                              
                              if (selectedCategory === "typography") {
                                return el.includes("font") || el.includes("text") || el.includes("header") || find.includes("font") || find.includes("typography") || find.includes("size") || rat.includes("font") || rat.includes("text");
                              }
                              if (selectedCategory === "spacing") {
                                return el.includes("pad") || el.includes("margin") || el.includes("space") || el.includes("grid") || find.includes("space") || find.includes("padding") || find.includes("margin") || find.includes("width") || find.includes("gap") || rat.includes("space") || rat.includes("layout");
                              }
                              if (selectedCategory === "hierarchy") {
                                return el.includes("card") || el.includes("header") || el.includes("container") || el.includes("section") || find.includes("hierarchy") || find.includes("priority") || find.includes("order") || rat.includes("hierarchy") || rat.includes("importance");
                              }
                              if (selectedCategory === "colorHarmony") {
                                return el.includes("color") || el.includes("bg") || el.includes("gradient") || el.includes("button") || find.includes("color") || find.includes("gradient") || find.includes("palette") || find.includes("slate") || rat.includes("color") || rat.includes("harmony");
                              }
                              if (selectedCategory === "interactions") {
                                return el.includes("button") || el.includes("hover") || el.includes("transition") || el.includes("click") || el.includes("animation") || find.includes("hover") || find.includes("interaction") || find.includes("transition") || find.includes("animation") || rat.includes("interaction") || rat.includes("hover");
                              }
                              return true;
                            })
                            .map((item, index) => (
                              <MicroFeedbackTable
                                key={index}
                                element={item.element}
                                finding={item.finding}
                                beforeCode={item.beforeCode}
                                afterCode={item.afterCode}
                                rationale={item.rationale}
                              />
                            ))}

                          {activeAudit.microFeedback.filter(item => {
                            const el = item.element.toLowerCase();
                            const find = item.finding.toLowerCase();
                            const rat = item.rationale.toLowerCase();
                            if (selectedCategory === "typography") return el.includes("font") || el.includes("text") || el.includes("header") || find.includes("font") || find.includes("typography") || find.includes("size") || rat.includes("font") || rat.includes("text");
                            if (selectedCategory === "spacing") return el.includes("pad") || el.includes("margin") || el.includes("space") || el.includes("grid") || find.includes("space") || find.includes("padding") || find.includes("margin") || find.includes("width") || find.includes("gap") || rat.includes("space") || rat.includes("layout");
                            if (selectedCategory === "hierarchy") return el.includes("card") || el.includes("header") || el.includes("container") || el.includes("section") || find.includes("hierarchy") || find.includes("priority") || find.includes("order") || rat.includes("hierarchy") || rat.includes("importance");
                            if (selectedCategory === "colorHarmony") return el.includes("color") || el.includes("bg") || el.includes("gradient") || el.includes("button") || find.includes("color") || find.includes("gradient") || find.includes("palette") || find.includes("slate") || rat.includes("color") || rat.includes("harmony");
                            if (selectedCategory === "interactions") return el.includes("button") || el.includes("hover") || el.includes("transition") || el.includes("click") || el.includes("animation") || find.includes("hover") || find.includes("interaction") || find.includes("transition") || find.includes("animation") || rat.includes("interaction") || rat.includes("hover");
                            return true;
                          }).length === 0 && (
                            <p className="text-xs text-[#6B6B6F] italic font-mono p-4 border border-dashed border-[#2A2A2D] bg-[#141416]/50 rounded text-center">
                              No specific replacement tables loaded for this section. Review other category tabs!
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-[#6B6B6F] font-mono">No specific adjustments suggested.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Prompt Tab */}
                {activeTab === "prompt" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-950/20 text-[#E0E0E0] border border-green-900/50 rounded-xl flex items-start gap-2 text-xs md:text-sm">
                      <Sparkles className="h-4.5 w-4.5 shrink-0 text-green-400 animate-pulse mt-0.5" />
                      <div>
                        <strong>Ultimate 100/100 Handoff:</strong> This structured prompt is optimized with strict guidelines, layout hierarchies, color pairing directives, and typography parameters to instruct an AI assistant (Claude, Gemini, ChatGPT) to refactor your code completely, removing all clunky AI aesthetic elements.
                      </div>
                    </div>

                    <PromptSection promptText={activeAudit.aiPrompt} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Welcome / Empty state block */
            <div className="h-full min-h-[450px] flex flex-col items-center justify-center p-8 border border-[#2A2A2D] bg-[#141416] rounded-xl text-center space-y-6">
              <div className="p-5 bg-black rounded-full border border-[#2A2A2D]">
                <Sliders className="h-10 w-10 text-white" />
              </div>

              <div className="max-w-md space-y-2">
                <h3 className="font-display font-semibold text-white text-lg">
                  No Active Aesthetic Audit
                </h3>
                <p className="text-[#6B6B6F] text-xs md:text-sm leading-relaxed">
                  Enter a target website URL or paste your local app source markup on the left, slide your completion level tracker, and trigger an aesthetic audit.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full pt-4 border-t border-[#2A2A2D]">
                <div className="p-4 bg-black/40 border border-[#2A2A2D] rounded-xl text-left">
                  <h4 className="font-sans font-semibold text-xs text-white uppercase tracking-wider mb-1">
                    Detect AI Clichés
                  </h4>
                  <p className="text-[#6B6B6F] text-xs leading-normal">
                    Identifies purple-blue gradient overlays, fake telemetry larping lines, and uniform robotic grids.
                  </p>
                </div>

                <div className="p-4 bg-black/40 border border-[#2A2A2D] rounded-xl text-left">
                  <h4 className="font-sans font-semibold text-xs text-white uppercase tracking-wider mb-1">
                    Copy 100/100 Prompt
                  </h4>
                  <p className="text-[#6B6B6F] text-xs leading-normal">
                    Generates custom AI code instructions detailing how to redesign your app with high-end Swiss minimalist elegance.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2A2A2D] bg-[#141416] mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-[#6B6B6F]">
          <span>Aesthetic UI/UX Auditor © 2026. Inspired by Swiss Modernist Architecture.</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Bento Grid Dark Theme
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
