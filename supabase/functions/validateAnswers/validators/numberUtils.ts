import { normalizeText } from '../utils.ts';

export const wordToNumber = (word: string): number | null => {
  const numberWords: { [key: string]: number } = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
    'fourteen': 14, 'fifteen': 15, 'sixteen': 16,
    'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20
  };

  const normalized = normalizeText(word);
  return numberWords[normalized] ?? null;
};

export const evaluateExponentExpression = (expr: string): number => {
  if (!expr) return NaN;
  
  try {
    const normalized = expr.replace(/\s+/g, '')
      .replace(/([0-9])²/g, '$1^2')
      .replace(/([0-9])³/g, '$1^3')
      .replace(/([0-9])⁴/g, '$1^4')
      .replace(/([0-9])⁵/g, '$1^5')
      .replace(/([0-9])⁶/g, '$1^6')
      .replace(/([0-9])⁷/g, '$1^7')
      .replace(/([0-9])⁸/g, '$1^8')
      .replace(/([0-9])⁹/g, '$1^9')
      .replace(/([0-9])¹/g, '$1^1');

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