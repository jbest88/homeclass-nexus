import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const speak = async (text: string) => {
    try {
      setIsPlaying(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/textToSpeech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      if (audioElement) {
        audioElement.pause();
        URL.revokeObjectURL(audioElement.src);
      }

      const audio = new Audio(url);
      setAudioElement(audio);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };

      audio.play();
    } catch (error) {
      console.error('Error generating speech:', error);
      setIsPlaying(false);
      throw error;
    }
  };

  const stop = () => {
    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    }
  };

  return { speak, stop, isPlaying };
};