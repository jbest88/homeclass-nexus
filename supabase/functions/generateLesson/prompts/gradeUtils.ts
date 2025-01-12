export const getPiagetStage = (gradeLevelText: string): string => {
  const gradeLevel = parseInt(gradeLevelText.replace(/[^0-9]/g, '')) || 0;
  
  if (gradeLevel <= 1) {
    return "preoperational stage (ages 2-7), with emphasis on advanced symbolic thinking and intuitive thought";
  } else if (gradeLevel <= 5) {
    return "concrete operational stage (ages 7-11), focusing on logical reasoning and abstract pattern recognition";
  } else if (gradeLevel <= 8) {
    return "early formal operational stage (ages 11-15), emphasizing advanced abstract thinking and hypothetical reasoning";
  } else {
    return "formal operational stage (ages 15+), with focus on complex abstract reasoning and theoretical thinking";
  }
};

export const getGradeLevelExpectations = (gradeLevelText: string): string => {
  const gradeLevel = parseInt(gradeLevelText.replace(/[^0-9]/g, '')) || 0;
  
  if (gradeLevel === 0) {
    return "advanced pattern recognition, complex relationships, and abstract thinking foundations";
  } else if (gradeLevel <= 2) {
    return "sophisticated problem-solving, multi-step reasoning, and advanced conceptual connections";
  } else if (gradeLevel <= 5) {
    return "complex analytical thinking, abstract mathematical modeling, and advanced problem decomposition";
  } else if (gradeLevel <= 8) {
    return "rigorous logical reasoning, theoretical concept exploration, and sophisticated mathematical arguments";
  } else {
    return "advanced theoretical analysis, complex problem-solving, and abstract mathematical reasoning";
  }
};