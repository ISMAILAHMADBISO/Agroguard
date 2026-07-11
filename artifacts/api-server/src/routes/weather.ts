import { Router } from "express";
import { z } from "zod/v4";
import { db } from "@workspace/db";
import { farmersTable, farmsTable, devicesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export const weatherRouter = Router();

weatherRouter.get("/", async (req, res) => {
  try {
    const session = (req as any).session || {};
    
    // We will simulate weather for the user's primary farm
    let location = "Abuja, Nigeria";
    
    let lat = 9.05; // Default: Abuja
    let lng = 7.49;
    
    if (session.userType === "farmer" && session.userId) {
      const farms = await db.select().from(farmsTable).where(eq(farmsTable.farmerId, session.userId));
      if (farms.length > 0) {
        location = farms[0].location || location;
        // In a full implementation, you would geocode the location string to lat/lng here.
      }
    }

    try {
      // Fetch real-time weather from Open-Meteo (no API key required)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=precipitation_probability_max&timezone=auto`;
      const meteoRes = await fetch(url);
      
      if (!meteoRes.ok) {
        throw new Error(`Open-Meteo API error: ${meteoRes.status}`);
      }
      
      const data = await meteoRes.json();
      
      const temp = data.current_weather?.temperature ?? 30;
      const weatherCode = data.current_weather?.weathercode ?? 0;
      const precipProb = data.daily?.precipitation_probability_max?.[0] ?? 0;
      
      // WMO Weather interpretation codes: 0-3 (Clear/Cloudy), 51-67 (Rain), 95-99 (Thunderstorm)
      const isRaining = (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 99);
      
      let condition = isRaining ? "Rainy" : temp > 35 ? "Hot & Sunny" : weatherCode <= 3 ? "Clear & Sunny" : "Cloudy";
      let recommendation = isRaining 
        ? "Rain expected. Delay irrigation to conserve water."
        : temp > 35 
        ? "Extreme heat detected. Increase irrigation frequency."
        : "Optimal weather conditions. Maintain regular farming schedule.";

      res.json({
        temperature: Math.round(temp),
        condition,
        precipitationProb: precipProb,
        recommendation,
      });
    } catch (apiError) {
      console.error("Weather API failed, falling back to mock:", apiError);
      
      // Fallback mock if the API fails
      const isRaining = Math.random() > 0.7;
      const temp = Math.floor(Math.random() * 15) + 25; // 25-40C
      const precipProb = isRaining ? Math.floor(Math.random() * 50) + 50 : Math.floor(Math.random() * 20);
      
      let condition = isRaining ? "Rainy" : temp > 35 ? "Hot & Sunny" : "Clear & Sunny";
      let recommendation = isRaining 
        ? "High probability of rain. Delay irrigation to conserve water."
        : temp > 35 
        ? "Extreme heat detected. Increase irrigation frequency."
        : "Optimal weather conditions. Maintain regular farming schedule.";

      res.json({
        temperature: temp,
        condition,
        precipitationProb: precipProb,
        recommendation,
      });
    }
  } catch (error) {
    console.error("Weather error:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});
