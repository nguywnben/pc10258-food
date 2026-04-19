import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMessageService, Conversation, Message, ConversationDetail } from '../../../services/admin-message.service';

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.html',
  styleUrls: ['./messages.css']
})
export class AdminMessages {
  private readonly adminMessageSvc = inject(AdminMessageService);

  // Signals
  conversations = signal<Conversation[]>([]);
  selectedConversation = signal<Conversation | null>(null);
  conversationDetail = signal<ConversationDetail | null>(null);
  isLoading = signal(true);
  isSending = signal(false);
  replyContent = signal('');

  // Computed
  selectedMessages = computed(() => {
    return this.conversationDetail()?.messages || [];
  });

  selectedUser = computed(() => {
    return this.selectedConversation()?.user || null;
  });

  constructor() {
    effect(() => {
      this.loadConversations();
    });
  }

  /**
   * Load all conversations
   */
  loadConversations(): void {
    this.isLoading.set(true);
    this.adminMessageSvc.getAllConversations().subscribe({
      next: (response) => {
        this.conversations.set(response.data);
        this.isLoading.set(false);
        console.log('Loaded conversations:', response.data);
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Select conversation and load its messages
   */
  selectConversation(conversation: Conversation): void {
    this.selectedConversation.set(conversation);
    this.adminMessageSvc.getConversationDetail(conversation.id).subscribe({
      next: (response) => {
        this.conversationDetail.set(response.data);
        console.log('Loaded conversation detail:', response.data);
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error loading conversation detail:', error);
      }
    });
  }

  /**
   * Send admin reply
   */
  sendReply(): void {
    const conversationId = this.selectedConversation()?.id;
    const content = this.replyContent().trim();

    if (!conversationId || !content) {
      return;
    }

    this.isSending.set(true);
    this.adminMessageSvc.sendReply(conversationId, content).subscribe({
      next: (response) => {
        console.log('Reply sent:', response.data);
        this.replyContent.set('');
        this.isSending.set(false);
        
        // Add message to UI
        const detail = this.conversationDetail();
        if (detail) {
          detail.messages.push(response.data);
          this.conversationDetail.set({ ...detail });
          this.scrollToBottom();
        }

        // Update conversation in list
        const convs = this.conversations();
        const updated = convs.map(c => 
          c.id === conversationId ? { ...c, updated_at: new Date().toISOString() } : c
        );
        this.conversations.set(updated);
      },
      error: (error) => {
        console.error('Error sending reply:', error);
        this.isSending.set(false);
      }
    });
  }

  /**
   * Format time for display
   */
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
  }

  /**
   * Get time ago display (5 phút trước, 1 giờ trước, etc)
   */
  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return this.formatDate(dateString);
  }

  /**
   * Scroll to bottom of messages
   */
  private scrollToBottom(): void {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  /**
   * Check if message is from user or agent
   */
  isUserMessage(message: Message): boolean {
    return message.sender_type === 'user';
  }

  /**
   * Get sender display name
   */
  getSenderName(message: Message): string {
    if (message.sender_type === 'user') {
      return this.selectedUser()?.full_name || 'Khách hàng';
    }
    return message.sender?.full_name || 'Admin Support';
  }

  /**
   * Get message status badge text
   */
  getStatusBadge(conversation: Conversation): string {
    const messageCount = conversation.messages?.length || 0;
    if (messageCount === 0) return 'Mới';
    return `${messageCount} tin`;
  }

  /**
   * Get last message preview
   */
  getLastMessagePreview(conversation: Conversation): string {
    const lastMessage = conversation.messages?.[0];
    if (!lastMessage) return 'Không có tin nhắn';
    return lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '');
  }
}
