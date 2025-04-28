// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cludxkffblwvgtupgelg.supabase.co'; // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsdWR4a2ZmYmx3dmd0dXBnZWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwODU4MzMsImV4cCI6MjA1NzY2MTgzM30.LJOVQi-CEVDXa5hCWi8Zw4xHlyDCP-r6PGvhoR0ZWQM'; // Replace with your Supabase anon key
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
