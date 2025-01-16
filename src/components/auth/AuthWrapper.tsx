import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthWrapperProps {
  authError: string | null;
}

export const AuthWrapper = ({ authError }: AuthWrapperProps) => {
  return (
    <div className="container max-w-md mx-auto py-8">
      {authError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}
      <Auth
        supabaseClient={supabase}
        appearance={{ 
          theme: ThemeSupa,
          style: {
            button: { background: 'rgb(59 130 246)', color: 'white' },
            anchor: { color: 'rgb(59 130 246)' },
          }
        }}
        providers={["google"]}
        redirectTo={window.location.origin}
      />
    </div>
  );
};