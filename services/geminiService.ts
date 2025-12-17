
import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export async function getPiInsight(stats: { total: number; square: number; estimate: number; error: number }) {
  const ai = getAiClient();
  const prompt = `I am running a Monte Carlo simulation to calculate Pi using a circle with an inscribed square.
  Current Statistics:
  - Total balls dropped (all in circle): ${stats.total}
  - Balls landed inside the inscribed square: ${stats.square}
  - Current Pi estimation: ${stats.estimate.toFixed(6)}
  - Percentage Error: ${(stats.error * 100).toFixed(4)}%

  Provide a brief, witty, and educational mathematical insight about these results. Explain why the approximation improves with more samples or comment on the current accuracy. Keep it under 60 words.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The laws of probability are currently contemplating your request. Try dropping more balls!";
  }
}
