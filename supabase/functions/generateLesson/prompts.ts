export const createLessonPrompt = (
  subject: string,
  gradeLevelText: string,
  difficultyLevel: string,
  proficiencyLevel: number
): string => {
  return `Create an engaging, student-friendly lesson about ${subject} for a ${gradeLevelText} student at a ${difficultyLevel} difficulty level (proficiency: ${proficiencyLevel}/10). 

    Write as if you're directly speaking to the student. Use clear, conversational language and include:
    - A friendly introduction that gets them excited about the topic
    - Real-world examples and relatable scenarios
    - Clear explanations of key concepts
    - "Did you know?" facts to maintain interest
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

    Make the questions:
    - Clear and straightforward
    - Directly related to the main concepts covered
    - Encouraging and supportive in tone
    - Focused on understanding rather than memorization

    Include a mix of these question types:
    1. Multiple choice (2 questions)
    2. Multiple answer (1 question)
    3. True/False (1 question)
    4. Dropdown (1 question)

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