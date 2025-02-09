
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
    Generate EXACTLY 10 questions with this distribution:
    - First two questions (multiple-choice): Test below grade level concepts
    - Next five questions: Test at grade level concepts
      * Two multiple-answer questions
      * One true-false question
      * Two dropdown questions
    - Last three questions (multiple-choice): Test above grade level concepts

    Each question must follow these JSON formats exactly:

    Multiple Choice:
    {
      "question": "What is...?",
      "type": "multiple-choice",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "option1",
      "explanation": "Detailed explanation of why this is correct and common misconceptions"
    }

    Multiple Answer:
    {
      "question": "Select all that apply...",
      "type": "multiple-answer",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswers": ["option1", "option2"],
      "explanation": "Explanation of why each selected option is correct and why others are incorrect"
    }

    True/False:
    {
      "question": "Consider the statement...",
      "type": "true-false",
      "answer": "true",
      "explanation": "Detailed explanation of why the statement is true/false with examples"
    }

    Dropdown:
    {
      "question": "Choose the correct...",
      "type": "dropdown",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "option1",
      "explanation": "Explanation of why this is the correct choice and what makes other options incorrect"
    }

    CRITICAL RULES:
    - Questions must be precise and unambiguous
    - Include detailed explanations for all answers
    - Ensure questions are independent but progress logically
    - Avoid cultural or regional specific content
    - Focus on core competencies and key skills
    - Include clear grading criteria
    - Questions must gradually increase in difficulty
    - Each question must test a different concept
    - Make questions challenging but fair
    - Cover multiple aspects of ${subject}
    - Include application and problem-solving scenarios
    - Include word problems where appropriate
    - Test both procedural and conceptual understanding

    OUTPUT FORMAT:
    Return ONLY a JSON array containing EXACTLY 10 questions in this order:
    [
      {two multiple-choice questions testing below grade level},
      {two multiple-answer questions testing at grade level},
      {one true-false question testing at grade level},
      {two dropdown questions testing at grade level},
      {three multiple-choice questions testing above grade level}
    ]`;
};
