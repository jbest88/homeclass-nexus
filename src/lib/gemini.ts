import { toast } from "sonner";

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export const generateLearningPlan = async (subject: string, apiKey: string): Promise<string> => {
  try {
    const prompt = `Create a detailed learning plan for ${subject}. Include:
    1. Key topics to cover
    2. Estimated time for each topic
    3. Learning objectives
    4. Practice exercises
    Please format the response in a clear, structured way.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate learning plan");
    }

    const data: GeminiResponse = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error generating learning plan:", error);
    toast.error("Failed to generate learning plan");
    throw error;
  }
};