import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface AuthStateHandlerProps {
  onSessionChange: (session: any) => void;
  onError: (error: string | null) => void;
}

export function AuthStateHandler({ onSessionChange, onError }: AuthStateHandlerProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Auth error:', error);
        onError("Failed to get session. Please try logging in again.");
        return;
      }
      console.log('Initial session:', session);
      onSessionChange(session);
    });

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, 'Session:', session);
      if (event === 'SIGNED_IN') {
        onError(null);
        onSessionChange(session);
      } else if (event === 'SIGNED_OUT') {
        onSessionChange(null);
        onError(null);
        queryClient.clear();
      } else if (event === 'TOKEN_REFRESHED') {
        onSessionChange(session);
      } else if (event === 'USER_UPDATED') {
        onSessionChange(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [onSessionChange, onError, queryClient]);

  return null;
}