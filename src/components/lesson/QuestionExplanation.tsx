import React from 'react';
import { isContextDependentQuestion, getShapeExplanation } from '@/utils/questionUtils';
import { Question, AnswerState } from '@/types/questions';

interface QuestionExplanationProps {
  question: Question;
  answerState: AnswerState;
}

export const QuestionExplanation = ({ question, answerState }: QuestionExplanationProps) => {
  const getExplanation = () => {
    if (!answerState.isSubmitted) return '';
    
    if (isContextDependentQuestion(question.question)) {
      return `This question cannot be automatically validated as it depends on your physical surroundings. The correct answers would vary based on what you actually see around you. For learning purposes, focus on understanding what these shapes look like:\n\n` +
        `- A circle is a perfectly round shape\n` +
        `- A triangle has three sides and three angles\n` +
        `- A rectangle has four sides and four right angles\n` +
        `- A square is a special rectangle with all sides equal\n` +
        `- A star typically has five or more points radiating from a center\n\n` +
        `Practice identifying these shapes in your environment!`;
    }

    if (question.type === 'true-false') {
      const userAnswer = String(answerState.answer).toLowerCase();
      const correctAnswer = String(question.answer).toLowerCase();
      
      if (question.question.toLowerCase().includes('bigger than') || 
          question.question.toLowerCase().includes('smaller than') ||
          question.question.toLowerCase().includes('greater than') ||
          question.question.toLowerCase().includes('less than') ||
          question.question.toLowerCase().includes('equal to')) {
        
        const numbers = question.question.match(/['"](\w+)['"]|(\d+)/g)
          ?.map(n => n.replace(/['"]/g, ''))
          .filter(Boolean) || [];
        
        if (numbers.length >= 2) {
          const [firstNum, secondNum] = numbers;
          const numberWords: { [key: string]: number } = {
            'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
            'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
          };
          
          const num1 = numberWords[firstNum.toLowerCase()] ?? parseInt(firstNum);
          const num2 = numberWords[secondNum.toLowerCase()] ?? parseInt(secondNum);
          
          let explanation = `You answered "${userAnswer}". `;
          explanation += `Let's break this down:\n`;
          explanation += `- The first number "${firstNum}" is equal to ${num1}\n`;
          explanation += `- The second number "${secondNum}" is equal to ${num2}\n`;
          
          if (question.question.toLowerCase().includes('bigger than') || 
              question.question.toLowerCase().includes('greater than')) {
            explanation += `- ${num1} is ${num1 > num2 ? '' : 'not'} greater than ${num2}\n`;
            explanation += `Therefore, the statement is ${correctAnswer}`;
          } else if (question.question.toLowerCase().includes('smaller than') || 
                     question.question.toLowerCase().includes('less than')) {
            explanation += `- ${num1} is ${num1 < num2 ? '' : 'not'} less than ${num2}\n`;
            explanation += `Therefore, the statement is ${correctAnswer}`;
          } else if (question.question.toLowerCase().includes('equal to')) {
            explanation += `- ${num1} is ${num1 === num2 ? '' : 'not'} equal to ${num2}\n`;
            explanation += `Therefore, the statement is ${correctAnswer}`;
          }
          
          return explanation;
        }
      }
      
      return `You answered "${userAnswer}". The correct answer is "${correctAnswer}".`;
    }

    if (question.type === 'multiple-answer' && 'correctAnswers' in question) {
      const userAnswers = (answerState.answer as string[]) || [];
      const correctAnswers = question.correctAnswers || [];
      
      const missed = correctAnswers.filter(answer => !userAnswers.includes(answer));
      const incorrect = userAnswers.filter(answer => !correctAnswers.includes(answer));
      
      let explanation = '';
      
      if (question.question.toLowerCase().includes('use numbers') || 
          question.question.toLowerCase().includes('we use numbers')) {
        explanation = `Let's understand how we use numbers:\n\n`;
        correctAnswers.forEach(answer => {
          explanation += `✓ ${answer}: `;
          switch(answer.toLowerCase()) {
            case 'tell time':
              explanation += 'Numbers help us read clocks and schedules\n';
              break;
            case 'count things':
              explanation += 'Numbers let us know how many items we have\n';
              break;
            case 'measure things':
              explanation += 'Numbers help us understand length, weight, and volume\n';
              break;
            default:
              explanation += '\n';
          }
        });
        
        if (incorrect.length > 0) {
          explanation += `\nYou selected "${incorrect.join(', ')}" which ${incorrect.length > 1 ? 'are' : 'is'} not a primary use of numbers in this context.`;
        }
      } else if (question.question.toLowerCase().includes('shape') && 
                 (question.question.toLowerCase().includes('sides') || 
                  question.question.toLowerCase().includes('angles'))) {
        explanation = `Let's understand the shapes:\n\n`;
        if (question.answer) {
          explanation += getShapeExplanation(question.answer as string) + '\n\n';
        }
        explanation += `You selected "${userAnswers.join(', ')}" but the correct answer is different because:\n`;
        userAnswers.forEach(answer => {
          explanation += `- ${answer}: ${getShapeExplanation(answer)}\n`;
        });
      } else {
        if (missed.length > 0) {
          explanation += `You missed these correct options: ${missed.join(', ')}. `;
        }
        if (incorrect.length > 0) {
          explanation += `You incorrectly selected: ${incorrect.join(', ')}. `;
        }
        explanation += `\n\nThe correct answers are: ${correctAnswers.join(', ')}. `;
      }
      
      return explanation;
    }

    if (question.type === 'multiple-choice' && 
        question.question.toLowerCase().includes('shape')) {
      let explanation = `The correct answer is "${question.answer}". Here's why:\n\n`;
      explanation += getShapeExplanation(question.answer);
      
      if (answerState.answer) {
        const userAnswer = answerState.answer as string;
        explanation += `\n\nYou chose "${userAnswer}": ${getShapeExplanation(userAnswer)}`;
      }
      
      return explanation;
    }

    return `The correct answer is "${question.answer}".`;
  };

  if (!answerState.isSubmitted) return null;

  return (
    <div className="mt-4 space-y-2">
      {answerState.isCorrect ? (
        <p className="text-green-600">Correct!</p>
      ) : (
        <div className="space-y-2">
          <p className="text-red-600">Incorrect</p>
          <p className="text-gray-700 whitespace-pre-line">{getExplanation()}</p>
        </div>
      )}
    </div>
  );
};