import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { LessonContent } from "@/components/lesson/LessonContent";
import { QuestionsSection } from "@/components/lesson/QuestionsSection";
import { Question } from "@/types/questions";
import { Video } from "@/types/video";

const GeneratedLesson = () => {
  const { lessonId } = useParams();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["generated-lesson", lessonId],
    queryFn: async () => {
      // First fetch the lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from("generated_lessons")
        .select("*")
        .eq("id", lessonId)
        .single();

      if (lessonError) throw lessonError;

      // Then fetch related videos
      const { data: videosData, error: videosError } = await supabase
        .from("lesson_videos")
        .select("*")
        .eq("lesson_id", lessonId);

      if (videosError) throw videosError;

      // Transform video data to match Video type
      const videos: Video[] = videosData.map(video => ({
        videoId: video.video_id,
        title: video.title,
        description: video.description || "",
        topics: [] // Topics will be extracted from the lesson content
      }));

      return {
        ...lessonData,
        questions: lessonData.questions as Question[],
        videos
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
        subject={lesson.subject}
        content={lesson.content}
        videos={lesson.videos}
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