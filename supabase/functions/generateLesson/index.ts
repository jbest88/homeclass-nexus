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
        getDifficultyLevel(Math.max(1, proficiencyLevel - 2)) : 
        difficultyLevel;

      console.log('Generating lesson content with difficulty:', adjustedDifficultyLevel);
      const lessonPrompt = createLessonPrompt(
        subject, 
        gradeLevelText, 
        adjustedDifficultyLevel, 
        isRetry ? Math.max(1, proficiencyLevel - 2) : proficiencyLevel
      );
      const lessonContent = await generateWithGemini(geminiApiKey, lessonPrompt);

      console.log('Generating questions');
      const questionsPrompt = createQuestionsPrompt(
        lessonContent, 
        gradeLevelText, 
        adjustedDifficultyLevel, 
        isRetry ? Math.max(1, proficiencyLevel - 2) : proficiencyLevel
      );
      const questionsText = await generateWithGemini(geminiApiKey, questionsPrompt);

      let questions;
      try {
        console.log('Raw questions text:', questionsText);
        
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

        // Enhanced validation for each question
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

          // Type-specific validation with detailed error messages
          switch (q.type) {
            case 'multiple-choice':
            case 'dropdown':
              if (!Array.isArray(q.options) || q.options.length < 2) {
                throw new Error(`Question ${index + 1} needs at least 2 options`);
              }
              if (!q.answer || !q.options.includes(q.answer)) {
                throw new Error(`Question ${index + 1}'s answer (${q.answer}) must be one of the options: ${q.options.join(', ')}`);
              }
              break;

            case 'multiple-answer':
              if (!Array.isArray(q.options) || q.options.length < 2) {
                throw new Error(`Question ${index + 1} needs at least 2 options`);
              }
              if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
                throw new Error(`Question ${index + 1} needs at least one correct answer`);
              }
              const invalidAnswers = q.correctAnswers.filter(answer => !q.options.includes(answer));
              if (invalidAnswers.length > 0) {
                throw new Error(`Question ${index + 1}'s correct answers (${invalidAnswers.join(', ')}) must all be in the options: ${q.options.join(', ')}`);
              }
              break;

            case 'true-false':
              if (typeof q.answer === 'boolean') {
                q.answer = q.answer.toString();
              }
              q.answer = q.answer.toLowerCase();
              if (q.answer !== 'true' && q.answer !== 'false') {
                throw new Error(`Question ${index + 1}'s answer must be 'true' or 'false', got: ${q.answer}`);
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

      const title = lessonContent.split('\n')[0].replace('#', '').trim();
      const content = lessonContent.split('\n').slice(1).join('\n').trim();

      console.log('Successfully generated lesson');

      const response: GeneratedLesson = {
        title,
        content,
        questions,
      };

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