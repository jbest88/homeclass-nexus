export { validateTrueFalse } from './trueFalseValidator.ts';
export { validateMultipleChoice } from './multipleChoiceValidator.ts';
export { validateMultipleAnswer } from './multipleAnswerValidator.ts';
export { validateText } from './textValidator.ts';

// Re-export validateDropdown as it uses the same logic as validateMultipleChoice
export { validateMultipleChoice as validateDropdown } from './multipleChoiceValidator.ts';