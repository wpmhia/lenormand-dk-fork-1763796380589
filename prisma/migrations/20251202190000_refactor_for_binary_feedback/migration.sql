-- Drop old tables that won't be used
DROP TABLE IF EXISTS "few_shot_examples";
DROP TABLE IF EXISTS "optimization_metrics";

-- Modify Feedback table to support binary feedback
ALTER TABLE "feedback"
DROP COLUMN IF EXISTS "type",
DROP COLUMN IF EXISTS "quality_score",
DROP COLUMN IF EXISTS "used_for_optimization",
DROP COLUMN IF EXISTS "optimization_notes",
DROP COLUMN IF EXISTS "updated_at";

-- Rename spreadId to spread_id if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='feedback' AND column_name='spreadId') THEN
        ALTER TABLE "feedback" RENAME COLUMN "spreadId" TO "spread_id";
    END IF;
END $$;

ALTER TABLE "feedback"
ADD COLUMN IF NOT EXISTS "is_helpful" BOOLEAN,
ADD COLUMN IF NOT EXISTS "prompt_temperature" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "prompt_variant" TEXT;

-- Create PromptVariant table
CREATE TABLE "prompt_variants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "spread_id" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "prompt_template" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "total_readings_generated" INTEGER NOT NULL DEFAULT 0,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "unhelpful_count" INTEGER NOT NULL DEFAULT 0,
    "helpfulness_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_variants_pkey" PRIMARY KEY ("id")
);

-- Create FeedbackPattern table
CREATE TABLE "feedback_patterns" (
    "id" TEXT NOT NULL,
    "spread_id" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "total_occurrences" INTEGER NOT NULL DEFAULT 0,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "helpfulness_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insights" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_patterns_pkey" PRIMARY KEY ("id")
);

-- Create new OptimizationMetrics table
CREATE TABLE "optimization_metrics" (
    "id" TEXT NOT NULL,
    "period_start_date" TIMESTAMP(3) NOT NULL,
    "period_end_date" TIMESTAMP(3) NOT NULL,
    "spread_id" TEXT NOT NULL,
    "total_feedback_collected" INTEGER NOT NULL,
    "helpful_count" INTEGER NOT NULL,
    "unhelpful_count" INTEGER NOT NULL,
    "helpfulness_rate" DOUBLE PRECISION NOT NULL,
    "best_performing_variant" TEXT,
    "improvement_since_last_period" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "optimization_metrics_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "prompt_variants_name_key" ON "prompt_variants"("name");
CREATE INDEX "prompt_variants_spread_id_idx" ON "prompt_variants"("spread_id");
CREATE INDEX "prompt_variants_is_active_idx" ON "prompt_variants"("is_active");
CREATE INDEX "prompt_variants_helpfulness_rate_idx" ON "prompt_variants"("helpfulness_rate");

CREATE UNIQUE INDEX "feedback_patterns_spread_id_pattern_key" ON "feedback_patterns"("spread_id", "pattern");
CREATE INDEX "feedback_patterns_helpfulness_rate_idx" ON "feedback_patterns"("helpfulness_rate");

CREATE UNIQUE INDEX "optimization_metrics_period_start_date_period_end_date_spread_key" ON "optimization_metrics"("period_start_date", "period_end_date", "spread_id");
CREATE INDEX "optimization_metrics_spread_id_idx" ON "optimization_metrics"("spread_id");

CREATE INDEX IF NOT EXISTS "feedback_is_helpful_idx" ON "feedback"("is_helpful");
CREATE INDEX IF NOT EXISTS "feedback_spread_id_idx" ON "feedback"("spread_id");
CREATE INDEX IF NOT EXISTS "feedback_prompt_variant_idx" ON "feedback"("prompt_variant");
