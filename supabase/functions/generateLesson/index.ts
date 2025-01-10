import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { subject, userId } = await req.json();

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Fetch user's grade level and subject proficiency
    const [profileResult, proficiencyResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('grade_level')
        .eq('id', userId)
        .single(),
      supabase
        .from('subject_proficiency')
        .select('*')
        .eq('user_id', userId)
        .eq('subject', subject)
        .single()
    ]);

    if (profileResult.error) {
      throw new Error('Failed to fetch user profile');
    }

    const gradeLevel = profileResult.data.grade_level ?? 5; // Default to 5th grade if not set
    const gradeLevelText = gradeLevel === 0 ? 'Kindergarten' : `${gradeLevel}th grade`;
    
    // Get proficiency level (1-10) or default to 1
    const proficiencyLevel = proficiencyResult.data?.proficiency_level || 1;
    console.log('Current proficiency level:', proficiencyLevel);

    // Adjust difficulty based on proficiency
    const difficultyLevel = proficiencyLevel <= 3 ? 'basic' : 
                          proficiencyLevel <= 6 ? 'intermediate' : 
                          'advanced';

    // Generate lesson content with grade level and proficiency consideration
    const lessonPrompt = `Create an educational lesson about ${subject} appropriate for a ${gradeLevelText} student at a ${difficultyLevel} difficulty level (proficiency: ${proficiencyLevel}/10). 
    The lesson should be comprehensive but concise, focusing on key concepts that are grade-appropriate. 
    Include a title for the lesson. Ensure the language and complexity level matches ${gradeLevelText} understanding.
    Make the content slightly more challenging than their current level to promote growth.`;

    const lessonResponse = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: lessonPrompt }] }],
      }),
    });

    if (!lessonResponse.ok) {
      const errorData = await lessonResponse.text();
      console.error('Lesson generation failed:', errorData);
      throw new Error(`Lesson generation failed: ${errorData}`);
    }

    const lessonData = await lessonResponse.json();
    
    if (!lessonData.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Unexpected lesson response format:', lessonData);
      throw new Error('Invalid lesson response format from Gemini API');
    }

    const lessonContent = lessonData.candidates[0].content.parts[0].text;

    // Generate questions with difficulty adjustment
    const questionsPrompt = `Based on this lesson: "${lessonContent}", generate 3 questions to test understanding for a ${gradeLevelText} student at a ${difficultyLevel} difficulty level (proficiency: ${proficiencyLevel}/10). Include a mix of:
    1. Multiple choice questions with 4 options (adjusted for ${difficultyLevel} level)
    2. Multiple answer questions where more than one option is correct (adjusted for ${difficultyLevel} level)
    3. Text questions requiring a written response (adjusted for ${difficultyLevel} level)
    
    Return ONLY a JSON array with this structure for each type:
    
    For multiple choice:
    {
      "question": "What is...?",
      "type": "multiple-choice",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "correct option"
    }
    
    For multiple answer:
    {
      "question": "Select all that apply...",
      "type": "multiple-answer",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswers": ["correct1", "correct2"]
    }
    
    For text questions:
    {
      "question": "Explain...",
      "type": "text",
      "answer": "expected answer"
    }
    
    Return only the raw JSON array, no additional text or formatting.`;
    
    const questionsResponse = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: questionsPrompt }] }],
      }),
    });

    if (!questionsResponse.ok) {
      const errorData = await questionsResponse.text();
      console.error('Questions generation failed:', errorData);
      throw new Error(`Questions generation failed: ${errorData}`);
    }

    const questionsData = await questionsResponse.json();
    
    if (!questionsData.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Unexpected questions response format:', questionsData);
      throw new Error('Invalid questions response format from Gemini API');
    }

    const questionsText = questionsData.candidates[0].content.parts[0].text;
    
    // Clean up the response to ensure it's valid JSON
    const cleanedQuestionsText = questionsText.replace(/```json\n|\n```/g, '').trim();
    console.log('Cleaned questions text:', cleanedQuestionsText);
    
    let questions;
    try {
      questions = JSON.parse(cleanedQuestionsText);
    } catch (error) {
      console.error('Error parsing questions JSON:', error);
      console.log('Raw questions text:', questionsText);
      throw new Error('Failed to parse questions JSON');
    }

    // Extract title from content (assuming it's the first line)
    const title = lessonContent.split('\n')[0].replace('#', '').trim();
    const content = lessonContent.split('\n').slice(1).join('\n').trim();

    return new Response(
      JSON.stringify({
        title,
        content,
        questions,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
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