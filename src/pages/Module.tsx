import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "sonner";

const Module = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const user = useUser();

  const { data: module, isLoading: moduleLoading } = useQuery({
    queryKey: ["module", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_modules")
        .select("*")
        .eq("id", moduleId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: progress } = useQuery({
    queryKey: ["module-progress", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_progress")
        .select("*")
        .eq("module_id", moduleId)
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleComplete = async () => {
    try {
      if (!user) return;

      if (progress) {
        const { error } = await supabase
          .from("module_progress")
          .update({ completed_at: new Date().toISOString() })
          .eq("id", progress.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("module_progress")
          .insert({
            user_id: user.id,
            module_id: moduleId,
            completed_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast.success("Module completed!");
    } catch (error) {
      console.error("Error marking module as complete:", error);
      toast.error("Failed to mark module as complete");
    }
  };

  if (moduleLoading) {
    return <div>Loading...</div>;
  }

  if (!module) {
    return <div>Module not found</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/dashboard")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{module.title}</CardTitle>
          <div className="text-sm text-muted-foreground">
            Subject: {module.subject}
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap">{module.content}</div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleComplete}
              className="flex items-center gap-2"
              disabled={!!progress?.completed_at}
            >
              <CheckCircle className="h-4 w-4" />
              {progress?.completed_at ? "Completed" : "Mark as Complete"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Module;