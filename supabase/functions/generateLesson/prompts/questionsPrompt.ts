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
    2. Generate EXACTLY 5 questions with this EXACT distribution:
       - EXACTLY 2 multiple-choice questions (must be first and last)
       - EXACTLY 1 multiple-answer question (must be second)
       - EXACTLY 1 true/false question (must be third)
       - EXACTLY 1 dropdown question (must be fourth)
    3. Each question MUST follow the specified JSON format EXACTLY.
    4. IMPORTANT: For multiple-answer questions:
       - The correct answers MUST be selected from the provided options
       - Do not include answers that aren't in the options list
       - Keep options and answers simple and directly related
    5. CRITICAL: Do NOT include ANY references to semesters, seasons, or time of year.

    FOR ALL QUESTIONS:
    - Keep questions directly related to the lesson content
    - Use clear, unambiguous language
    - Ensure every correct answer matches exactly one or more provided options
    - For multiple-answer questions, limit correct answers to 2-3 options maximum

    SPECIFIC FORMATS AND ORDER:
    1. First question (Multiple choice):
    {
      "question": "What is...?",
      "type": "multiple-choice",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "option1"
    }
    
    2. Second question (Multiple answer):
    {
      "question": "Select all that apply...",
      "type": "multiple-answer",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswers": ["option1", "option2"]
    }
    - IMPORTANT: correctAnswers must be a subset of options
    
    3. Third question (True/False):
    {
      "question": "Is this statement true...?",
      "type": "true-false",
      "answer": "true"
    }
    
    4. Fourth question (Dropdown):
    {
      "question": "Choose the correct...?",
      "type": "dropdown",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "option1"
    }

    5. Fifth question (Multiple choice):
    {
      "question": "Which of the following...?",
      "type": "multiple-choice",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "option1"
    }

    OUTPUT INSTRUCTIONS:
    - Return ONLY the raw JSON array with EXACTLY 5 questions IN THE EXACT ORDER SPECIFIED ABOVE
    - Verify all answers exist in their respective options lists
    - Double-check multiple-answer questions to ensure correctAnswers is a subset of options

    Your response should look like this:
    [
      {
        "question": "...",
        "type": "multiple-choice",
        "options": [...],
        "answer": "..."
      },
      {
        "question": "...",
        "type": "multiple-answer",
        "options": [...],
        "correctAnswers": [...]
      },
      {
        "question": "...",
        "type": "true-false",
        "answer": "..."
      },
      {
        "question": "...",
        "type": "dropdown",
        "options": [...],
        "answer": "..."
      },
      {
        "question": "...",
        "type": "multiple-choice",
        "options": [...],
        "answer": "..."
      }
    ]`;
};