import React, { useState, useEffect } from "react";
import { 
  Check, 
  Clipboard, 
  Edit2, 
  Save, 
  Terminal, 
  Sparkles, 
  Cpu, 
  Sliders, 
  Layers, 
  ShieldCheck, 
  FileText,
  ChevronDown
} from "lucide-react";

interface PromptSectionProps {
  promptText: string;
}

type TargetLlm = "claude" | "gemini" | "gpt4o" | "cursor";
type Persona = "swiss" | "techlead" | "creativedirector";

export default function PromptSection({ promptText }: PromptSectionProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  
  // Prompt engineering controls state
  const [targetLlm, setTargetLlm] = useState<TargetLlm>("claude");
  const [persona, setPersona] = useState<Persona>("swiss");
  const [strategies, setStrategies] = useState({
    xmlTags: true,
    cot: true,
    negativeConstraints: true,
    fewShot: true,
  });

  // Compiler function to wrap the base prompt with state-of-the-art prompt engineering wrappers
  const compilePrompt = (
    base: string,
    llm: TargetLlm,
    pers: Persona,
    strats: typeof strategies
  ) => {
    let result = "";

    // 1. Role-Play & System Persona Definition
    let systemRole = "";
    if (pers === "swiss") {
      systemRole = `You are a world-class, pedantic Swiss Minimalist Design Engineer & Master of Aesthetics. You hold an absolute zero-tolerance policy for visual clutter, unnecessary elements, and generic "AI slop" layout patterns. You design with extreme typographic restraint, perfect grid alignments, and generous negative space reminiscent of Josef Müller-Brockmann and Emil Ruder. Focus on structure, ratios, and fine typographic rhythm.`;
    } else if (pers === "techlead") {
      systemRole = `You are a strict, ultra-pragmatic Senior Frontend Architect and Tech Lead. You despise unrequested features, nested div-soup, and generic templated styles. You enforce clean semantic HTML, performant and highly responsive CSS utility layouts, and robust, maintainable components.`;
    } else {
      systemRole = `You are an elite, pixel-perfect Creative Director specialized in high-end luxury digital products. Your extreme focus lies on microscopic visual details: precise tracking (letter-spacing), line-height rhythm, subtle border ratios, micro-interactions, flawless hover/active state feedback, and exquisite transition design.`;
    }

    // 2. LLM-specific Optimizer directives
    let llmTuning = "";
    if (llm === "claude") {
      llmTuning = `Analyze and refactor the code holistically. Retain all complex business logic and state hooks perfectly. Claude Engine Directive: Prioritize complete, production-ready code outputs with clear block placements. Avoid placeholders or truncated code lines.`;
    } else if (llm === "gemini") {
      llmTuning = `Establish high-context spatial awareness of the grid layout. Gemini Engine Directive: Focus on multimodal rendering logic, structured layout hierarchy, and absolute adherence to the exact specifications of the original framework.`;
    } else if (llm === "gpt4o") {
      llmTuning = `Process the rules with logical determinism. GPT-4o Engine Directive: Retain exact syntactic structures, apply clean step-by-step CSS refactoring, and output code with zero decorative metadata or markdown preamble outside of the code block.`;
    } else {
      llmTuning = `Focus on incremental search-and-replace efficiency. Cursor/v0 Directive: Structure the edits cleanly with explicit file paths and precise modification blocks. Avoid outputting unchanged sections unless necessary, preserving local context.`;
    }

    // Apply XML tags if enabled
    if (strats.xmlTags) {
      result += `<system_instructions>\n${systemRole}\n${llmTuning}\n</system_instructions>\n\n`;
    } else {
      result += `=== SYSTEM ROLE ===\n${systemRole}\n${llmTuning}\n\n`;
    }

    // 3. Chain-of-Thought (CoT) Directive
    if (strats.cot) {
      const cotInstruction = `CRITICAL STEP-BY-STEP REASONING REQUIRED:
Before writing any code, you MUST generate a thorough visual and structural audit inside a <thinking_process> tag. In this thinking block:
1. Break down the detected layout flaws and visual slop.
2. Outline your planned structural grid/flex updates.
3. Establish the design system tokens: typographic scale (tracking, leading), color palettes (base, surface, accent), and interaction states.
4. Verify that no functional JavaScript state or props are broken.`;
      
      if (strats.xmlTags) {
        result += `<reasoning_protocol>\n${cotInstruction}\n</reasoning_protocol>\n\n`;
      } else {
        result += `=== REASONING PROCESS ===\n${cotInstruction}\n\n`;
      }
    }

    // 4. Negative Constraints
    if (strats.negativeConstraints) {
      const constraints = `STRICT NEGATIVE CONSTRAINTS (RULES OF ENGAGEMENT):
- DO NOT use generic bright purple-to-blue linear gradients (e.g. from-purple-500 to-blue-500) for backgrounds or cards.
- DO NOT add unrequested system logs, "online/active" network status lights, port labels, or simulated terminal logs.
- DO NOT modify, delete, or break any React hooks, state variables, event handlers, or functional prop interfaces.
- DO NOT add persistent navigation bars, drawer menus, or sidebars unless explicitly requested by the user.
- DO NOT use arbitrary padding or margins (e.g. mixing p-4, p-5, p-6 randomly); maintain a strict 4px/8px spacer baseline.`;

      if (strats.xmlTags) {
        result += `<negative_constraints>\n${constraints}\n</negative_constraints>\n\n`;
      } else {
        result += `=== STRICT NEGATIVE CONSTRAINTS ===\n${constraints}\n\n`;
      }
    }

    // 5. Few-Shot Demonstration
    if (strats.fewShot) {
      const fewShotExample = `FEW-SHOT DEMONSTRATION (STANDARD OF QUALITY):
--- INCOMING "AI SLOP" LAYOUT SNIPPET ---
<div class="rounded-2xl shadow-2xl bg-white p-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
  <div class="flex justify-between">
    <span>● SYSTEM STATUS: ONLINE</span>
    <span>PORT: 3000</span>
  </div>
  <button class="bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-lg">Click Me</button>
</div>

--- SWISS MINIMALIST REFACTOR OUTCOME ---
<div class="rounded-xl border border-[#2A2A2D] bg-[#141416] p-8 text-[#E0E0E0] font-sans tracking-tight">
  <div class="flex items-center justify-between text-xs font-mono text-[#6B6B6F] mb-6">
    <span class="tracking-widest uppercase">System Operational</span>
    <span>v1.0.0</span>
  </div>
  <button class="px-5 py-2.5 bg-white text-black font-semibold text-xs uppercase tracking-wide hover:bg-[#E0E0E0] transition-all duration-200">
    Execute Command
  </button>
</div>`;

      if (strats.xmlTags) {
        result += `<few_shot_examples>\n${fewShotExample}\n</few_shot_examples>\n\n`;
      } else {
        result += `=== FEW-SHOT DEMONSTRATION ===\n${fewShotExample}\n\n`;
      }
    }

    // 6. Base Prompt Core
    if (strats.xmlTags) {
      result += `<core_directives>\n${base}\n</core_directives>`;
    } else {
      result += `=== CORE DIRECTIVES ===\n${base}`;
    }

    return result;
  };

  // Compile prompt whenever parameters or parent prompt changes
  useEffect(() => {
    const compiled = compilePrompt(promptText, targetLlm, persona, strategies);
    setEditedText(compiled);
  }, [promptText, targetLlm, persona, strategies]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const toggleStrategy = (key: keyof typeof strategies) => {
    setStrategies(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getActiveStrategiesCount = () => {
    return Object.values(strategies).filter(Boolean).length;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Prompt Engineering Controls Sidebar (Span 4) */}
      <div className="xl:col-span-4 space-y-4">
        {/* Control Panel Card */}
        <div className="border border-[#2A2A2D] bg-[#141416] p-5 rounded-xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#2A2A2D]">
            <Sliders className="h-4 w-4 text-white" />
            <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider">
              Prompt Optimizer Suite
            </h4>
          </div>

          {/* 1. Target LLM selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono font-bold text-[#6B6B6F] uppercase tracking-wider flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                Target LLM Compiler
              </label>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/30">
                ACTIVE
              </span>
            </div>
            <div className="relative">
              <select
                value={targetLlm}
                onChange={(e) => setTargetLlm(e.target.value as TargetLlm)}
                className="w-full bg-black border border-[#2A2A2D] p-3 text-xs rounded-lg text-white font-mono focus:outline-none focus:border-white appearance-none cursor-pointer"
              >
                <option value="claude">Claude 3.5 Sonnet (Holistic Code)</option>
                <option value="gemini">Gemini 1.5/2.0 Pro (High Context)</option>
                <option value="gpt4o">GPT-4o (Strict Deterministic)</option>
                <option value="cursor">v0 / Cursor AI (Surgical Replacements)</option>
              </select>
              <div className="absolute right-3 top-3.5 pointer-events-none text-[#6B6B6F]">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
            <p className="text-[10px] text-[#6B6B6F] leading-normal italic">
              {targetLlm === "claude" && "✓ Optimizes for Claude's deep comprehension of structural layouts and relative sizing."}
              {targetLlm === "gemini" && "✓ Enhances Gemini's focus on multimodal specifications and spatial alignment."}
              {targetLlm === "gpt4o" && "✓ Tailored for strict instruction adherence and logical structure compliance."}
              {targetLlm === "cursor" && "✓ Formats output in clean search-and-replace blocks to minimize token overhead."}
            </p>
          </div>

          {/* 2. System Persona selector */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] font-mono font-bold text-[#6B6B6F] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Design Persona
            </label>
            <div className="relative">
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value as Persona)}
                className="w-full bg-black border border-[#2A2A2D] p-3 text-xs rounded-lg text-white font-sans focus:outline-none focus:border-white appearance-none cursor-pointer"
              >
                <option value="swiss">Swiss Minimalist Architect (Strict restrains)</option>
                <option value="techlead">Ruthless Senior Tech Lead (Div-soup cleanout)</option>
                <option value="creativedirector">Creative Director (Luxury micro-details)</option>
              </select>
              <div className="absolute right-3 top-3.5 pointer-events-none text-[#6B6B6F]">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* 3. Advanced Prompt Engineering Strategies */}
          <div className="space-y-3 pt-3 border-t border-[#2A2A2D]">
            <label className="text-[10px] font-mono font-bold text-[#6B6B6F] uppercase tracking-wider flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              Logical Prompt Principles
            </label>

            <div className="space-y-2">
              {/* XML Toggles */}
              <button
                onClick={() => toggleStrategy("xmlTags")}
                className="w-full flex items-start gap-3 p-2.5 rounded-lg border border-[#2A2A2D] hover:border-white bg-black/40 text-left transition cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={strategies.xmlTags}
                  readOnly
                  className="mt-0.5 accent-white cursor-pointer"
                />
                <div>
                  <h5 className="text-xs font-bold text-white">XML Tags Isolation</h5>
                  <p className="text-[10px] text-[#6B6B6F] leading-normal mt-0.5">
                    Separates system, context, rules & demonstrations. Prevents token leakage and instruction drift.
                  </p>
                </div>
              </button>

              {/* CoT reasoning */}
              <button
                onClick={() => toggleStrategy("cot")}
                className="w-full flex items-start gap-3 p-2.5 rounded-lg border border-[#2A2A2D] hover:border-white bg-black/40 text-left transition cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={strategies.cot}
                  readOnly
                  className="mt-0.5 accent-white cursor-pointer"
                />
                <div>
                  <h5 className="text-xs font-bold text-white">Chain-of-Thought (CoT)</h5>
                  <p className="text-[10px] text-[#6B6B6F] leading-normal mt-0.5">
                    Forces target LLM to write out visual layout planning step-by-step prior to writing any markup. Reduces syntax errors.
                  </p>
                </div>
              </button>

              {/* Negative constraints */}
              <button
                onClick={() => toggleStrategy("negativeConstraints")}
                className="w-full flex items-start gap-3 p-2.5 rounded-lg border border-[#2A2A2D] hover:border-white bg-black/40 text-left transition cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={strategies.negativeConstraints}
                  readOnly
                  className="mt-0.5 accent-white cursor-pointer"
                />
                <div>
                  <h5 className="text-xs font-bold text-white">Strict Negative Constraints</h5>
                  <p className="text-[10px] text-[#6B6B6F] leading-normal mt-0.5">
                    Directly forbids typical AI slop patterns (unnecessary gradients, ports, status indicators). Prevents over-engineering.
                  </p>
                </div>
              </button>

              {/* Few-Shot Demo */}
              <button
                onClick={() => toggleStrategy("fewShot")}
                className="w-full flex items-start gap-3 p-2.5 rounded-lg border border-[#2A2A2D] hover:border-white bg-black/40 text-left transition cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={strategies.fewShot}
                  readOnly
                  className="mt-0.5 accent-white cursor-pointer"
                />
                <div>
                  <h5 className="text-xs font-bold text-white">Few-Shot Demonstrations</h5>
                  <p className="text-[10px] text-[#6B6B6F] leading-normal mt-0.5">
                    Injects a concrete Before/After illustration to establish absolute standards for Swiss minimalist output.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Prompt Pipeline architecture map */}
        <div className="border border-[#2A2A2D] bg-[#141416]/60 p-4 rounded-xl space-y-3">
          <h5 className="text-[10px] font-mono font-bold text-[#6B6B6F] uppercase tracking-wider">
            Prompt Compilation Map
          </h5>
          <div className="space-y-1 font-mono text-[9px]">
            <div className="flex items-center gap-2 p-1.5 bg-black border border-[#2A2A2D] rounded">
              <span className="text-green-400">1</span>
              <span className="text-white font-bold">SYSTEM ROLE</span>
              <span className="text-[#6B6B6F] ml-auto">[{persona.toUpperCase()}]</span>
            </div>
            {strategies.cot && (
              <div className="flex items-center gap-2 p-1.5 bg-black border border-emerald-900/40 rounded">
                <span className="text-emerald-400">2</span>
                <span className="text-white font-bold">REASONING BLOCK</span>
                <span className="text-emerald-500 ml-auto">[CoT ACTIVE]</span>
              </div>
            )}
            {strategies.negativeConstraints && (
              <div className="flex items-center gap-2 p-1.5 bg-black border border-red-900/30 rounded">
                <span className="text-red-400">3</span>
                <span className="text-white font-bold">NEG CONSTRAINTS</span>
                <span className="text-red-400 ml-auto">[GUARD ACTIVE]</span>
              </div>
            )}
            {strategies.fewShot && (
              <div className="flex items-center gap-2 p-1.5 bg-black border border-purple-900/30 rounded">
                <span className="text-purple-400">4</span>
                <span className="text-white font-bold">FEW-SHOT TEMPLATES</span>
                <span className="text-purple-400 ml-auto">[DEMO INJECTED]</span>
              </div>
            )}
            <div className="flex items-center gap-2 p-1.5 bg-black border border-amber-900/40 rounded">
              <span className="text-amber-400">{1 + (strategies.cot ? 1 : 0) + (strategies.negativeConstraints ? 1 : 0) + (strategies.fewShot ? 1 : 0)}</span>
              <span className="text-white font-bold">CORE COMPILER</span>
              <span className="text-[#6B6B6F] ml-auto">[BESPOKE CODE]</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compiled Prompt Display Section (Span 8) */}
      <div className="xl:col-span-8 flex flex-col h-full">
        <div className="border border-[#2A2A2D] bg-[#141416] rounded-xl overflow-hidden flex flex-col h-full">
          {/* Header */}
          <div className="px-5 py-4 bg-black border-b border-[#2A2A2D] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#141416] rounded border border-[#2A2A2D]">
                <Terminal className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-medium text-sm md:text-base text-white tracking-wide">
                  Refactoring Prompt Blueprint
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-mono text-[#6B6B6F]">
                    {getActiveStrategiesCount()} of 4 prompt engineering layers active
                  </span>
                  <span className="text-[#2A2A2D]">•</span>
                  <span className="text-[10px] font-mono text-emerald-400 capitalize">
                    {targetLlm} Compiler Mode
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Edit Mode Toggle */}
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141416] hover:bg-black text-xs font-mono font-medium border border-[#2A2A2D] transition cursor-pointer"
              >
                {isEditing ? (
                  <>
                    <Save className="h-3.5 w-3.5 text-white" />
                    <span className="text-white">Apply & Lock</span>
                  </>
                ) : (
                  <>
                    <Edit2 className="h-3.5 w-3.5 text-[#6B6B6F]" />
                    <span className="text-[#E0E0E0]">Manual Overrides</span>
                  </>
                )}
              </button>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition cursor-pointer ${
                  copied
                    ? "bg-emerald-500 text-black shadow-lg"
                    : "bg-white text-black hover:bg-[#E0E0E0]"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="h-3.5 w-3.5" />
                    <span>Copy Compiler Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Editor/Prompt Area */}
          <div className="p-5 bg-black font-mono text-xs md:text-[13px] text-[#E0E0E0] leading-relaxed flex-1 flex flex-col">
            {isEditing ? (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-[500px] bg-[#141416] text-[#E0E0E0] p-4 rounded-xl border border-[#2A2A2D] focus:outline-hidden focus:border-white font-mono leading-relaxed text-xs resize-y flex-1"
                placeholder="Modify compiled instruction layout manually..."
              />
            ) : (
              <div className="relative flex-1 flex flex-col">
                <div className="max-h-[500px] overflow-y-auto whitespace-pre-wrap select-text pr-2 scrollbar-thin flex-1 font-mono">
                  {editedText}
                </div>

                <div className="absolute bottom-2 right-2 p-2 bg-black/90 rounded-md text-[10px] uppercase font-semibold text-emerald-400 border border-emerald-500/20 pointer-events-none flex items-center gap-1 z-10 shadow-xl">
                  <Sparkles className="h-3 w-3" />
                  Meta-Compiled Successfully
                </div>
              </div>
            )}
          </div>

          {/* Usage instructions */}
          <div className="px-5 py-3.5 bg-black border-t border-[#2A2A2D] text-xs text-[#6B6B6F] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#E0E0E0]">Execution Protocol:</span>
              <span>Paste this compiled text back to your code assistant.</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 font-mono text-[10px] uppercase">
              <ShieldCheck className="h-3 w-3" />
              <span>Protects State Hooks & Handlers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
