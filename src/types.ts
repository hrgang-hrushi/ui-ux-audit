export interface CategoryAudit {
  score: number;
  issues: string[];
  recommendations: string[];
}

export interface AISlopAlert {
  issue: string;
  severity: "High" | "Medium" | "Low" | string;
  description: string;
  fix: string;
}

export interface MicroFeedback {
  element: string;
  finding: string;
  beforeCode: string;
  afterCode: string;
  rationale: string;
}

export interface AuditResponse {
  projectName: string;
  overallScore: number;
  completionStageLabel: string;
  categories: {
    typography: CategoryAudit;
    spacing: CategoryAudit;
    hierarchy: CategoryAudit;
    colorHarmony: CategoryAudit;
    interactions: CategoryAudit;
  };
  aiSlopAlerts: AISlopAlert[];
  microFeedback: MicroFeedback[];
  aiPrompt: string;
}

export interface SavedAudit {
  id: string;
  timestamp: string;
  url?: string;
  completionStage: number;
  data: AuditResponse;
}
