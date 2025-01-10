import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

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

    const { subject } = await req.json();

    // Generate lesson content
    const lessonPrompt = `Create an educational lesson about ${subject}. The lesson should be comprehensive but concise, focusing on key concepts. Include a title for the lesson.`;
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

    // Generate questions with improved formatting
    const questionsPrompt = `Based on this lesson: "${lessonContent}", generate 3 questions to test understanding. Include a mix of:
    1. Multiple choice questions with 4 options
    2. Multiple answer questions where more than one option is correct
    3. Text questions requiring a written response
    
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