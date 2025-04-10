// prompts/index.ts

/** @deprecated Use createCombinedLessonPrompt instead */
export { createLessonPrompt } from './lessonPrompt.ts';

/** @deprecated Use createCombinedLessonPrompt instead */
export { createQuestionsPrompt } from './questionsPrompt.ts';

// New recommended function for generating complete lessons
export { createCombinedLessonPrompt } from './combinedLessonPrompt.ts';