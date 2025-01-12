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

  return `Generate an engaging and academically sound lesson on ${subject} that aligns with ${gradeLevelText} curriculum standards. The content should maintain academic depth while being accessible to students at this level.

    ACADEMIC REQUIREMENTS:
    - Content should target the upper-middle range of ${gradeLevelText} curriculum standards
    - Cognitive development stage: ${piagetStage}
    - Academic expectations: ${gradeExpectations}
    - Use precise academic terminology appropriate for ${gradeLevelText}
    - Balance theoretical understanding with practical applications
    - Incorporate cross-disciplinary connections where relevant
    - Challenge students while maintaining grade-level accessibility

    CONTENT STRUCTURE:
    1. Core Concepts:
       - Present key theoretical principles clearly
       - Define important terminology precisely
       - Establish foundational understanding
    
    2. Concept Development:
       For each key concept:
       * Theoretical Foundation:
         - Clear explanation of principles
         - Logical progression of ideas
         - Key relationships and patterns
       
       * Worked Examples:
         - Step-by-step problem solving
         - Real-world applications
         - Clear analytical process
         - Practice opportunities
       
       * Understanding Check:
         - Key points summary
         - Common misconceptions addressed
         - Application strategies
    
    3. Connections:
       - Link to related topics
       - Show practical relevance
       - Connect to other subjects
    
    4. Applications:
       - Practical problem-solving
       - Real-world examples
       - Hands-on activities
       - Extension opportunities

    CRITICAL GUIDELINES:
    - Use clear, precise language
    - Include appropriate mathematical/scientific notation
    - Present step-by-step examples
    - Balance challenge with accessibility
    - Focus on understanding and application
    - Emphasize problem-solving strategies
    - Maintain engagement through relevant examples

    The content should be academically sound while being appropriately challenging for ${gradeLevelText}. Include a clear, descriptive title that reflects the lesson content.`;
};