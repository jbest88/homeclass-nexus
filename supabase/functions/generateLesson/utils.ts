import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { UserProfile, Proficiency, GeminiResponse } from './types.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const getDifficultyLevel = (proficiencyLevel: number): string => {
  return proficiencyLevel <= 3 ? 'basic' : 
         proficiencyLevel <= 6 ? 'intermediate' : 
         'advanced';
};

export const getGradeLevelText = (gradeLevel: number): string => {
  return gradeLevel === 0 ? 'Kindergarten' : `${gradeLevel}th grade`;
};

export const fetchUserProfile = async (
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('grade_level')
    .eq('id', userId)
    .single();

  if (error) throw new Error('Failed to fetch user profile');
  return data;
};

export const fetchProficiencyLevel = async (
  supabase: ReturnType<typeof createClient>,
  userId: string,
  subject: string
): Promise<Proficiency> => {
  const { data, error } = await supabase
    .from('subject_proficiency')
    .select('proficiency_level')
    .eq('user_id', userId)
    .eq('subject', subject)
    .single();

  if (error) return { proficiency_level: 1 };
  return data;
};

export const generateWithGemini = async (
  apiKey: string,
  prompt: string
): Promise<string> => {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Generation failed:', errorText);
    throw new Error(`Generation failed: ${errorText}`);
  }

  const data = await response.json() as GeminiResponse;
  
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error('Unexpected response format:', data);
    throw new Error('Invalid response format from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
};