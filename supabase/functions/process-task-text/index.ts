import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()
    console.log('Processing text:', text);

    // Initialize Hugging Face API
    const HUGGING_FACE_API = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
    const response = await fetch(HUGGING_FACE_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('HUGGING_FACE_ACCESS_TOKEN')}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          candidate_labels: ["search query", "task creation"]
        }
      })
    })

    const classification = await response.json()
    console.log('Classification result:', classification);
    
    const isSearch = classification.labels[0] === "search query"

    if (isSearch) {
      // Process as search query
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { data: searchResults, error } = await supabase
        .from('tasks')
        .select('*')
        .textSearch('summary', text, {
          type: 'websearch',
          config: 'english'
        })

      if (error) throw error

      return new Response(
        JSON.stringify({
          type: 'search',
          results: searchResults
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Process as task creation
      // Use Hugging Face for NER to extract task details
      const nerResponse = await fetch("https://api-inference.huggingface.co/models/dslim/bert-base-NER", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get('HUGGING_FACE_ACCESS_TOKEN')}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text })
      })

      const entities = await nerResponse.json()
      console.log('NER entities:', entities);
      
      // Process entities to extract task information
      const task = {
        summary: text.split('.')[0], // Use first sentence as summary
        description: text,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to 1 week
        priority: text.toLowerCase().includes('urgent') || text.toLowerCase().includes('high priority') 
          ? 'High' 
          : 'Medium',
        category: 'General'
      }

      return new Response(
        JSON.stringify({
          type: 'create',
          task
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})