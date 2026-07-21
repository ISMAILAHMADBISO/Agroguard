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
  },
  {
    crop: "yam",
    plantingGuide: "Plant yam setts or minisetts on mounds or ridges. Ensure good drainage. Spacing depends on sett size, typically 1m x 1m.",
    fertilizerGuide: "Apply NPK 15-15-15 about 6 weeks after planting when sprouting is well established.",
    irrigation: "Requires consistent moisture during early growth, but cannot tolerate waterlogging.",
    diseases: "Yam mosaic virus, anthracnose. Use clean, disease-free planting material.",
    pests: "Yam beetles, nematodes. Practice crop rotation and use treated planting material.",
    harvesting: "Harvest when foliage turns yellow and dries up, typically 6-10 months after planting depending on variety.",
    storage: "Store in a well-ventilated yam barn. Inspect regularly to remove rotting tubers.",
    bestPractices: "Stake vines early to expose leaves to sunlight, increasing yield."
  },
  {
    crop: "cassava",
    plantingGuide: "Plant stem cuttings (20-25 cm long) at an angle on ridges or flat ground. Spacing is usually 1m x 1m.",
    fertilizerGuide: "Apply NPK 15-15-15 at 4-6 weeks after planting.",
    irrigation: "Highly drought-tolerant. Only needs occasional watering during prolonged dry spells.",
    diseases: "Cassava mosaic disease (CMD), cassava brown streak disease. Use resistant varieties.",
    pests: "Cassava mealybug, green mite. Use biological control methods or appropriate pesticides.",
    harvesting: "Harvest 9-18 months after planting, depending on variety and desired starch content.",
    storage: "Process immediately after harvest (within 48 hours) into garri, fufu, or chips, as roots deteriorate rapidly.",
    bestPractices: "Weed early (first 3-4 months) before the canopy closes."
  },
  {
    crop: "sorghum",
    plantingGuide: "Plant seeds 3-5 cm deep. Spacing is usually 75 cm between rows and 15-20 cm between plants.",
    fertilizerGuide: "Apply NPK basal and top dress with urea 4-6 weeks after planting.",
    irrigation: "Drought-tolerant. Performs well with 400-600 mm of rainfall. Requires water mainly during flowering.",
    diseases: "Sorghum downy mildew, anthracnose. Use resistant varieties and seed treatment.",
    pests: "Shoot fly, stem borer. Use early planting and appropriate insecticides.",
    harvesting: "Harvest when grains are hard and moisture content is around 20%.",
    storage: "Dry to 12% moisture. Store in dry, pest-proof containers.",
    bestPractices: "Thin seedlings 2-3 weeks after planting to maintain optimum plant population."
  },
  {
    crop: "millet",
    plantingGuide: "Sow seeds 2-3 cm deep. Spacing 75 cm between rows, 30 cm between plants. Often intercropped.",
    fertilizerGuide: "Requires less fertilizer than maize. Apply moderate NPK at planting.",
    irrigation: "Highly drought-tolerant. Can survive on very little rainfall.",
    diseases: "Downy mildew, ergot, smut. Use resistant varieties.",
    pests: "Stem borer, head caterpillar, birds. Use bird scaring and early harvest.",
    harvesting: "Harvest when the panicles turn brown and seeds are hard.",
    storage: "Dry well to 10-12% moisture. Can be stored for long periods without losing quality.",
    bestPractices: "Ideal for marginal lands with poor soils and low rainfall."
  },
  {
    crop: "cowpea",
    plantingGuide: "Plant seeds 3-4 cm deep. Spacing 60-75 cm between rows and 20 cm between plants.",
    fertilizerGuide: "Fixes its own nitrogen, but responds well to phosphorus (Superphosphate) at planting.",
    irrigation: "Drought-tolerant but needs moisture at flowering and pod filling.",
    diseases: "Anthracnose, cercospora leaf spot, bacterial blight. Use resistant varieties.",
    pests: "Aphids, thrips, Maruca pod borer, bruchids (in storage). Spray insecticides at bud formation and flowering.",
    harvesting: "Harvest when pods are dry and turn brown. Do not delay to avoid shattering.",
    storage: "Treat with appropriate grain protectant or store in hermetic bags (PICS bags) to prevent bruchid damage.",
    bestPractices: "Excellent for crop rotation to improve soil fertility."
  },
  {
    crop: "groundnut",
    plantingGuide: "Plant seeds 5 cm deep in loose, well-drained soils. Spacing 50-75 cm rows, 15-20 cm plants.",
    fertilizerGuide: "Needs calcium (gypsum) at pegging stage for good pod formation. Apply phosphorus at planting.",
    irrigation: "Requires adequate moisture during flowering and pegging stages.",
    diseases: "Rosette virus, early and late leaf spots. Use resistant varieties and fungicides.",
    pests: "Aphids (vector for rosette), termites. Control termites in soil and aphids on leaves.",
    harvesting: "Harvest when the inner shell turns dark and leaves begin to yellow. Avoid late harvesting to prevent sprouting.",
    storage: "Dry pods thoroughly to 8-10% moisture before storing in bags in a dry place.",
    bestPractices: "Avoid planting in heavy clay soils. Weed early but do not disturb the soil during pegging."
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
