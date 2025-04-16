/**
 * Creates a prompt asking the AI to generate only the lesson content (title and content)
 * without any questions or extraneous commentary. The response must be a JSON object.
 *
 * @param subject The subject of the lesson.
 * @param gradeLevelText The target grade level (e.g., "Grade 5", "Kindergarten").
 * @param isPlacementTest If true, tailor content for a placement test.
 * @returns The prompt string for the AI call.
 */
export function createLessonOnlyPrompt(
  subject: string,
  gradeLevelText: string,
  isPlacementTest: boolean = false
): string {
  const lessonType = isPlacementTest ? "placement test" : "lesson";
  
  // Define the exact JSON structure the AI must adhere to.
  const jsonStructure = `{
  "title": "string (A concise, descriptive title for the ${lessonType}, without any prefix like 'Title:')",
  "content": "string (The complete lesson content for the ${lessonType}. Include clear headings, bullet points, examples, and markdown formatting as specified below.)"
}`;

  const prompt = `
You are an expert instructional designer. Generate a ${lessonType} on "${subject}" suitable for ${gradeLevelText}.

Your response MUST be a single, valid JSON object that strictly follows the JSON structure specified below. Do NOT include any introductory text, explanations, code blocks, markdown formatting (outside of the content), or any additional commentary.

**Required JSON Output Structure:**
\`\`\`json
${jsonStructure}
\`\`\`

**Instructions for the JSON Fields:**

1. **"title":**
   - Generate a clear, concise title for the lesson.
   - Do not include any prefixes (e.g., "Title:"), just the title text.

2. **"content":**
   - Write engaging, academically sound lesson content that targets the academic level of ${gradeLevelText}.
   - **Content Requirements:**
     - **Core Concepts:** Present clear principles, definitions, and foundational understanding.
     - **Concept Development:** For each key concept, include:
       - A theoretical foundation.
       - Step-by-step worked examples with real-world relevance.
       - Understanding checks or brief recaps.
     - **Connections:** Make connections to related topics, practical applications, and interdisciplinary links.
     - **Applications:** Provide problem-solving activities, practical examples, and extension questions.
   - **Display Guidelines (using Markdown):**
     - Use clear headings (e.g., \`## Core Concepts\`).
     - Use bullet or numbered lists and concise paragraphs.
     - Bold or italicize key terms.
     - Include suggestions for where diagrams or visuals would enhance understanding.
   - Ensure the content is well-structured, engaging, and easy to follow.

**Final Output:**  
Your output should contain only the raw JSON object with the fields "title" and "content", and nothing else. Validate the JSON to ensure it is correct.
`;

  return prompt;
}
