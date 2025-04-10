// prompts/combinedLessonPrompt.ts

// Assuming these utility functions are in a file named gradeUtils.ts within the same directory or accessible path
import { getPiagetStage, getGradeLevelExpectations } from './gradeUtils.ts';

/**
 * Creates a prompt asking the AI to generate a complete lesson (title, content, questions)
 * as a single JSON object, incorporating detailed content and question requirements.
 *
 * @param subject The subject of the lesson.
 * @param gradeLevelText The target grade level (e.g., "Grade 5", "Kindergarten").
 * @param isPlacementTest If true, tailor content/questions for a placement test.
 * @returns The prompt string for the single AI call.
 */
export function createCombinedLessonPrompt(
  subject: string,
  gradeLevelText: string,
  isPlacementTest: boolean = false
): string {
  const lessonType = isPlacementTest ? "placement test" : "lesson plan";
  const questionCount = 5; // Define how many questions you want
  const piagetStage = getPiagetStage(gradeLevelText); // Get cognitive stage info
  const gradeExpectations = getGradeLevelExpectations(gradeLevelText); // Get academic expectations

  // Define the expected JSON output structure clearly for the AI
  const jsonStructure = `{
  "title": "string (A concise, descriptive title for the ${lessonType}, without prefixes like 'Title:')",
  "content": "string (The full educational content for the ${lessonType}, following structure/presentation guidelines below. Markdown is acceptable.)",
  "questions": [
    // Array of EXACTLY ${questionCount} question objects in the specified order and formats.
    // 1st: Multiple Choice
    { "question": "string", "type": "multiple-choice", "options": ["string", "..."], "answer": "string" },
    // 2nd: Multiple Answer
    { "question": "string", "type": "multiple-answer", "options": ["string", "..."], "correctAnswers": ["string", "..."] },
    // 3rd: True/False
    { "question": "string", "type": "true-false", "answer": "string ('true' or 'false')" },
    // 4th: Dropdown
    { "question": "string", "type": "dropdown", "options": ["string", "..."], "answer": "string" },
    // 5th: Multiple Choice
    { "question": "string", "type": "multiple-choice", "options": ["string", "..."], "answer": "string" }
  ]
}`;

  // Construct the detailed prompt combining content and question generation
  const prompt = `
You are an expert instructional designer. Generate a ${lessonType} about "${subject}" suitable for ${gradeLevelText}.

Your response MUST be a single, valid JSON object conforming precisely to the structure specified below. Do NOT include any introductory text, explanations, comments, markdown formatting around the JSON, or anything else other than the JSON object itself.

**Required JSON Output Structure:**
\`\`\`json
${jsonStructure}
\`\`\`

**Detailed Instructions for JSON Fields:**

1.  **"title" Field:**
    * Generate a clear, descriptive title for the lesson (without any prefix like "Title:").

2.  **"content" Field:**
    * Generate engaging and academically sound lesson content.
    * **Academic Requirements:**
        * Target the upper-middle range for ${gradeLevelText}.
        * Align with cognitive stage: ${piagetStage}.
        * Meet academic expectations: ${gradeExpectations}.
        * Use precise, grade-appropriate terminology.
        * Balance theory and practical application.
    * **Content Structure (Follow this structure within the content string):**
        * Core Concepts: Clear principles, definitions, foundational understanding.
        * Concept Development (for each key concept): Include theoretical foundation, worked examples (step-by-step, real-world), and understanding checks (summary, misconceptions).
        * Connections: Link to related topics, practical relevance, other subjects.
        * Applications: Problem-solving, examples, activities, extensions.
    * **Display/Presentation (Apply these within the content string using Markdown):**
        * Use clear headings (e.g., \`## Core Concepts\`).
        * Use lists (bullet/numbered) and short paragraphs.
        * Highlight key terms (**bold** or *italics*).
        * Describe where diagrams/visuals would be helpful (e.g., "[Diagram showing X]").
        * Ensure readability.
    * **Critical Content Guidelines:** Clear language, step-by-step examples, focus on understanding and application, maintain engagement.

3.  **"questions" Field:**
    * Generate an array containing EXACTLY ${questionCount} practice questions based *directly* on the generated "content".
    * The questions MUST follow the EXACT order, types, and JSON formats specified in the structure above (MC, MA, TF, Dropdown, MC).
    * **Critical Question Rules:**
        * Calibrate precisely for ${gradeLevelText} vocabulary, concepts, and cognitive level.
        * For multiple-answer questions, 'correctAnswers' MUST be a subset of 'options'. Use 2-3 correct answers maximum. Do not include an 'answer' field for this type.
        * For all other types requiring an 'answer', it must match exactly one of the 'options' (or be 'true'/'false' as a string for true-false).
        * Do NOT include ANY references to semesters, seasons, or time of year.
        * Ensure clear, unambiguous language.

**Final Output:** Remember, provide ONLY the raw JSON object adhering strictly to the specified structure and instructions. Verify JSON syntax validity before outputting.
`;

  return prompt;
}