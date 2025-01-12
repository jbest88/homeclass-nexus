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

  return `Imagine you are an experienced and friendly teacher for ${gradeLevelText}. Create an engaging lesson about ${subject} specifically for a ${gradeLevelText} student. This lesson should align with the ${gradeLevelText} mathematics curriculum. 

    CRITICAL GRADE-LEVEL REQUIREMENTS:
    - Students are in ${piagetStage}. Provide specific characteristics of this stage relevant to their mathematical learning. 
    - Expected comprehension level: ${gradeExpectations}.
    - Use vocabulary and concepts STRICTLY appropriate for ${gradeLevelText}.
    - Examples must reflect real-world scenarios relevant to ${gradeLevelText} students.
    - Explanations must match the cognitive development level of ${gradeLevelText} students.
    - Incorporate elements that cater to diverse learning styles (visual, auditory, kinesthetic).

    IMPORTANT: 
    - The content MUST be appropriate for ${gradeLevelText}. Do not include concepts that are too advanced.
    - Based on the student's current learning progression:
      - Focus on teaching: ${curriculumContext.currentTopics} (Provide concrete examples of concepts relevant to ${gradeLevelText} math)
      - Build upon: ${curriculumContext.previousKnowledge} (Provide concrete examples of prior knowledge for ${gradeLevelText})
      - Prepare students for: ${curriculumContext.upcomingTopics} (Provide concrete examples of future topics for ${gradeLevelText})
    - CRITICAL: Do NOT include ANY references to semesters, seasons, or time of year in the lesson content or examples.

    Write as if you're directly speaking to the student. Use clear, conversational language, and employ scaffolding techniques. Include:
    - A friendly introduction that gets them excited about the topic.
    - For EACH concept or topic covered:
      * Start with a clear, simple explanation.
      * Provide 2-5 diverse real-world examples (vary the number for each topic), following this format:
          * **Scenario:** [Real-world situation]
          * **Problem:** [Age-appropriate question/challenge]
          * **Solution:** [Step-by-step explanation]
          * **Connection:** [How it relates to their daily life]
      * Include a detailed breakdown of how the concept works.
      * Add practical applications they might encounter. 
      * Provide step-by-step explanations for new ideas.
    - Multiple "Did you know?" facts for each major topic.
    - Comprehensive bullet-point recaps after each section:
      * Main concept summary.
      * Key points to remember.
      * Common misconceptions.
      * Connections to previous learning.
    - Suggestions for checking understanding:
      * Include simple activities AND open-ended problems that require application of concepts in novel situations.
    - Ideas for differentiation to cater to different learning speeds and styles.
    - Encourage students to develop and justify their own mathematical arguments.
    - Allow opportunities for independent exploration and deeper inquiry.

    End with an encouraging closing statement that connects to their interests and potential future paths.

    The content should be easy to read and understand, using grade-appropriate vocabulary.
    Include a clear, student-friendly title that includes the grade level (${gradeLevelText}).`;
};