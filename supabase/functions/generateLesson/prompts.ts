export const createLessonPrompt = (
  subject: string,
  gradeLevelText: string,
  difficultyLevel: string,
  proficiencyLevel: number
): string => {
  return `Create a comprehensive, well-structured lesson about ${subject} for a ${gradeLevelText} student at a ${difficultyLevel} difficulty level (proficiency: ${proficiencyLevel}/10).

    REQUIRED SECTIONS (use these exact headings with markdown ##):
    
    ## Learning Objectives
    Start with 3-4 clear, measurable learning objectives that are appropriate for ${gradeLevelText} students.
    
    ## Introduction
    Begin with an engaging hook that connects to students' daily lives or prior knowledge.
    Briefly explain why this topic matters and how it relates to what they already know.
    
    ## Key Concepts
    Break down the main ideas into clear, digestible chunks.
    Use simple language appropriate for ${gradeLevelText}.
    Include relevant examples for each concept.
    
    ## Real-World Applications
    Provide at least 2 concrete examples of how this topic is used in everyday life.
    Make these examples relatable to ${gradeLevelText} students.
    
    ## Did you know?
    Include 2-3 interesting facts that will capture student interest.
    These should be grade-appropriate and connect to the main concepts.
    
    ## Practice Time
    Brief review points or mini-exercises (separate from the actual questions that will be generated later).
    
    ## Summary
    Recap the key points covered in the lesson.
    Reinforce the main takeaways.

    IMPORTANT GUIDELINES:
    1. Write in a friendly, conversational tone
    2. Use clear, age-appropriate language for ${gradeLevelText}
    3. Break complex ideas into smaller, manageable parts
    4. Include frequent examples and analogies
    5. Maintain consistent difficulty level throughout
    6. Keep paragraphs short (3-4 sentences maximum)
    7. Use bullet points for lists
    8. Include brief recaps after each major section
    
    The content should be thorough but concise, focusing on depth of understanding rather than breadth of coverage.
    Use markdown formatting for headings (##) and emphasis (*) where appropriate.`;
};

export const createQuestionsPrompt = (
  lessonContent: string,
  gradeLevelText: string,
  difficultyLevel: string,
  proficiencyLevel: number
): string => {
  return `Based on this lesson: "${lessonContent}", generate EXACTLY 5 practice questions that will help a ${gradeLevelText} student check their understanding. The questions should be at a ${difficultyLevel} difficulty level (proficiency: ${proficiencyLevel}/10). 

    IMPORTANT RULES:
    1. Questions MUST directly align with the learning objectives stated in the lesson
    2. Each question should test a different concept from the lesson
    3. Include questions that test both recall and understanding
    4. Use clear, grade-appropriate language
    5. Make questions engaging and relevant to real-world applications mentioned in the lesson
    6. Ensure all options are plausible but only one is clearly correct
    7. Avoid negative phrasing (e.g., "Which is NOT...")
    8. Include at least one question about real-world applications

    CRITICAL: You MUST include EXACTLY ONE of each of these question types:
    1. Multiple choice question (2 questions)
    2. Multiple answer question where students select multiple correct options (1 question)
    3. True/False question (1 question)
    4. Dropdown question (1 question)

    For EVERY question:
    - Base it directly on content from the lesson
    - Make sure the correct answer is explicitly covered in the lesson
    - Use clear, unambiguous wording
    - Keep options concise and distinct
    - Ensure all options are relevant to the question

    For multiple choice and dropdown questions:
    - Provide exactly 4 distinct options
    - Make all options plausible
    - Avoid obvious incorrect answers
    - Keep options similar in length and style

    For multiple answer questions:
    - Include exactly 2-3 correct answers
    - Make it clear multiple answers should be selected
    - Use "Select all that apply" in the question text

    For true/false questions:
    - Base it on a clear fact from the lesson
    - Avoid complex or compound statements
    - Make the correct answer unambiguous

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