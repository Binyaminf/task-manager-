import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TelegramSettings() {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const setupWebhook = async () => {
    const webhookUrl = `https://acmmuhybijjkycfoxuzc.supabase.co/functions/v1/telegram-bot`;
    
    try {
      const { error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'setup-webhook',
          webhookUrl
        }
      });

      if (error) throw error;

      console.log('Webhook setup successful');
    } catch (error) {
      console.error('Error setting up webhook:', error);
    }
  };

  // Set up webhook when component mounts
  useEffect(() => {
    setupWebhook();
  }, []);

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    const session = await supabase.auth.getSession();
    if (!session.data.session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to verify your Telegram account",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'verify',
          code: verificationCode.toUpperCase(),
          userId: session.data.session.user.id
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Telegram account linked successfully!",
      });
      setVerificationCode("");
    } catch (error) {
      console.error('Error verifying code:', error);
      toast({
        title: "Error",
        description: "Failed to verify code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram Integration</CardTitle>
        <CardDescription>
          Link your Telegram account to manage tasks via chat
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            1. Start a chat with our bot: @TaskManagerAssistantBot
          </p>
          <p className="text-sm text-muted-foreground">
            2. Send the /start command to receive your verification code
          </p>
          <p className="text-sm text-muted-foreground">
            3. Enter the code below to link your account
          </p>
        </div>
        <form onSubmit={handleVerification} className="flex space-x-2">
          <Input
            placeholder="Enter verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="max-w-[200px]"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}