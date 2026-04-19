import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  type: 'support' | 'shipper' | 'promotion';
  avatar_text?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  messages?: {
    content: string;
    sender_type: string;
    created_at: string;
  }[];
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id?: number;
  sender_type: 'user' | 'agent' | 'system';
  content: string;
  created_at: string;
}

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getConversations(): Observable<Conversation[]> {
    return this.http
      .get<ApiResponse<Conversation[]>>(`${this.apiUrl}/conversations`)
      .pipe(map(response => response.data || []));
  }

  getMessages(conversationId: number): Observable<Message[]> {
    return this.http
      .get<ApiResponse<{ conversation: Conversation, messages: Message[] }>>(`${this.apiUrl}/conversations/${conversationId}/messages`)
      .pipe(map(response => response.data?.messages || []));
  }

  sendMessage(conversationId: number, content: string): Observable<Message> {
    return this.http
      .post<ApiResponse<Message>>(`${this.apiUrl}/messages`, { conversation_id: conversationId, content })
      .pipe(map(response => response.data));
  }

  createConversation(title: string, type: string = 'support'): Observable<Conversation> {
    return this.http
      .post<ApiResponse<Conversation>>(`${this.apiUrl}/conversations`, { title, type })
      .pipe(map(response => response.data));
  }
}
