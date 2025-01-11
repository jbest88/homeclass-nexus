import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { LessonRequest, GeneratedLesson } from './types.ts';
import { corsHeaders, getDifficultyLevel, getGradeLevelText, fetchUserProfile, fetchProficiencyLevel, generateWithGemini } from './utils.ts';
import { createLessonPrompt, createQuestionsPrompt } from './prompts.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const { subject, userId } = await req.json() as LessonRequest;

    // Fetch user data
    const [profile, proficiencyResult] = await Promise.all([
      fetchUserProfile(supabase, userId),
      fetchProficiencyLevel(supabase, userId, subject),
    ]);

    const gradeLevel = profile.grade_level ?? 5;
    const proficiencyLevel = proficiencyResult.proficiency_level;
    const gradeLevelText = getGradeLevelText(gradeLevel);
    const difficultyLevel = getDifficultyLevel(proficiencyLevel);

    // Generate lesson content
    const lessonPrompt = createLessonPrompt(subject, gradeLevelText, difficultyLevel, proficiencyLevel);
    const lessonContent = await generateWithGemini(geminiApiKey, lessonPrompt);

    // Generate questions
    const questionsPrompt = createQuestionsPrompt(lessonContent, gradeLevelText, difficultyLevel, proficiencyLevel);
    const questionsText = await generateWithGemini(geminiApiKey, questionsPrompt);

    // Parse and validate questions
    let questions;
    try {
      const cleanedQuestionsText = questionsText.replace(/```json\n|\n```/g, '').trim();
      questions = JSON.parse(cleanedQuestionsText);
      
      if (!Array.isArray(questions) || questions.length !== 5) {
        throw new Error('Generated questions must be an array of exactly 5 questions');
      }

      const types = questions.map(q => q.type);
      const requiredTypes = ['multiple-choice', 'multiple-answer', 'true-false', 'dropdown'];
      const hasAllTypes = requiredTypes.every(type => types.includes(type));
      
      if (!hasAllTypes) {
        throw new Error('Missing required question types');
      }
    } catch (error) {
      console.error('Error parsing or validating questions:', error);
      console.log('Raw questions text:', questionsText);
      throw new Error('Failed to parse or validate questions JSON');
    }

    // Extract title and content
    const title = lessonContent.split('\n')[0].replace('#', '').trim();
    const content = lessonContent.split('\n').slice(1).join('\n').trim();

    const response: GeneratedLesson = {
      title,
      content,
      questions,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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