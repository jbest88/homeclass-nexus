export const createQuestionsPrompt = (
  lessonContent: string,
  gradeLevelText: string,
): string => {
  return `Based on this lesson: "${lessonContent}", generate EXACTLY 5 challenging practice questions to test deep understanding for an advanced ${gradeLevelText} student.

    CRITICAL RULES:
    1. Questions MUST be challenging yet appropriate for advanced ${gradeLevelText} students:
       - Use sophisticated vocabulary and complex concepts
       - Require multi-step problem solving
       - Include application of multiple concepts
       - Test deeper understanding rather than mere recall
    2. Generate EXACTLY 5 questions, covering these types:
       - Multiple choice (2 questions with challenging distractors)
       - Multiple answer (1 question requiring careful analysis)
       - True/False (1 question testing subtle understanding)
       - Dropdown (1 question with complex options)
    3. Each question MUST follow the specified JSON format EXACTLY
    4. IMPORTANT: Avoid ANY references to semesters, seasons, or time of year

    FOR ALL QUESTIONS:
    - Require application of multiple concepts from the lesson
    - Include challenging edge cases and complex scenarios
    - Test both procedural and conceptual understanding
    - Incorporate real-world applications
    - Ensure distractors are plausible and test common misconceptions

    SPECIFIC FORMATS:
    1. Multiple choice:
    {
      "question": "Complex scenario requiring analysis...",
      "type": "multiple-choice",
      "options": ["4 challenging options with subtle differences"],
      "answer": "correct option"
    }
    
    2. Multiple answer:
    {
      "question": "Scenario requiring identification of multiple correct elements...",
      "type": "multiple-answer",
      "options": ["options requiring careful consideration"],
      "correctAnswers": ["correct options"]
    }

    3. True/False:
    {
      "question": "Subtle statement testing deep understanding...",
      "type": "true-false",
      "answer": "true/false"
    }

    4. Dropdown:
    {
      "question": "Complex scenario with multiple considerations...",
      "type": "dropdown",
      "options": ["carefully crafted options"],
      "answer": "correct option"
    }

    OUTPUT INSTRUCTIONS:
    - Return ONLY the raw JSON array with EXACTLY 5 challenging questions
    - Verify all questions are properly formatted and challenging
    - Ensure each question tests deep understanding

    Your response should look like this:
    [
      {
        "question": "...",
        "type": "...",
        "options": [...],
        "answer": "..."
      },
      ...
    ]`;
};