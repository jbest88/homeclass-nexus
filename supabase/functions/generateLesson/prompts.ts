export const createLessonPrompt = (
  subject: string,
  gradeLevelText: string,
  difficultyLevel: string,
  proficiencyLevel: number,
  curriculumPeriod: string
): string => {
  const curriculumContext = getCurriculumContext(curriculumPeriod);

  return `Create an engaging, student-friendly lesson about ${subject} specifically for a ${gradeLevelText} student at a ${difficultyLevel} difficulty level (proficiency: ${proficiencyLevel}/10).

    IMPORTANT: 
    - The content MUST be appropriate for ${gradeLevelText} students. Do not include concepts that are too advanced.
    - Since we are in the ${curriculumPeriod}:
      - Focus on teaching ${curriculumContext.currentTopics}
      - Build upon ${curriculumContext.previousKnowledge}
      - Prepare students for ${curriculumContext.upcomingTopics}

    Write as if you're directly speaking to the student. Use clear, conversational language and include:
    - A friendly introduction that gets them excited about the topic
    - For EACH concept or topic covered:
      * Start with a clear, simple explanation
      * Provide 2-5 diverse real-world examples that a ${gradeLevelText} student would understand (vary the number for each topic)
      * Include a detailed breakdown of how the concept works
      * Add practical applications or scenarios where they might encounter this
      * Provide step-by-step explanations when introducing new ideas
    - Multiple "Did you know?" facts for each major topic to deepen understanding
    - Comprehensive bullet-point recaps after each section, including:
      * Main concept summary
      * Key points to remember
      * Common misconceptions to avoid
      * Connections to previous learning
    - For each example:
      * Break down the reasoning behind it
      * Explain why it works
      * Show how it connects to other concepts they've learned

    End with a positive closing statement or question to encourage curiosity about the subject.

    The content should be easy to read and understand, avoiding overly technical language unless necessary.
    Include a clear, student-friendly title for the lesson that includes the grade level (${gradeLevelText}).`;
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

const getCurriculumContext = (curriculumPeriod: string) => {
  switch (curriculumPeriod) {
    case "Fall Semester":
      return {
        currentTopics: "foundational concepts and core principles that will be built upon throughout the year",
        previousKnowledge: "concepts from the previous grade level",
        upcomingTopics: "intermediate applications and expanding core concepts"
      };
    case "Winter Term":
      return {
        currentTopics: "intermediate concepts and deeper applications of Fall semester foundations",
        previousKnowledge: "foundational concepts established in the Fall semester",
        upcomingTopics: "advanced topics and complex problem-solving"
      };
    case "Spring Semester":
      return {
        currentTopics: "advanced applications and integration of previous concepts",
        previousKnowledge: "foundational and intermediate concepts from Fall and Winter",
        upcomingTopics: "comprehensive mastery and preparation for next grade level"
      };
    case "Summer Term":
      return {
        currentTopics: "synthesis of the year's key concepts and addressing any knowledge gaps",
        previousKnowledge: "the full academic year's curriculum",
        upcomingTopics: "next grade level's foundational concepts"
      };
    default:
      return {
        currentTopics: "grade-appropriate concepts",
        previousKnowledge: "prerequisite concepts for this grade level",
        upcomingTopics: "upcoming grade-level material"
      };
  }
};
