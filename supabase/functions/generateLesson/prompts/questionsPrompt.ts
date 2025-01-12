export const createQuestionsPrompt = (
  lessonContent: string,
  gradeLevelText: string,
): string => {
  return `Based on this lesson: "${lessonContent}", generate EXACTLY 5 practice questions to help a ${gradeLevelText} student check their understanding.

    CRITICAL RULES:
    1. Questions MUST be precisely calibrated for ${gradeLevelText} students:
       - Use grade-appropriate vocabulary and concepts
       - Match the cognitive development level of the grade
       - Ensure examples are relatable to students of this age
    2. Generate EXACTLY 5 questions, covering these types:
       - Multiple choice (2 questions)
       - Multiple answer (1 question)
       - True/False (1 question)
       - Dropdown (1 question)
    3. Each question MUST follow the specified JSON format EXACTLY, with no additional text, comments, or deviations.
    4. IMPORTANT: Do NOT include ANY references to semesters, seasons, or time of year in the questions or answer options.

    FOR ALL QUESTIONS:
    - Ensure every question is directly tied to the content in the lesson.
    - Use clear, concise, and age-appropriate language.
    - Avoid ambiguous, tricky, or overly complex phrasing.
    - Verify that the correct answer(s) match exactly one or more provided options.
    - Exclude references to visuals unless explicitly included in the lesson.

    SPECIFIC FORMATS:
    1. Multiple choice:
    {
      "question": "What is...?",
      "type": "multiple-choice",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "option1"
    }
    - Provide 3-4 distinct options; one correct answer must match an option.
    
    2. Multiple answer:
    {
      "question": "Select all that apply...",
      "type": "multiple-answer",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswers": ["option1", "option2"]
    }
    - Provide 2-3 correct answers and include "Select all that apply" in the question.

    3. True/False:
    {
      "question": "Is this statement true...?",
      "type": "true-false",
      "answer": "true"
    }
    - Make the statement unambiguous and based on the lesson content.

    4. Dropdown:
    {
      "question": "Choose the correct...?",
      "type": "dropdown",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "option1"
    }
    - Provide 3-4 options; one correct answer must match an option.

    OUTPUT INSTRUCTIONS:
    - Return ONLY the raw JSON array with EXACTLY 5 questions.
    - Do NOT include any additional text, explanations, or formatting.
    - Verify completeness and correctness before output.

    Your response should look like this:
    [
      {
        "question": "...",
        "type": "...",
        "options": [...],
        "answer": "..."
      },
      ...
    ]`;
};