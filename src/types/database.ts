export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  title: string;
  template_id?: string;
  contact_count: number;
  status: string;
  scheduled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  user_id: string;
  contact_id: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_type: 'user' | 'contact';
  content: string;
  status: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  status: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}
