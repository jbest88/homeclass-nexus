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
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

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

    const gradeLevel = profileResult.data.grade_level ?? 5;
    const gradeLevelText = gradeLevel === 0 ? 'Kindergarten' : `${gradeLevel}th grade`;
    const proficiencyLevel = proficiencyResult.data?.proficiency_level || 1;
    const difficultyLevel = proficiencyLevel <= 3 ? 'basic' : 
                          proficiencyLevel <= 6 ? 'intermediate' : 
                          'advanced';

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

    const questionsPrompt = `Based on this lesson: "${lessonContent}", generate EXACTLY 5 questions to test understanding for a ${gradeLevelText} student at a ${difficultyLevel} difficulty level (proficiency: ${proficiencyLevel}/10). 

    Include a mix of these question types:
    1. Multiple choice (2 questions)
    2. Multiple answer (1 question)
    3. True/False (1 question)
    4. Dropdown (1 question)

    Return ONLY a JSON array with these structures:

    Multiple choice:
    {
      "question": "What is...?",
      "type": "multiple-choice",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "correct option"
    }

    Multiple answer:
    {
      "question": "Select all that apply...",
      "type": "multiple-answer",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswers": ["correct1", "correct2"]
    }

    True/False:
    {
      "question": "Is this statement true...?",
      "type": "true-false",
      "answer": "true"
    }

    Dropdown:
    {
      "question": "Choose the correct...?",
      "type": "dropdown",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "correct option"
    }

    Return only the raw JSON array with EXACTLY 5 questions, no additional text or formatting.`;

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
    const cleanedQuestionsText = questionsText.replace(/```json\n|\n```/g, '').trim();
    
    let questions;
    try {
      questions = JSON.parse(cleanedQuestionsText);
      
      if (!Array.isArray(questions) || questions.length !== 5) {
        throw new Error('Generated questions must be an array of exactly 5 questions');
      }

      // Validate question types
      const types = questions.map(q => q.type);
      const requiredTypes = ['multiple-choice', 'multiple-answer', 'true-false', 'dropdown'];
      const hasAllTypes = requiredTypes.every(type => types.includes(type));
      
      if (!hasAllTypes) {
        throw new Error('Missing required question types. Each type should appear exactly once.');
      }
      
    } catch (error) {
      console.error('Error parsing or validating questions:', error);
      console.log('Raw questions text:', questionsText);
      throw new Error('Failed to parse or validate questions JSON');
    }

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
