export const createPlacementTestPrompt = (
  subject: string,
  gradeLevelText: string,
): string => {
  return `Generate a comprehensive placement test for ${subject} to assess a student's knowledge and skills relative to ${gradeLevelText} standards. The test should help determine if the student is at, above, or below grade level.

    TEST STRUCTURE:
    1. Start with foundational concepts from one grade level below
    2. Progress to grade-level content
    3. Include advanced concepts from one grade level above
    4. Cover all major topic areas within ${subject}

    QUESTION DISTRIBUTION:
    - 20% below grade level concepts
    - 60% at grade level concepts
    - 20% above grade level concepts

    CONTENT REQUIREMENTS:
    - Clear, concise instructions
    - Gradually increasing difficulty
    - Mix of theoretical and practical questions
    - Coverage of all key subject areas
    - Clear assessment criteria
    - Varied question formats

    FORMAT GUIDELINES:
    - Use markdown formatting
    - Break into clear sections
    - Include a brief introduction
    - Provide clear instructions
    - End with assessment criteria

    CRITICAL RULES:
    - Questions must be precise and unambiguous
    - Include complete solutions and explanations
    - Ensure questions are independent
    - Avoid cultural or regional specific content
    - Focus on core competencies
    - Include clear grading criteria`;
};