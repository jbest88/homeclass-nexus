import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUser } from "@supabase/auth-helpers-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export const useLearningPath = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  const addToLearningPath = async (
    lessonId: string,
    subject: string
  ) => {
    if (!user) return null;

    try {
      // Get today's date in YYYY-MM-DD format
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Check if there's already a learning path for this subject today
      const { data: existingPaths, error: pathError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', user.id)
        .eq('subject', subject)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .maybeSingle();

      if (pathError) throw pathError;

      let pathId;

      // Create new path if none exists for today
      if (!existingPaths) {
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
      } else {
        pathId = existingPaths.id;
      }

      // Check if this specific lesson is already in this specific path
      const { data: existingPathLesson, error: checkError } = await supabase
        .from('learning_path_lessons')
        .select('*')
        .eq('path_id', pathId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (checkError) throw checkError;

      // Only add the lesson if it's not already in this specific path
      if (!existingPathLesson) {
        // Get the highest order_index for the current path
        const { data: lastLesson, error: orderError } = await supabase
          .from('learning_path_lessons')
          .select('order_index')
          .eq('path_id', pathId)
          .order('order_index', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (orderError) throw orderError;

        const nextOrderIndex = (lastLesson?.order_index ?? -1) + 1;

        const { error: addLessonError } = await supabase
          .from('learning_path_lessons')
          .insert({
            path_id: pathId,
            lesson_id: lessonId,
            order_index: nextOrderIndex,
          });

        if (addLessonError) {
          // If it's a duplicate error, just ignore it
          if (addLessonError.code === '23505') {
            console.log('Lesson already exists in path, skipping...');
            return { pathId };
          }
          throw addLessonError;
        }

        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ["learning-paths"] });
        queryClient.invalidateQueries({ queryKey: ["generated-lessons"] });
      }

      return { pathId };
    } catch (error: any) {
      console.error('Error managing learning path:', error);
      // Only show toast for non-duplicate errors
      if (!error.message?.includes('duplicate key value')) {
        toast.error('Failed to update learning path');
      }
      return null;
    }
  };

  return { addToLearningPath };
};