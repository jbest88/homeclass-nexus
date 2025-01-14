import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUser } from "@supabase/auth-helpers-react";
import { format } from "date-fns";

export const useLearningPath = () => {
  const user = useUser();

  const addToLearningPath = async (
    lessonId: string,
    subject: string
  ) => {
    if (!user) return;

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
        .lte('created_at', `${today}T23:59:59`);

      if (pathError) throw pathError;

      let pathId;

      // Create new path if none exists for today
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
      } else {
        pathId = existingPaths[0].id;
      }

      // Get the highest order_index for the current path
      const { data: lastLesson, error: orderError } = await supabase
        .from('learning_path_lessons')
        .select('order_index')
        .eq('path_id', pathId)
        .order('order_index', { ascending: false })
        .limit(1);

      if (orderError) throw orderError;

      const nextOrderIndex = (lastLesson?.[0]?.order_index ?? -1) + 1;

      // Check if this specific lesson is already in this specific path
      const { data: existingPathLesson, error: checkError } = await supabase
        .from('learning_path_lessons')
        .select('id')
        .eq('path_id', pathId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (checkError) throw checkError;

      // Only add the lesson if it's not already in this specific path
      if (!existingPathLesson) {
        const { error: addLessonError } = await supabase
          .from('learning_path_lessons')
          .insert({
            path_id: pathId,
            lesson_id: lessonId,
            order_index: nextOrderIndex,
          });

        if (addLessonError) throw addLessonError;
      }

      return { pathId };
    } catch (error) {
      console.error('Error managing learning path:', error);
      toast.error('Failed to update learning path');
      return null;
    }
  };

  return { addToLearningPath };
};