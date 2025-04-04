
import { generateWithAI, AIProvider } from "../services/aiService.ts";

export async function validateQuestions(questionsText: string, aiProvider: AIProvider = 'gemini-2.5-pro-exp-03-25'): Promise<any[]> {
  try {
    // Try to parse the questions as JSON
    try {
      const parsedQuestions = JSON.parse(questionsText);
      
      if (Array.isArray(parsedQuestions)) {
        // Validate that each question has the required fields
        for (const question of parsedQuestions) {
          if (!question.question || !question.type || !question.options || !question.answer) {
            throw new Error("Invalid question format: missing required fields");
          }
        }
        
        return parsedQuestions;
      } else {
        throw new Error("Questions should be an array");
      }
    } catch (parseError) {
      console.error("Error parsing questions:", parseError);
      console.log("Raw questions text:", questionsText);
      
      // If we can't parse the JSON, try to extract and fix the JSON using the AI
      const fixPrompt = `The following text should be valid JSON representing an array of questions, but it has syntax errors. 
Please fix the JSON and return ONLY the fixed, valid JSON array with no additional text or explanations:

${questionsText}`;
      
      const fixedJson = await generateWithAI(fixPrompt, aiProvider);
      
      try {
        // Try to parse the fixed JSON
        const parsedQuestions = JSON.parse(fixedJson);
        
        if (Array.isArray(parsedQuestions)) {
          // Validate fixed questions
          for (const question of parsedQuestions) {
            if (!question.question || !question.type || !question.options || !question.answer) {
              throw new Error("Invalid question format after fixing: missing required fields");
            }
          }
          
          return parsedQuestions;
        } else {
          throw new Error("Fixed questions should be an array");
        }
      } catch (fixedParseError) {
        throw new Error(`Could not parse questions even after fixing: ${fixedParseError.message}`);
      }
    }
  } catch (error) {
    console.error("Error validating questions:", error);
    throw error;
  }
}
