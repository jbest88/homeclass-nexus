export const createLessonPrompt = (
  subject: string,
  gradeLevelText: string,
  difficultyLevel: string,
  proficiencyLevel: number,
  curriculumPeriod: string
): string => {
  const curriculumContext = getCurriculumContext(curriculumPeriod);

  return `Create an engaging, student-friendly lesson about ${subject} specifically for a ${gradeLevelText} student at a ${difficultyLevel} difficulty level (proficiency: ${proficiencyLevel}/10) during their ${curriculumPeriod}.

    IMPORTANT: 
    - The content MUST be appropriate for ${gradeLevelText} students. Do not include concepts that are too advanced.
    - The lesson should focus on ${curriculumContext.currentTopics}
    - Assume students have already learned ${curriculumContext.previousKnowledge}
    - The content should build upon this foundation and prepare them for ${curriculumContext.upcomingTopics}

    Write as if you're directly speaking to the student. Use clear, conversational language and include:
    - A friendly introduction that gets them excited about the topic
    - Real-world examples and relatable scenarios that a ${gradeLevelText} student would understand
    - Clear explanations of key concepts using age-appropriate language
    - "Did you know?" facts that would interest a student at this grade level
    - Brief, bullet-point recaps of key ideas throughout the lesson
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
  return `Based on this lesson: "${lessonContent}", generate EXACTLY 5 practice questions to help a ${gradeLevelText} student check their understanding. The questions must align with a ${difficultyLevel} difficulty level (proficiency: ${proficiencyLevel}/10).

    CRITICAL RULES:
    1. The questions MUST be appropriate for ${gradeLevelText} students and match the lesson content.
    2. Generate EXACTLY 5 questions, covering these types:
       - Multiple choice (2 questions)
       - Multiple answer (1 question)
       - True/False (1 question)
       - Dropdown (1 question)
    3. Each question MUST follow the specified JSON format EXACTLY, with no additional text, comments, or deviations.

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

// Helper function to provide curriculum context based on the period
const getCurriculumContext = (curriculumPeriod: string) => {
  switch (curriculumPeriod) {
    case "Fall Semester":
      return {
        currentTopics: "foundational concepts and introductory material for this grade level",
        previousKnowledge: "material from their previous grade level",
        upcomingTopics: "more advanced concepts later in the year"
      };
    case "Winter Term":
      return {
        currentTopics: "intermediate concepts that build upon Fall semester material",
        previousKnowledge: "foundational concepts from the Fall semester",
        upcomingTopics: "more complex applications in the Spring semester"
      };
    case "Spring Semester":
      return {
        currentTopics: "advanced applications and synthesis of previous learning",
        previousKnowledge: "both foundational and intermediate concepts from Fall and Winter terms",
        upcomingTopics: "end-of-year comprehensive understanding"
      };
    case "Summer Term":
      return {
        currentTopics: "review and enrichment of the year's most important concepts",
        previousKnowledge: "the full year's curriculum",
        upcomingTopics: "preparation for the next grade level"
      };
    default:
      return {
        currentTopics: "grade-appropriate concepts",
        previousKnowledge: "prerequisite concepts for this grade level",
        upcomingTopics: "future learning in this subject"
      };
  }
};
