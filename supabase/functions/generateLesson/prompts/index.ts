
// prompts/index.ts

/** @deprecated Use createLessonOnlyPrompt instead */
export { createLessonPrompt } from './lessonPrompt.ts';

/** @deprecated Use createLessonOnlyPrompt instead */
export { createQuestionsPrompt } from './questionsPrompt.ts';

/** @deprecated Use createLessonOnlyPrompt instead */
export { createCombinedLessonPrompt } from './createCombinedLessonPrompt.ts'; // Fixed import path

// New simplified prompt function for generating lesson content only
export { createLessonOnlyPrompt } from './lessonOnlyPrompt.ts';
