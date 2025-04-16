/**
 * Creates a prompt asking the AI to generate the lesson content (title and content)
 * as a plain JSON object. The output must include ONLY the JSON object with exactly
 * two keys: "title" and "content".
 *
 * @param subject The subject of the lesson.
 * @param gradeLevelText The target grade level (e.g., "Grade 5", "Kindergarten").
 * @param isPlacementTest If true, tailor the lesson for a placement test.
 * @returns The prompt string for the AI call.
 */
export function createLessonOnlyPrompt(
  subject: string,
  gradeLevelText: string,
  isPlacementTest: boolean = false
): string {
  const lessonType = isPlacementTest ? "placement test" : "lesson";

  // Define the required JSON structure
  const jsonStructure = `{
  "title": "string (A concise, descriptive title for the ${lessonType}, without prefixes)",
  "content": "string (The full lesson content for the ${lessonType}, using markdown for headings, lists, examples, etc. Render all content as plain text within this value)"
}`;

  const prompt = `
You are an expert instructional designer. Generate a ${lessonType} on "${subject}" for ${gradeLevelText}.

IMPORTANT: Your response MUST be a single, valid JSON object containing exactly these two keys: "title" and "content". DO NOT include any extra text, logging, introductions, or formatting outside this JSON.

**Required JSON Output Structure:**
\`\`\`json
${jsonStructure}
\`\`\`

**Instructions for Content:**

1. **Title:**  
   - Provide a concise, descriptive title that fits the ${lessonType}.  
   - Do not include any additional prefixes or commentary.

2. **Content:**  
   - Create engaging and well-structured lesson content that targets the academic level of ${gradeLevelText}.  
   - Include clear headings (using Markdown, e.g., \`## Core Concepts\`), bullet points, and short paragraphs.  
   - Cover the following aspects:
     - **Core Concepts:** Definitions and essential principles.
     - **Concept Development:** Theoretical explanations, step-by-step examples, and checks for understanding.
     - **Connections and Applications:** Practical activities, interdisciplinary links, and visual suggestions.
   - Ensure the complete lesson is rendered as a plain string within the "content" value. Do not include any serialized objects or code markers.

Before outputting, validate that the JSON is strictly correct and contains nothing other than the JSON object with "title" and "content".`;

  return prompt;
}
