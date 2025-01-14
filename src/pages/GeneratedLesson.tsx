import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import LessonContent from "@/components/lesson/LessonContent";
import { QuestionsSection } from "@/components/lesson/QuestionsSection";
import { Question } from "@/types/questions";

const GeneratedLesson = () => {
  const { lessonId } = useParams();

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
      <LessonHeader />
      <LessonContent 
        title={lesson.title}
        content={lesson.content}
      />
      {hasQuestions && (
        <QuestionsSection
          questions={questions}
          lessonId={lesson.id}
          subject={lesson.subject}
        />
      )}
    </div>
  );
};

export default GeneratedLesson;