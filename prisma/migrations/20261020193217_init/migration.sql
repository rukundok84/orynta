-- CreateEnum
CREATE TYPE "OpportunityCategory" AS ENUM ('EDUCATION', 'TOURISM', 'EVENT', 'BUSINESS', 'RESEARCH');

-- CreateEnum
CREATE TYPE "RwandaProvince" AS ENUM ('KIGALI_CITY', 'SOUTHERN', 'NORTHERN', 'EASTERN', 'WESTERN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'UNVERIFIED', 'PENDING_REVIEW');

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "description" TEXT,
    "citation" TEXT,
    "referencePeriod" TEXT,
    "geographicCoverage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "OpportunityCategory" NOT NULL,
    "locationName" TEXT NOT NULL,
    "province" "RwandaProvince" NOT NULL,
    "district" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "priceRwf" INTEGER,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "tags" TEXT[],
    "keywords" TEXT,
    "websiteUrl" TEXT,
    "sourceId" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "isSampleData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Opportunity_category_idx" ON "Opportunity"("category");

-- CreateIndex
CREATE INDEX "Opportunity_province_idx" ON "Opportunity"("province");

-- CreateIndex
CREATE INDEX "Opportunity_name_idx" ON "Opportunity"("name");

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
