export const createLessonPrompt = (
  subject: string,
  gradeLevelText: string,
  difficultyLevel: string,
  proficiencyLevel: number
): string => {
  return `Create an engaging, student-friendly lesson about ${subject} specifically for a ${gradeLevelText} student at a ${difficultyLevel} difficulty level (proficiency: ${proficiencyLevel}/10). 

    IMPORTANT: The content MUST be appropriate for ${gradeLevelText} students. Do not include concepts that are too advanced.
    
    Write as if you're directly speaking to the student. Use clear, conversational language and include:
    - A friendly introduction that gets them excited about the topic
    - Real-world examples and relatable scenarios that a ${gradeLevelText} student would understand
    - Clear explanations of key concepts using age-appropriate language
    - "Did you know?" facts that would interest a student at this grade level
    - Brief recap points throughout the lesson
    
    The content should be easy to read and understand, avoiding overly technical language unless necessary.
    Include a clear, student-friendly title for the lesson.`;
};

export const createQuestionsPrompt = (
  lessonContent: string,
  gradeLevelText: string,
  difficultyLevel: string,
  proficiencyLevel: number
): string => {
  return `Based on this lesson: "${lessonContent}", generate EXACTLY 5 practice questions that will help a ${gradeLevelText} student check their understanding. The questions should be at a ${difficultyLevel} difficulty level (proficiency: ${proficiencyLevel}/10). 

    IMPORTANT: The questions MUST be appropriate for ${gradeLevelText} students. Do not include concepts or vocabulary that are too advanced.

    CRITICAL: You MUST include EXACTLY ONE of each of these question types:
    1. Multiple choice question (2 questions)
    2. Multiple answer question where students select multiple correct options (1 question)
    3. True/False question (1 question)
    4. Dropdown question (1 question)

    DO NOT include any text/open-ended questions. All questions must have predefined answer choices.

    IMPORTANT VALIDATION RULES:
    1. For math questions:
       - All numerical answers must be exact and unambiguous
       - If using multiple choice, ensure only ONE answer is mathematically correct
       - Include units where applicable (e.g., cm, kg)
       - For word problems, ensure all necessary information is provided
       - Use age-appropriate numbers and concepts
    
    2. For all questions:
       - Double-check that the correct answer is included in the options
       - Ensure options don't contain duplicate values
       - Make sure questions are grade-appropriate
       - Verify that questions test understanding, not just memorization
       - NEVER use open-ended or text input questions

    Make the questions:
    - Clear and straightforward for ${gradeLevelText} students
    - Directly related to the main concepts covered
    - Encouraging and supportive in tone
    - Focused on understanding rather than memorization

    For the multiple answer question:
    - Include at least 2-4 correct answers
    - Make it clear that multiple answers should be selected
    - Use phrases like "Select all that apply" or "Choose all correct answers"

    Return ONLY a JSON array with these structures:

    Multiple choice:
    {
      "question": "What is...?",
      "type": "multiple-choice",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "correct option"
    }

    Multiple answer:
    {
      "question": "Select all that apply...",
      "type": "multiple-answer",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswers": ["correct1", "correct2"]
    }

    True/False:
    {
      "question": "Is this statement true...?",
      "type": "true-false",
      "answer": "true"
    }

    Dropdown:
    {
      "question": "Choose the correct...?",
      "type": "dropdown",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "correct option"
    }

    Return only the raw JSON array with EXACTLY 5 questions, no additional text or formatting.`;
};