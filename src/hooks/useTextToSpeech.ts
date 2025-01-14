import { useState } from 'react';

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const speak = async (text: string) => {
    try {
      setIsPlaying(true);
      
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/XB0fDUnXU5powFXDhCwa/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': import.meta.env.VITE_ELEVEN_LABS_API_KEY || '',
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          }
        }),
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
      throw error; // Re-throw to handle in the component
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