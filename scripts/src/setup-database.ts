/**
 * First-time database setup / seed.
 *
 * Run after the schema has been pushed (`npm run push --workspace @workspace/db`):
 *     npm run setup
 *
 * This seeds the demo staff accounts advertised on the login page plus one demo
 * farmer login, so a fresh local install can be logged into immediately.
 * It is idempotent — existing accounts (matched by email) are left untouched.
 */
import bcrypt from "bcryptjs";
import { db, staffTable, farmersTable } from "@workspace/db";

const DEMO_PASSWORD = "AgroGuard2024!";

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const staff = [
    {
      name: "Dr. Amina Okonkwo",
      email: "amina.okonkwo@agroguard.ng",
      phone: "+2348030000001",
      role: "super_admin",
      department: "Executive",
      status: "active",
      passwordHash,
      mustChangePassword: false,
    },
    {
      name: "Fatima Al-Hassan",
      email: "fatima.alhassan@agroguard.ng",
      phone: "+2348030000002",
      role: "agronomist",
      department: "Agronomy",
      status: "active",
      passwordHash,
      mustChangePassword: false,
    },
    {
      name: "Ibrahim Garba",
      email: "ibrahim.garba@agroguard.ng",
      phone: "+2348030000003",
      role: "staff",
      department: "Field Operations",
      status: "active",
      passwordHash,
      mustChangePassword: false,
    },
  ];

  for (const member of staff) {
    await db
      .insert(staffTable)
      .values(member)
      .onConflictDoNothing({ target: staffTable.email });
  }

  await db
    .insert(farmersTable)
    .values({
      name: "Emeka Chukwu",
      email: "emeka.chukwu@farm.ng",
      phone: "+2348030000010",
      location: "Zaria, Kaduna State",
      farmName: "Green Valley Demo Farm",
      farmSizeHectares: 2.5,
      cropTypes: "Maize, Tomato",
      status: "active",
      passwordHash,
      mustChangePassword: false,
    })
    .onConflictDoNothing({ target: farmersTable.email });

  console.log("Database setup complete. Demo accounts (password: AgroGuard2024!):");
  console.log("  Super Admin : amina.okonkwo@agroguard.ng");
  console.log("  Agronomist  : fatima.alhassan@agroguard.ng");
  console.log("  Staff       : ibrahim.garba@agroguard.ng");
  console.log("  Farmer      : emeka.chukwu@farm.ng");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Database setup failed:", err);
    process.exit(1);
  });
