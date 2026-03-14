const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function migrate() {
  try {
    // Create enums
    await db.execute(`CREATE TYPE IF NOT EXISTS "tier" AS ENUM ('free', 'unlimited')`);
    await db.execute(`CREATE TYPE IF NOT EXISTS "membership_status" AS ENUM ('active', 'cancelled', 'expired')`);
    
    // Create memberships table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "memberships" (
        "user_id" text PRIMARY KEY NOT NULL,
        "tier" "tier" DEFAULT 'free' NOT NULL,
        "status" "membership_status" DEFAULT 'active' NOT NULL,
        "started_at" timestamp DEFAULT now() NOT NULL,
        "expires_at" timestamp,
        "kofi_transaction_id" text,
        "kofi_email" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);
    
    // Add foreign key
    await db.execute(`
      ALTER TABLE "memberships" 
      ADD CONSTRAINT IF NOT EXISTS "memberships_user_id_user_id_fk" 
      FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") 
      ON DELETE cascade ON UPDATE no action
    `);
    
    // Drop old user_supporter table if it exists
    await db.execute(`DROP TABLE IF EXISTS "user_supporter"`);
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
