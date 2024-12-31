import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tasks } = await req.json();
    
    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ summary: "No priority tasks found." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Summarize these ${tasks.length} priority tasks in a concise way:
      ${tasks.map(task => `
        - ${task.summary} (Due: ${new Date(task.dueDate).toLocaleDateString()}, Priority: ${task.priority})
      `).join('\n')}
      
      Format the response as a brief overview paragraph followed by key action items.`;

    console.log('Sending prompt to OpenAI:', prompt);

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',  // Using the most cost-effective model
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
        max_tokens: 300,  // Limiting response length to reduce costs
        temperature: 0.7  // Balanced between creativity and consistency
      }),
    });

    if (!openAiResponse.ok) {
      const errorData = await openAiResponse.text();
      console.error('OpenAI API error:', errorData);
      
      // Check if it's a quota error
      if (errorData.includes('insufficient_quota')) {
        return new Response(
          JSON.stringify({ 
            error: "OpenAI API quota exceeded. Please check your OpenAI account billing status.",
            details: "The AI summary feature requires active OpenAI API credits."
          }), {
          status: 402, // Payment Required
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const aiResponse = await openAiResponse.json();
    console.log('OpenAI API response:', aiResponse);

    if (!aiResponse.choices?.[0]?.message?.content) {
      console.error('Unexpected OpenAI API response format:', aiResponse);
      throw new Error('Invalid response format from OpenAI API');
    }

    const summary = aiResponse.choices[0].message.content;

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in summarize-tasks function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check the function logs for more information'
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});