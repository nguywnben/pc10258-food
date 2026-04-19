import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  type: 'support' | 'shipper' | 'promotion';
  avatar_text?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    avatar_url?: string;
  };
  messages?: any[];
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id?: number;
  sender_type: 'user' | 'agent' | 'system';
  content: string;
  created_at: string;
  sender?: {
    id: number;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: Message[];
}

export interface ChatStatistics {
  conversationId: number;
  userId: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  totalMessages: number;
  userMessages: number;
  agentMessages: number;
  lastUpdate: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminMessageService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/admin/messages';

  constructor() {}

  /**
   * Get all support conversations
   */
  getAllConversations(): Observable<{ status: number; data: Conversation[] }> {
    return this.http.get<{ status: number; data: Conversation[] }>(
      `${this.apiUrl}/conversations`
    );
  }

  /**
   * Get conversation detail with all messages
   */
  getConversationDetail(conversationId: number): Observable<{ status: number; data: ConversationDetail }> {
    return this.http.get<{ status: number; data: ConversationDetail }>(
      `${this.apiUrl}/conversations/${conversationId}`
    );
  }

  /**
   * Send admin reply to a conversation
   */
  sendReply(conversationId: number, content: string): Observable<{ message: string; data: Message }> {
    return this.http.post<{ message: string; data: Message }>(
      `${this.apiUrl}/conversations/${conversationId}/reply`,
      { content }
    );
  }

  /**
   * Get chat statistics for all conversations
   */
  getChatStatistics(): Observable<{ status: number; data: ChatStatistics[] }> {
    return this.http.get<{ status: number; data: ChatStatistics[] }>(
      `${this.apiUrl}/statistics`
    );
  }
}
