import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { LessonRequest } from './types.ts';
import { corsHeaders, getDifficultyLevel, getGradeLevelText, fetchUserProfile, fetchProficiencyLevel } from './utils.ts';
import { generateLesson } from './services/lessonService.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      } 
    });
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
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          details: error.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { subject, userId, isRetry } = requestBody;
    if (!subject || !userId) {
      console.error('Missing required fields:', { subject, userId });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: subject and userId are required',
          details: { subject, userId }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Fetching user data for:', userId);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000); // 25 second timeout

      const [profile, proficiencyResult] = await Promise.all([
        fetchUserProfile(supabase, userId),
        fetchProficiencyLevel(supabase, userId, subject),
      ]);

      clearTimeout(timeout);

      if (!profile || profile.grade_level === null) {
        console.error('User profile or grade level not found');
        return new Response(
          JSON.stringify({ 
            error: 'User profile or grade level not found',
            details: { userId, profile }
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
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
        getDifficultyLevel(Math.max(1, proficiencyLevel - 2)) : 
        difficultyLevel;

      const response = await generateLesson(
        geminiApiKey,
        subject,
        gradeLevelText,
        adjustedDifficultyLevel,
        proficiencyLevel,
        isRetry
      );

      return new Response(
        JSON.stringify(response),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        }
      );

    } catch (error) {
      console.error('Error fetching user data or generating content:', error);
      
      // Check if it's an abort error (timeout)
      if (error.name === 'AbortError') {
        return new Response(
          JSON.stringify({ 
            error: 'Request timeout',
            details: 'The request took too long to complete'
          }),
          { 
            status: 504, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: error.message,
          details: error.stack
        }),
        { 
          status: error.status || 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});