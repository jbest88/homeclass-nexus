export const createLessonPrompt = (
  subject: string,
  gradeLevelText: string,
  difficultyLevel: string,
  proficiencyLevel: number,
  curriculumPeriod: string
): string => {
  const curriculumContext = getCurriculumContext(curriculumPeriod);
  const gradeAdjustedDifficulty = getGradeAdjustedDifficulty(gradeLevelText, difficultyLevel);

  return `Imagine you are an experienced and friendly teacher for ${gradeLevelText}. Create an engaging lesson about ${subject} specifically for a ${gradeLevelText} student at a ${gradeAdjustedDifficulty} difficulty level (proficiency: ${proficiencyLevel}/10). This lesson should be aligned with [relevant state/national standards, if applicable] and suitable for students who have completed [previous grade level].

    CRITICAL GRADE-LEVEL REQUIREMENTS:
    - Considering that ${gradeLevelText} students are typically in [Piaget's stage of cognitive development], tailor your explanations and examples accordingly.
    - Use vocabulary and concepts appropriate for ${gradeLevelText} students.
    - Examples must reflect real-world scenarios that ${gradeLevelText} students can relate to.
    - Explanations should match the cognitive development level of ${gradeLevelText} students.
    - Incorporate elements that cater to diverse learning styles (visual, auditory, kinesthetic).

    IMPORTANT: 
    - The content MUST be appropriate for ${gradeLevelText} students. Do not include concepts that are too advanced.
    - Based on the student's current learning progression:
      - Focus on teaching: ${curriculumContext.currentTopics}
      - Build upon: ${curriculumContext.previousKnowledge}
      - Prepare students for: ${curriculumContext.upcomingTopics}
    - CRITICAL: Do NOT include ANY references to semesters, seasons, or time of year in the lesson content or examples.

    Write as if you're directly speaking to the student. Use clear, conversational language, and employ scaffolding techniques (building on prior knowledge, gradually increasing complexity). Include:
    - A friendly introduction that gets them excited about the topic.
    - For EACH concept or topic covered:
      * Start with a clear, simple explanation.
      * Provide 2-5 diverse real-world examples that a ${gradeLevelText} student would understand (vary the number for each topic), following this format for each example:
          * **Scenario:** [Real-world situation]
          * **Problem:** [Question or challenge related to the concept]
          * **Solution:** [Step-by-step explanation or demonstration]
          * **Connection:** [How it relates to other concepts or the bigger picture]
      * Include a detailed breakdown of how the concept works.
      * Add practical applications or scenarios where they might encounter this.
      * Provide step-by-step explanations when introducing new ideas.
    - Multiple "Did you know?" facts for each major topic to deepen understanding.
    - Comprehensive bullet-point recaps after each section, including:
      * Main concept summary
      * Key points to remember
      * Common misconceptions to avoid
      * Connections to previous learning
    - Suggestions for formative assessment (e.g., quick quizzes, exit tickets) and/or summative assessment (e.g., a short assignment).
    - Suggestions for differentiating the lesson for students with different learning needs or paces.

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
  const gradeAdjustedDifficulty = getGradeAdjustedDifficulty(gradeLevelText, difficultyLevel);
  
  return `Based on this lesson: "${lessonContent}", generate EXACTLY 5 practice questions to help a ${gradeLevelText} student check their understanding. The questions must align with a ${gradeAdjustedDifficulty} difficulty level (proficiency: ${proficiencyLevel}/10).

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

const getCurriculumContext = (curriculumPeriod: string) => {
  switch (curriculumPeriod) {
    case "Fall Semester":
      return {
        currentTopics: "foundational concepts and essential building blocks",
        previousKnowledge: "basic prerequisites and fundamental concepts",
        upcomingTopics: "intermediate applications and expanding core concepts"
      };
    case "Winter Term":
      return {
        currentTopics: "intermediate concepts and practical applications",
        previousKnowledge: "foundational concepts and basic principles",
        upcomingTopics: "advanced topics and complex problem-solving"
      };
    case "Spring Semester":
      return {
        currentTopics: "advanced applications and concept integration",
        previousKnowledge: "foundational and intermediate concepts",
        upcomingTopics: "comprehensive mastery and higher-level thinking"
      };
    case "Summer Term":
      return {
        currentTopics: "synthesis and mastery of key concepts",
        previousKnowledge: "comprehensive understanding of core principles",
        upcomingTopics: "preparation for next level concepts"
      };
    default:
      return {
        currentTopics: "grade-appropriate concepts",
        previousKnowledge: "prerequisite concepts for this grade level",
        upcomingTopics: "upcoming grade-level material"
      };
  }
};

const getGradeAdjustedDifficulty = (gradeLevelText: string, baseDifficulty: string): string => {
  // Extract grade number (or 0 for kindergarten)
  const gradeNum = gradeLevelText.toLowerCase().includes('kindergarten') ? 0 : 
    parseInt(gradeLevelText.match(/\d+/)?.[0] || '0');

  // Adjust difficulty based on grade level with increased challenge
  switch (baseDifficulty.toLowerCase()) {
    case 'easy':
      return gradeNum <= 3 ? 'basic' :           // Increased from 'foundational'
             gradeNum <= 6 ? 'standard' :        // Increased from 'basic'
             gradeNum <= 9 ? 'intermediate' :    // Increased from 'introductory'
             'advanced';                         // Increased from 'standard'
    case 'medium':
      return gradeNum <= 3 ? 'intermediate' :    // Increased from 'basic'
             gradeNum <= 6 ? 'advanced' :        // Increased from 'standard'
             gradeNum <= 9 ? 'complex' :         // Increased from 'intermediate'
             'expert';                           // Increased from 'advanced'
    case 'hard':
      return gradeNum <= 3 ? 'advanced' :        // Increased from 'challenging'
             gradeNum <= 6 ? 'complex' :         // Increased from 'advanced'
             gradeNum <= 9 ? 'expert' :          // Increased from 'complex'
             'mastery';                          // New highest level
    default:
      return 'advanced';                         // Increased from 'standard'
  }
};

// ... keep existing code (other functions and exports)
