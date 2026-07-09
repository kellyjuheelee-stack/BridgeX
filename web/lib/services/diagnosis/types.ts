// web/lib/services/diagnosis/types.ts
import type { ChecklistKey } from "@/lib/constants/diagnosisChecklist";

// 16개 체크 항목의 불리언 + 요약 문구용 회사명
export type ChecklistAnswers = Record<ChecklistKey, boolean> & {
  companyName: string;
};

export interface SectionResult {
  score: number;
  label: string;
  comment: string;
  gaps: string[];
}
export interface Priority {
  label: string;
  note: string;
}
export interface EuStatus {
  haveCount: number;
  total: number;
  missing: string[];
}
export interface ConsultingNeed {
  level: "보통" | "높음";
  pitch: string;
  recommendedTopics: string[];
}

export interface DiagnosisResult {
  isBasic: true;
  overallScore: number;
  readinessLevel: "준비됨" | "부분 준비됨" | "준비 필요";
  summary: string;
  sections: {
    productReadiness: SectionResult;
    euRegulationReadiness: SectionResult;
    salesMaterialReadiness: SectionResult;
    buyerFollowUpReadiness: SectionResult;
  };
  euStatus: EuStatus;
  priorities: Priority[];
  consultingNeed: ConsultingNeed;
  nextActions: string[];
}
