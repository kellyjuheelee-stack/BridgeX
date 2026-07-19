// web/app/(public)/diagnose/sample/page.tsx
// "샘플 보기" — 진단 결과 PDF(세로 1페이지)를 가상 데이터로 생성해 화면에 미리보기로 보여준다.
// 폼 자동입력 대신, 사용자가 실제 산출물(리포트)이 어떤 모습인지 바로 확인할 수 있게 한다.
import { generateDiagnosis } from "@/lib/services/diagnosis/generateDiagnosis";
import type { ChecklistAnswers } from "@/lib/services/diagnosis/types";
import { DIAGNOSE_EXAMPLES } from "../exampleData";
import PdfSummary from "../result/[id]/PdfSummary";
import SamplePreviewActions from "./SamplePreviewActions";
import styles from "../result/[id]/result.module.css";

export const metadata = {
  title: "BridgeX 수출 준비도 진단 — 샘플 리포트",
};

export default function SamplePreviewPage() {
  // 부분 준비된 세트(B)가 KPI·미비 요건 등 리포트 구성 요소를 골고루 보여줘 샘플로 적합
  const ex = DIAGNOSE_EXAMPLES[1] ?? DIAGNOSE_EXAMPLES[0];
  const answers = { companyName: ex.companyName, ...ex.checks } as ChecklistAnswers;
  const result = generateDiagnosis(answers);

  return (
    <main className={styles.pdfPreviewPage}>
      <div className={styles.pdfPreviewBar}>
        <p className={styles.pdfPreviewNote}>
          샘플 리포트 미리보기 · 실제 진단 시 입력하신 브랜드 정보로 생성됩니다
        </p>
        <SamplePreviewActions />
      </div>
      <div className={styles.pdfPaper}>
        <PdfSummary
          companyName={ex.companyName}
          result={result}
          answers={ex.checks as unknown as Record<string, boolean>}
        />
      </div>
    </main>
  );
}
