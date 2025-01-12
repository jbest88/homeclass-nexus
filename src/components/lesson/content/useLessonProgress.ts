import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "sonner";

export const useLessonProgress = (lessonId: string) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const user = useUser();

  useEffect(() => {
    const loadProgress = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('lesson_section_progress')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading progress:', error);
        return;
      }

      if (data) {
        setCurrentSection(data.current_section);
        setCompletedSections(data.completed_sections || []);
      }
    };

    loadProgress();
  }, [lessonId, user]);

  const saveProgress = async (section: number, completed: number[]) => {
    if (!user) return;

    const { error } = await supabase
      .from('lesson_section_progress')
      .upsert({
        user_id: user.id,
        lesson_id: lessonId,
        current_section: section,
        completed_sections: completed,
        last_accessed_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    }
  };

  return {
    currentSection,
    setCurrentSection,
    completedSections,
    setCompletedSections,
    saveProgress,
  };
};