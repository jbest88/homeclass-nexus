import { generateWithAI } from "../services/aiService.ts";

export async function validateQuestions(questionsText: string, provider = 'gemini-pro', apiKey?: string): Promise<any[]> {
  try {
    // Parse the raw questions text into a structured format
    console.log("Parsing raw questions...");
    const rawQuestions = JSON.parse(questionsText);

    if (!Array.isArray(rawQuestions)) {
      throw new Error("Questions must be an array");
    }

    const questions = rawQuestions.map((rawQuestion) => {
      const { type } = rawQuestion;

      switch (type) {
        case "multiple-choice":
          return {
            type: "multiple-choice",
            question: rawQuestion.question,
            options: rawQuestion.options,
            correctAnswer: rawQuestion.correctAnswer,
          };
        case "multiple-answer":
          return {
            type: "multiple-answer",
            question: rawQuestion.question,
            options: rawQuestion.options,
            correctAnswers: rawQuestion.correctAnswers,
          };
        case "text":
          return {
            type: "text",
            question: rawQuestion.question,
            correctAnswer: rawQuestion.correctAnswer,
          };
        case "true-false":
          return {
            type: "true-false",
            question: rawQuestion.question,
            correctAnswer: rawQuestion.correctAnswer,
          };
        case "dropdown":
          return {
            type: "dropdown",
            question: rawQuestion.question,
            options: rawQuestion.options,
            correctAnswer: rawQuestion.correctAnswer,
          };
        default:
          throw new Error(`Unsupported question type: ${type}`);
      }
    });

    // Run AI validation on the questions
    console.log("Running AI validation on questions...");
    
    const validationResults = await Promise.all(
      questions.map(question => validateQuestionWithAI(question, provider, apiKey))
    );
    
    // Apply AI validation results to the questions
    for (let i = 0; i < questions.length; i++) {
      const validationResult = validationResults[i];
      questions[i].isValid = validationResult.isCorrect;
      questions[i].validationExplanation = validationResult.explanation;
    }
    
    return questions;
  } catch (error) {
    console.error("Error validating questions:", error);
    throw error;
  }
}

export async function validateQuestionWithAI(question: any, provider = 'gemini-pro', apiKey?: string) {
  try {
    const { type, question: questionText } = question;
    let prompt = `You are an expert teacher. Please validate the following question and provide a brief explanation.
      Question type: ${type}
      Question: ${questionText}\n`;

    switch (type) {
      case "multiple-choice":
        prompt += `Options: ${question.options.join(", ")}\nCorrect Answer: ${question.correctAnswer}`;
        break;
      case "multiple-answer":
        prompt += `Options: ${question.options.join(", ")}\nCorrect Answers: ${question.correctAnswers.join(", ")}`;
        break;
      case "text":
        prompt += `Correct Answer: ${question.correctAnswer}`;
        break;
      case "true-false":
        prompt += `Correct Answer: ${question.correctAnswer}`;
        break;
      case "dropdown":
        prompt += `Options: ${question.options.join(", ")}\nCorrect Answer: ${question.correctAnswer}`;
        break;
    }
    
    prompt += `\nIs this a valid question? Answer with JSON format: { "isCorrect": true/false, "explanation": "Explanation here" }`;
    
    console.log(`Sending validation prompt to ${provider.charAt(0).toUpperCase() + provider.slice(1)}:`, prompt);
    
    // Use the provider and apiKey parameters for the API call
    // This will depend on your implementation of the API call function
    // For example:
    let validationResult;
    if (provider === 'openai') {
      validationResult = await validateWithOpenAI(prompt, apiKey);
    } else {
      // Default to using Gemini
      validationResult = await validateWithGemini(prompt, apiKey);
    }
    
    // Parse the AI's response
    try {
      return JSON.parse(validationResult);
    } catch (error) {
      console.error("Failed to parse AI response:", validationResult);
      return {
        isCorrect: false,
        explanation: "Failed to parse AI response."
      };
    }
    
    return validationResult;
  } catch (error) {
    console.error(`Error validating question with AI:`, error);
    throw error;
  }
}

// Add implementation of these validation functions based on your API service

async function validateWithGemini(prompt: string, apiKey?: string) {
  // Implementation to validate with Gemini API
  // Use apiKey if provided, otherwise use environment variable
  const geminiApiKey = apiKey || Deno.env.get("GEMINI_API_KEY");
  if (!geminiApiKey) {
    throw new Error("Gemini API key is not configured");
  }

  try {
    const response = await generateWithAI(prompt, 'gemini-pro', geminiApiKey);
    return response;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

async function validateWithOpenAI(prompt: string, apiKey?: string) {
  // Implementation to validate with OpenAI API
  // Use apiKey if provided, otherwise use environment variable
  const openAIApiKey = apiKey || Deno.env.get("OPENAI_API_KEY");
  if (!openAIApiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  try {
    const response = await generateWithAI(prompt, 'openai', openAIApiKey);
    return response;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}
