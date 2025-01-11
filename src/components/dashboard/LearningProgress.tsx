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
import { differenceInDays } from "date-fns";

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

      return pathsWithLessons;
    },
    enabled: !!user,
  });

  // Get all lesson IDs that are part of any learning path
  const pathLessonIds = learningPaths?.flatMap(path => 
    path.lessons?.map(lesson => lesson.lesson_id) || []
  ) || [];

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

  const { data: generatedLessons } = useQuery({
    queryKey: ["generated-lessons"],
    queryFn: async () => {
      if (!user) return null;
      const { data: lessons, error } = await supabase
        .from("generated_lessons")
        .select("*")
        .eq("user_id", user.id)
        .order("subject")
        .order("order_index");

      if (error) throw error;
      
      // Only show lessons that are not part of any learning path and are not archived
      const now = new Date();
      return lessons.filter(lesson => 
        !pathLessonIds.includes(lesson.id) && 
        differenceInDays(now, new Date(lesson.created_at)) < 1
      );
    },
    enabled: !!user,
  });

  const handleLessonDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["generated-lessons"] });
    queryClient.invalidateQueries({ queryKey: ["learning-paths"] });
    queryClient.invalidateQueries({ queryKey: ["archived-lessons"] });
  };

  // Group lessons by subject for regular progress view
  const subjectProgress = generatedLessons?.reduce((acc, lesson) => {
    if (!acc[lesson.subject]) {
      acc[lesson.subject] = {
        totalModules: 0,
        completedModules: 0,
        modules: [],
      };
    }

    acc[lesson.subject].totalModules++;
    acc[lesson.subject].modules.push({
      id: lesson.id,
      title: lesson.title,
      completed: completedLessonIds.has(lesson.id),
      created_at: lesson.created_at,
    });

    if (completedLessonIds.has(lesson.id)) {
      acc[lesson.subject].completedModules++;
    }

    return acc;
  }, {} as Record<string, { totalModules: number; completedModules: number; modules: any[] }>);

  // Group learning paths by subject
  const pathsBySubject = learningPaths?.reduce((acc, path) => {
    if (!acc[path.subject]) {
      acc[path.subject] = [];
    }
    acc[path.subject].push(path);
    return acc;
  }, {} as Record<string, LearningPath[]>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Learning Journey
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => navigate('/archive')}
        >
          <Archive className="h-4 w-4" />
          Archive
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {Object.entries(subjectProgress || {}).map(([subject, data]) => (
            <SubjectProgress
              key={subject}
              subject={subject}
              totalModules={data.totalModules}
              completedModules={data.completedModules}
              modules={data.modules}
              learningPaths={pathsBySubject?.[subject] || []}
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