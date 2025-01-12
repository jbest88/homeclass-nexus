// Difficulty levels from 1-10 mapped to educational terms
export const difficultyLevels = {
  basic: [1, 2, 3],
  intermediate: [4, 5, 6],
  advanced: [7, 8, 9, 10]
};

export const getDifficultyLevel = (proficiencyLevel: number): 'basic' | 'intermediate' | 'advanced' => {
  if (proficiencyLevel <= 3) return 'basic';
  if (proficiencyLevel <= 6) return 'intermediate';
  return 'advanced';
};

export const validateQuestionDifficulty = (
  question: string,
  gradeLevel: number,
  proficiencyLevel: number
): boolean => {
  // Keywords that indicate complexity
  const advancedKeywords = [
    'analyze', 'evaluate', 'synthesize', 'compare', 'contrast',
    'explain why', 'predict', 'hypothesize', 'prove'
  ];
  
  const intermediateKeywords = [
    'describe', 'explain', 'identify', 'classify', 'demonstrate',
    'solve', 'calculate', 'illustrate'
  ];
  
  const basicKeywords = [
    'what is', 'who is', 'where is', 'when did',
    'list', 'name', 'define', 'recall'
  ];

  const questionLower = question.toLowerCase();
  const difficulty = getDifficultyLevel(proficiencyLevel);

  // Check if question complexity matches the student's level
  const hasAdvancedKeywords = advancedKeywords.some(keyword => 
    questionLower.includes(keyword.toLowerCase())
  );
  const hasIntermediateKeywords = intermediateKeywords.some(keyword => 
    questionLower.includes(keyword.toLowerCase())
  );
  const hasBasicKeywords = basicKeywords.some(keyword => 
    questionLower.includes(keyword.toLowerCase())
  );

  // Validate based on difficulty level
  switch (difficulty) {
    case 'basic':
      return hasBasicKeywords && !hasAdvancedKeywords;
    case 'intermediate':
      return hasIntermediateKeywords && !hasAdvancedKeywords;
    case 'advanced':
      return hasAdvancedKeywords || 
        (hasIntermediateKeywords && proficiencyLevel > 7);
    default:
      return false;
  }
};

export const adjustQuestionForDifficulty = (
  question: string,
  targetDifficulty: 'basic' | 'intermediate' | 'advanced'
): string => {
  // Add difficulty-appropriate prefixes to questions
  const prefixes = {
    basic: ['What is', 'Can you tell me', 'Please list'],
    intermediate: ['Explain how', 'Describe why', 'In what way'],
    advanced: ['Analyze why', 'Evaluate how', 'Compare and contrast']
  };

  // Remove any existing prefixes
  const cleanQuestion = question.replace(/^(what|explain|describe|analyze|evaluate|compare).+?(is|how|why)/i, '').trim();

  // Add new prefix based on target difficulty
  const prefix = prefixes[targetDifficulty][Math.floor(Math.random() * prefixes[targetDifficulty].length)];
  return `${prefix} ${cleanQuestion}`;
};