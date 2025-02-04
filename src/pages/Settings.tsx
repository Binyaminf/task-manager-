import { TelegramSettings } from "@/components/settings/TelegramSettings";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export default function Settings() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="max-w-2xl">
        <TelegramSettings />
      </div>
    </div>
  );
}