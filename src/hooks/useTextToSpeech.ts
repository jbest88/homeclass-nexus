import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const speak = async (text: string) => {
    try {
      setIsPlaying(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      console.log('Calling textToSpeech function...');
      const { data, error } = await supabase.functions.invoke('textToSpeech', {
        body: { text }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No audio data received');
      }

      // Cleanup previous audio if it exists
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
        URL.revokeObjectURL(audioElement.src);
      }

      // Convert the base64 response to a blob
      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      setAudioElement(audio);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        throw new Error('Failed to play audio');
      };

      await audio.play();
    } catch (error) {
      console.error('Error generating speech:', error);
      setIsPlaying(false);
      throw error;
    }
  };

  const stop = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
      URL.revokeObjectURL(audioElement.src);
      setIsPlaying(false);
    }
  };

  return { speak, stop, isPlaying };
};