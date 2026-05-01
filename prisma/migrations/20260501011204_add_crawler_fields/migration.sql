-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "Jurisdiction" AS ENUM ('FEDERAL', 'WA', 'NT', 'QLD', 'NSW', 'VIC', 'SA', 'TAS', 'ACT');

-- CreateEnum
CREATE TYPE "GrantStatus" AS ENUM ('OPEN', 'CLOSED', 'MONITORING');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('NOT_STARTED', 'RESEARCHING', 'DRAFTING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "GrantSource" AS ENUM ('MANUAL', 'CRAWLED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('APPROVED', 'PENDING_REVIEW', 'REJECTED');

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abn" TEXT,
    "jurisdiction" TEXT,
    "industry" TEXT,
    "indigenousOwnership" BOOLEAN NOT NULL DEFAULT false,
    "turnover" TEXT,
    "tradingDuration" TEXT,
    "employeeCount" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jurisdiction" "Jurisdiction" NOT NULL,
    "administeringBody" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "status" "GrantStatus" NOT NULL DEFAULT 'OPEN',
    "deadline" TEXT,
    "externalLink" TEXT,
    "relevanceRating" INTEGER,
    "description" TEXT NOT NULL,
    "eligibilityCriteria" TEXT,
    "source" "GrantSource" NOT NULL DEFAULT 'MANUAL',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'APPROVED',
    "sourceUrl" TEXT,
    "crawledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grant_checklist_items" (
    "id" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "grant_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grant_process_steps" (
    "id" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "grant_process_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grant_applications" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "notes" TEXT,
    "eligibilityResult" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grant_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "checklistItemId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_authId_key" ON "profiles"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "profiles_companyId_idx" ON "profiles"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_abn_key" ON "companies"("abn");

-- CreateIndex
CREATE UNIQUE INDEX "grants_sourceUrl_key" ON "grants"("sourceUrl");

-- CreateIndex
CREATE INDEX "grants_jurisdiction_idx" ON "grants"("jurisdiction");

-- CreateIndex
CREATE INDEX "grants_status_idx" ON "grants"("status");

-- CreateIndex
CREATE INDEX "grants_reviewStatus_idx" ON "grants"("reviewStatus");

-- CreateIndex
CREATE INDEX "grant_checklist_items_grantId_idx" ON "grant_checklist_items"("grantId");

-- CreateIndex
CREATE INDEX "grant_process_steps_grantId_idx" ON "grant_process_steps"("grantId");

-- CreateIndex
CREATE INDEX "grant_applications_companyId_idx" ON "grant_applications"("companyId");

-- CreateIndex
CREATE INDEX "grant_applications_grantId_idx" ON "grant_applications"("grantId");

-- CreateIndex
CREATE INDEX "grant_applications_status_idx" ON "grant_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "grant_applications_companyId_grantId_key" ON "grant_applications"("companyId", "grantId");

-- CreateIndex
CREATE INDEX "documents_applicationId_idx" ON "documents"("applicationId");

-- CreateIndex
CREATE INDEX "documents_checklistItemId_idx" ON "documents"("checklistItemId");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grant_checklist_items" ADD CONSTRAINT "grant_checklist_items_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "grants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grant_process_steps" ADD CONSTRAINT "grant_process_steps_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "grants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grant_applications" ADD CONSTRAINT "grant_applications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grant_applications" ADD CONSTRAINT "grant_applications_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "grants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "grant_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "grant_checklist_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
