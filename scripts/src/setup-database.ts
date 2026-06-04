/**
 * First-time database setup / seed.
 *
 * Run after the schema has been pushed (`npm run push --workspace @workspace/db`):
 *     npm run setup
 *
 * This seeds:
 *   - the demo staff accounts advertised on the login page,
 *   - one demo farmer login,
 *   - a demo 7-in-1 device assigned to that farmer with 24h of readings, and
 *   - a few demo AI recommendations,
 * so a fresh install can be logged into and explored immediately (no blank pages).
 *
 * It is idempotent — existing accounts (matched by email / hardware id) are left
 * untouched, and the device/readings/recommendations are only seeded once.
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import {
  db,
  staffTable,
  farmersTable,
  devicesTable,
  sensorReadingsTable,
  recommendationsTable,
} from "@workspace/db";

const DEMO_PASSWORD = "AgroGuard2024!";
const DEMO_FARMER_EMAIL = "emeka.chukwu@farm.ng";
const DEMO_DEVICE_ID = "AGR-DEMO-0001";

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const staff = [
    { name: "Ismail Ahmad", email: "ismail.ahmad@agroguard.ng", phone: "+2348030000001", role: "super_admin", department: "Executive", status: "active", passwordHash, mustChangePassword: false },
    { name: "Usman Umar", email: "usman.umar@agroguard.ng", phone: "+2348030000002", role: "admin", department: "Technology", status: "active", passwordHash, mustChangePassword: false },
    { name: "Sadiya Ladan", email: "sadiya.ladan@agroguard.ng", phone: "+2348030000003", role: "agronomist", department: "Agronomy", status: "active", passwordHash, mustChangePassword: false },
    { name: "Ibrahim Garba", email: "ibrahim.garba@agroguard.ng", phone: "+2348030000004", role: "staff", department: "Field Operations", status: "active", passwordHash, mustChangePassword: false },
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
      email: DEMO_FARMER_EMAIL,
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

  // Resolve the demo farmer id (needed for the device + recommendations FKs).
  const [farmer] = await db
    .select()
    .from(farmersTable)
    .where(eq(farmersTable.email, DEMO_FARMER_EMAIL));

  if (farmer) {
    await seedDeviceAndReadings(farmer.id);
    await seedRecommendations(farmer.id);
  }

  console.log("Database setup complete. Demo accounts (password: AgroGuard2024!):");
  console.log("  Super Admin : ismail.ahmad@agroguard.ng");
  console.log("  Admin       : usman.umar@agroguard.ng");
  console.log("  Agronomist  : sadiya.ladan@agroguard.ng");
  console.log("  Staff       : ibrahim.garba@agroguard.ng");
  console.log("  Farmer      : emeka.chukwu@farm.ng");
}

/** Seed one demo 7-in-1 device assigned to the farmer plus 24h of readings. */
async function seedDeviceAndReadings(farmerId: number): Promise<void> {
  await db
    .insert(devicesTable)
    .values({
      deviceId: DEMO_DEVICE_ID,
      name: "Green Valley Field A",
      farmerId,
      location: "Zaria, Kaduna State",
      status: "online",
      lastSeenAt: new Date(),
      firmwareVersion: "1.2.0",
      batteryLevel: 86,
      notes: "Demo 7-in-1 RS485 soil sensor node (seeded).",
    })
    .onConflictDoNothing({ target: devicesTable.deviceId });

  const [device] = await db
    .select()
    .from(devicesTable)
    .where(eq(devicesTable.deviceId, DEMO_DEVICE_ID));
  if (!device) return;

  // Only seed readings once.
  const existing = await db
    .select({ id: sensorReadingsTable.id })
    .from(sensorReadingsTable)
    .where(eq(sensorReadingsTable.deviceId, device.id))
    .limit(1);
  if (existing.length > 0) return;

  // Generate one reading every 30 minutes for the last 24 hours.
  const now = Date.now();
  const points = 48;
  const rows = [];
  for (let i = points; i >= 0; i--) {
    const t = new Date(now - i * 30 * 60 * 1000);
    // Smooth daily cycles with small noise for realistic-looking charts.
    const phase = (i / points) * Math.PI * 2;
    const moisture = 38 + Math.sin(phase) * 8 + rand(-1.5, 1.5);
    const temperature = 28 + Math.sin(phase + 1) * 5 + rand(-0.8, 0.8);
    const humidity = 60 + Math.sin(phase + 2) * 12 + rand(-2, 2);
    rows.push({
      deviceId: device.id,
      soilMoisture: round1(moisture),
      temperature: round1(temperature),
      humidity: round1(humidity),
      heatIndex: round1(temperature + (humidity > 60 ? 1.5 : 0.5)),
      electricalConductivity: round1(180 + rand(-20, 20)),
      ph: round1(6.4 + rand(-0.3, 0.3)),
      nitrogen: Math.round(75 + rand(-10, 10)),
      phosphorus: Math.round(32 + rand(-6, 6)),
      potassium: Math.round(140 + rand(-15, 15)),
      rainfall: null,
      lightIntensity: null,
      recordedAt: t,
    });
  }
  await db.insert(sensorReadingsTable).values(rows);
}

/** Seed a few demo AI recommendations so the page is not blank. */
async function seedRecommendations(farmerId: number): Promise<void> {
  const existing = await db
    .select({ id: recommendationsTable.id })
    .from(recommendationsTable)
    .where(eq(recommendationsTable.farmerId, farmerId))
    .limit(1);
  if (existing.length > 0) return;

  await db.insert(recommendationsTable).values([
    {
      farmerId,
      category: "irrigation",
      title: "Increase irrigation on Field A",
      description:
        "Soil moisture dipped below 30% during the afternoon. Apply 15–20mm of water in the early morning to reduce evaporation loss and avoid heat stress on the maize.",
      priority: "high",
      status: "pending",
    },
    {
      farmerId,
      category: "fertilizer",
      title: "Top-dress with nitrogen",
      description:
        "Available nitrogen is trending toward the low end for maize at this growth stage. A split urea top-dressing of 50kg/ha will support vegetative growth.",
      priority: "medium",
      status: "pending",
    },
    {
      farmerId,
      category: "pest",
      title: "Scout for fall armyworm",
      description:
        "Warm, humid conditions favour fall armyworm. Inspect leaf whorls twice this week and apply a recommended biopesticide if egg masses are found.",
      priority: "medium",
      status: "pending",
    },
    {
      farmerId,
      category: "crop",
      title: "Soil pH is in the optimal band",
      description:
        "Soil pH is steady around 6.4, which is ideal for maize and tomato. No liming is required this season; maintain current practices.",
      priority: "low",
      status: "applied",
      appliedAt: new Date(),
    },
  ]);
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Database setup failed:", err);
    process.exit(1);
  });
