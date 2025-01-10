import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";

interface LearningProgressProps {
  onGenerateLesson: (subject: string) => Promise<void>;
  isGenerating: boolean;
}

const LearningProgress = ({ onGenerateLesson, isGenerating }: LearningProgressProps) => {
  const user = useUser();
  const navigate = useNavigate();

  const { data: modules } = useQuery({
    queryKey: ["learning-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_modules")
        .select("*")
        .order("subject")
        .order("order_index");

      if (error) throw error;
      return data;
    },
  });

  const { data: progress } = useQuery({
    queryKey: ["module-progress"],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("module_progress")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const subjectProgress = modules?.reduce((acc, module) => {
    if (!acc[module.subject]) {
      acc[module.subject] = {
        totalModules: 0,
        completedModules: 0,
        modules: [],
      };
    }

    acc[module.subject].totalModules++;
    acc[module.subject].modules.push({
      ...module,
      completed: progress?.some(
        (p) => p.module_id === module.id && p.completed_at
      ),
    });

    if (
      progress?.some((p) => p.module_id === module.id && p.completed_at)
    ) {
      acc[module.subject].completedModules++;
    }

    return acc;
  }, {} as Record<string, { totalModules: number; completedModules: number; modules: any[] }>);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Learning Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {Object.entries(subjectProgress || {}).map(([subject, data]) => (
            <div key={subject} className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{subject}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {data.completedModules} / {data.totalModules} modules
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGenerateLesson(subject)}
                    disabled={isGenerating}
                  >
                    <Plus className="h-4 w-4" />
                    Generate
                  </Button>
                </div>
              </div>
              <Progress
                value={(data.completedModules / data.totalModules) * 100}
                className="h-2"
              />
              <div className="mt-4 space-y-3">
                {data.modules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between bg-muted/50 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {module.completed && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                      <span className="text-sm">{module.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/module/${module.id}`)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LearningProgress;