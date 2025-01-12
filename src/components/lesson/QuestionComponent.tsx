import { MultipleChoiceQuestion } from "./question-types/MultipleChoiceQuestion";
import { MultipleAnswerQuestion } from "./question-types/MultipleAnswerQuestion";
import { TrueFalseQuestion } from "./question-types/TrueFalseQuestion";
import { DropdownQuestion } from "./question-types/DropdownQuestion";
import { TextQuestion } from "./question-types/TextQuestion";
import { Question, AnswerState } from "@/types/questions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isNumberComparisonQuestion, isMathematicalQuestion, calculateDiscriminant } from "@/utils/questionUtils";

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

  const isContextDependentQuestion = (questionText: string): boolean => {
    const contextPatterns = [
      /around you/i,
      /do you see/i,
      /can you see/i,
      /in your room/i,
      /in front of you/i,
      /near you/i,
      /beside you/i,
      /in your environment/i,
      /in your surroundings/i,
    ];
    return contextPatterns.some(pattern => pattern.test(questionText));
  };

  const getShapeExplanation = (shape: string): string => {
    const shapeExplanations: Record<string, string> = {
      'circle': 'A circle has no sides - it is a curved line where every point is the same distance from the center.',
      'square': 'A square has 4 equal sides and 4 right angles.',
      'triangle': 'A triangle has 3 sides.',
      'rectangle': 'A rectangle has 4 sides with opposite sides being equal.',
      'pentagon': 'A pentagon has 5 sides.',
      'hexagon': 'A hexagon has 6 sides.',
      'octagon': 'An octagon has 8 sides.',
    };
    return shapeExplanations[shape.toLowerCase()] || '';
  };

  const getExplanation = () => {
    if (!answerState.isSubmitted) return '';
    
    // Handle context-dependent questions first
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
      
      if (isNumberComparisonQuestion(question.question)) {
        const numbers = question.question.match(/[\d,]+/g)?.map(num => Number(num.replace(/,/g, '')));
        
        if (numbers && numbers.length >= 2) {
          const [firstNum, secondNum] = numbers;
          
          let explanation = `You answered "${userAnswer}". `;
          explanation += `Let's understand why:\n`;
          explanation += `- The first number "${firstNum}" is equal to ${firstNum}\n`;
          explanation += `- The second number "${secondNum}" is equal to ${secondNum}\n`;
          
          if (question.question.toLowerCase().includes('bigger than') || 
              question.question.toLowerCase().includes('greater than')) {
            explanation += `- ${firstNum} is ${firstNum > secondNum ? '' : 'not'} greater than ${secondNum}\n`;
            explanation += `Therefore, the statement is ${correctAnswer}`;
          } else if (question.question.toLowerCase().includes('smaller than') || 
                     question.question.toLowerCase().includes('less than')) {
            explanation += `- ${firstNum} is ${firstNum < secondNum ? '' : 'not'} less than ${secondNum}\n`;
            explanation += `Therefore, the statement is ${correctAnswer}`;
          } else if (question.question.toLowerCase().includes('equal to')) {
            explanation += `- ${firstNum} is ${firstNum === secondNum ? '' : 'not'} equal to ${secondNum}\n`;
            explanation += `Therefore, the statement is ${correctAnswer}`;
          }
          
          return explanation;
        }
      }
      
      return `You answered "${userAnswer}". ${userAnswer === correctAnswer ? 
        `This is correct because the statement accurately reflects the concept being tested.` : 
        `The correct answer is "${correctAnswer}".`}`;
    }

    if (question.type === 'multiple-answer' && 'correctAnswers' in question) {
      const userAnswers = (answerState.answer as string[]) || [];
      const correctAnswers = question.correctAnswers || [];
      
      let explanation = '';
      
      // Special handling for questions about using numbers
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
        
        if (answerState.isCorrect) {
          explanation += `\nGreat job! You've correctly identified these important uses of numbers in everyday life.`;
        } else {
          const incorrect = userAnswers.filter(answer => !correctAnswers.includes(answer));
          explanation += `\nYou selected "${incorrect.join(', ')}" which ${incorrect.length > 1 ? 'are' : 'is'} not a primary use of numbers in this context.`;
        }
      } else if (question.question.toLowerCase().includes('shape') && 
                 (question.question.toLowerCase().includes('sides') || 
                  question.question.toLowerCase().includes('angles'))) {
        explanation = `Let's understand the shapes:\n\n`;
        if (question.answer) {
          explanation += getShapeExplanation(question.answer as string) + '\n\n';
        }
        if (answerState.isCorrect) {
          explanation += `You've correctly identified the properties of these shapes! Here's why each answer is correct:\n`;
          userAnswers.forEach(answer => {
            explanation += `✓ ${answer}: ${getShapeExplanation(answer)}\n`;
          });
        } else {
          explanation += `Your selection wasn't quite right. Here's why:\n`;
          userAnswers.forEach(answer => {
            explanation += `- ${answer}: ${getShapeExplanation(answer)}\n`;
          });
        }
      } else {
        if (answerState.isCorrect) {
          explanation = `Excellent! You selected all the correct answers: ${correctAnswers.join(', ')}. `;
          explanation += `Each of these answers demonstrates your understanding of the concept.`;
        } else {
          const missed = correctAnswers.filter(answer => !userAnswers.includes(answer));
          const incorrect = userAnswers.filter(answer => !correctAnswers.includes(answer));
          
          if (missed.length > 0) {
            explanation += `You missed these correct options: ${missed.join(', ')}. `;
          }
          if (incorrect.length > 0) {
            explanation += `You incorrectly selected: ${incorrect.join(', ')}. `;
          }
          explanation += `\n\nThe correct answers are: ${correctAnswers.join(', ')}. `;
        }
      }
      
      return explanation;
    }

    // For multiple choice questions about shapes
    if (question.type === 'multiple-choice' && 
        question.question.toLowerCase().includes('shape')) {
      let explanation = answerState.isCorrect 
        ? `Excellent! You correctly chose "${question.answer}". Here's why this is correct:\n\n`
        : `The correct answer is "${question.answer}". Here's why:\n\n`;
      explanation += getShapeExplanation(question.answer);
      
      // Add explanation for the chosen answer if incorrect
      if (!answerState.isCorrect && answerState.answer) {
        const userAnswer = answerState.answer as string;
        explanation += `\n\nYou chose "${userAnswer}": ${getShapeExplanation(userAnswer)}`;
      }
      
      return explanation;
    }

    // For mathematical questions
    if (question.question.toLowerCase().includes('discriminant')) {
      const equation = question.question.match(/\$.*\$/)?.[0].replace(/\$/g, '') || '';
      const matches = equation.match(/(-?\d*)?x\^2\s*([+-]\s*\d*)?x\s*([+-]\s*\d+)?/);
      
      if (matches) {
        const a = matches[1] ? parseInt(matches[1]) : 1;
        const b = matches[2] ? parseInt(matches[2].replace(/\s/g, '')) : 0;
        const c = matches[3] ? parseInt(matches[3].replace(/\s/g, '')) : 0;
        
        const discriminant = b * b - 4 * a * c;
        
        let explanation = answerState.isCorrect
          ? `Correct! Let's break down why the discriminant is ${discriminant}:\n\n`
          : `The discriminant is ${discriminant}. Here's how we calculate it:\n\n`;
        
        explanation += `1. For a quadratic equation ax² + bx + c, the discriminant is b² - 4ac\n`;
        explanation += `2. In this equation:\n`;
        explanation += `   - a = ${a}\n`;
        explanation += `   - b = ${b}\n`;
        explanation += `   - c = ${c}\n`;
        explanation += `3. Discriminant = (${b})² - 4(${a})(${c})\n`;
        explanation += `4. = ${b * b} - ${4 * a * c}\n`;
        explanation += `5. = ${discriminant}`;
        
        return explanation;
      }
    }

    // For other multiple choice questions
    return answerState.isCorrect
      ? `Correct! "${question.answer}" is the right answer because it best matches the concept being tested.`
      : `The correct answer is "${question.answer}".`;
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
              <div className="space-y-2">
                <p className="text-green-600">Correct!</p>
                <p className="text-gray-700 whitespace-pre-line">{getExplanation()}</p>
              </div>
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
