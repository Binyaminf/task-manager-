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
    const { text, currentTime } = await req.json();
    console.log('Processing text:', text);
    console.log('Current time reference:', currentTime);

    // Initialize Hugging Face API
    const HUGGING_FACE_API = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";
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
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const classification = await response.json();
    console.log('Classification result:', classification);
    
    const isSearch = classification.labels[0] === "search query";

    if (isSearch) {
      const { data: searchResults, error } = await supabase
        .from('tasks')
        .select('*')
        .textSearch('summary', text, {
          type: 'websearch',
          config: 'english'
        });

      if (error) throw error;

      return new Response(
        JSON.stringify({
          type: 'search',
          results: searchResults
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Extract priority keywords
      const priorityKeywords = {
        high: ['urgent', 'asap', 'important', 'critical', 'high priority'],
        low: ['low priority', 'whenever possible', 'not urgent', 'can wait']
      };

      // Extract category keywords
      const categoryKeywords = {
        'Meeting': ['meet', 'meeting', 'conference', 'call'],
        'Development': ['code', 'develop', 'programming', 'debug', 'feature'],
        'Planning': ['plan', 'strategy', 'roadmap', 'outline'],
        'Research': ['research', 'investigate', 'study', 'analyze'],
        'Documentation': ['document', 'write', 'draft', 'report']
      };

      // Determine priority
      const textLower = text.toLowerCase();
      let priority = 'Medium';
      
      if (priorityKeywords.high.some(keyword => textLower.includes(keyword))) {
        priority = 'High';
      } else if (priorityKeywords.low.some(keyword => textLower.includes(keyword))) {
        priority = 'Low';
      }

      // Determine category
      let category = 'General';
      for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => textLower.includes(keyword))) {
          category = cat;
          break;
        }
      }

      // Parse the current time
      const now = new Date(currentTime);

      // Extract date using regex patterns
      const datePatterns = {
        tomorrow: /\btomorrow\b/i,
        nextWeek: /\bnext week\b/i,
        specificDate: /\bon ([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?)\b/i,
        daysFromNow: /\bin (\d+) days?\b/i
      };

      let dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 7); // Default to one week

      if (datePatterns.tomorrow.test(text)) {
        dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + 1);
      } else if (datePatterns.nextWeek.test(text)) {
        dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + 7);
      } else if (datePatterns.daysFromNow.test(text)) {
        const matches = text.match(datePatterns.daysFromNow);
        if (matches && matches[1]) {
          const days = parseInt(matches[1]);
          dueDate = new Date(now);
          dueDate.setDate(dueDate.getDate() + days);
        }
      }

      // Extract duration using regex
      const durationPattern = /(\d+)\s*(h|hour|hours|d|day|days)/i;
      let estimatedDuration = '1h';
      const durationMatch = text.match(durationPattern);
      if (durationMatch) {
        const amount = durationMatch[1];
        const unit = durationMatch[2].toLowerCase();
        if (unit.startsWith('h')) {
          estimatedDuration = `${amount}h`;
        } else if (unit.startsWith('d')) {
          estimatedDuration = `${amount}d`;
        }
      }

      const task = {
        summary: text.split('.')[0], // Use first sentence as summary
        description: text,
        dueDate: dueDate.toISOString(),
        priority,
        category,
        estimatedDuration
      };

      console.log('Created task:', task);

      return new Response(
        JSON.stringify({
          type: 'create',
          task
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});