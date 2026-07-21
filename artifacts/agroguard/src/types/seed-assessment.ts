export interface SeedAssessment {
  id: number;
  farmerId: number | null;
  cropType: string;
  qualityScore: number;
  overallQuality: "Excellent" | "Good" | "Fair" | "Poor";
  confidence: number;
  germinationProbability: number;
  physicalCondition: string;
  seedUniformity: string;
  recommendedSoilType: string;
  recommendedPlantingConditions: string;
  expectedYieldPotential: string;
  recommendation: string;
  images: string[];
  rating: number | null;
  feedback: string | null;
  feedbackDate: string | null;
  createdAt: string;
}
