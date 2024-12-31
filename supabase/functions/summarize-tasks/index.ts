import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get auth user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get priority tasks
    const { data: tasks, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('status', 'To Do')
      .order('due_date', { ascending: true })
      .limit(5);

    if (error) throw error;

    const prompt = `Summarize these ${tasks.length} priority tasks in a concise way:
      ${tasks.map(task => `
        - ${task.summary} (Due: ${new Date(task.due_date).toLocaleDateString()}, Priority: ${task.priority})
      `).join('\n')}
      
      Format the response as a brief overview paragraph followed by key action items.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful task management assistant. Be concise and focus on actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    const aiResponse = await response.json();
    const summary = aiResponse.choices[0].message.content;

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});