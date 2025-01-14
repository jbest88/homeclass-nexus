import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUser } from "@supabase/auth-helpers-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export const useLearningPath = () => {
  const user = useUser();
  const queryClient = useQueryClient();
  const [processedLessons] = useState(new Set<string>());

  const addToLearningPath = async (
    lessonId: string,
    subject: string
  ) => {
    if (!user) return null;

    try {
      // If we've already processed this lesson today, skip it
      if (processedLessons.has(lessonId)) {
        console.log(`Lesson ${lessonId} already processed today, skipping`);
        return null;
      }

      console.log(`Adding lesson ${lessonId} to learning path for subject ${subject}`);
      
      // First, check if the lesson exists
      const { data: lesson, error: lessonError } = await supabase
        .from('generated_lessons')
        .select('*')
        .eq('id', lessonId)
        .maybeSingle();

      if (lessonError) {
        console.error('Error finding lesson:', lessonError);
        throw lessonError;
      }

      if (!lesson) {
        console.error('Lesson not found');
        return null;
      }

      // Get today's date range in UTC
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();
      
      // Try to find an existing learning path for today and this subject
      const { data: existingPath, error: pathError } = await supabase
        .from('learning_paths')
        .select()
        .eq('user_id', user.id)
        .eq('subject', subject)
        .gte('created_at', startOfToday)
        .lt('created_at', endOfToday)
        .maybeSingle();

      if (pathError) {
        console.error('Error checking existing path:', pathError);
        throw pathError;
      }

      let pathId;

      if (!existingPath) {
        console.log('Creating new learning path');
        const { data: newPath, error: createPathError } = await supabase
          .from('learning_paths')
          .insert({
            user_id: user.id,
            subject: subject,
          })
          .select()
          .single();

        if (createPathError) {
          console.error('Error creating new path:', createPathError);
          throw createPathError;
        }
        pathId = newPath.id;
      } else {
        console.log('Using existing path:', existingPath.id);
        pathId = existingPath.id;
      }

      // Check if lesson is already in this path
      const { data: existingLesson, error: existingLessonError } = await supabase
        .from('learning_path_lessons')
        .select()
        .eq('path_id', pathId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (existingLessonError) {
        console.error('Error checking existing lesson in path:', existingLessonError);
        throw existingLessonError;
      }

      if (existingLesson) {
        console.log('Lesson already in path:', pathId);
        processedLessons.add(lessonId);
        return { pathId };
      }

      // Get the highest order_index for the current path
      const { data: lastLesson, error: orderError } = await supabase
        .from('learning_path_lessons')
        .select('order_index')
        .eq('path_id', pathId)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orderError) {
        console.error('Error getting last order index:', orderError);
        throw orderError;
      }

      const nextOrderIndex = (lastLesson?.order_index ?? -1) + 1;
      console.log('Using order index:', nextOrderIndex);

      // Add the lesson to the path
      const { error: addLessonError } = await supabase
        .from('learning_path_lessons')
        .insert({
          path_id: pathId,
          lesson_id: lessonId,
          order_index: nextOrderIndex,
        });

      if (addLessonError) {
        console.error('Error adding lesson to path:', addLessonError);
        throw addLessonError;
      }

      // Mark this lesson as processed
      processedLessons.add(lessonId);

      // Invalidate queries to refresh the data
      console.log('Invalidating queries to refresh data');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["learning-paths"] }),
        queryClient.invalidateQueries({ queryKey: ["generated-lessons"] })
      ]);

      return { pathId };
    } catch (error: any) {
      console.error('Error managing learning path:', error);
      if (!error.message?.includes('duplicate key value')) {
        toast.error('Failed to update learning path');
      }
      return null;
    }
  };

  return { addToLearningPath };
};