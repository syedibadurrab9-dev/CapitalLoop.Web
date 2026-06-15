import { Component, inject, ViewChild, ElementRef, AfterViewChecked, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { patchState } from '@ngrx/signals';
import { ChatStore } from '../../store/chat.store';
import { PortfolioStore } from '../../store/portfolio.store';

@Component({
  selector: 'app-chat-desk',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule
  ],
  templateUrl: './chat-desk.component.html'
})
export class ChatDeskComponent implements OnInit, AfterViewChecked {
  // Injecting real-time messaging pipeline and central portfolio ledger stores
  protected readonly chatStore = inject(ChatStore);
  protected readonly portfolioStore = inject(PortfolioStore);

  // Binding reference coordinate to anchor automatic scroll down positions
  @ViewChild('streamContainer') private readonly streamContainer!: ElementRef;
  private shouldScrollToBottom = false;

  constructor() {
    /**
     * ⚡ Reactive View Stream Scroller Listener
     * Automatically schedules a layout scroll alignment recalculation 
     * every single time a new message packet hits your active stream array.
     */
    effect(() => {
      const messages = this.chatStore.activeMessageStream();
      if (messages.length > 0) {
        this.shouldScrollToBottom = true;
      }
    });
  }

  /**
   * 🛡️ Real-Time SignalR Operational Initializer Hook
   * Dispatches connection signals over the state gateway immediately 
   * when the administration console tray initializes.
   */
  public ngOnInit(): void {
    // Only establish a fresh socket pipeline connection if the hub is completely offline
    if (this.chatStore.connectionStatus() === 'Disconnected') {
      this.chatStore.initSignalR();
    }
  }

  /**
   * Fires every time Angular finishes verifying presentation layouts
   */
  public ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  /**
   * Intercepts left-sidebar click events to select a client user.
   */
  protected selectClientUser(email: string): void {
    if (!email) return;
    const normalizedEmail = email.trim().toLowerCase();

    // =============================================================================
    // 🔒 FIXED: Aligned state mutations with modern NgRx patchState parameters
    // =============================================================================
    patchState(this.portfolioStore, { selectedUserEmail: normalizedEmail });
    
    this.chatStore.loadActiveThreadStream(normalizedEmail);
  }

  /**
   * Helper utility reading current context headers
   */
  protected getActiveThreadName(): string {
    const currentEmail = this.portfolioStore.selectedUserEmail();
    if (!currentEmail) return 'Selected Client Chat Channel';

    const activeThread = this.chatStore.activeThreads().find(
      t => t.email.trim().toLowerCase() === currentEmail.trim().toLowerCase()
    );
    
    return activeThread ? activeThread.clientName : 'Selected Client Chat Channel';
  }

  /**
   * Dispatches an administrative text block over the SignalR pipeline.
   */
  protected dispatchResponse(inputRef: HTMLInputElement): void {
    const targetText = inputRef.value?.trim();
    const rawDestinationEmail = this.portfolioStore.selectedUserEmail();

    if (!targetText || !rawDestinationEmail) return;
    
    const normalizedEmail = rawDestinationEmail.trim().toLowerCase();

    // Direct verified, lowercase parameters to your SignalR messaging handler
    this.chatStore.transmitAgentMessage(normalizedEmail, targetText);
    
    // Clear the plain-text input box instantly to prevent replay double-posts
    inputRef.value = '';
    this.shouldScrollToBottom = true;
  }

  /**
   * Shifts scroll window heights downward to focus incoming traffic cleanly
   */
  private scrollToBottom(): void {
    try {
      if (this.streamContainer?.nativeElement) {
        this.streamContainer.nativeElement.scrollTop = this.streamContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.warn('⚠️ Scroll layout adjustment failed:', err);
    }
  }
}