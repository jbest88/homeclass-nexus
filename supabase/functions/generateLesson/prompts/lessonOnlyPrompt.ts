
/**
 * Creates a prompt asking the AI to generate only the lesson content (title and content)
 * without questions, formatted as a simple JSON object.
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
  
  // Define the expected JSON output structure clearly for the AI
  const jsonStructure = `{
  "title": "string (A concise, descriptive title for the ${lessonType}, without prefixes like 'Title:')",
  "content": "string (The full educational content for the ${lessonType}, following structure/presentation guidelines below. Markdown is acceptable.)"
}`;

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
        * Use precise, grade-appropriate terminology.
        * Balance theory and practical application.
    * **Content Structure (Follow this structure within the content string):**
        * Core Concepts: Clear principles, definitions, foundational understanding.
        * Concept Development (for each key concept): Include theoretical foundation, worked examples (step-by-step, real-world), and understanding checks.
        * Connections: Link to related topics, practical relevance, other subjects.
        * Applications: Problem-solving, examples, activities, extensions.
    * **Display/Presentation (Apply these within the content string using Markdown):**
        * Use clear headings (e.g., \`## Core Concepts\`).
        * Use lists (bullet/numbered) and short paragraphs.
        * Highlight key terms (**bold** or *italics*).
        * Describe where diagrams/visuals would be helpful.
        * Ensure readability.
    * **Critical Content Guidelines:** Clear language, step-by-step examples, focus on understanding and application, maintain engagement.

**Final Output:** Remember, provide ONLY the raw JSON object adhering strictly to the specified structure. Verify JSON syntax validity before outputting.
`;

  return prompt;
}
