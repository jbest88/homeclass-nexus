export const normalizeText = (text: string): string => {
  if (!text) return '';
  // Remove extra whitespace, convert to lowercase, and trim
  return text.toString().toLowerCase().trim();
};

export const isAllOfTheAbove = (text: string): boolean => {
  const normalizedText = normalizeText(text);
  return normalizedText.includes('all of the above') || 
         normalizedText.includes('all the above');
};

export const isMathQuestion = (question: string): boolean => {
  const mathKeywords = [
    'calculate', 'solve', 'sum', 'difference', 'product', 'quotient',
    'equals', 'plus', 'minus', 'times', 'divided by', '+', '-', '*', '/',
    'square', 'cube', 'root', 'power', 'exponent'
  ];
  
  const normalizedQuestion = question.toLowerCase();
  return mathKeywords.some(keyword => normalizedQuestion.includes(keyword));
};

export const isNumberComparisonQuestion = (question: string): boolean => {
  const normalizedQuestion = question.toLowerCase();
  return normalizedQuestion.includes('greater than') ||
         normalizedQuestion.includes('less than') ||
         normalizedQuestion.includes('equal to');
};

export const wordToNumber = (word: string): number | null => {
  const numberWords: { [key: string]: number } = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10
  };

  const normalized = normalizeText(word);
  return numberWords[normalized] ?? null;
};

export const evaluateExponentExpression = (expr: string): number => {
  if (!expr) return NaN;
  
  try {
    const normalized = expr.replace(/\s+/g, '')
      .replace(/([0-9])²/g, '$1^2')
      .replace(/([0-9])³/g, '$1^3');

    const parts = normalized.split(/([×\+\-\/])/);
    const evaluated = parts.map(part => {
      if (part.includes('^')) {
        const [base, exponent] = part.split('^').map(Number);
        return Math.pow(base, exponent);
      }
      return part;
    }).join('');

    return new Function(`return ${evaluated}`)();
  } catch (error) {
    console.error('Error evaluating expression:', error);
    return NaN;
  }
};