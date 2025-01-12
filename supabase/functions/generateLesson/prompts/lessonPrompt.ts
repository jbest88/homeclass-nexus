import { getCurriculumContext } from './curriculumContext.ts';

const getPiagetStage = (gradeLevelText: string): string => {
  const gradeLevel = parseInt(gradeLevelText.replace(/[^0-9]/g, '')) || 0;
  
  if (gradeLevel <= 1) { // Kindergarten and 1st grade
    return "preoperational stage (ages 2-7), where students learn through symbols and imagination";
  } else if (gradeLevel <= 5) { // 2nd to 5th grade
    return "concrete operational stage (ages 7-11), where students can think logically about concrete situations";
  } else if (gradeLevel <= 8) { // 6th to 8th grade
    return "early formal operational stage (ages 11-15), where students begin abstract thinking";
  } else { // 9th grade and up
    return "formal operational stage (ages 15+), where students can think abstractly and reason hypothetically";
  }
};

const getGradeLevelExpectations = (gradeLevelText: string): string => {
  const gradeLevel = parseInt(gradeLevelText.replace(/[^0-9]/g, '')) || 0;
  
  if (gradeLevel === 0) {
    return "basic concept recognition, simple patterns, and concrete examples";
  } else if (gradeLevel <= 2) {
    return "foundational skills, direct relationships, and clear step-by-step explanations";
  } else if (gradeLevel <= 5) {
    return "multiple-step problems, basic analytical thinking, and real-world applications";
  } else if (gradeLevel <= 8) {
    return "abstract concepts, logical reasoning, and interconnected ideas";
  } else {
    return "complex analysis, theoretical concepts, and advanced problem-solving";
  }
};

export const createLessonPrompt = (
  subject: string,
  gradeLevelText: string,
  curriculumPeriod: string
): string => {
  const curriculumContext = getCurriculumContext(curriculumPeriod);
  const piagetStage = getPiagetStage(gradeLevelText);
  const gradeExpectations = getGradeLevelExpectations(gradeLevelText);

  return `Imagine you are an experienced and friendly teacher for ${gradeLevelText}. Create an engaging lesson about ${subject} specifically for a ${gradeLevelText} student. This lesson should align with standard ${gradeLevelText} curriculum requirements.

    CRITICAL GRADE-LEVEL REQUIREMENTS:
    - Students are in ${piagetStage}
    - Expected comprehension level: ${gradeExpectations}
    - Use vocabulary and concepts that are STRICTLY appropriate for ${gradeLevelText} students
    - Examples must reflect real-world scenarios that ${gradeLevelText} students encounter in their daily lives
    - Explanations must match the cognitive development level of ${gradeLevelText} students
    - Incorporate elements that cater to diverse learning styles (visual, auditory, kinesthetic)

    IMPORTANT: 
    - The content MUST be appropriate for ${gradeLevelText} students. Do not include concepts that are too advanced.
    - Based on the student's current learning progression:
      - Focus on teaching: ${curriculumContext.currentTopics}
      - Build upon: ${curriculumContext.previousKnowledge}
      - Prepare students for: ${curriculumContext.upcomingTopics}
    - CRITICAL: Do NOT include ANY references to semesters, seasons, or time of year in the lesson content or examples.

    Write as if you're directly speaking to the student. Use clear, conversational language, and employ scaffolding techniques (building on prior knowledge, gradually increasing complexity). Include:
    - A friendly introduction that gets them excited about the topic
    - For EACH concept or topic covered:
      * Start with a clear, simple explanation
      * Provide 2-5 diverse real-world examples that a ${gradeLevelText} student would understand (vary the number for each topic), following this format for each example:
          * **Scenario:** [Real-world situation relevant to ${gradeLevelText} students]
          * **Problem:** [Age-appropriate question or challenge]
          * **Solution:** [Step-by-step explanation at ${gradeLevelText} level]
          * **Connection:** [How it relates to their daily life]
      * Include a detailed breakdown of how the concept works
      * Add practical applications they might encounter
      * Provide step-by-step explanations when introducing new ideas
    - Multiple "Did you know?" facts for each major topic to deepen understanding
    - Comprehensive bullet-point recaps after each section, including:
      * Main concept summary in ${gradeLevelText}-appropriate language
      * Key points to remember
      * Common misconceptions to avoid
      * Connections to previous learning
    - Suggestions for checking understanding through simple activities
    - Ideas for different learning speeds and styles

    End with an encouraging closing statement that connects to their interests.

    The content should be easy to read and understand, using grade-appropriate vocabulary.
    Include a clear, student-friendly title for the lesson that includes the grade level (${gradeLevelText}).`;
};