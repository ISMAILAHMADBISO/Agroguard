import { db, farmingGuidesTable } from "@workspace/db";

const guides = [
  {
    crop: "rice",
    plantingGuide: "Plant rice seeds 1-2 cm deep in well-prepared, leveled soil. Keep the soil continuously flooded with 2-5 cm of water.",
    fertilizerGuide: "Apply NPK 15-15-15 at planting. Top dress with Urea 3-4 weeks after transplanting and again at panicle initiation.",
    irrigation: "Maintain a continuous flood of 2-5 cm of water. Drain the field 2 weeks before harvesting.",
    diseases: "Rice blast, bacterial blight, and sheath blight. Use resistant varieties and apply appropriate fungicides.",
    pests: "Stem borers, leaf folders, and planthoppers. Monitor regularly and use integrated pest management.",
    harvesting: "Harvest when 80% of the panicles turn straw-colored and the grains in the lower part of the panicle are hard.",
    storage: "Dry paddy to 14% moisture content before storage. Store in cool, dry, and rodent-proof conditions.",
    bestPractices: "Use certified seeds, maintain proper weed control, and practice crop rotation."
  },
  {
    crop: "maize",
    plantingGuide: "Plant seeds 5 cm deep with a spacing of 75 cm between rows and 25 cm between plants.",
    fertilizerGuide: "Apply basal NPK 15-15-15. Top dress with Urea 4 weeks after planting.",
    irrigation: "Ensure adequate moisture especially during silking and tasseling stages. Maize requires about 500-800 mm of water per season.",
    diseases: "Maize streak virus, rust, and leaf blight. Use resistant varieties.",
    pests: "Fall armyworm and stem borers. Use targeted insecticides and biological control.",
    harvesting: "Harvest when the cobs droop and the husks turn brown and dry.",
    storage: "Dry grains to 13-14% moisture content. Store in hermetic bags to prevent weevil damage.",
    bestPractices: "Practice early planting, control weeds early, and use quality hybrid seeds."
  }
];

async function seed() {
  for (const guide of guides) {
    await db.insert(farmingGuidesTable).values(guide).onConflictDoNothing();
  }
  console.log("Seeded farming guides");
  process.exit(0);
}

seed().catch(console.error);
