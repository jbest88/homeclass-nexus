import { Button } from "@/components/ui/button";
import { QuestionComponent } from "./QuestionComponent";
import { useQuestionResponses } from "@/hooks/useQuestionResponses";
import { Question } from "@/types/questions";
import { useNavigate } from "react-router-dom";

interface QuestionsSectionProps {
  questions: Question[];
  lessonId: string;
  subject: string;
}

export const QuestionsSection = ({ questions, lessonId, subject }: QuestionsSectionProps) => {
  const navigate = useNavigate();
  const {
    answers,
    isSubmitting,
    isSubmitted,
    handleAnswerChange,
    handleSubmit,
  } = useQuestionResponses(lessonId, subject);

  if (!questions.length) return null;

  const handleContinue = () => {
    navigate("/dashboard");
  };

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
            isLocked={isSubmitted}
          />
        ))}
        {!isSubmitted ? (
          <Button 
            onClick={() => handleSubmit(questions)} 
            disabled={isSubmitting}
            className="mt-4"
          >
            {isSubmitting ? "Checking answers..." : "Submit Answers"}
          </Button>
        ) : (
          <Button 
            onClick={handleContinue}
            className="mt-4"
          >
            Continue to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
};