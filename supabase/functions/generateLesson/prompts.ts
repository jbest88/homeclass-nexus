import { getCurriculumContext } from './curriculumContext.ts';
import { getPiagetStage, getGradeLevelExpectations } from './gradeUtils.ts';

export const createLessonPrompt = (
  subject: string,
  gradeLevelText: string,
  curriculumPeriod: string
): string => {
  const curriculumContext = getCurriculumContext(curriculumPeriod);
  const piagetStage = getPiagetStage(gradeLevelText);
  const gradeExpectations = getGradeLevelExpectations(gradeLevelText);

  return `Generate a comprehensive lesson on ${subject} aligned with ${gradeLevelText} academic standards. The content should be rigorous and maintain academic depth while remaining accessible to the target grade level.

    ACADEMIC REQUIREMENTS:
    - Content must align with ${gradeLevelText} curriculum standards
    - Cognitive development stage: ${piagetStage}
    - Expected comprehension level: ${gradeExpectations}
    - Use precise academic terminology appropriate for ${gradeLevelText}
    - Include practical applications that demonstrate real-world relevance
    - Incorporate cross-disciplinary connections where applicable

    CRITICAL FOCUS AREAS:
    - Current learning objectives: ${curriculumContext.currentTopics}
    - Foundation from previous work: ${curriculumContext.previousKnowledge}
    - Preparation for advanced concepts: ${curriculumContext.upcomingTopics}
    - IMPORTANT: Exclude any references to semesters, seasons, or temporal markers

    CONTENT STRUCTURE:
    - Begin with core concept definitions and theoretical framework
    - For each key concept:
      * Present formal definition and theoretical background
      * Provide sophisticated examples:
          * **Context:** [Academic or real-world scenario]
          * **Challenge:** [Complex problem or application]
          * **Analysis:** [Detailed solution approach]
          * **Implementation:** [Practical application]
      * Include mathematical proofs or logical derivations where relevant
      * Emphasize interconnections with related concepts
    - Integrate relevant theorems, laws, or principles
    - Include "Key Insights" sections highlighting:
      * Critical theoretical foundations
      * Common misconceptions and their resolution
      * Advanced applications
      * Connections to higher-level concepts
    - Conclude with synthesis of concepts and advanced applications

    The content should maintain academic rigor while ensuring clarity and precision. Include a clear, academically appropriate title that includes the grade level (${gradeLevelText}).`;
};

export const createQuestionsPrompt = (
  lessonContent: string,
  gradeLevelText: string,
): string => {
  return `Based on this lesson: "${lessonContent}", generate EXACTLY 5 assessment questions appropriate for ${gradeLevelText} students that test conceptual understanding and application.

    CRITICAL REQUIREMENTS:
    1. Questions must:
       - Target higher-order thinking skills
       - Test both theoretical understanding and practical application
       - Align with ${gradeLevelText} academic standards
       - Require analytical reasoning
    2. Generate EXACTLY 5 questions across these formats:
       - Multiple choice (2 questions)
       - Multiple answer (1 question)
       - True/False (1 question)
       - Dropdown (1 question)
    3. Each question must follow the specified JSON format precisely
    4. Exclude temporal references (semesters, seasons, etc.)

    FOR ALL QUESTIONS:
    - Focus on conceptual understanding over memorization
    - Include application-based scenarios
    - Ensure clear, unambiguous language
    - Verify answer options are mutually exclusive
    - Maintain academic rigor appropriate for the grade level

    SPECIFIC FORMATS:
    1. Multiple choice:
    {
      "question": "What is...?",
      "type": "multiple-choice",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "option1"
    }
    
    2. Multiple answer:
    {
      "question": "Select all that apply...",
      "type": "multiple-answer",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswers": ["option1", "option2"]
    }
    
    3. True/False:
    {
      "question": "Consider the following statement...",
      "type": "true-false",
      "answer": "true"
    }
    
    4. Dropdown:
    {
      "question": "In the context of...",
      "type": "dropdown",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "option1"
    }

    OUTPUT FORMAT:
    - Return ONLY the raw JSON array with EXACTLY 5 questions
    - Verify all answers exist in their respective options lists
    - Ensure multiple-answer questions have valid correctAnswers subsets

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