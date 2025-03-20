
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

type SetupStatus = 'idle' | 'loading' | 'success' | 'error';

interface TelegramSettingsData {
  username: string;
  activated: boolean;
  setup_date: string;
}

export function TelegramSettings() {
  const [username, setUsername] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [setupStatus, setSetupStatus] = useState<SetupStatus>('idle');
  const [telegramData, setTelegramData] = useState<TelegramSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTelegramSettings = async () => {
    try {
      setIsLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from('telegram_settings')
        .select('username, activated, setup_date')
        .eq('user_id', session.session.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setTelegramData(data as TelegramSettingsData);
        setUsername(data.username);
      }
    } catch (error) {
      console.error("Error fetching Telegram settings:", error);
      toast({
        title: "Error",
        description: "Failed to load Telegram settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelegramSettings();
  }, []);

  const setupTelegramBot = async () => {
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Telegram username",
        variant: "destructive",
      });
      return;
    }

    try {
      setSetupStatus('loading');
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: JSON.stringify({
          action: 'setup',
          username: username.trim(),
          userId: session.session.user.id,
        }),
      });

      if (error) throw error;

      if (data && data.success) {
        setSetupCode(data.setupCode);
        setSetupStatus('success');
        toast({
          title: "Success",
          description: "Setup initiated! Use the code to activate your bot",
        });
      } else {
        throw new Error(data?.message || "Failed to setup Telegram bot");
      }
    } catch (error) {
      console.error("Error setting up Telegram bot:", error);
      setSetupStatus('error');
      toast({
        title: "Error",
        description: error.message || "Failed to setup Telegram bot",
        variant: "destructive",
      });
    }
  };

  const resetSetup = () => {
    setSetupStatus('idle');
    setSetupCode("");
  };

  const disconnectTelegram = async () => {
    try {
      setIsLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from('telegram_settings')
        .delete()
        .eq('user_id', session.session.user.id);

      if (error) throw error;

      setTelegramData(null);
      toast({
        title: "Success",
        description: "Telegram bot disconnected",
      });
    } catch (error) {
      console.error("Error disconnecting Telegram:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect Telegram bot",
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
          Connect your account to Telegram to receive updates and manage your tasks via chat
        </CardDescription>
      </CardHeader>
      <CardContent>
        {telegramData?.activated ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p>Connected to @{telegramData.username}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Connected since {new Date(telegramData.setup_date).toLocaleDateString()}
            </p>
            <Button variant="destructive" onClick={disconnectTelegram} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium">
                Your Telegram Username
              </label>
              <Input
                id="username"
                placeholder="@yourusername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={setupStatus === 'loading' || setupStatus === 'success'}
              />
              <p className="text-xs text-muted-foreground">
                Don't include the @ symbol, just your username
              </p>
            </div>

            {setupStatus === 'success' && (
              <Alert>
                <AlertDescription className="space-y-4">
                  <p>Send the following code to our bot @TaskManagerAIBot on Telegram:</p>
                  <code className="block bg-muted p-2 rounded font-mono">{setupCode}</code>
                  <Button size="sm" onClick={resetSetup}>Try with a different username</Button>
                </AlertDescription>
              </Alert>
            )}

            {setupStatus === 'error' && (
              <Alert variant="destructive">
                <AlertDescription className="space-y-2">
                  <p>Failed to set up Telegram integration</p>
                  <Button size="sm" variant="outline" onClick={resetSetup}>Try again</Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
      {!telegramData?.activated && setupStatus !== 'success' && (
        <CardFooter>
          <Button 
            onClick={setupTelegramBot} 
            disabled={setupStatus === 'loading'}
            className="w-full"
          >
            {setupStatus === 'loading' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Connect to Telegram"
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
