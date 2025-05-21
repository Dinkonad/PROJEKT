import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://whtbzhoheyuryrebquvj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodGJ6aG9oZXl1cnlyZWJxdXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MTI3ODYsImV4cCI6MjA2MzM4ODc4Nn0.rUZRylH1svpQxWssDPbdmFfSTG2Yh71fxaXLRPiIJ74';

export const supabase = createClient(supabaseUrl, supabaseKey);