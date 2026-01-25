-- Create Card table
CREATE TABLE "Card" (
    "id" INTEGER NOT NULL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "number" INTEGER NOT NULL,
    "keywords" TEXT[],
    "uprightMeaning" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster lookups
CREATE INDEX "Card_name_idx" ON "Card"("name");

-- Create CardCombination table
CREATE TABLE "CardCombination" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" INTEGER NOT NULL,
    "withCardId" INTEGER NOT NULL,
    "meaning" TEXT NOT NULL,
    "context" TEXT,
    "examples" TEXT[],
    "category" VARCHAR(255),
    "strength" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "CardCombination_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE CASCADE,
    CONSTRAINT "CardCombination_withCardId_fkey" FOREIGN KEY ("withCardId") REFERENCES "Card" ("id") ON DELETE CASCADE,
    CONSTRAINT "CardCombination_cardId_withCardId_key" UNIQUE ("cardId", "withCardId")
);

-- Create indexes on foreign keys
CREATE INDEX "CardCombination_cardId_idx" ON "CardCombination"("cardId");
CREATE INDEX "CardCombination_withCardId_idx" ON "CardCombination"("withCardId");
