/**
 * Creates a prompt asking the AI to generate the lesson content (title and content)
 * as a plain JSON object. The content must be formatted with hard returns for clear
 * sections and readability.
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

  // Define the required JSON structure.
  // NOTE: The "content" field should have hard returns (i.e. newlines) to clearly separate sections.
  const jsonStructure = `{
  "title": "string (A concise, descriptive title for the ${lessonType}, without any prefixes)",
  "content": "string (The full lesson content for the ${lessonType}, formatted with hard returns between sections. Use Markdown for headings, lists, and any other formatting as needed.)"
}`;

  const prompt = `
You are an expert instructional designer. Generate a ${lessonType} on "${subject}" for ${gradeLevelText}.

IMPORTANT: Your response MUST be a single, valid JSON object with exactly two keys: "title" and "content". Do NOT include any extra text, code fences, logs, or commentary.

**Required JSON Output Structure:**
\`\`\`json
${jsonStructure}
\`\`\`

**Instructions for the JSON Fields:**

1. **title**  
   - Provide a concise, descriptive title for the lesson (without any prefixes such as "Title:").

2. **content**  
   - Create engaging, well-structured lesson content that targets the academic level of ${gradeLevelText}.
   - Format the content using clear, hard returns (newlines) so that each section is visibly separated.
   - Include a title heading, an introduction, and clearly defined sections (e.g., "Core Concepts", "Exploring Each Sense", "Applications & Activities") with Markdown headings.
   - Use bullet lists or numbering for items (e.g., for senses or steps in an activity).
   - Ensure that paragraphs are separated by hard returns, not just space.
   - The content should be a continuous string that includes all markdown formatting as plain text within the JSON "content" value.

Before outputting, validate that the JSON is strictly correct and includes nothing other than the JSON object with "title" and "content".

OUTPUT ONLY the JSON without any additional text.
`;

  return prompt;
}
