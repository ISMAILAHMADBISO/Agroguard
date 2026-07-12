/**
 * AgroGuard Site Configuration
 * Central data file for editable landing page content.
 * Update values here to change what appears on the public website.
 */

// ─── Social Media Links ─────────────────────────────────────────────
export const socialLinks = {
  facebook: "https://www.facebook.com/share/1BDF2vHEkH/?mibextid=wwXIfr",
  linkedin: "https://www.linkedin.com/company/agroguard-ltd/",
  instagram: "https://www.instagram.com/agroguard_ltd?igsh=MTAyYzFva29heW5uaA==",
  twitter: "https://x.com/agroguard_ltd",
  website: "https://agroguard.tech",
  email: "iamagroguard@gmail.com",
  phone: "+2347089459265",
} as const;

// ─── Impact Counter Statistics ───────────────────────────────────────
export const impactCounters = [
  { label: "Farmers Reached", value: 5000, suffix: "+" },
  { label: "Pilot Farms", value: 120, suffix: "+" },
  { label: "IoT Devices Deployed", value: 12000, suffix: "+" },
  { label: "Environmental Data Points", value: 1, suffix: "M+", multiplier: 1 },
  { label: "Acres Monitored", value: 8500, suffix: "+" },
] as const;

// ─── Company Info ────────────────────────────────────────────────────
export const companyInfo = {
  about:
    "AgroGuard Ltd. is an agritech company developing intelligent farm monitoring solutions that combine IoT devices, artificial intelligence, environmental sensing, and data analytics to help farmers monitor crops in real time, make informed decisions, reduce losses, and improve productivity.",
  mission:
    "To empower farmers with affordable smart farming technologies that increase productivity, reduce waste, strengthen food security, and promote climate-smart agriculture.",
  vision:
    "To become Africa's leading smart agriculture and farm intelligence platform, transforming agriculture through innovation, data, and technology.",
} as const;

// ─── Trust Points ────────────────────────────────────────────────────
export const trustPoints = [
  {
    icon: "Activity" as const,
    title: "Real-Time Farm Monitoring",
    description: "Track soil conditions, weather, and crop health 24/7 with live sensor data streamed directly to your dashboard.",
  },
  {
    icon: "ShieldCheck" as const,
    title: "AI-Powered Disease Detection",
    description: "Machine learning models trained on African crop diseases detect threats early and recommend preventive action.",
  },
  {
    icon: "Droplets" as const,
    title: "Smart Irrigation Insights",
    description: "Precision moisture data helps you water only when needed, reducing waste and improving crop yield.",
  },
  {
    icon: "CloudSun" as const,
    title: "Weather Monitoring",
    description: "Localized weather forecasts and environmental data help you plan planting, harvesting, and field operations.",
  },
  {
    icon: "Thermometer" as const,
    title: "Environmental Sensing",
    description: "Monitor temperature, humidity, soil pH, nitrogen, phosphorus, and potassium levels in one integrated system.",
  },
  {
    icon: "Bell" as const,
    title: "Early Warning Alerts",
    description: "Instant in-app alerts and receiver unit notifications when conditions reach critical thresholds, so you can act before damage occurs.",
  },
  {
    icon: "LayoutDashboard" as const,
    title: "Cloud Dashboard",
    description: "Access your farm data from any device — phone, tablet, or computer — with a clean, intuitive interface.",
  },
  {
    icon: "Lock" as const,
    title: "Secure Data Management",
    description: "Enterprise-grade encryption and access controls keep your farm data private and protected at all times.",
  },
  {
    icon: "Globe" as const,
    title: "Designed for African Agriculture",
    description: "Built from the ground up for the realities of African farming — rugged hardware, local crops, and local languages.",
  },
] as const;

// ─── Customer Journey Steps ──────────────────────────────────────────
export const customerJourneySteps = [
  {
    step: "01",
    icon: "Package" as const,
    title: "Install AgroGuard Device",
    description: "Mount the rugged, solar-powered AgroGuard Node in your field. It connects automatically and starts sensing.",
  },
  {
    step: "02",
    icon: "Radio" as const,
    title: "Sensors Collect Farm Data",
    description: "The 7-in-1 soil probe continuously reads moisture, temperature, pH, NPK, and conductivity from your soil.",
  },
  {
    step: "03",
    icon: "Cloud" as const,
    title: "Data Sent Securely to Cloud",
    description: "Readings are transmitted over WiFi or LoRa to the AgroGuard cloud platform in real time.",
  },
  {
    step: "04",
    icon: "Brain" as const,
    title: "AI Analyzes Farm Conditions",
    description: "Our AI engine processes your data against regional models to detect risks, diseases, and optimization opportunities.",
  },
  {
    step: "05",
    icon: "Bell" as const,
    title: "Farmers Receive Alerts",
    description: "Get instant dashboard alerts and receiver unit notifications when action is needed.",
  },
  {
    step: "06",
    icon: "TrendingUp" as const,
    title: "Better Decisions, Higher Productivity",
    description: "Make data-driven farming decisions that reduce crop losses, save water, and increase your harvest yield.",
  },
] as const;

// ─── Business Hours ──────────────────────────────────────────────────
export const businessHours = {
  weekdays: "Monday – Friday: 8:00 AM – 6:00 PM",
  weekends: "Saturday: 9:00 AM – 2:00 PM",
  closed: "Sunday: Closed",
} as const;

// ─── Credibility Items ───────────────────────────────────────────────
export const credibilityItems = [
  {
    type: "incubation" as const,
    title: "UNDP Incubation Programme 2025",
    description: "Selected among Top 30 from 200+ applicants for the United Nations Development Programme incubation.",
  },
  {
    type: "award" as const,
    title: "Professor Ogundipe Innovation Challenge",
    description: "Ranked among Top 10 teams at the University of Lagos innovation competition.",
  },
  {
    type: "event" as const,
    title: "NIGCOMSAT Satellite Week 2026",
    description: "Selected among Top 10 startups to pitch at the national satellite technology showcase in Abuja.",
  },
  {
    type: "partner" as const,
    title: "Strategic Partners",
    description: "Partner logos coming soon — collaborating with agricultural agencies, NGOs, and research institutions.",
  },
] as const;
