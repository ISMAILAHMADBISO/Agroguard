export interface DiseaseForecast {
  id: number;
  farmerId: number | null;
  cropType: string;
  predictedDisease: string;
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  probability: number;
  confidence: "Low" | "Medium" | "High" | "Very High";
  expectedTimeWindow: string;
  forecastDrivers: string[];
  recommendedActions: string[];
  weatherSummary: string;
  occurred: "Yes" | "No" | "Partially" | null;
  createdBy: number;
  createdByType: "staff" | "farmer";
  createdAt: string;
}
