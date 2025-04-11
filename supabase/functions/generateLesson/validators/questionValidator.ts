// Remove AIProvider import as it's no longer used here
import { generateWithAI } from "../services/aiService.ts"; // Ensure path is correct

// Removed aiProvider parameter from the function signature
export async function validateQuestions(questionsText: string): Promise<unknown[]> {
  try {
    // Try to parse the questions as JSON directly
    try {
      const parsedQuestions = JSON.parse(questionsText);

      if (Array.isArray(parsedQuestions)) {
        // Basic validation: Check if it's an array and not empty
        if (parsedQuestions.length === 0) {
            console.warn("Parsed questions array is empty.");
            // Decide if empty array is acceptable or should be an error/retried
            // return []; // Option: return empty if allowed
             throw new Error("Parsed questions array is empty"); // Option: treat as error
        }

        // Validate structure of each question object
        for (let i = 0; i < parsedQuestions.length; i++) {
          const question = parsedQuestions[i];
          // Adjust required fields based on your actual needs per question type
          // This example assumes 'multiple-choice', 'multiple-answer', 'true-false', 'dropdown' might have different required fields
          if (!question || typeof question !== 'object') {
             throw new Error(`Question at index ${i} is not a valid object.`);
          }
          if (!question.question || typeof question.question !== 'string' || question.question.trim() === '') {
            throw new Error(`Invalid or missing 'question' field (string) at index ${i}`);
          }
          if (!question.type || typeof question.type !== 'string' || question.type.trim() === '') {
            throw new Error(`Invalid or missing 'type' field (string) at index ${i} for question: "${question.question}"`);
          }

          // Example: Options required for certain types
          if (['multiple-choice', 'multiple-answer', 'dropdown'].includes(question.type)) {
              if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
                   throw new Error(`Invalid or missing 'options' field (array) at index ${i} for question type ${question.type}: "${question.question}"`);
              }
              // Optionally validate content of options array
          }

          // Example: Answer/correctAnswers required for certain types
          if (['multiple-choice', 'true-false', 'dropdown'].includes(question.type)) {
              if (question.answer === undefined || question.answer === null) { // Check for presence, allow various types potentially
                   throw new Error(`Missing 'answer' field at index ${i} for question type ${question.type}: "${question.question}"`);
              }
          } else if (question.type === 'multiple-answer') {
              if (!question.correctAnswers || !Array.isArray(question.correctAnswers)) { // Allow empty array if valid?
                   throw new Error(`Invalid or missing 'correctAnswers' field (array) at index ${i} for question type ${question.type}: "${question.question}"`);
              }
          }
        }
        console.log("Successfully parsed and validated questions from initial text.");
        return parsedQuestions; // Initial parse and validation successful
      } else {
        // Handle case where parsing succeeded but result wasn't an array
        console.error("Parsed questions structure is not an array:", parsedQuestions);
        throw new Error("Parsed questions data should be a JSON array");
      }
    } catch (parseError) {
      // This block executes if JSON.parse fails or validation throws an error
      console.error("Initial parsing/validation failed:", parseError.message);
      console.log("Raw questions text that failed parsing/validation:", questionsText);

      // Attempt to fix the JSON using the AI (using the hardcoded model via generateWithAI)
      console.log("Attempting to fix JSON using AI...");
      const fixPrompt = `The following text is supposed to be a valid JSON array of question objects. Each object requires at least 'question' (string), 'type' (string), 'options' (array, usually), and 'answer' or 'correctAnswers' fields depending on the type. The text might be malformed, incomplete, or contain extraneous text/markdown formatting. Please analyze the text, correct any JSON syntax errors, remove any surrounding text/markdown, and return ONLY the fixed, valid JSON array. Ensure the output is nothing but the JSON array itself.

Input Text:
\`\`\`
${questionsText}
\`\`\`

Corrected JSON Array:`; // Added context and clear instructions

      // *** Call generateWithAI with ONLY ONE argument (the prompt) ***
      const fixedJson = await generateWithAI(fixPrompt);

      console.log("AI response for fixed JSON length:", fixedJson.length);
      console.log("AI response preview:", fixedJson.substring(0, 200) + "...");

      if (!fixedJson || fixedJson.trim() === '') {
          throw new Error("AI failed to provide a response for fixing JSON.");
      }

      // Try to parse the AI's fixed JSON response
      try {
        // It's possible the AI still includes markdown backticks or explanations
        // Attempt to clean it up defensively before parsing
        let cleanedFixedJson = fixedJson.trim();
        const jsonMatch = cleanedFixedJson.match(/```json\s*([\s\S]*?)\s*```|(\[[\s\S]*\]|\{[\s\S]*\})/); // Look for ```json ... ``` or starting [ or {

        if (jsonMatch) {
            cleanedFixedJson = jsonMatch[1] || jsonMatch[2] || cleanedFixedJson; // Extract content if matched
            cleanedFixedJson = cleanedFixedJson.trim();
             console.log("Extracted potential JSON from AI response:", cleanedFixedJson.substring(0, 200) + "...");
        } else {
            console.warn("Could not definitively extract JSON block from AI response, attempting parse on raw response.");
        }


        const parsedFixedQuestions = JSON.parse(cleanedFixedJson);

        if (Array.isArray(parsedFixedQuestions)) {
          // Basic validation (repeat checks)
           if (parsedFixedQuestions.length === 0) {
               throw new Error("Fixed questions array is empty");
           }
          // Re-validate the structure of the fixed questions (can reuse validation logic)
          for (let i = 0; i < parsedFixedQuestions.length; i++) {
             const question = parsedFixedQuestions[i];
              if (!question || typeof question !== 'object') throw new Error(`Fixed question at index ${i} is not a valid object.`);
              if (!question.question || typeof question.question !== 'string') throw new Error(`Invalid/missing 'question' field (string) in fixed question at index ${i}`);
              if (!question.type || typeof question.type !== 'string') throw new Error(`Invalid/missing 'type' field (string) in fixed question at index ${i}`);
              // Add more validation as needed based on required fields for fixed questions
              if (['multiple-choice', 'multiple-answer', 'dropdown'].includes(question.type)) {
                  if (!question.options || !Array.isArray(question.options)) throw new Error(`Invalid/missing 'options' field (array) in fixed question at index ${i}`);
              }
              if (['multiple-choice', 'true-false', 'dropdown'].includes(question.type)) {
                   if (question.answer === undefined || question.answer === null) throw new Error(`Missing 'answer' field in fixed question at index ${i}`);
              } else if (question.type === 'multiple-answer') {
                   if (!question.correctAnswers || !Array.isArray(question.correctAnswers)) throw new Error(`Invalid/missing 'correctAnswers' field (array) in fixed question at index ${i}`);
              }
          }
          console.log("Successfully parsed and validated questions after AI fix.");
          return parsedFixedQuestions; // Return successfully fixed and validated questions
        } else {
          console.error("AI-fixed questions structure is not an array:", parsedFixedQuestions);
          throw new Error("AI-fixed questions data should be a JSON array, but wasn't.");
        }
      } catch (fixedParseError) {
        console.error("Error parsing AI-fixed JSON:", fixedParseError);
        console.log("AI response that failed parsing:", fixedJson); // Log the raw AI response
        throw new Error(`Could not parse questions even after AI fixing attempt: ${fixedParseError.message}`);
      }
    }
  } catch (error) {
    // Catch errors thrown from within the try blocks or the final catch block
    console.error("Error during question validation process:", error);
    // Re-throw the error to be handled by the caller (lessonService)
    throw error;
  }
}