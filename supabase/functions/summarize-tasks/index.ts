
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

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

    // Use a more reliable smaller model
    const MODEL_TO_USE = 'tiiuae/falcon-7b-instruct'; // Fall back to this smaller model
    const BACKUP_MODEL = 'google/flan-t5-base'; // Second fallback option
    
    console.log(`Processing ${tasks.length} tasks for summarization`);

    // Format tasks in a more structured way for better summarization
    const taskDetails = tasks.map(task => ({
      summary: task.summary,
      dueDate: new Date(task.dueDate).toLocaleDateString(),
      priority: task.priority,
      status: task.status,
      category: task.category
    }));

    // Improved prompt with clearer instructions
    const prompt = `Summarize the following ${tasks.length} priority tasks concisely:
      ${tasks.map((task, index) => `
        ${index + 1}. ${task.summary} 
           - Due: ${new Date(task.dueDate).toLocaleDateString()}
           - Priority: ${task.priority}
           - Category: ${task.category}
      `).join('\n')}
      
      Format your response as:
      1. A brief overview paragraph (2-3 sentences)
      2. Key action items in order of priority
      3. Any notable deadlines
      
      Keep your response under 200 words and focus on actionable information.`;

    console.log('Using prompt:', prompt);

    try {
      const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'))
      
      console.log(`Attempting summarization with ${MODEL_TO_USE}`);
      
      const response = await hf.textGeneration({
        model: MODEL_TO_USE,
        inputs: prompt,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.7,
          top_p: 0.95,
        }
      });

      console.log('Model response received:', response);

      if (!response.generated_text) {
        throw new Error('Invalid response format from model');
      }

      return new Response(
        JSON.stringify({ 
          summary: response.generated_text.trim(),
          model: MODEL_TO_USE,
          taskCount: tasks.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (modelError) {
      console.error(`Error with primary model ${MODEL_TO_USE}:`, modelError);
      
      // Fall back to even simpler model
      try {
        console.log(`Falling back to ${BACKUP_MODEL}`);
        const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'))
        
        const backupResponse = await hf.textGeneration({
          model: BACKUP_MODEL,
          inputs: prompt.substring(0, 500), // Shorter prompt for simpler model
          parameters: {
            max_new_tokens: 150,
            temperature: 0.5
          }
        });
        
        return new Response(
          JSON.stringify({ 
            summary: backupResponse.generated_text.trim(),
            model: BACKUP_MODEL,
            taskCount: tasks.length,
            fallback: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (backupError) {
        console.error('Error with backup model:', backupError);
        
        // Ultimate fallback - generate a simple summary directly
        const fallbackSummary = `You have ${tasks.length} priority tasks. ` +
          `The highest priority items are: ${tasks.slice(0, 3).map(t => t.summary).join(', ')}. ` +
          `The earliest deadline is ${new Date(tasks.reduce((a, b) => 
            new Date(a.dueDate) < new Date(b.dueDate) ? a : b
          ).dueDate).toLocaleDateString()}.`;
        
        return new Response(
          JSON.stringify({ 
            summary: fallbackSummary,
            model: 'fallback',
            taskCount: tasks.length,
            fallback: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
  } catch (error) {
    console.error('Error in summarize-tasks function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check the function logs for more information',
        summary: "Unable to summarize tasks at this time. Please try again later."
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
