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

  return `Imagine you are an experienced and challenging teacher for ${gradeLevelText}. Create an advanced, thought-provoking lesson about ${subject} specifically for a ${gradeLevelText} student who is ready for more challenging material. This lesson should align with and extend beyond the standard ${gradeLevelText} curriculum. 

    CRITICAL GRADE-LEVEL REQUIREMENTS:
    - Students are in ${piagetStage}. Push their cognitive abilities while staying within their developmental stage.
    - Expected comprehension level: ${gradeExpectations}.
    - Use advanced vocabulary and complex concepts appropriate for high-achieving ${gradeLevelText} students.
    - Examples must include challenging real-world scenarios that require deeper analytical thinking.
    - Explanations should encourage critical thinking and problem-solving skills.
    - Incorporate advanced learning techniques for different learning styles.

    IMPORTANT: 
    - While challenging, content must remain conceptually appropriate for ${gradeLevelText}.
    - Based on the student's accelerated learning progression:
      - Focus on teaching: Advanced applications of ${curriculumContext.currentTopics} (Include complex problem-solving scenarios)
      - Build upon: Deep understanding of ${curriculumContext.previousKnowledge} (Challenge assumptions and explore edge cases)
      - Prepare for: Early introduction to ${curriculumContext.upcomingTopics} (Preview advanced concepts)
    - CRITICAL: Do NOT include ANY references to semesters, seasons, or time of year.

    Write in an engaging but intellectually stimulating style. Include:
    - A thought-provoking introduction that presents a complex problem or paradox.
    - For EACH concept:
      * Begin with an advanced explanation that includes theoretical foundations.
      * Provide 3-5 challenging real-world examples:
          * **Scenario:** [Complex real-world situation]
          * **Problem:** [Multi-step challenge requiring deep analysis]
          * **Solution:** [Detailed explanation with multiple approaches]
          * **Extension:** [How this connects to more advanced concepts]
      * Include rigorous proofs or derivations where applicable.
      * Present edge cases and exceptions to rules.
      * Encourage exploration of alternative solution methods.
    - Advanced "Did you know?" sections linking to higher-level concepts.
    - Comprehensive section summaries:
      * Core concept analysis
      * Advanced theoretical frameworks
      * Common advanced misconceptions
      * Connections to higher-level mathematics
    - Challenging assessment opportunities:
      * Complex problem sets
      * Open-ended investigations
      * Real-world application projects
    - Differentiation strategies for advanced learners
    - Encourage mathematical proof writing and formal argumentation
    - Provide opportunities for independent research

    End with a challenging question that connects to advanced applications in the field.

    The content should be rigorous while remaining accessible to advanced ${gradeLevelText} students.
    Include an engaging title that reflects the advanced nature of the lesson.`;
};