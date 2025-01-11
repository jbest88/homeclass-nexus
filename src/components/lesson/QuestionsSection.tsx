import { Button } from "@/components/ui/button";
import { QuestionComponent } from "./QuestionComponent";
import { useQuestionResponses } from "@/hooks/useQuestionResponses";
import { Question } from "@/types/questions";
import { useNavigate } from "react-router-dom";
import { useGenerateLesson } from "@/hooks/useGenerateLesson";

interface QuestionsSectionProps {
  questions: Question[];
  lessonId: string;
  subject: string;
}

export const QuestionsSection = ({ questions, lessonId, subject }: QuestionsSectionProps) => {
  const navigate = useNavigate();
  const { handleGenerateLesson, isGenerating } = useGenerateLesson();
  const {
    answers,
    isSubmitting,
    isSubmitted,
    handleAnswerChange,
    handleSubmit,
    performance,
  } = useQuestionResponses(lessonId, subject);

  if (!questions.length) return null;

  const handleContinue = () => {
    navigate("/dashboard");
  };

  const handleGenerateNewLesson = async () => {
    if (performance && performance.correctPercentage < 70) {
      // If performance is below 70%, regenerate a lesson on the same subject
      await handleGenerateLesson(subject, true);
    } else {
      // If performance is good, move on to a new lesson
      await handleGenerateLesson(subject);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Practice Questions</h3>
      <div className="space-y-6">
        {questions.map((question, index) => (
          <QuestionComponent
            key={index}
            question={question}
            answerState={answers[index] || { answer: "", isSubmitted: false }}
            onAnswerChange={(answer) => handleAnswerChange(index, answer)}
            isLocked={isSubmitted}
            subject={subject}
            lessonId={lessonId}
            questionIndex={index}
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
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button 
              onClick={handleGenerateNewLesson}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? "Generating..." : performance && performance.correctPercentage < 70 
                ? "Try a Different Approach" 
                : "Generate New Lesson"}
            </Button>
            <Button 
              onClick={handleContinue}
              variant="outline"
              className="flex-1"
            >
              Return to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};