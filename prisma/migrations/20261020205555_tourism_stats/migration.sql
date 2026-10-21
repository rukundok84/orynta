-- CreateTable
CREATE TABLE "TourismStat" (
    "id" TEXT NOT NULL,
    "indicator" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'visitors',
    "sourceId" TEXT NOT NULL,

    CONSTRAINT "TourismStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TourismStat_indicator_year_idx" ON "TourismStat"("indicator", "year");

-- CreateIndex
CREATE UNIQUE INDEX "TourismStat_indicator_subject_year_key" ON "TourismStat"("indicator", "subject", "year");

-- AddForeignKey
ALTER TABLE "TourismStat" ADD CONSTRAINT "TourismStat_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
