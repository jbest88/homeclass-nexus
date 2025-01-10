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

    const lessonData = await lessonResponse.json();
    const lessonContent = lessonData.candidates[0].content.parts[0].text;

    // Generate questions about the lesson
    const questionsPrompt = `Based on this lesson: "${lessonContent}", generate 3 multiple choice questions to test understanding. Return ONLY a JSON array with this structure, and nothing else: [{"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "..."}]. Do not include any markdown formatting, just the raw JSON array.`;
    
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

    const questionsData = await questionsResponse.json();
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});