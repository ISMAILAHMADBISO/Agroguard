import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query(`
      ALTER TABLE "farmers" ADD COLUMN IF NOT EXISTS "subscription_plan" text DEFAULT 'free' NOT NULL;
      ALTER TABLE "farmers" ADD COLUMN IF NOT EXISTS "subscription_start_date" timestamp with time zone;
      ALTER TABLE "farmers" ADD COLUMN IF NOT EXISTS "subscription_expiry_date" timestamp with time zone;
      ALTER TABLE "farmers" ADD COLUMN IF NOT EXISTS "ai_chat_usage_count" integer DEFAULT 0 NOT NULL;
      ALTER TABLE "farmers" ADD COLUMN IF NOT EXISTS "ai_disease_usage_count" integer DEFAULT 0 NOT NULL;
      
      UPDATE "farmers" SET "subscription_plan" = 'premium' WHERE "is_premium" = true;
      
      ALTER TABLE "farmers" DROP COLUMN IF EXISTS "is_premium";
      ALTER TABLE "farmers" DROP COLUMN IF EXISTS "ai_usage_count";
      
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" serial PRIMARY KEY,
        "farmer_id" integer NOT NULL REFERENCES "farmers"("id"),
        "paystack_reference" text NOT NULL UNIQUE,
        "plan" text NOT NULL,
        "amount" real NOT NULL,
        "status" text DEFAULT 'success' NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    console.log("Migration complete");
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
