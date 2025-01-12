export const isNumberComparisonQuestion = (question: string): boolean => {
  const normalizedQuestion = question.toLowerCase();
  return normalizedQuestion.includes('greater than') ||
         normalizedQuestion.includes('less than') ||
         normalizedQuestion.includes('equal to');
};

export const isMathematicalQuestion = (question: string): boolean => {
  const mathPatterns = [
    /discriminant/i,
    /quadratic equation/i,
    /solve for x/i,
    /calculate/i,
    /evaluate/i,
    /find the value/i
  ];
  
  return mathPatterns.some(pattern => pattern.test(question));
};

export const calculateDiscriminant = (equation: string): number => {
  // Remove spaces and equals zero part
  const cleanedEquation = equation.replace(/\s+/g, '').replace(/=0$/, '');
  
  // Extract coefficients using regex
  const coefficientRegex = /(-?\d*)?x\^2|(-?\d*)?x|(-?\d+)/g;
  const terms = cleanedEquation.match(coefficientRegex) || [];
  
  let a = 0, b = 0, c = 0;
  
  terms.forEach(term => {
    if (term.includes('x^2')) {
      a = term === 'x^2' ? 1 : term === '-x^2' ? -1 : parseInt(term);
    } else if (term.includes('x')) {
      b = term === 'x' ? 1 : term === '-x' ? -1 : parseInt(term);
    } else {
      c = parseInt(term);
    }
  });
  
  // Calculate discriminant using b² - 4ac
  return Math.pow(b, 2) - (4 * a * c);
};