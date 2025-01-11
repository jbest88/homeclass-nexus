import { MultipleChoiceQuestion } from "./question-types/MultipleChoiceQuestion";
import { MultipleAnswerQuestion } from "./question-types/MultipleAnswerQuestion";
import { TrueFalseQuestion } from "./question-types/TrueFalseQuestion";
import { DropdownQuestion } from "./question-types/DropdownQuestion";
import { TextQuestion } from "./question-types/TextQuestion";
import { Question, AnswerState } from "@/types/questions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface QuestionComponentProps {
  question: Question;
  answerState: AnswerState;
  onAnswerChange: (answer: string | string[]) => void;
  isLocked?: boolean;
}

export const QuestionComponent = ({
  question,
  answerState,
  onAnswerChange,
  isLocked = false,
}: QuestionComponentProps) => {
  const handleAnswerChange = (value: string | string[]) => {
    if (!isLocked) {
      onAnswerChange(value);
    }
  };

  const props = {
    question: question.question,
    value: answerState.answer,
    onChange: handleAnswerChange,
    disabled: isLocked,
    options: 'options' in question ? question.options : undefined,
  };

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'multiple-choice':
        return <MultipleChoiceQuestion {...props} />;
      case 'multiple-answer':
        return <MultipleAnswerQuestion {...props} />;
      case 'true-false':
        return <TrueFalseQuestion {...props} />;
      case 'dropdown':
        return <DropdownQuestion {...props} />;
      case 'text':
        return <TextQuestion {...props} />;
      default:
        return null;
    }
  };

  const getExplanation = () => {
    if (!answerState.isSubmitted || answerState.isCorrect) {
      return answerState.explanation;
    }

    if (question.type === 'true-false') {
      const userAnswer = String(answerState.answer).toLowerCase();
      const correctAnswer = String(question.answer).toLowerCase();
      
      // Handle number comparison questions
      if (question.question.toLowerCase().includes('bigger than') || 
          question.question.toLowerCase().includes('smaller than') ||
          question.question.toLowerCase().includes('greater than') ||
          question.question.toLowerCase().includes('less than') ||
          question.question.toLowerCase().includes('equal to')) {
        
        // Extract numbers from the question
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
          
          if (answerState.explanation) {
            explanation += `\n\n${answerState.explanation}`;
          }
          
          return explanation;
        }
      }
      
      // For other true/false questions, provide a standard explanation
      return `You answered "${userAnswer}". The correct answer is "${correctAnswer}". ${answerState.explanation || ''}`;
    }

    if (question.type === 'multiple-answer' && 'correctAnswers' in question) {
      const userAnswers = (answerState.answer as string[]) || [];
      const correctAnswers = question.correctAnswers || [];
      
      const missed = correctAnswers.filter(answer => !userAnswers.includes(answer));
      const incorrect = userAnswers.filter(answer => !correctAnswers.includes(answer));
      
      let explanation = '';
      
      if (missed.length > 0) {
        explanation += `You missed these correct options: ${missed.join(', ')}. `;
      }
      
      if (incorrect.length > 0) {
        explanation += `You incorrectly selected: ${incorrect.join(', ')}. `;
      }
      
      explanation += `\n\nThe correct answers are: ${correctAnswers.join(', ')}. `;
      
      if (answerState.explanation) {
        explanation += `\n\n${answerState.explanation}`;
      }
      
      return explanation;
    }

    // For multiple choice questions, provide a clearer explanation
    if (question.type === 'multiple-choice') {
      return `The correct answer is "${question.answer}". ${answerState.explanation || ''}`;
    }

    return answerState.explanation;
  };

  return (
    <Card>
      <CardHeader>
        <div className="text-lg font-medium">{question.question}</div>
      </CardHeader>
      <CardContent>
        {renderQuestionInput()}
        {answerState.isSubmitted && (
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
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionComponent;