import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://mxwydlnjaqkodjrzxntu.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14d3lkbG5qYXFrb2Rqcnp4bnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MzYwODMsImV4cCI6MjEwODExMjA4M30.iJX-ITVgvXMAYyvHoQqLh_n6iwS3rXNVjVKOgxUxM8o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface UserRecord {
  id?: number;
  username: string;
  password?: string;
  email: string;
  enable: boolean;
}

export interface DanhMucRecord {
  id: number;
  phanloai: string;
}

export interface DanhSachTrangWebRecord {
  id: number;
  ten: string;
  link: string;
  mota: string | null;
  hieuluc: boolean;
  phanloai: number;
}
