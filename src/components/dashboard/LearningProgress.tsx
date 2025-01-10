import { Card, ProgressBar, ListGroup } from 'react-bootstrap';
import { GraduationCap, ArrowRight, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

interface LearningProgressProps {
  isGenerating: boolean;
}

const LearningProgress = ({ isGenerating }: LearningProgressProps) => {
  const user = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

  const { data: generatedLessons } = useQuery({
    queryKey: ["generated-lessons"],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("generated_lessons")
        .select("*")
        .eq("user_id", user.id)
        .order("subject")
        .order("order_index");

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleLessonDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["generated-lessons"] });
  };

  const handleDelete = async (lessonId: string) => {
    if (deletingLessonId) return;
    
    try {
      setDeletingLessonId(lessonId);
      const { error } = await supabase
        .from("generated_lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;

      toast.success("Lesson deleted successfully");
      handleLessonDeleted();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast.error("Failed to delete lesson");
    } finally {
      setDeletingLessonId(null);
    }
  };

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
      completed: true,
    });

    acc[lesson.subject].completedModules++;

    return acc;
  }, {} as Record<string, { totalModules: number; completedModules: number; modules: any[] }>);

  return (
    <Card>
      <Card.Header>
        <div className="d-flex align-items-center gap-2">
          <GraduationCap size={20} />
          <Card.Title className="mb-0">Learning Progress</Card.Title>
        </div>
      </Card.Header>
      <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {Object.entries(subjectProgress || {}).map(([subject, data]) => (
          <div key={subject} className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-medium">{subject}</span>
              <span className="text-muted small">
                {data.completedModules} / {data.totalModules} lessons
              </span>
            </div>
            <ProgressBar
              now={(data.completedModules / data.totalModules) * 100}
              className="mb-3"
            />
            <ListGroup>
              {data.modules.map((module) => (
                <ListGroup.Item
                  key={module.id}
                  className="d-flex justify-content-between align-items-center bg-light"
                >
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-success rounded-circle" style={{ width: 8, height: 8 }} />
                    <span>{module.title}</span>
                  </div>
                  <div>
                    <button
                      className="btn btn-link btn-sm p-1 me-2"
                      onClick={() => navigate(`/generated-lesson/${module.id}`)}
                    >
                      <ArrowRight size={16} />
                    </button>
                    <button
                      className="btn btn-link btn-sm p-1 text-danger"
                      onClick={() => handleDelete(module.id)}
                      disabled={deletingLessonId === module.id}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        ))}
      </Card.Body>
    </Card>
  );
};

export default LearningProgress;