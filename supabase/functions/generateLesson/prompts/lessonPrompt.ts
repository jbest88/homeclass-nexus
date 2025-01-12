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

  return `Imagine you are an experienced teacher for ${gradeLevelText}. Create an engaging, grade-appropriate lesson about ${subject} specifically for a ${gradeLevelText} student. This lesson must be STRICTLY aligned with ${gradeLevelText} curriculum standards.

    CRITICAL GRADE-LEVEL REQUIREMENTS:
    - IMPORTANT: Content MUST be precisely calibrated for ${gradeLevelText}. DO NOT include concepts from higher grades.
    - Students are in ${piagetStage}. Stay within their developmental capabilities.
    - Expected comprehension level: ${gradeExpectations}
    - Use vocabulary that ${gradeLevelText} students would understand
    - Examples must reflect real-world scenarios that ${gradeLevelText} students encounter daily
    - Break down complex ideas into simpler, digestible parts
    - Include frequent comprehension checks

    IMPORTANT: 
    - The content MUST be appropriate for ${gradeLevelText} students. If you're unsure if a concept is too advanced, err on the side of simplicity.
    - Based on the student's current learning progression:
      - Focus on teaching: Basic foundations of ${curriculumContext.currentTopics}
      - Build upon: Core understanding of ${curriculumContext.previousKnowledge}
      - Prepare for: Introduction to ${curriculumContext.upcomingTopics}
    - CRITICAL: Do NOT include ANY references to semesters, seasons, or time of year.

    Write in a friendly, encouraging tone appropriate for ${gradeLevelText} students. Include:
    - A welcoming introduction that connects to their daily life
    - For EACH concept:
      * Start with the most basic explanation possible
      * Provide 2-3 simple, relatable examples:
          * **Scenario:** [Simple, age-appropriate situation]
          * **Problem:** [Clear, straightforward challenge]
          * **Solution:** [Step-by-step explanation]
          * **Connection:** [How it relates to their life]
      * Use visual analogies when possible
      * Include practice opportunities
    - Fun "Did you know?" facts that reinforce basic concepts
    - Regular summary points:
      * Main idea in simple terms
      * Key points to remember
      * Common mistakes to avoid
      * Links to previous learning
    - Simple self-check questions
    - Activities that support different learning styles

    End with an encouraging message and a preview of how this knowledge will help them in their daily life.

    The content should be easy to read and understand, using simple language appropriate for ${gradeLevelText}.
    Include a clear, student-friendly title that includes the grade level (${gradeLevelText}).`;
};