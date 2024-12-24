import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { parseTaskMessage, type ParsedTask } from "./messageParser.ts";
import { sendWhatsAppMessage } from "./whatsappApi.ts";

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
                const parsedTask = parseTaskMessage(messageText);
                
                if (parsedTask.summary) {
                  await handleTaskCreation(supabase, parsedTask, phoneNumber);
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

async function handleTaskCreation(supabase: any, parsedTask: ParsedTask, phoneNumber: string) {
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
}