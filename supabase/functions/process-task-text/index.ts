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
    // Log the raw request for debugging
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          details: error.message,
          receivedBody: rawBody
        }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    if (!body?.text || typeof body.text !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Missing or invalid text field',
          receivedBody: body
        }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log('Processing text:', body.text);

    // Initialize Hugging Face API
    const HUGGING_FACE_API = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";
    const response = await fetch(HUGGING_FACE_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('HUGGING_FACE_ACCESS_TOKEN')}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: body.text,
        parameters: {
          candidate_labels: ["search query", "task creation"]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const classification = await response.json();
    console.log('Classification result:', classification);
    
    const isSearch = classification.labels[0] === "search query";

    if (isSearch) {
      // Process as search query
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: searchResults, error } = await supabase
        .from('tasks')
        .select('*')
        .textSearch('summary', body.text, {
          type: 'websearch',
          config: 'english'
        });

      if (error) throw error;

      return new Response(
        JSON.stringify({
          type: 'search',
          results: searchResults
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    } else {
      // Process as task creation
      const nerResponse = await fetch("https://api-inference.huggingface.co/models/dslim/bert-base-NER", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get('HUGGING_FACE_ACCESS_TOKEN')}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: body.text })
      });

      if (!nerResponse.ok) {
        throw new Error(`NER API error: ${nerResponse.statusText}`);
      }

      const entities = await nerResponse.json();
      console.log('NER entities:', entities);
      
      const task = {
        summary: body.text.split('.')[0], // Use first sentence as summary
        description: body.text,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to 1 week
        priority: body.text.toLowerCase().includes('urgent') || body.text.toLowerCase().includes('high priority') 
          ? 'High' 
          : 'Medium',
        category: 'General'
      };

      return new Response(
        JSON.stringify({
          type: 'create',
          task
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});