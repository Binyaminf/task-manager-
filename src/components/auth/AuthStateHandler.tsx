import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AuthError, Session, AuthChangeEvent } from "@supabase/supabase-js";

interface AuthStateHandlerProps {
  onSessionChange: (session: Session | null) => void;
  onError: (error: string | null) => void;
}

export function AuthStateHandler({ onSessionChange, onError }: AuthStateHandlerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Auth error:', error);
        onError("Failed to get session. Please try logging in again.");
        toast({
          title: "Authentication Error",
          description: "Failed to get session. Please try logging in again.",
          variant: "destructive",
        });
        return;
      }
      console.log('Initial session:', session);
      onSessionChange(session);
    });

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
      console.log('Auth state changed:', event, 'Session:', session);
      
      switch (event) {
        case 'SIGNED_IN':
          onError(null);
          onSessionChange(session);
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
          break;
        
        case 'SIGNED_OUT':
          onSessionChange(null);
          onError(null);
          queryClient.clear();
          toast({
            title: "Signed out",
            description: "You have been signed out successfully.",
          });
          break;
        
        case 'TOKEN_REFRESHED':
          onSessionChange(session);
          break;
        
        case 'USER_UPDATED':
          onSessionChange(session);
          break;

        case 'PASSWORD_RECOVERY':
          toast({
            title: "Password Recovery",
            description: "Please check your email for password reset instructions.",
          });
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, [onSessionChange, onError, queryClient, toast]);

  return null;
}