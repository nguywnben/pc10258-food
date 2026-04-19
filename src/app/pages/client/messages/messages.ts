import { AfterViewInit, Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, Conversation, Message } from '../../../services/message.service';
import { Subscription, interval, switchMap } from 'rxjs';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.html',
})
export class Messages implements OnInit, AfterViewInit, OnDestroy {
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];
  newMessageContent: string = '';
  
  private pollingSubscription?: Subscription;

  ngOnInit(): void {
    this.loadConversations();
  }

  ngAfterViewInit(): void {
    // Tạm thời tắt load main.js nếu nó gây nhiễu click event của Angular
    /*
    if (typeof document === 'undefined') return;
    if (document.querySelector('script#food-main-js')) return;

    const script = document.createElement('script');
    script.id = 'food-main-js';
    script.src = 'assets/js/main.js';
    document.body.appendChild(script);
    */
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadConversations(): void {
    this.messageService.getConversations().subscribe({
      next: (data) => {
        this.conversations = data;
        
        // Nếu đã có hội thoại đang chọn, hãy cập nhật lại reference từ danh sách mới
        if (this.selectedConversation) {
          const updated = this.conversations.find(c => c.id === this.selectedConversation?.id);
          if (updated) this.selectedConversation = updated;
        } 
        // Nếu chưa chọn gì, chọn cái đầu tiên
        else if (this.conversations.length > 0) {
          this.selectConversation(this.conversations[0]);
        }
        
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading conversations:', err)
    });
  }

  selectConversation(conv: Conversation): void {
    // Nếu click vào cái đang chọn thì không làm gì thêm (tránh flicker)
    if (this.selectedConversation?.id === conv.id && this.messages.length > 0) {
      return;
    }

    this.selectedConversation = conv;
    this.messages = []; // Xóa tin nhắn cũ ngay lập tức để người dùng thấy phản hồi
    
    this.loadMessages(conv.id);
    this.startPolling(conv.id);
    
    // Ép Angular cập nhật UI ngay lập tức
    this.cdr.detectChanges();
  }

  loadMessages(conversationId: number): void {
    this.messageService.getMessages(conversationId).subscribe({
      next: (data) => {
        this.messages = data;
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: (err) => console.error('Error loading messages:', err)
    });
  }

  sendMessage(): void {
    if (!this.selectedConversation || !this.newMessageContent.trim()) return;

    const content = this.newMessageContent.trim();
    this.newMessageContent = '';

    this.messageService.sendMessage(this.selectedConversation.id, content).subscribe({
      next: (msg) => {
        this.messages.push(msg);
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: (err) => console.error('Error sending message:', err)
    });
  }

  startPolling(conversationId: number): void {
    this.stopPolling();
    this.pollingSubscription = interval(5000)
      .pipe(
        switchMap(() => this.messageService.getMessages(conversationId))
      )
      .subscribe({
        next: (data) => {
          if (data.length !== this.messages.length) {
            this.messages = data;
            this.cdr.detectChanges();
            this.scrollToBottom();
          }
        },
        error: (err) => console.error('Polling error:', err)
      });
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  handleKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const thread = document.getElementById('chat-thread');
      if (thread) {
        thread.scrollTop = thread.scrollHeight;
      }
    }, 50);
  }
}


