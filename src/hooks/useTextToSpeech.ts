import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

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
        if (error.message.includes('quota_exceeded')) {
          throw new Error('Text-to-speech service is temporarily unavailable due to high demand. Please try again later.');
        }
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
    } catch (error: any) {
      console.error('Error generating speech:', error);
      setIsPlaying(false);
      
      // Show user-friendly error message
      if (error.message.includes('quota_exceeded') || error.message.includes('high demand')) {
        toast.error('Text-to-speech is temporarily unavailable. Please try again later.');
      } else {
        toast.error('Failed to generate speech. Please try again.');
      }
      
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