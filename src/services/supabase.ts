// src/services/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// 🔴 PASTE YOUR EXACT SUPABASE URL AND KEY HERE:
const supabaseUrl = 'https://wdoclxhjtvueabhkvywd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indkb2NseGhqdHZ1ZWFiaGt2eXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzE4MjMsImV4cCI6MjA4OTY0NzgyM30.ACiDNdlXNzLEhSwnhjHdx135FwOmag89sjmt6jyeQWw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});