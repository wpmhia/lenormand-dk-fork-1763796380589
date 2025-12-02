-- CreateTable
CREATE TABLE "readings" (
    "id" TEXT NOT NULL,
    "request" JSONB NOT NULL,
    "response" JSONB NOT NULL,
    "duration" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "question" TEXT,
    "spreadId" TEXT,
    "cards" JSONB,
    "readingText" TEXT,
    "translationText" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readingId" TEXT,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_readings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "question" TEXT NOT NULL,
    "spread_id" TEXT NOT NULL,
    "cards" JSONB NOT NULL,
    "layout_type" INTEGER NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_interpretations" (
    "id" TEXT NOT NULL,
    "reading_id" TEXT NOT NULL,
    "reading_text" TEXT NOT NULL,
    "practical_translation" TEXT,
    "deadline" TEXT,
    "task" TEXT,
    "timing_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interpretations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_readings_user_id_idx" ON "user_readings"("user_id");

-- CreateIndex
CREATE INDEX "ai_interpretations_reading_id_idx" ON "ai_interpretations"("reading_id");

-- AddForeignKey
ALTER TABLE "user_readings" ADD CONSTRAINT "user_readings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interpretations" ADD CONSTRAINT "ai_interpretations_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "user_readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
