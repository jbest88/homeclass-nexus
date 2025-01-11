import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { LessonContent } from "@/components/lesson/LessonContent";
import { QuestionsSection } from "@/components/lesson/QuestionsSection";
import { Question } from "@/types/questions";
import { toast } from "sonner";
import { useState } from "react";

const GeneratedLesson = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [highlightedText, setHighlightedText] = useState<string | null>(null);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["generated-lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_lessons")
        .select("*")
        .eq("id", lessonId)
        .single();

      if (error) throw error;
      return {
        ...data,
        questions: data.questions as Question[]
      };
    },
  });

  const handleDelete = async () => {
    if (!lessonId || isDeleting) return;
    
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from("generated_lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;

      toast.success("Lesson deleted successfully");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast.error("Failed to delete lesson");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!lesson) {
    return <div>Lesson not found</div>;
  }

  const hasQuestions = Array.isArray(lesson.questions);
  const questions = hasQuestions ? lesson.questions : [];

  return (
    <div className="container mx-auto p-6">
      <LessonHeader onDelete={handleDelete} isDeleting={isDeleting} />
      <LessonContent 
        title={lesson.title}
        subject={lesson.subject}
        content={lesson.content}
        highlightedText={highlightedText}
      />
      {hasQuestions && (
        <QuestionsSection
          questions={questions}
          lessonId={lesson.id}
          subject={lesson.subject}
          onHighlightContent={setHighlightedText}
        />
      )}
    </div>
  );
};

export default GeneratedLesson;