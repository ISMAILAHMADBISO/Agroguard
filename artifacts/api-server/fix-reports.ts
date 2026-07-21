import { db, diseaseReportsTable } from "@workspace/db";
import { isNull } from "drizzle-orm";

async function fix() {
  await db.update(diseaseReportsTable)
    .set({ cropType: "tomato" })
    .where(isNull(diseaseReportsTable.cropType));
    
  console.log("Fixed old reports");
  process.exit(0);
}

fix().catch(console.error);
