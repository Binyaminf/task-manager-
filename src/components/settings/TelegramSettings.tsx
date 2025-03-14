
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
import { AlertCircle, RefreshCw } from "lucide-react";

export function TelegramSettings() {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  // Check if user already has a connected Telegram account
  const checkConnection = async () => {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('telegram_users')
        .select('*')
        .eq('user_id', session.data.session.user.id)
        .maybeSingle();
      
      if (data && !error) {
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error checking Telegram connection:', error);
    }
  };

  const setupWebhook = async () => {
    setSetupStatus('loading');
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
      setSetupStatus('success');
    } catch (error) {
      console.error('Error setting up webhook:', error);
      setSetupStatus('error');
    }
  };

  // Set up webhook and check connection when component mounts
  useEffect(() => {
    setupWebhook();
    checkConnection();
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
      setIsConnected(true);
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

  const handleReset = async () => {
    setIsLoading(true);
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user?.id) return;

    try {
      await supabase
        .from('telegram_users')
        .update({ user_id: null })
        .eq('user_id', session.data.session.user.id);
      
      setIsConnected(false);
      toast({
        title: "Success",
        description: "Telegram connection has been reset. You can now link a new account.",
      });
    } catch (error) {
      console.error('Error resetting connection:', error);
      toast({
        title: "Error",
        description: "Failed to reset Telegram connection.",
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
        {setupStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">
                Bot service error
              </p>
              <p className="text-sm text-red-600 mt-1">
                There was a problem connecting to the Telegram bot service. Please try again later.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={setupWebhook} 
                className="mt-2"
                disabled={setupStatus === 'loading'}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${setupStatus === 'loading' ? 'animate-spin' : ''}`} />
                Retry connection
              </Button>
            </div>
          </div>
        )}

        {isConnected ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-md">
              <p className="text-sm font-medium text-green-700">
                ✅ Your Telegram account is connected!
              </p>
              <p className="text-sm text-green-600 mt-1">
                You can now use the bot to manage your tasks. Here are some commands:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-green-700">
                <li>List your tasks using "list tasks" command</li>
                <li>View priority overview using "priority overview" command</li>
                <li>Ask questions using natural language</li>
                <li>Use /help to see all available commands</li>
              </ul>
            </div>
            <Button variant="outline" onClick={handleReset} disabled={isLoading}>
              {isLoading ? "Processing..." : "Reset Connection"}
            </Button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
