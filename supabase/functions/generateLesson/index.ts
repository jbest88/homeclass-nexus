import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { LessonRequest } from './types.ts';
import { corsHeaders, getDifficultyLevel, getGradeLevelText, fetchUserProfile, fetchProficiencyLevel } from './utils.ts';
import { generateLesson } from './services/lessonService.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request to generate lesson');

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not configured');
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration is missing');
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let requestBody;
    try {
      requestBody = await req.json() as LessonRequest;
    } catch (error) {
      console.error('Failed to parse request body:', error);
      throw new Error('Invalid request body');
    }

    const { subject, userId, isRetry } = requestBody;
    if (!subject || !userId) {
      console.error('Missing required fields:', { subject, userId });
      throw new Error('Missing required fields: subject and userId are required');
    }

    console.log('Fetching user data for:', userId);

    try {
      const [profile, proficiencyResult] = await Promise.all([
        fetchUserProfile(supabase, userId),
        fetchProficiencyLevel(supabase, userId, subject),
      ]);

      if (!profile || profile.grade_level === null) {
        console.error('User profile or grade level not found');
        throw new Error('User profile or grade level not found');
      }

      const gradeLevel = profile.grade_level;
      const proficiencyLevel = proficiencyResult.proficiency_level;
      const gradeLevelText = getGradeLevelText(gradeLevel);
      const difficultyLevel = getDifficultyLevel(proficiencyLevel);

      console.log('User data fetched successfully:', {
        gradeLevel,
        proficiencyLevel,
        gradeLevelText,
        difficultyLevel,
      });

      const adjustedDifficultyLevel = isRetry ? 
        getDifficultyLevel(Math.max(1, proficiencyLevel - 1)) : // Changed from -2 to -1
        difficultyLevel;

      const response = await generateLesson(
        geminiApiKey,
        subject,
        gradeLevelText,
        adjustedDifficultyLevel,
        proficiencyLevel,
        isRetry
      );

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Error fetching user data or generating content:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error in generateLesson function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});