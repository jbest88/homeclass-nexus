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
    - Real-world examples that relate to common experiences of a ${gradeLevelText} student (e.g., school life, popular hobbies, or age-appropriate interests)
    - Clear explanations of key concepts using age-appropriate language
    - "Did you know?" facts that would interest a student at this grade level
    - Brief recap points throughout the lesson
    - One or two simple activities or thought questions to keep them engaged

    The content should be easy to read and understand, avoiding overly technical language unless necessary. Break the lesson into labeled sections with concise paragraphs and bullet points where applicable.

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

    IMPORTANT VALIDATION RULES:
    1. For math questions:
       - All numerical answers must be exact and unambiguous
       - If using multiple choice, ensure only ONE answer is mathematically correct
       - Include units where applicable (e.g., cm, kg)
       - For word problems, ensure all necessary information is provided
       - Use age-appropriate numbers and concepts
    
    2. For text-based questions:
       - Answers must be clearly supported by the lesson content
       - Avoid subjective or opinion-based questions
       - For multiple choice, ensure options are distinct and unambiguous
       - Use vocabulary appropriate for ${gradeLevelText} students
       - Cover the most important points from the lesson content

    3. For multiple-answer questions:
       - Ensure there are at least two correct answers
       - Options should test understanding, not just recall

    4. For all questions:
       - Double-check that the correct answer is included in the options
       - Ensure options don't contain duplicate values
       - Make sure questions are grade-appropriate
       - Verify that questions test understanding, not just memorization

    Make the questions:
    - Clear and straightforward for ${gradeLevelText} students
    - Directly related to the main concepts covered
    - Encouraging and supportive in tone
    - Balanced between conceptual and factual understanding

    Include a mix of these question types:
    1. Multiple choice (2 questions)
    2. Multiple answer (1 question)
    3. True/False (1 question)
    4. Dropdown (1 question)

    Return ONLY a properly formatted JSON array with these structures:

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

    Return ONLY the JSON array with EXACTLY 5 questions, no additional text or formatting.`;
};