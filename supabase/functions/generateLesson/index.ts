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
      console.log('Raw questions text:', questionsText);
      
      // Clean up the JSON string
      const cleanedQuestionsText = questionsText
        .replace(/```json\n|\n```/g, '')
        .replace(/^[\s\n]*\[/, '[')
        .replace(/\][\s\n]*$/, ']')
        .trim();
      
      console.log('Cleaned questions text:', cleanedQuestionsText);
      
      try {
        questions = JSON.parse(cleanedQuestionsText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error(`Failed to parse questions JSON: ${parseError.message}`);
      }

      if (!Array.isArray(questions)) {
        throw new Error('Generated questions must be an array');
      }

      if (questions.length !== 5) {
        throw new Error(`Expected 5 questions, but got ${questions.length}`);
      }

      // Validate each question
      questions.forEach((q, index) => {
        if (!q || typeof q !== 'object') {
          throw new Error(`Question ${index + 1} is not a valid object`);
        }

        if (!q.question || typeof q.question !== 'string') {
          throw new Error(`Question ${index + 1} is missing a valid question text`);
        }

        if (!q.type || typeof q.type !== 'string') {
          throw new Error(`Question ${index + 1} is missing a valid type`);
        }

        const validTypes = ['multiple-choice', 'multiple-answer', 'true-false', 'dropdown', 'text'];
        if (!validTypes.includes(q.type)) {
          throw new Error(`Question ${index + 1} has an invalid type: ${q.type}`);
        }

        // Type-specific validation
        switch (q.type) {
          case 'multiple-choice':
          case 'dropdown':
            if (!Array.isArray(q.options) || q.options.length < 2) {
              throw new Error(`Question ${index + 1} needs at least 2 options`);
            }
            if (!q.answer || !q.options.includes(q.answer)) {
              throw new Error(`Question ${index + 1}'s answer must be one of the options`);
            }
            break;

          case 'multiple-answer':
            if (!Array.isArray(q.options) || q.options.length < 2) {
              throw new Error(`Question ${index + 1} needs at least 2 options`);
            }
            if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
              throw new Error(`Question ${index + 1} needs at least one correct answer`);
            }
            if (!q.correctAnswers.every(answer => q.options.includes(answer))) {
              throw new Error(`Question ${index + 1}'s correct answers must all be in the options`);
            }
            break;

          case 'true-false':
            // Convert answer to lowercase string for consistent validation
            if (typeof q.answer === 'boolean') {
              q.answer = q.answer.toString();
            }
            q.answer = q.answer.toLowerCase();
            
            if (q.answer !== 'true' && q.answer !== 'false') {
              throw new Error(`Question ${index + 1}'s answer must be 'true' or 'false'`);
            }
            break;

          case 'text':
            if (!q.answer || typeof q.answer !== 'string') {
              throw new Error(`Question ${index + 1} must have a valid text answer`);
            }
            break;
        }
      });

      // Ensure we have at least one of each required type
      const types = questions.map(q => q.type);
      const requiredTypes = ['multiple-choice', 'multiple-answer', 'true-false', 'dropdown'];
      const missingTypes = requiredTypes.filter(type => !types.includes(type));
      
      if (missingTypes.length > 0) {
        throw new Error(`Missing required question types: ${missingTypes.join(', ')}`);
      }

    } catch (error) {
      console.error('Error validating questions:', error);
      console.log('Questions array:', questions);
      throw new Error(`Question validation failed: ${error.message}`);
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