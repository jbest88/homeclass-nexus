import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateWithGemini } from '../generateLesson/utils.ts';
import { createQuestionsPrompt } from '../generateLesson/prompts.ts';
import { validateQuestions } from '../generateLesson/validators/questionValidator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { lessonId, userId, gradeLevelText, difficultyLevel, proficiencyLevel } = await req.json();
    
    if (!lessonId || !userId || !gradeLevelText || !difficultyLevel) {
      throw new Error('Missing required fields');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the lesson content
    const { data: lesson, error: lessonError } = await supabase
      .from('generated_lessons')
      .select('content')
      .eq('id', lessonId)
      .single();

    if (lessonError) throw lessonError;

    const questionsPrompt = createQuestionsPrompt(
      lesson.content,
      gradeLevelText,
      difficultyLevel,
      proficiencyLevel
    );

    const questionsText = await generateWithGemini(geminiApiKey, questionsPrompt);
    
    let questions;
    try {
      const cleanedQuestionsText = questionsText
        .replace(/```json\n|\n```/g, '')
        .replace(/^[\s\n]*\[/, '[')
        .replace(/\][\s\n]*$/, ']')
        .trim();
      
      questions = JSON.parse(cleanedQuestionsText);
      validateQuestions(questions);
    } catch (error) {
      console.error('Error parsing questions:', error);
      throw new Error(`Question validation failed: ${error.message}`);
    }

    // Update the lesson with new questions
    const { error: updateError } = await supabase
      .from('generated_lessons')
      .update({ questions })
      .eq('id', lessonId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generateQuestions function:', error);
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