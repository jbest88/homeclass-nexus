import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()

    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/XB0fDUnXU5powFXDhCwa/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': Deno.env.get('ELEVEN_LABS_API_KEY') || '',
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ElevenLabs API error: ${error}`)
    }

    const audioBlob = await response.blob()
    return new Response(audioBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  }
})