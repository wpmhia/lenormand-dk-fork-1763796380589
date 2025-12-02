/*
  Warnings:

  - You are about to drop the column `readingId` on the `feedback` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `feedback` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "feedback" DROP COLUMN "readingId",
ADD COLUMN     "ai_interpretation_id" TEXT,
ADD COLUMN     "optimization_notes" TEXT,
ADD COLUMN     "quality_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "used_for_optimization" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "user_reading_id" TEXT;

-- CreateTable
CREATE TABLE "few_shot_examples" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "cards" JSONB NOT NULL,
    "spread_id" TEXT NOT NULL,
    "excellent_response" TEXT NOT NULL,
    "source_reading_id" TEXT,
    "source_feedback_id" TEXT,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "average_quality_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "few_shot_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_metrics" (
    "id" TEXT NOT NULL,
    "period_start_date" TIMESTAMP(3) NOT NULL,
    "period_end_date" TIMESTAMP(3) NOT NULL,
    "total_feedback_collected" INTEGER NOT NULL,
    "average_quality_score" DOUBLE PRECISION NOT NULL,
    "excellent_readings_percent" DOUBLE PRECISION NOT NULL,
    "unhelpful_readings_percent" DOUBLE PRECISION NOT NULL,
    "few_shot_examples_generated" INTEGER NOT NULL,
    "readings_optimized_with" INTEGER NOT NULL,
    "average_improvement_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "optimization_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "few_shot_examples_spread_id_idx" ON "few_shot_examples"("spread_id");

-- CreateIndex
CREATE INDEX "few_shot_examples_is_active_idx" ON "few_shot_examples"("is_active");

-- CreateIndex
CREATE INDEX "few_shot_examples_average_quality_score_idx" ON "few_shot_examples"("average_quality_score");

-- CreateIndex
CREATE INDEX "optimization_metrics_period_start_date_idx" ON "optimization_metrics"("period_start_date");

-- CreateIndex
CREATE INDEX "feedback_type_idx" ON "feedback"("type");

-- CreateIndex
CREATE INDEX "feedback_quality_score_idx" ON "feedback"("quality_score");

-- CreateIndex
CREATE INDEX "feedback_used_for_optimization_idx" ON "feedback"("used_for_optimization");
