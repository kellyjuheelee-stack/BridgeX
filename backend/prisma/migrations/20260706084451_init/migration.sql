-- CreateTable
CREATE TABLE "export_diagnosis_requests" (
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
    "targetCountries" TEXT NOT NULL,
    "preferredChannels" TEXT,
    "exportExperience" TEXT NOT NULL,
    "tradeFairExperience" TEXT,
    "hasExistingBuyer" TEXT NOT NULL,
    "painPoints" TEXT NOT NULL,
    "diagnosisStatus" TEXT NOT NULL DEFAULT 'submitted',
    "diagnosisResult" TEXT,
    "adminMemo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME
);

-- CreateIndex
CREATE INDEX "export_diagnosis_requests_diagnosisStatus_idx" ON "export_diagnosis_requests"("diagnosisStatus");

-- CreateIndex
CREATE INDEX "export_diagnosis_requests_productCategory_idx" ON "export_diagnosis_requests"("productCategory");

-- CreateIndex
CREATE INDEX "export_diagnosis_requests_submittedAt_idx" ON "export_diagnosis_requests"("submittedAt");
