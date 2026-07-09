// web/lib/services/roadmap/fromRow.ts
// export_diagnosis_requests 행(snake_case) → buildRoadmap 입력(camelCase) 매핑.
import type { RoadmapDiagnosis } from "./types";

export interface DiagnosisRoadmapRow {
  eu_compliance_readiness?: string[] | null;
  packaging_readiness?: string[] | null;
  is_selling_in_korea?: string | null;
  certifications?: string[] | null;
  product_files?: unknown[] | null;
}

export function toRoadmapDiagnosis(row: DiagnosisRoadmapRow): RoadmapDiagnosis {
  return {
    euComplianceReadiness: row.eu_compliance_readiness ?? [],
    packagingReadiness: row.packaging_readiness ?? [],
    isSellingInKorea: row.is_selling_in_korea ?? undefined,
    certifications: row.certifications ?? [],
    productFiles: row.product_files ?? [],
  };
}
