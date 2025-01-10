import { Button } from "@/components/ui/button";
import { QuestionComponent } from "./QuestionComponent";
import { useQuestionResponses } from "@/hooks/useQuestionResponses";

type Question = {
  question: string;
  answer: string;
  type: 'text' | 'multiple-choice' | 'multiple-answer';
  options?: string[];
  correctAnswers?: string[];
};

interface QuestionsSectionProps {
  questions: Question[];
  lessonId: string;
  subject: string;
}

export const QuestionsSection = ({ questions, lessonId, subject }: QuestionsSectionProps) => {
  const {
    answers,
    isSubmitting,
    handleAnswerChange,
    handleSubmit,
  } = useQuestionResponses(lessonId, subject);

  if (!questions.length) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Practice Questions</h3>
      <div className="space-y-6">
        {questions.map((question, index) => (
          <QuestionComponent
            key={index}
            question={question}
            index={index}
            answer={answers[index]}
            onAnswerChange={handleAnswerChange}
          />
        ))}
        <Button 
          onClick={() => handleSubmit(questions)} 
          disabled={isSubmitting}
          className="mt-4"
        >
          {isSubmitting ? "Checking answers..." : "Submit Answers"}
        </Button>
      </div>
    </div>
  );
};