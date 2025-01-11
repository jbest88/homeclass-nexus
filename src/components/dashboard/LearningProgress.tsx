import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import SubjectProgress from "./SubjectProgress";
import { LearningPath } from "@/types/learning-path";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LearningProgressProps {
  isGenerating: boolean;
}

const LearningProgress = ({ isGenerating }: LearningProgressProps) => {
  const user = useUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: learningPaths } = useQuery({
    queryKey: ["learning-paths"],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: paths, error: pathsError } = await supabase
        .from("learning_paths")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (pathsError) throw pathsError;

      const pathsWithLessons = await Promise.all(
        paths.map(async (path) => {
          const { data: pathLessons, error: lessonsError } = await supabase
            .from("learning_path_lessons")
            .select(`
              id,
              path_id,
              lesson_id,
              order_index,
              created_at,
              generated_lessons (
                id,
                title,
                subject,
                created_at
              )
            `)
            .eq("path_id", path.id)
            .order("order_index");

          if (lessonsError) throw lessonsError;

          return {
            ...path,
            lessons: pathLessons.map(pl => ({
              ...pl,
              title: pl.generated_lessons.title,
              subject: pl.generated_lessons.subject,
            })),
          };
        })
      );

      // Filter out paths that have no lessons
      return pathsWithLessons.filter(path => path.lessons && path.lessons.length > 0);
    },
    enabled: !!user,
  });

  // Fetch question responses to determine completed lessons
  const { data: questionResponses } = useQuery({
    queryKey: ["question-responses"],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("question_responses")
        .select("lesson_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Create a set of completed lesson IDs
  const completedLessonIds = new Set(questionResponses?.map(response => response.lesson_id));

  const handleLessonDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["generated-lessons"] });
    queryClient.invalidateQueries({ queryKey: ["learning-paths"] });
    queryClient.invalidateQueries({ queryKey: ["archived-lessons"] });
  };

  // Group learning paths by subject
  const pathsBySubject = learningPaths?.reduce((acc, path) => {
    if (!acc[path.subject]) {
      acc[path.subject] = {
        totalModules: 0,
        completedModules: 0,
        paths: [],
      };
    }

    const pathLessons = path.lessons || [];
    acc[path.subject].totalModules += pathLessons.length;
    acc[path.subject].completedModules += pathLessons.filter(
      lesson => completedLessonIds.has(lesson.lesson_id)
    ).length;
    acc[path.subject].paths.push(path);

    return acc;
  }, {} as Record<string, { totalModules: number; completedModules: number; paths: LearningPath[] }>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Today's Learning Journey
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => navigate('/archive')}
        >
          <Archive className="h-4 w-4" />
          Other Journeys
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {Object.entries(pathsBySubject || {}).map(([subject, data]) => (
            <SubjectProgress
              key={subject}
              subject={subject}
              totalModules={data.totalModules}
              completedModules={data.completedModules}
              modules={[]}
              learningPaths={data.paths}
              isGenerating={isGenerating}
              onLessonDeleted={handleLessonDeleted}
            />
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LearningProgress;