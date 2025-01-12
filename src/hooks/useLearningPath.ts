import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUser } from "@supabase/auth-helpers-react";

export const useLearningPath = () => {
  const user = useUser();

  const addToLearningPath = async (
    lessonId: string,
    subject: string,
    performance?: { correctPercentage: number }
  ) => {
    if (!user) return;

    try {
      let pathId;
      let newLesson;

      // Check if this lesson is already part of a learning path
      const { data: existingPathLesson, error: checkError } = await supabase
        .from('learning_path_lessons')
        .select('path_id')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (checkError) throw checkError;

      // Get existing paths for this subject
      const { data: existingPaths, error: pathError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', user.id)
        .eq('subject', subject)
        .order('created_at', { ascending: false })
        .limit(1);

      if (pathError) throw pathError;

      // Create new path if none exists
      if (!existingPaths?.length) {
        const { data: newPath, error: createPathError } = await supabase
          .from('learning_paths')
          .insert({
            user_id: user.id,
            subject: subject,
          })
          .select()
          .single();

        if (createPathError) throw createPathError;
        pathId = newPath.id;

        // Add current lesson to the new path
        const { error: lessonError } = await supabase
          .from('learning_path_lessons')
          .insert({
            path_id: pathId,
            lesson_id: lessonId,
            order_index: 0,
          });

        if (lessonError) throw lessonError;
      } else {
        pathId = existingPathLesson?.path_id || existingPaths[0].id;

        // Add current lesson to existing path if not already added
        if (!existingPathLesson) {
          const { data: lastLesson, error: orderError } = await supabase
            .from('learning_path_lessons')
            .select('order_index')
            .eq('path_id', pathId)
            .order('order_index', { ascending: false })
            .limit(1);

          if (orderError) throw orderError;

          const nextOrderIndex = (lastLesson?.[0]?.order_index ?? -1) + 1;

          const { error: addLessonError } = await supabase
            .from('learning_path_lessons')
            .insert({
              path_id: pathId,
              lesson_id: lessonId,
              order_index: nextOrderIndex,
            });

          if (addLessonError) throw addLessonError;
        }
      }

      return { pathId, newLesson };
    } catch (error) {
      console.error('Error managing learning path:', error);
      toast.error('Failed to update learning path');
      return null;
    }
  };

  return { addToLearningPath };
};