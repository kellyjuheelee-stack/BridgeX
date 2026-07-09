-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_export_diagnosis_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "position" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "homepageUrl" TEXT,
    "smartStoreUrl" TEXT,
    "instagramUrl" TEXT,
    "annualRevenueRange" TEXT,
    "productName" TEXT NOT NULL,
    "productCategory" TEXT NOT NULL,
    "productFiles" TEXT,
    "hasInci" TEXT NOT NULL,
    "volumeAndPriceRange" TEXT,
    "isSellingInKorea" TEXT NOT NULL,
    "monthlySalesOrBestSeller" TEXT,
    "certifications" TEXT NOT NULL,
    "euComplianceReadiness" TEXT,
    "packagingReadiness" TEXT,
    "targetCountries" TEXT NOT NULL,
    "preferredChannels" TEXT,
    "exportExperience" TEXT NOT NULL,
    "tradeFairExperience" TEXT,
    "hasExistingBuyer" TEXT NOT NULL,
    "painPoints" TEXT NOT NULL,
    "diagnosisStatus" TEXT NOT NULL DEFAULT 'submitted',
    "diagnosisResult" TEXT,
    "adminMemo" TEXT,
    "consultationRequested" BOOLEAN NOT NULL DEFAULT false,
    "consultationRequestedAt" DATETIME,
    "memberId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    CONSTRAINT "export_diagnosis_requests_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_export_diagnosis_requests" ("adminMemo", "annualRevenueRange", "certifications", "companyName", "consultationRequested", "consultationRequestedAt", "contactName", "createdAt", "diagnosisResult", "diagnosisStatus", "email", "euComplianceReadiness", "exportExperience", "hasExistingBuyer", "hasInci", "homepageUrl", "id", "instagramUrl", "isSellingInKorea", "monthlySalesOrBestSeller", "packagingReadiness", "painPoints", "phone", "position", "preferredChannels", "productCategory", "productFiles", "productName", "smartStoreUrl", "submittedAt", "targetCountries", "tradeFairExperience", "updatedAt", "volumeAndPriceRange") SELECT "adminMemo", "annualRevenueRange", "certifications", "companyName", "consultationRequested", "consultationRequestedAt", "contactName", "createdAt", "diagnosisResult", "diagnosisStatus", "email", "euComplianceReadiness", "exportExperience", "hasExistingBuyer", "hasInci", "homepageUrl", "id", "instagramUrl", "isSellingInKorea", "monthlySalesOrBestSeller", "packagingReadiness", "painPoints", "phone", "position", "preferredChannels", "productCategory", "productFiles", "productName", "smartStoreUrl", "submittedAt", "targetCountries", "tradeFairExperience", "updatedAt", "volumeAndPriceRange" FROM "export_diagnosis_requests";
DROP TABLE "export_diagnosis_requests";
ALTER TABLE "new_export_diagnosis_requests" RENAME TO "export_diagnosis_requests";
CREATE INDEX "export_diagnosis_requests_diagnosisStatus_idx" ON "export_diagnosis_requests"("diagnosisStatus");
CREATE INDEX "export_diagnosis_requests_productCategory_idx" ON "export_diagnosis_requests"("productCategory");
CREATE INDEX "export_diagnosis_requests_submittedAt_idx" ON "export_diagnosis_requests"("submittedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
