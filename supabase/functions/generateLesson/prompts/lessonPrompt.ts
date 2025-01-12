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

  return `Generate an academically rigorous lesson on ${subject} that strictly adheres to ${gradeLevelText} academic standards. The content must maintain sophisticated academic depth while being precisely calibrated for the target grade level.

    ACADEMIC REQUIREMENTS:
    - Content MUST be at the upper range of ${gradeLevelText} curriculum standards
    - Target cognitive development: ${piagetStage}
    - Academic expectations: ${gradeExpectations}
    - Employ precise academic terminology and sophisticated vocabulary appropriate for ${gradeLevelText}
    - Incorporate advanced theoretical frameworks and complex analytical approaches
    - Emphasize interdisciplinary connections and higher-order thinking skills
    - CRITICAL: Content must challenge students at the upper bounds of their grade level

    CONTENT STRUCTURE:
    1. Core Theoretical Framework:
       - Present advanced theoretical principles
       - Define complex terminology with precision
       - Establish mathematical/scientific foundations
    
    2. Advanced Concept Analysis:
       For each key concept:
       * Theoretical Foundation:
         - Rigorous mathematical/scientific principles
         - Formal definitions and proofs where applicable
         - Underlying mechanisms and relationships
       
       * Complex Examples:
         - Sophisticated real-world applications
         - Multi-step problem-solving scenarios
         - Advanced case studies
         - Analytical frameworks
       
       * Critical Analysis:
         - Theoretical implications
         - Edge cases and limitations
         - Advanced problem-solving strategies
    
    3. Integration Points:
       - Connect to advanced topics in related fields
       - Explore theoretical intersections
       - Analyze real-world applications
    
    4. Advanced Applications:
       - Complex problem-solving scenarios
       - Multi-variable analysis
       - Real-world case studies
       - Theoretical extensions

    CRITICAL GUIDELINES:
    - Maintain sophisticated academic language throughout
    - Include rigorous mathematical/scientific notation where appropriate
    - Present complex, multi-step examples
    - Challenge students with advanced concepts while maintaining grade-level appropriateness
    - Focus on theoretical understanding and analytical thinking
    - Emphasize problem-solving strategies and critical analysis
    - IMPORTANT: Content must be at the upper bounds of ${gradeLevelText} difficulty

    The content should maintain high academic rigor while being precisely calibrated for ${gradeLevelText}. Include a clear, academically appropriate title that reflects the sophisticated nature of the content.`;
};