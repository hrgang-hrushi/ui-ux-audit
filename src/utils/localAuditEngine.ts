import { AuditResponse, CategoryAudit, AISlopAlert, MicroFeedback } from "../types";

/**
 * Local Deterministic UI/UX & Aesthetic Audit Engine
 * Evaluates code structure, typography, Swiss modular scales, spacing, color harmony,
 * interactions, and detects "AI Slop" visual patterns without external LLMs or API keys.
 */

export function analyzeCodeLocally(
  sourceCode: string,
  url: string = "",
  completionStage: number = 5
): AuditResponse {
  const code = sourceCode || "";

  // 1. Extract Project Name
  let projectName = "Web Application Project";
  const titleMatch = code.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1].trim()) {
    projectName = titleMatch[1].trim();
  } else {
    const h1Match = code.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match && h1Match[1].trim()) {
      const cleanH1 = h1Match[1].replace(/<[^>]+>/g, "").trim();
      if (cleanH1.length > 0 && cleanH1.length < 50) {
        projectName = cleanH1;
      }
    } else if (url) {
      try {
        const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
        projectName = parsed.hostname.replace(/^www\./, "");
      } catch {
        // keep fallback
      }
    }
  }

  // 2. Perform Category Audits

  // --- TYPOGRAPHY AUDIT ---
  const hasCustomTracking = /tracking-(tight|tighter|wide|wider|normal)/i.test(code);
  const hasLeadingControl = /leading-(relaxed|snug|tight|normal|loose)/i.test(code);
  const hasFontFamily = /font-(sans|serif|mono|display|body|heading)/i.test(code) || /font-family/i.test(code);
  const hasUnadjustedInter = !hasCustomTracking && !hasLeadingControl;

  const typographyIssues: string[] = [];
  const typographyRecs: string[] = [];
  let typographyScore = 88;

  if (hasUnadjustedInter) {
    typographyIssues.push("Default unadjusted font stack detected without line-height (leading) or tracking fine-tuning.");
    typographyRecs.push("Add 'tracking-tight' to headings (h1, h2) and 'leading-relaxed' to long paragraph copy for editorial polish.");
    typographyScore -= 12;
  }
  if (!hasLeadingControl) {
    typographyIssues.push("Body text lacks explicit line-height (leading-relaxed) control, risking cramped reading density.");
    typographyRecs.push("Apply 'leading-relaxed' (line-height: 1.625) to all long-form text blocks.");
    typographyScore -= 8;
  }
  if (!hasFontFamily) {
    typographyIssues.push("No explicit display vs body font pairing found in utility classes.");
    typographyRecs.push("Pair a distinctive serif or high-contrast display font for titles with a clean geometric sans for UI controls.");
    typographyScore -= 10;
  }
  if (typographyIssues.length === 0) {
    typographyRecs.push("Excellent typographic balance with tight heading tracking and generous paragraph leading.");
  }

  // --- TYPOGRAPHY SCALE AUDIT (Swiss Modular Scale) ---
  const arbitraryFontSizes = code.match(/text-\[\d+px\]/gi) || [];
  const inlineFontSizes = code.match(/style=\{[^}]*font-size[^}]*\}/gi) || [];
  const headingJump = /<h1[\s\S]*?<\/h1>[\s\S]*?<h[4-6]/i.test(code);

  const scaleIssues: string[] = [];
  const scaleRecs: string[] = [];
  let scaleScore = 90;

  if (arbitraryFontSizes.length > 0) {
    scaleIssues.push(`Detected ${arbitraryFontSizes.length} arbitrary font size overrides (e.g. ${arbitraryFontSizes.slice(0, 3).join(", ")}).`);
    scaleRecs.push("Replace arbitrary pixel values with a mathematical modular scale (e.g. Major Third 1.250 or Tailwind step ratios: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl).");
    scaleScore -= 15;
  }
  if (inlineFontSizes.length > 0) {
    scaleIssues.push("Inline style font-size overrides bypass design token scales.");
    scaleRecs.push("Remove inline font-size declarations and map text sizes to Tailwind's modular typography tokens.");
    scaleScore -= 10;
  }
  if (headingJump) {
    scaleIssues.push("Heading hierarchy skips step levels (e.g. H1 directly followed by H4).");
    scaleRecs.push("Maintain monotonic step progression in heading scales (H1 → H2 → H3) for strict visual hierarchy.");
    scaleScore -= 10;
  }
  if (scaleIssues.length === 0) {
    scaleRecs.push("Follows Swiss typographic standards with ratio-based step progression and mathematical modular scale.");
  }

  // --- SPACING AUDIT ---
  const outerPaddings = code.match(/p-[4-8]|px-[4-8]|py-[4-8]/g) || [];
  const monotonousPadding = outerPaddings.length > 8 && !/p-(10|12|16|20)/.test(code);
  const flexGaps = code.match(/gap-[1-6]/g) || [];
  const missingMaxWidth = !/max-w-(4xl|5xl|6xl|7xl|screen)/i.test(code);
  const badButtonPadding = /px-[1-2]\s+py-[4-6]/i.test(code);

  const spacingIssues: string[] = [];
  const spacingRecs: string[] = [];
  let spacingScore = 85;

  if (monotonousPadding) {
    spacingIssues.push("Monotonous, robotic padding detected across sections (identical p-4/p-6 everywhere without section rhythm).");
    spacingRecs.push("Use tight padding (p-3/p-4) inside interactive controls and generous structural padding (p-8/p-12) between main sections.");
    spacingScore -= 15;
  }
  if (missingMaxWidth) {
    spacingIssues.push("Container lacks max-width constraint, allowing layouts to stretch out on wide desktop screens.");
    spacingRecs.push("Wrap major sections in 'w-full max-w-7xl mx-auto' to ensure proper desktop layout bounds.");
    spacingScore -= 12;
  }
  if (badButtonPadding) {
    spacingIssues.push("Button horizontal-to-vertical padding ratio is imbalanced.");
    spacingRecs.push("Ensure button horizontal padding is exactly ~2x vertical padding (e.g., 'px-4 py-2' or 'px-6 py-3').");
    spacingScore -= 8;
  }
  if (spacingIssues.length === 0) {
    spacingRecs.push("Rhythmic spacing structure with clear distinction between outer containers and inner child gaps.");
  }

  // --- HIERARCHY AUDIT ---
  const divSoupCount = (code.match(/<div/gi) || []).length;
  const semanticTags = (code.match(/<(header|main|section|article|aside|footer)/gi) || []).length;
  const nestedCards = (code.match(/(border|rounded|shadow)[^>]*>[\s\S]*?(border|rounded|shadow)/gi) || []).length;

  const hierarchyIssues: string[] = [];
  const hierarchyRecs: string[] = [];
  let hierarchyScore = 86;

  if (divSoupCount > 15 && semanticTags < 2) {
    hierarchyIssues.push("Heavy container nesting ('div soup') without semantic HTML landmarks (header, main, section).");
    hierarchyRecs.push("Refactor generic div containers into semantic section elements for clear structural hierarchy.");
    hierarchyScore -= 14;
  }
  if (nestedCards > 2) {
    hierarchyIssues.push("Nested cards detected (cards inside cards with competing borders and shadows).");
    hierarchyRecs.push("Flatten depth: use subtle background contrast and whitespace dividers instead of double-nested borders.");
    hierarchyScore -= 12;
  }
  if (hierarchyIssues.length === 0) {
    hierarchyRecs.push("Clean visual hierarchy using subtle whitespace contrasts rather than heavy container borders.");
  }

  // --- COLOR HARMONY AUDIT ---
  const purpleGradients = /bg-gradient-to-[a-z]+\s+from-(purple|violet|indigo)-[0-9]+\s+to-(blue|cyan|pink)-[0-9]+/gi.test(code);
  const pureBlackWhite = /bg-black\s+text-white/i.test(code) && !/bg-\[#[0-9a-fA-F]{6}\]/i.test(code);
  const harshGlows = /shadow-(purple|indigo|blue|cyan)-[0-9]+\/[0-9]+/i.test(code);

  const colorIssues: string[] = [];
  const colorRecs: string[] = [];
  let colorScore = 87;

  if (purpleGradients) {
    colorIssues.push("Generic purple-to-blue linear gradients detected across buttons or card backgrounds.");
    colorRecs.push("Replace harsh multi-hue gradients with solid warm/cool neutrals or monochrome micro-accents.");
    colorScore -= 16;
  }
  if (harshGlows) {
    colorIssues.push("Arbitrary glowing drop-shadows present on cards/buttons.");
    colorRecs.push("Remove artificial colored glows; use clean 1px subtle borders (e.g. border-[#2A2A2D]) for depth.");
    colorScore -= 10;
  }
  if (pureBlackWhite) {
    colorIssues.push("Stark 100% pure black (#000000) and white (#FFFFFF) contrast extreme.");
    colorRecs.push("Inject subtle <5% warm or cool neutral tinting (e.g., #141416 dark canvas, #E0E0E0 text) for eye comfort.");
    colorScore -= 8;
  }
  if (colorIssues.length === 0) {
    colorRecs.push("Sophisticated neutral palette with restrained accent colors and balanced contrast.");
  }

  // --- INTERACTIONS AUDIT ---
  const buttonMatches = code.match(/<button[\s\S]*?<\/button>/gi) || [];
  let missingHoverCount = 0;
  let missingTransitionCount = 0;

  buttonMatches.forEach((btn) => {
    if (!/hover:/i.test(btn)) missingHoverCount++;
    if (!/transition/i.test(btn)) missingTransitionCount++;
  });

  const interactionIssues: string[] = [];
  const interactionRecs: string[] = [];
  let interactionScore = 89;

  if (missingHoverCount > 0) {
    interactionIssues.push(`Found ${missingHoverCount} button(s) lacking explicit hover state feedback ('hover:bg-*').`);
    interactionRecs.push("Add smooth hover state changes (e.g., 'hover:bg-white/10' or 'hover:border-neutral-400') to all buttons.");
    interactionScore -= 12;
  }
  if (missingTransitionCount > 0) {
    interactionIssues.push(`Found ${missingTransitionCount} interactive control(s) lacking transition timing classes.`);
    interactionRecs.push("Include 'transition-all duration-200 ease-out' on interactive elements for fluid state changes.");
    interactionScore -= 8;
  }
  if (interactionIssues.length === 0) {
    interactionRecs.push("Complete interaction states with smooth transition effects and clear cursor feedback.");
  }

  // Normalize scores between 50 and 98
  typographyScore = Math.max(55, Math.min(98, typographyScore));
  scaleScore = Math.max(55, Math.min(98, scaleScore));
  spacingScore = Math.max(55, Math.min(98, spacingScore));
  hierarchyScore = Math.max(55, Math.min(98, hierarchyScore));
  colorScore = Math.max(55, Math.min(98, colorScore));
  interactionScore = Math.max(55, Math.min(98, interactionScore));

  const overallScore = Math.round(
    (typographyScore + scaleScore + spacingScore + hierarchyScore + colorScore + interactionScore) / 6
  );

  // Completion stage label
  let completionStageLabel = "Functional Prototype";
  if (completionStage <= 3) completionStageLabel = "Early Skeleton Concept";
  else if (completionStage >= 8) completionStageLabel = "Polished Production Candidate";

  // 3. AI Slop Alerts Detection
  const aiSlopAlerts: AISlopAlert[] = [];

  if (purpleGradients || /bg-gradient-to-r from-purple/i.test(code)) {
    aiSlopAlerts.push({
      issue: "Generic Purple-to-Blue Linear Gradient",
      severity: "High",
      description: "Overuse of multi-hue linear gradients (purple-to-blue) on buttons and header cards, a hallmark cliché of unrefined AI generation.",
      fix: "Replace 'bg-gradient-to-r from-purple-500 to-blue-500' with a solid matte neutral ('bg-[#1E1E22]') paired with a crisp 1px border."
    });
  }

  if (/●\s*(ONLINE|ACTIVE|LIVE)|CPU:\s*\d+|RAM:\s*\d+|System Status/i.test(code)) {
    aiSlopAlerts.push({
      issue: "Artificial Telemetry & Terminal Noise",
      severity: "High",
      description: "Decorative status indicators ('● ACTIVE', fake CPU/RAM indicators, terminal logs) that clutter the UI without providing real functional utility.",
      fix: "Remove non-functional telemetry labels and green status dots from headers and corner cards."
    });
  }

  if (/rounded-3xl\s+shadow-2xl/i.test(code) || /shadow-2xl\s+bg-white/i.test(code)) {
    aiSlopAlerts.push({
      issue: "Overly Rounded Cards with Heavy Shadows",
      severity: "Medium",
      description: "Combining extreme border radius (rounded-3xl) with dark 2xl drop shadows creates an artificial 'floating bubble' look.",
      fix: "Cap corner radii at 'rounded-xl' (12px) and replace heavy shadows with a refined 1px border ('border border-neutral-800')."
    });
  }

  if (monotonousPadding) {
    aiSlopAlerts.push({
      issue: "Monotonous Robotic Spacing",
      severity: "Medium",
      description: "Identical padding (p-4 or p-6) applied everywhere across buttons, cards, section containers, and headers without layout rhythm.",
      fix: "Establish visual contrast by reducing button padding (py-2 px-4) and increasing outer section padding (p-8 to p-12)."
    });
  }

  if (/text-\[\d+px\]/i.test(code)) {
    aiSlopAlerts.push({
      issue: "Random Arbitrary Font Sizing",
      severity: "High",
      description: "Arbitrary font sizes (e.g. text-[13px], text-[17px]) break mathematical modular scale progression.",
      fix: "Adopt Swiss typographic ratios (Major Third 1.250 or standard Tailwind tokens: text-xs, text-sm, text-base, text-lg, text-xl)."
    });
  }

  if (/(🚀|✨|🔥|⚡|🎉|💡)\s*[A-Z]/i.test(code)) {
    aiSlopAlerts.push({
      issue: "Emoji Clutter in UI Labels",
      severity: "Low",
      description: "Using decorative emojis directly inside section titles or button labels as a visual crutch.",
      fix: "Replace inline emojis with clean SVG icons from Lucide React or sleek typographic hierarchy."
    });
  }

  if (nestedCards > 1) {
    aiSlopAlerts.push({
      issue: "Double-Nested Card Containers",
      severity: "Medium",
      description: "Cards placed inside other cards with identical borders and shadows, causing visually noisy container clutter.",
      fix: "Flatten container depth; use whitespace padding and subtle background color steps instead of nested borders."
    });
  }

  // Fallback Slop alert if none triggered
  if (aiSlopAlerts.length === 0) {
    aiSlopAlerts.push({
      issue: "Minor Typography Tracking Fine-Tuning",
      severity: "Low",
      description: "Heading typography can benefit from tighter letter-spacing for editorial precision.",
      fix: "Apply 'tracking-tight' to all h1, h2, and h3 headings."
    });
  }

  // 4. Micro Feedback Items Generator
  const microFeedback: MicroFeedback[] = [];

  if (purpleGradients) {
    microFeedback.push({
      element: "<button / gradient background>",
      finding: "Saturated multi-hue purple-to-blue linear gradient.",
      beforeCode: "className=\"bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-2xl shadow-xl\"",
      afterCode: "className=\"bg-[#1E1E22] text-[#E0E0E0] hover:bg-[#25252A] px-5 py-2.5 rounded-xl border border-[#2A2A2D] transition-all duration-200\"",
      rationale: "Solid matte dark background with subtle border creates a premium, calm, editorial aesthetic compared to noisy AI gradients."
    });
  }

  if (arbitraryFontSizes.length > 0) {
    microFeedback.push({
      element: "Typography / Custom Font Sizes",
      finding: `Arbitrary font sizing inline overrides (${arbitraryFontSizes[0]}).`,
      beforeCode: `className="${arbitraryFontSizes[0]} font-medium text-gray-700"`,
      afterCode: "className=\"text-sm font-medium tracking-tight text-[#E0E0E0]\"",
      rationale: "Aligning text sizes with standard Tailwind modular tokens (text-xs, text-sm, text-base) preserves baseline rhythm."
    });
  }

  if (missingHoverCount > 0) {
    microFeedback.push({
      element: "<button / interactive control>",
      finding: "Interactive element lacks hover feedback and transition curve.",
      beforeCode: "className=\"bg-neutral-900 text-white px-4 py-2 rounded-lg\"",
      afterCode: "className=\"bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg transition-colors duration-200 cursor-pointer\"",
      rationale: "Hover states and transition duration provide vital visual affordance for modern web applications."
    });
  }

  if (monotonousPadding || missingMaxWidth) {
    microFeedback.push({
      element: "<section / main container>",
      finding: "Container lacks maximum width bounds and spatial rhythm.",
      beforeCode: "className=\"w-full p-4 border rounded-2xl\"",
      afterCode: "className=\"w-full max-w-7xl mx-auto px-6 py-10 rounded-xl border border-[#2A2A2D] bg-[#141416]\"",
      rationale: "Constrains content on ultra-wide desktop monitors while providing comfortable section-level padding."
    });
  }

  if (microFeedback.length < 2) {
    microFeedback.push({
      element: "Heading Typography",
      finding: "Display headings missing negative letter-spacing.",
      beforeCode: "<h1 className=\"text-3xl font-bold text-white\">Project Title</h1>",
      afterCode: "<h1 className=\"text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight\">Project Title</h1>",
      rationale: "Tighter letter spacing (tracking-tight) gives display headers an optical, custom typography feel."
    });
  }

  // 5. Refactoring Developer Prompt Generator
  const aiPrompt = `Refactor and polish the UI/UX of this component according to strict Swiss Minimalist design standards:

1. REMOVE ALL AI SLOP:
   - Eliminate all purple-to-blue linear gradients (from-purple-*, to-blue-*) and replace with matte neutral solids (bg-[#1E1E22] or bg-[#141416]) and 1px borders (border-[#2A2A2D]).
   - Remove fake telemetry indicators, status dots, and decorative emojis inside button titles.
   - Replace heavy drop shadows (shadow-2xl) with subtle 1px hairline borders.

2. SWISS TYPOGRAPHY & MODULAR SCALING:
   - Ensure all text sizes adhere to standard modular scale tokens (text-xs, text-sm, text-base, text-lg, text-xl, text-2xl). Remove custom pixel sizing like text-[13px] or text-[17px].
   - Add 'tracking-tight' to display headings (h1, h2, h3) and 'leading-relaxed' to paragraph body text.
   - Use high-contrast font pairing with customized letter-spacing.

3. SPACING & CONTAINER BOUNDS:
   - Ensure all outer section containers use 'w-full max-w-7xl mx-auto' with generous section padding (py-8 px-6).
   - Ensure button padding adheres to a ~2x horizontal-to-vertical ratio (px-4 py-2 or px-5 py-2.5).

4. CODE INTEGRITY:
   - Modify ONLY styling classes and layout markup. Preserve all React state hooks (useState, useEffect), event handlers (onClick, onSubmit), props, and business logic intact.`;

  return {
    projectName,
    overallScore,
    completionStageLabel,
    categories: {
      typography: {
        score: typographyScore,
        issues: typographyIssues,
        recommendations: typographyRecs,
      },
      typographyScale: {
        score: scaleScore,
        issues: scaleIssues,
        recommendations: scaleRecs,
      },
      spacing: {
        score: spacingScore,
        issues: spacingIssues,
        recommendations: spacingRecs,
      },
      hierarchy: {
        score: hierarchyScore,
        issues: hierarchyIssues,
        recommendations: hierarchyRecs,
      },
      colorHarmony: {
        score: colorScore,
        issues: colorIssues,
        recommendations: colorRecs,
      },
      interactions: {
        score: interactionScore,
        issues: interactionIssues,
        recommendations: interactionRecs,
      },
    },
    aiSlopAlerts,
    microFeedback,
    aiPrompt,
  };
}
