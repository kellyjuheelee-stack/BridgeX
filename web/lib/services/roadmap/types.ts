// web/lib/services/roadmap/types.ts
// 수출 실행 로드맵 엔진의 타입 정의.

export type StepTag = "self" | "expert" | "hybrid";
export type StepPhase = "foundation" | "sales" | "buyer";
export type LinkType = "info" | "tool" | "consulting" | "soon";

export interface StepLink {
  type: LinkType;
  href?: string;
  label?: string;
}

// buildRoadmap 입력 진단 형태 (레거시 camelCase 필드와 동일).
export interface RoadmapDiagnosis {
  euComplianceReadiness?: string[];
  packagingReadiness?: string[];
  isSellingInKorea?: string;
  certifications?: string[];
  productFiles?: unknown[];
}

export interface RoadmapStep {
  id: string;
  phase: StepPhase;
  title: string;
  tag: StepTag;
  link: StepLink;
  derivedDone: boolean;
  done: boolean;
  comment: string;
}

export interface RoadmapProgressSummary {
  total: number;
  doneCount: number;
  expertRemaining: number;
  percent: number;
}

export interface RoadmapResult {
  steps: RoadmapStep[];
  progress: RoadmapProgressSummary;
}

// 회원 진행상태 저장 형태: { "<stepId>": { done, doneAt } }
export type RoadmapProgress = Record<
  string,
  { done: boolean; doneAt: string | null } | undefined
>;
