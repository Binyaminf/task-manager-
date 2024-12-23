import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages: Array<{
          from: string;
          text: {
            body: string;
          };
          timestamp: string;
          type: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

interface ParsedTask {
  summary: string;
  description?: string;
  dueDate?: string;
  estimatedDuration?: string;
  priority?: "High" | "Medium" | "Low";
  category?: string;
}

function parseTaskMessage(message: string): ParsedTask {
  const lines = message.toLowerCase().split('\n');
  const task: ParsedTask = {
    summary: '',
    priority: 'Medium',
    category: 'WhatsApp'
  };

  for (const line of lines) {
    if (line.startsWith('task:')) {
      task.summary = line.substring(5).trim();
    } else if (line.startsWith('due:')) {
      task.dueDate = new Date(line.substring(4).trim()).toISOString();
    } else if (line.startsWith('time:')) {
      task.estimatedDuration = line.substring(5).trim();
    } else if (line.startsWith('priority:')) {
      const priority = line.substring(9).trim();
      if (['high', 'medium', 'low'].includes(priority)) {
        task.priority = priority.charAt(0).toUpperCase() + priority.slice(1) as "High" | "Medium" | "Low";
      }
    } else if (line.startsWith('category:')) {
      task.category = line.substring(9).trim();
    } else if (line.startsWith('desc:')) {
      task.description = line.substring(5).trim();
    }
  }

  // Set default values if not provided
  if (!task.dueDate) {
    task.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (!task.estimatedDuration) {
    task.estimatedDuration = '1h';
  }

  return task;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify webhook
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN');

      if (mode === 'subscribe' && token === verifyToken) {
        console.log('Webhook verified');
        return new Response(challenge, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }

      return new Response('Forbidden', { status: 403 });
    }

    // Handle incoming messages
    if (req.method === 'POST') {
      const whatsappData: WhatsAppMessage = await req.json();
      console.log('Received WhatsApp webhook:', whatsappData);

      for (const entry of whatsappData.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            for (const message of change.value.messages) {
              if (message.type === 'text') {
                const messageText = message.text.body;
                const phoneNumber = message.from;

                // Parse message to create task
                const parsedTask = parseTaskMessage(messageText);
                
                if (parsedTask.summary) {
                  // Store task in database
                  const { data, error } = await supabase
                    .from('tasks')
                    .insert([{
                      summary: parsedTask.summary,
                      description: parsedTask.description,
                      due_date: parsedTask.dueDate,
                      estimated_duration: parsedTask.estimatedDuration,
                      priority: parsedTask.priority,
                      status: 'To Do',
                      category: parsedTask.category,
                      user_id: null // Will be set once we implement phone number to user mapping
                    }]);

                  if (error) {
                    console.error('Error creating task:', error);
                    await sendWhatsAppMessage(phoneNumber, 'Sorry, I couldn\'t create your task. Please try again.');
                  } else {
                    const helpMessage = `Task created successfully! You can include these optional fields in your message:
- due: [date]
- time: [duration]
- priority: high/medium/low
- category: [category name]
- desc: [description]`;
                    await sendWhatsAppMessage(phoneNumber, helpMessage);
                  }
                } else {
                  await sendWhatsAppMessage(phoneNumber, 'Please start your message with "task:" followed by the task description.');
                }
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendWhatsAppMessage(to: string, message: string) {
  const whatsappToken = Deno.env.get('WHATSAPP_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    console.log('WhatsApp message sent successfully');
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}