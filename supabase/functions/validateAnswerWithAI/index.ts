import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, userAnswers, correctAnswers, type } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Format answers for the prompt
    const userAnswersStr = Array.isArray(userAnswers) 
      ? userAnswers.join(', ') 
      : userAnswers;

    // Special handling for multiple-answer questions
    const isMultipleAnswer = type === 'multiple-answer';
    let isCorrect = false;

    if (isMultipleAnswer && Array.isArray(userAnswers) && Array.isArray(correctAnswers)) {
      // Sort both arrays for consistent comparison
      const sortedUserAnswers = [...userAnswers].sort();
      const sortedCorrectAnswers = [...correctAnswers].sort();
      
      // Check if arrays have same length and same elements
      isCorrect = sortedUserAnswers.length === sortedCorrectAnswers.length &&
                 sortedUserAnswers.every((answer, index) => 
                   answer === sortedCorrectAnswers[index]
                 );
    }

    const prompt = `You are an expert teacher evaluating a student's answer.

Question: "${question}"
Student's answer(s): ${userAnswersStr}

Based on your expertise and understanding of the subject matter:
1. Determine if the student's answer is completely correct
2. If incorrect, provide a very brief explanation (1-2 sentences) to help the student understand why

Respond in this exact format:
CORRECT: ${isMultipleAnswer ? isCorrect.toString() : '[true/false]'}
EXPLANATION: [only if incorrect, otherwise leave blank]`;

    console.log('Sending prompt to Gemini:', prompt);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 100,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data);

    const aiResponse = data.candidates[0].content.parts[0].text.trim();
    
    // For multiple-answer questions, use our pre-computed isCorrect
    const correctMatch = isMultipleAnswer 
      ? { 1: isCorrect.toString() }
      : aiResponse.match(/CORRECT:\s*(true|false)/i);
    const explanationMatch = aiResponse.match(/EXPLANATION:\s*(.+)/i);
    
    const finalIsCorrect = isMultipleAnswer 
      ? isCorrect 
      : correctMatch ? correctMatch[1].toLowerCase() === 'true' : false;
    const explanation = explanationMatch ? explanationMatch[1].trim() : '';

    return new Response(
      JSON.stringify({ 
        isCorrect: finalIsCorrect,
        explanation,
        aiResponse,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in validateAnswerWithAI function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});