-- Add economy controls to Streamer Profile
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS min_video_price numeric DEFAULT 5.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS min_costream_price numeric DEFAULT 10.00;
