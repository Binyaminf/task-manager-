
-- Create telegram_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.telegram_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  username TEXT NOT NULL,
  activated BOOLEAN DEFAULT false,
  setup_code TEXT,
  setup_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.telegram_settings ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view their own telegram settings"
ON public.telegram_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own telegram settings"
ON public.telegram_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own telegram settings"
ON public.telegram_settings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own telegram settings"
ON public.telegram_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger to update updated_at on row update
CREATE TRIGGER update_telegram_settings_updated_at
BEFORE UPDATE ON public.telegram_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
