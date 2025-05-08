// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://ofyxpiqpcomlxfdyswkv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9meXhwaXFwY29tbHhmZHlzd2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTQ4MTgsImV4cCI6MjA2MTUzMDgxOH0.3Otp-UMVytSQYMeKlUjdn2G50HEds_AEuc3kBmqrJjQ'
);