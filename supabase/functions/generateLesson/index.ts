import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { createLessonPrompt, createQuestionsPrompt } from "./prompts.ts";
import { validateQuestions } from "./utils.ts";
import { getDifficultyLevel } from "./utils.ts";
import { Question } from "./types.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { subject, userId, isRetry = false } = await req.json();

    if (!subject || !userId) {
      throw new Error('Missing required parameters');
    }

    // Get user's profile for grade level
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('grade_level')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    const gradeLevel = profile?.grade_level ?? 5; // Default to 5th grade if not set
    const gradeLevelText = gradeLevel === 0 ? 'Kindergarten' : `Grade ${gradeLevel}`;

    // Get user's proficiency level for the subject
    const { data: proficiencyData, error: proficiencyError } = await supabase
      .from('subject_proficiency')
      .select('proficiency_level')
      .eq('user_id', userId)
      .eq('subject', subject)
      .single();

    if (proficiencyError && proficiencyError.code !== 'PGRST116') { // Ignore "not found" errors
      console.error('Error fetching proficiency:', proficiencyError);
      throw new Error('Failed to fetch subject proficiency');
    }

    const proficiencyLevel = proficiencyData?.proficiency_level ?? 5; // Default to level 5 if not set
    const difficultyLevel = getDifficultyLevel(proficiencyLevel);

    // Generate lesson content
    const lessonResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: createLessonPrompt(
              subject,
              gradeLevelText,
              difficultyLevel,
              proficiencyLevel,
            ),
          }],
        }],
      }),
    });

    if (!lessonResponse.ok) {
      console.error('Gemini API error:', await lessonResponse.text());
      throw new Error('Failed to generate lesson content');
    }

    const lessonData = await lessonResponse.json();
    const lessonContent = lessonData.candidates[0].content.parts[0].text;

    // Generate questions
    const questionsResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: createQuestionsPrompt(
              lessonContent,
              gradeLevelText,
              difficultyLevel,
              proficiencyLevel,
            ),
          }],
        }],
      }),
    });

    if (!questionsResponse.ok) {
      console.error('Gemini API error:', await questionsResponse.text());
      throw new Error('Failed to generate questions');
    }

    const questionsData = await questionsResponse.json();
    const questionsText = questionsData.candidates[0].content.parts[0].text;

    let questions: Question[];
    try {
      // Parse and validate the questions
      questions = JSON.parse(questionsText);
      validateQuestions(questions);

      // Extract title from lesson content (first line)
      const title = lessonContent.split('\n')[0].replace(/^#\s*/, '');

      return new Response(
        JSON.stringify({
          title,
          content: lessonContent,
          questions,
        }),
        { 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      console.error('Error processing questions:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in generateLesson:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});