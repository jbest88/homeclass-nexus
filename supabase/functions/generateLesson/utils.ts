import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { UserProfile, Proficiency, GeminiResponse } from './types.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const getDifficultyLevel = (proficiencyLevel: number): string => {
  if (proficiencyLevel <= 3) return 'basic';
  if (proficiencyLevel <= 6) return 'intermediate';
  return 'advanced';
};

export const getGradeLevelText = (gradeLevel: number): string => {
  if (gradeLevel === 0) return 'Kindergarten';
  if (gradeLevel === 1) return '1st grade';
  if (gradeLevel === 2) return '2nd grade';
  if (gradeLevel === 3) return '3rd grade';
  return `${gradeLevel}th grade`;
};

export const getCurriculumPeriod = (date: string) => {
  const lessonDate = new Date(date);
  const month = lessonDate.getMonth();
  
  if (month >= 8 && month <= 10) return "Fall Semester";
  if (month >= 11 || month <= 1) return "Winter Term";
  if (month >= 2 && month <= 4) return "Spring Semester";
  return "Summer Term";
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

  if (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile');
  }
  
  if (!data || data.grade_level === null) {
    console.error('User profile or grade level not found:', data);
    throw new Error('User profile or grade level not found');
  }

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

  if (error) {
    console.log('No existing proficiency found, defaulting to level 1');
    return { proficiency_level: 1 };
  }
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