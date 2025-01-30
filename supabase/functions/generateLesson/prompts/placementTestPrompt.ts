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
    Generate EXACTLY 5 questions with this distribution:
    - First question (multiple-choice): Test below grade level concept
    - Second question (multiple-answer): Test at grade level concept
    - Third question (true-false): Test at grade level concept
    - Fourth question (dropdown): Test at grade level concept
    - Fifth question (multiple-choice): Test above grade level concept

    Each question must follow these JSON formats exactly:

    Multiple Choice:
    {
      "question": "What is...?",
      "type": "multiple-choice",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "option1"
    }

    Multiple Answer:
    {
      "question": "Select all that apply...",
      "type": "multiple-answer",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswers": ["option1", "option2"]
    }

    True/False:
    {
      "question": "Consider the statement...",
      "type": "true-false",
      "answer": "true"
    }

    Dropdown:
    {
      "question": "Choose the correct...",
      "type": "dropdown",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "option1"
    }

    CRITICAL RULES:
    - Questions must be precise and unambiguous
    - Include complete solutions and explanations
    - Ensure questions are independent
    - Avoid cultural or regional specific content
    - Focus on core competencies
    - Include clear grading criteria
    - Questions must gradually increase in difficulty
    - Each question must test a different concept
    - Explanations must be included for each answer

    OUTPUT FORMAT:
    Return ONLY a JSON array containing EXACTLY 5 questions in the specified order:
    [
      {multiple-choice question testing below grade level},
      {multiple-answer question testing at grade level},
      {true-false question testing at grade level},
      {dropdown question testing at grade level},
      {multiple-choice question testing above grade level}
    ]`;
};