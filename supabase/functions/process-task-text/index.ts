
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Fix: Use correct date-fns imports for Deno
import { addDays, format as formatDate } from "https://esm.sh/date-fns@2.30.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, content-length',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Improved NLP patterns
const contextPatterns = {
  priority: {
    high: /\b(urgent|asap|important|critical|high priority|crucial|emergency|immediate|vital|priority.*high)\b/i,
    low: /\b(low priority|whenever possible|not urgent|can wait|optional|flexible|minor|priority.*low)\b/i,
    dependencies: /\b(after|before|depends on|following|prerequisite|blocker|blocked by)\b/i
  },
  category: {
    'Meeting': /\b(meet|meeting|conference|call|sync|discussion|presentation|interview|1:1|standup)\b/i,
    'Development': /\b(code|develop|programming|debug|feature|implement|build|test|deploy|release)\b/i,
    'Planning': /\b(plan|strategy|roadmap|outline|organize|coordinate|schedule|prioritize|backlog)\b/i,
    'Research': /\b(research|investigate|study|analyze|explore|review|evaluate|assess|compare|examine)\b/i,
    'Documentation': /\b(document|write|draft|report|update docs|create guide|readme|wiki|specs|requirements)\b/i,
    'Design': /\b(design|mockup|prototype|wireframe|ui|ux|layout|sketch|figma|interface)\b/i,
    'Bug Fix': /\b(bug|fix|issue|problem|error|defect|patch|troubleshoot|resolve|hotfix)\b/i,
    'Admin': /\b(admin|administration|management|organize|setup|configure|maintain|upgrade)\b/i,
    'Education': /\b(learn|study|course|training|tutorial|workshop|certification|skill|education)\b/i,
    'Communication': /\b(email|message|communicate|contact|respond|reply|discuss|chat|call)\b/i
  },
  timeframe: {
    immediate: /\b(today|now|asap|immediately|urgent|right away)\b/i,
    shortTerm: /\b(tomorrow|next day|this week|coming days)\b/i,
    mediumTerm: /\b(next week|coming weeks|this month|soon)\b/i,
    longTerm: /\b(next month|coming months|long term|eventually|later|future)\b/i,
    specificDate: /\b(on|by|before|after|until)\s+(\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?)\b/i,
    nextDay: /\b(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i,
    recurringPattern: /\b(every|each)\s+(day|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i
  },
  duration: {
    quick: /\b(\d+)\s*(min|minute|minutes)\b/i,
    hours: /\b(\d+\.?\d*)\s*(h|hr|hour|hours)\b/i,
    days: /\b(\d+\.?\d*)\s*(d|day|days)\b/i,
    weeks: /\b(\d+)\s*(w|week|weeks)\b/i,
    indefinite: /\b(ongoing|continuous|undetermined)\b/i
  },
  status: {
    inProgress: /\b(in progress|started|ongoing|working on|begin|beginning|start)\b/i,
    done: /\b(completed|done|finished|resolved|closed)\b/i
  }
};

// Advanced date parsing
function parseTextualDate(text, currentTime) {
  const now = new Date(currentTime);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // Handle relative dates
  if (/\btoday\b/i.test(text)) {
    return today;
  } else if (/\btomorrow\b/i.test(text)) {
    return addDays(today, 1);
  } else if (/\bnext week\b/i.test(text)) {
    return addDays(today, 7);
  } else if (/\bnext month\b/i.test(text)) {
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  }

  // Handle specific days of week
  const dayMatch = text.match(/\b(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i);
  if (dayMatch) {
    const dayMap = {
      'monday': 1, 'mon': 1,
      'tuesday': 2, 'tue': 2,
      'wednesday': 3, 'wed': 3,
      'thursday': 4, 'thu': 4,
      'friday': 5, 'fri': 5,
      'saturday': 6, 'sat': 6,
      'sunday': 0, 'sun': 0
    };
    
    const targetDay = dayMap[dayMatch[2].toLowerCase()];
    const currentDay = today.getDay();
    let daysToAdd = targetDay - currentDay;
    
    if (daysToAdd <= 0 || dayMatch[1].toLowerCase() === 'next') {
      daysToAdd += 7;
    }
    
    return addDays(today, daysToAdd);
  }

  // Try to extract specific date formats
  try {
    const dateMatch = text.match(/\b(\d{1,2})[-\/\.](\d{1,2})(?:[-\/\.](\d{2,4}))?\b/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1; // JS months are 0-indexed
      let year = dateMatch[3] ? parseInt(dateMatch[3], 10) : today.getFullYear();
      
      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  } catch (e) {
    console.log('Error parsing specific date:', e);
  }

  // Default fallback
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  // Request validation
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, 
      headers: corsHeaders
    });
  }

  try {
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
            "task deletion",
            "general question"
          ]
        }
      })
    });

    if (!response.ok) {
      console.error(`Hugging Face API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const classification = await response.json();
    console.log('Classification result:', classification);
    
    // Determine what type of request this is
    const topLabel = classification.labels[0];
    const confidenceScore = classification.scores[0];
    
    console.log(`Top classification: ${topLabel} (${confidenceScore})`);

    const isSearch = topLabel === "search query";

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
          results: searchResults,
          confidence: confidenceScore
        }),
        { headers: corsHeaders }
      );
    }

    // Determine priority with confidence scoring
    let priority = 'Medium';
    let priorityConfidence = 0.5;
    let priorityReason = 'Default priority level';
    
    if (contextPatterns.priority.high.test(text)) {
      priority = 'High';
      priorityConfidence = 0.85;
      priorityReason = 'Contains high priority indicators';
    } else if (contextPatterns.priority.low.test(text)) {
      priority = 'Low';
      priorityConfidence = 0.85;
      priorityReason = 'Contains low priority indicators';
    }

    // Smart category detection with improved confidence
    let category = 'General';
    let categoryConfidence = 0.3;
    let categoryReason = 'No specific category detected';
    
    for (const [cat, pattern] of Object.entries(contextPatterns.category)) {
      if (pattern.test(text)) {
        category = cat;
        categoryConfidence = 0.8;
        categoryReason = `Matched pattern for ${cat} category`;
        break;
      }
    }

    // Parse the current time
    const now = new Date(currentTime);

    // Advanced due date determination
    let dueDate = new Date(now);
    let dateConfidence = 0.6;
    let dateReason = 'Default due date (today)';

    // Try to parse textual date first
    const parsedTextDate = parseTextualDate(text, currentTime);
    
    if (parsedTextDate) {
      dueDate = parsedTextDate;
      dateConfidence = 0.9;
      dateReason = 'Specific date mentioned in text';
    } else if (contextPatterns.timeframe.immediate.test(text)) {
      dueDate = new Date(now);
      dateConfidence = 0.9;
      dateReason = 'Immediate timeframe mentioned';
    } else if (contextPatterns.timeframe.shortTerm.test(text)) {
      dueDate.setDate(dueDate.getDate() + 2);
      dateConfidence = 0.8;
      dateReason = 'Short-term timeframe mentioned';
    } else if (contextPatterns.timeframe.mediumTerm.test(text)) {
      dueDate.setDate(dueDate.getDate() + 7);
      dateConfidence = 0.7;
      dateReason = 'Medium-term timeframe mentioned';
    } else if (contextPatterns.timeframe.longTerm.test(text)) {
      dueDate.setDate(dueDate.getDate() + 30);
      dateConfidence = 0.6;
      dateReason = 'Long-term timeframe mentioned';
    }

    // Smart duration estimation with improved parsing
    let estimatedDuration = '1h';
    let durationConfidence = 0.5;
    let durationReason = 'Default duration estimate';

    for (const [type, pattern] of Object.entries(contextPatterns.duration)) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        switch (type) {
          case 'quick':
            estimatedDuration = `${Math.max(1, Math.ceil(amount/60))}h`;
            durationConfidence = 0.85;
            durationReason = `Parsed ${amount} minutes`;
            break;
          case 'hours':
            estimatedDuration = `${amount}h`;
            durationConfidence = 0.9;
            durationReason = `Parsed ${amount} hours`;
            break;
          case 'days':
            estimatedDuration = `${amount}d`;
            durationConfidence = 0.9;
            durationReason = `Parsed ${amount} days`;
            break;
          case 'weeks':
            estimatedDuration = `${amount * 5}d`; // Converting to working days
            durationConfidence = 0.85;
            durationReason = `Parsed ${amount} weeks`;
            break;
          case 'indefinite':
            estimatedDuration = 'ongoing';
            durationConfidence = 0.7;
            durationReason = 'Indefinite duration mentioned';
            break;
        }
        break;
      }
    }

    // Determine status
    let status = 'To Do';
    if (contextPatterns.status.inProgress.test(text)) {
      status = 'In Progress';
    } else if (contextPatterns.status.done.test(text)) {
      status = 'Done';
    }

    // Extract key phrases for context
    const keyPhrases = text.match(/\b[A-Za-z]+(?:\s+[A-Za-z]+)*\b/g) || [];
    const relatedKeywords = [...new Set(keyPhrases)]
      .filter(phrase => phrase.length > 3)
      .filter(phrase => !['task', 'the', 'and', 'for', 'with', 'this', 'that', 'have', 'from'].includes(phrase.toLowerCase()))
      .slice(0, 5);

    const task = {
      summary: text.split(/[.?!]/, 1)[0].trim() || text.substring(0, 50) + '...',
      description: text,
      dueDate: dueDate.toISOString(),
      priority,
      category,
      estimatedDuration,
      status,
      relatedKeywords
    };

    // Calculate overall confidence score with weighted components
    const overallConfidence = (
      priorityConfidence * 0.2 + 
      categoryConfidence * 0.2 + 
      dateConfidence * 0.3 + 
      durationConfidence * 0.2 +
      confidenceScore * 0.1
    );

    console.log('Created task with analysis:', task);
    console.log('Confidence details:', {
      priority: { value: priority, confidence: priorityConfidence, reason: priorityReason },
      category: { value: category, confidence: categoryConfidence, reason: categoryReason },
      dueDate: { value: dueDate.toISOString(), confidence: dateConfidence, reason: dateReason },
      duration: { value: estimatedDuration, confidence: durationConfidence, reason: durationReason }
    });

    return new Response(
      JSON.stringify({
        type: 'create',
        task,
        analysis: {
          confidence: overallConfidence,
          relatedKeywords: task.relatedKeywords,
          details: {
            priority: { value: priority, confidence: priorityConfidence, reason: priorityReason },
            category: { value: category, confidence: categoryConfidence, reason: categoryReason },
            dueDate: { value: formatDate(dueDate, 'yyyy-MM-dd'), confidence: dateConfidence, reason: dateReason },
            duration: { value: estimatedDuration, confidence: durationConfidence, reason: durationReason }
          }
        }
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        suggestions: [
          "Try rephrasing your request",
          "Be more specific about due dates and priorities",
          "Check your internet connection"
        ]
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});
