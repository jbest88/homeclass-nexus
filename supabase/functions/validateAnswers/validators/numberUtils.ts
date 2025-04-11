import { normalizeText } from "../utils.ts";

export const wordToNumber = (word: string): number | null => {
  const numberWords: { [key: string]: number } = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
  };

  const normalized = normalizeText(word);
  return numberWords[normalized] ?? null;
};

export const evaluateExponentExpression = (expr: string): number => {
  if (!expr) return NaN; // Handle empty expression

  const normalized = expr.replace(/\s+/g, ""); // Remove all whitespace
  const regex = /([0-9])([²³⁴⁵⁶⁷⁸⁹¹])/g;
  const replaced = normalized.replace(regex, (_, num, exp) => `${num}^${"²³⁴⁵⁶⁷⁸⁹¹".indexOf(exp) + 2}`); // Replace unicode exponents with ^
  const parts = replaced.split(/([×+\-/])/); // Splitting by operators

  const evaluated = parts.map((part) => {
    if (part.includes("^")) {
      const [base, exponent] = part.split("^").map(Number);
      if (!isNaN(base) && !isNaN(exponent)) return Math.pow(base, exponent); // Evaluate to power
      else return NaN; // Handle invalid base or exponent
    } else if (["×", "+", "-", "/"].includes(part)) { 
      return part; // return operators
    }
    return Number(part); // return number
  }).join("");

  return new Function(`return ${evaluated}`)(); // run the expression
};