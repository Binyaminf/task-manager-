
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Ensure request is POST
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const body = await req.json();
    const { text, currentTime } = body;
    
    console.log('Processing text:', text);
    console.log('Current time reference:', currentTime);

    if (!text) {
      throw new Error('No text provided');
    }

    // Initialize Hugging Face API for task classification
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
          candidate_labels: [
            "task creation",
            "search query",
            "task update",
            "task deletion"
          ]
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
      // Initialize Supabase client for search operations
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

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
        { headers: corsHeaders }
      );
    }

    // Enhanced context analysis
    const contextPatterns = {
      priority: {
        high: /\b(urgent|asap|important|critical|high priority|crucial|emergency|immediate|vital)\b/i,
        low: /\b(low priority|whenever possible|not urgent|can wait|optional|flexible|minor)\b/i,
        dependencies: /\b(after|before|depends on|following|prerequisite)\b/i
      },
      category: {
        'Meeting': /\b(meet|meeting|conference|call|sync|discussion|presentation)\b/i,
        'Development': /\b(code|develop|programming|debug|feature|implement|build|test)\b/i,
        'Planning': /\b(plan|strategy|roadmap|outline|organize|coordinate|schedule)\b/i,
        'Research': /\b(research|investigate|study|analyze|explore|review|evaluate)\b/i,
        'Documentation': /\b(document|write|draft|report|update docs|create guide)\b/i,
        'Design': /\b(design|mockup|prototype|wireframe|ui|ux|layout)\b/i,
        'Bug Fix': /\b(bug|fix|issue|problem|error|defect|patch)\b/i
      },
      timeframe: {
        immediate: /\b(today|now|asap|immediately|urgent)\b/i,
        shortTerm: /\b(tomorrow|next day|this week)\b/i,
        mediumTerm: /\b(next week|coming weeks|this month)\b/i,
        longTerm: /\b(next month|coming months|long term)\b/i
      },
      duration: {
        quick: /\b(\d+)\s*(min|minute|minutes)\b/i,
        hours: /\b(\d+)\s*(h|hour|hours)\b/i,
        days: /\b(\d+)\s*(d|day|days)\b/i,
        weeks: /\b(\d+)\s*(w|week|weeks)\b/i
      }
    };

    // Determine priority with confidence scoring
    let priority = 'Medium';
    let priorityConfidence = 0.5;
    
    if (contextPatterns.priority.high.test(text)) {
      priority = 'High';
      priorityConfidence = 0.8;
    } else if (contextPatterns.priority.low.test(text)) {
      priority = 'Low';
      priorityConfidence = 0.8;
    }

    // Smart category detection
    let category = 'General';
    let categoryConfidence = 0.3;
    
    for (const [cat, pattern] of Object.entries(contextPatterns.category)) {
      if (pattern.test(text)) {
        category = cat;
        categoryConfidence = 0.7;
        break;
      }
    }

    // Parse the current time
    const now = new Date(currentTime);

    // Intelligent due date determination
    let dueDate = new Date(now);
    let dateConfidence = 0.5;

    if (contextPatterns.timeframe.immediate.test(text)) {
      dueDate = new Date(now);
      dateConfidence = 0.9;
    } else if (contextPatterns.timeframe.shortTerm.test(text)) {
      dueDate.setDate(dueDate.getDate() + 2);
      dateConfidence = 0.8;
    } else if (contextPatterns.timeframe.mediumTerm.test(text)) {
      dueDate.setDate(dueDate.getDate() + 7);
      dateConfidence = 0.7;
    } else if (contextPatterns.timeframe.longTerm.test(text)) {
      dueDate.setDate(dueDate.getDate() + 30);
      dateConfidence = 0.6;
    }

    // Smart duration estimation
    let estimatedDuration = '1h';
    let durationConfidence = 0.4;

    for (const [type, pattern] of Object.entries(contextPatterns.duration)) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseInt(match[1]);
        switch (type) {
          case 'quick':
            estimatedDuration = `${Math.ceil(amount/60)}h`;
            break;
          case 'hours':
            estimatedDuration = `${amount}h`;
            break;
          case 'days':
            estimatedDuration = `${amount}d`;
            break;
          case 'weeks':
            estimatedDuration = `${amount * 5}d`; // Converting to working days
            break;
        }
        durationConfidence = 0.8;
        break;
      }
    }

    // Extract key phrases for context
    const keyPhrases = text.match(/\b[A-Za-z]+(?:\s+[A-Za-z]+)*\b/g) || [];
    const relatedKeywords = [...new Set(keyPhrases)]
      .filter(phrase => phrase.length > 3)
      .slice(0, 5);

    const task = {
      summary: text.split('.')[0],
      description: text,
      dueDate: dueDate.toISOString(),
      priority,
      category,
      estimatedDuration,
      relatedKeywords,
      confidence: (priorityConfidence + categoryConfidence + dateConfidence + durationConfidence) / 4
    };

    console.log('Created task with analysis:', task);

    return new Response(
      JSON.stringify({
        type: 'create',
        task,
        analysis: {
          confidence: task.confidence,
          relatedKeywords: task.relatedKeywords,
        }
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});
