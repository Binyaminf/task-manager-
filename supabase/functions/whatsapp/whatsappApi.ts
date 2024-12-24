export async function sendWhatsAppMessage(to: string, message: string) {
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