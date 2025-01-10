import { useState } from "react";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type BaseQuestion = {
  question: string;
  answer: string;
  type: 'text' | 'multiple-choice' | 'multiple-answer';
};

type TextQuestion = BaseQuestion & {
  type: 'text';
};

type MultipleChoiceQuestion = BaseQuestion & {
  type: 'multiple-choice';
  options: string[];
};

type MultipleAnswerQuestion = BaseQuestion & {
  type: 'multiple-answer';
  options: string[];
  correctAnswers: string[];
};

type Question = TextQuestion | MultipleChoiceQuestion | MultipleAnswerQuestion;

type AnswerState = {
  value: string | string[];
  isCorrect?: boolean;
  explanation?: string;
};

interface QuestionComponentProps {
  question: Question;
  index: number;
  answer: AnswerState | undefined;
  onAnswerChange: (index: number, value: string | string[]) => void;
}

export const QuestionComponent = ({
  question,
  index,
  answer,
  onAnswerChange,
}: QuestionComponentProps) => {
  const handleTextAnswerChange = (value: string) => {
    onAnswerChange(index, value);
  };

  const handleMultipleChoiceChange = (value: string) => {
    onAnswerChange(index, value);
  };

  const handleMultipleAnswerChange = (value: string, checked: boolean) => {
    const currentAnswers = Array.isArray(answer?.value) ? answer.value : [];
    let newAnswers: string[];
    
    if (checked) {
      newAnswers = [...currentAnswers, value];
    } else {
      newAnswers = currentAnswers.filter(answer => answer !== value);
    }

    onAnswerChange(index, newAnswers);
  };

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <RadioGroup
            value={answer?.value as string || ""}
            onValueChange={handleMultipleChoiceChange}
            className="space-y-2"
          >
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}-${optionIndex}`} />
                <Label htmlFor={`option-${index}-${optionIndex}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'multiple-answer':
        return (
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => {
              const currentAnswers = (answer?.value as string[]) || [];
              return (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <Checkbox
                    id={`option-${index}-${optionIndex}`}
                    checked={currentAnswers.includes(option)}
                    onCheckedChange={(checked) => 
                      handleMultipleAnswerChange(option, checked as boolean)
                    }
                  />
                  <Label htmlFor={`option-${index}-${optionIndex}`}>{option}</Label>
                </div>
              );
            })}
          </div>
        );
      
      default:
        return (
          <Input
            placeholder="Type your answer here..."
            value={answer?.value as string || ""}
            onChange={(e) => handleTextAnswerChange(e.target.value)}
            className="mb-2"
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <p className="font-medium mb-4">Q: {question.question}</p>
        {renderQuestionInput()}
        {answer?.isCorrect !== undefined && (
          <div className={`mt-2 p-2 rounded ${
            answer.isCorrect 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            <p className="font-medium">
              {answer.isCorrect ? "Correct!" : "Incorrect"}
            </p>
            {answer.explanation && (
              <p className="text-sm mt-1">{answer.explanation}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};