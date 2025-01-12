export const createLessonPrompt = (
  subject: string,
  gradeLevelText: string,
  difficultyLevel: string,
  proficiencyLevel: number
): string => {
  return `Create an engaging, student-friendly lesson about ${subject} specifically for a ${gradeLevelText} student at a ${difficultyLevel} difficulty level (proficiency: ${proficiencyLevel}/10).

    IMPORTANT: 
    - The content MUST be appropriate for ${gradeLevelText} students. Do not include concepts that are too advanced.
    - The lesson should help the student understand [specific concepts].

    Write as if you're directly speaking to the student. Use clear, conversational language and include:
    - A friendly introduction that gets them excited about the topic
    - Real-world examples and relatable scenarios that a ${gradeLevelText} student would understand
    - Clear explanations of key concepts using age-appropriate language
    - "Did you know?" facts that would interest a student at this grade level
    - Brief, bullet-point recaps of key ideas throughout the lesson
    - At least one interactive activity, question, or task the student can try
    - Descriptions of visuals or diagrams that could enhance understanding

    End with a positive closing statement or question to encourage curiosity about the subject.

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

    IMPORTANT RULES:
    1. The questions MUST be appropriate for ${gradeLevelText} students.
    2. EVERY question must be directly related to the content in the lesson.
    3. The correct answer MUST be one of the provided options.
    4. Each option must be a complete, clear phrase or statement.
    5. Do not reference any visual elements unless they are explicitly provided.
    6. Keep options concise and clear - ideally 1-5 words each.

    CRITICAL: You MUST include EXACTLY ONE of each of these question types:
    1. Multiple choice question (2 questions)
    2. Multiple answer question where students select multiple correct options (1 question)
    3. True/False question (1 question)
    4. Dropdown question (1 question)

    For EVERY question:
    - Make sure the correct answer exactly matches one of the options
    - Keep options simple and straightforward
    - Avoid ambiguous or tricky wording
    - Do not reference images or diagrams
    - Ensure all options are relevant to the question

    For multiple choice and dropdown questions:
    - Provide 3-4 distinct, clear options
    - Make sure the correct answer is exactly one of these options
    - Keep options similar in length and style

    For multiple answer questions:
    - Include 2-3 correct answers from the options
    - Make it clear multiple answers should be selected
    - Use "Select all that apply" in the question text

    For true/false questions:
    - Make the statement clear and unambiguous
    - Base it directly on information from the lesson

    Return ONLY a JSON array with these exact structures:

    Multiple choice:
    {
      "question": "What is...?",
      "type": "multiple-choice",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "option1"
    }

    Multiple answer:
    {
      "question": "Select all that apply...",
      "type": "multiple-answer",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswers": ["option1", "option2"]
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
      "answer": "option1"
    }

    Return only the raw JSON array with EXACTLY 5 questions, no additional text or formatting.`;
};