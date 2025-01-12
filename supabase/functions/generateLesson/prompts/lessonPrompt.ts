import { getCurriculumContext } from './curriculumContext';

export const createLessonPrompt = (
  subject: string,
  gradeLevelText: string,
  curriculumPeriod: string
): string => {
  const curriculumContext = getCurriculumContext(curriculumPeriod);

  return `Imagine you are an experienced and friendly teacher for ${gradeLevelText}. Create an engaging lesson about ${subject} specifically for a ${gradeLevelText} student. This lesson should be aligned with [relevant state/national standards, if applicable] and suitable for students who have completed [previous grade level].

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