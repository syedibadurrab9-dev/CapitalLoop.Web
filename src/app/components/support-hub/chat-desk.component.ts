import { Component, inject, ViewChild, ElementRef, AfterViewChecked, OnInit, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatStore } from '../../store/chat.store';
import { PortfolioStore } from '../../store/portfolio.store';

export type ConsultantLicenseType = 'SECP_ADVISOR' | 'FBR_TAX_PRACTITIONER';

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

  // Search filter for queue
  public readonly searchQuery = signal<string>('');

  public readonly filteredThreads = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const threads = this.chatStore.activeThreads();
    if (!query) return threads;
    return threads.filter(t => 
      t.clientName.toLowerCase().includes(query) || 
      t.email.toLowerCase().includes(query) ||
      (t.lastMessageSnippet && t.lastMessageSnippet.toLowerCase().includes(query))
    );
  });

  // Binding reference coordinate to anchor automatic scroll down positions
  @ViewChild('streamContainer') private readonly streamContainer!: ElementRef;
  private shouldScrollToBottom = false;

  // Regulatory Consultant Verification State (SECP / FBR Accreditation)
  public readonly isConsultantVerified = signal<boolean>(false);
  public readonly consultantLicense = signal<string>('SECP-ADV-8492');
  public readonly consultantName = signal<string>('Syed Ibad (Senior Advisory Partner)');
  public readonly consultantType = signal<ConsultantLicenseType>('SECP_ADVISOR');
  public readonly showVerificationModal = signal<boolean>(false);
  public readonly verificationError = signal<string | null>(null);

  // Modal form inputs
  public licenseInput: string = 'SECP-ADV-8492';
  public nameInput: string = 'Syed Ibad';
  public typeInput: ConsultantLicenseType = 'SECP_ADVISOR';

  constructor() {
    effect(() => {
      const messages = this.chatStore.activeMessageStream();
      if (messages.length > 0) {
        this.shouldScrollToBottom = true;
      }
    });
  }

  public ngOnInit(): void {
    this.chatStore.initSignalR();
  }

  public ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  protected selectClientUser(email: string): void {
    if (!email) return;
    const normalizedEmail = email.trim().toLowerCase();

    this.portfolioStore.selectedUserEmail.set(normalizedEmail);
    this.chatStore.loadActiveThreadStream(normalizedEmail);
    this.chatStore.clearEngagementWarning();
  }

  protected getActiveThreadName(): string {
    const currentEmail = this.portfolioStore.selectedUserEmail();
    if (!currentEmail) return 'Selected Client Chat Channel';

    const activeThread = this.chatStore.activeThreads().find(
      t => t.email.trim().toLowerCase() === currentEmail.trim().toLowerCase()
    );
    
    return activeThread ? activeThread.clientName : 'Selected Client Chat Channel';
  }

  public openVerificationModal(): void {
    this.verificationError.set(null);
    this.showVerificationModal.set(true);
  }

  public closeVerificationModal(): void {
    this.showVerificationModal.set(false);
  }

  public verifyCredentials(): void {
    const lic = this.licenseInput.trim().toUpperCase();
    const name = this.nameInput.trim();

    if (!name) {
      this.verificationError.set('Consultant legal name is required.');
      return;
    }

    // Must match SECP-ADV-XXXX or FBR-TP-XXXX
    const regex = /^(SECP-ADV|FBR-TP)-\d{4,6}$/;
    if (!regex.test(lic)) {
      this.verificationError.set('Invalid license format. Must follow standard: SECP-ADV-XXXX or FBR-TP-XXXX.');
      return;
    }

    this.consultantLicense.set(lic);
    this.consultantName.set(`${name} (Accredited Advisor)`);
    this.consultantType.set(this.typeInput);
    this.isConsultantVerified.set(true);
    this.verificationError.set(null);
    this.showVerificationModal.set(false);
  }

  public async claimCurrentSession(forceTakeover: boolean = false): Promise<void> {
    const email = this.portfolioStore.selectedUserEmail();
    if (!email) return;

    if (!this.isConsultantVerified()) {
      this.openVerificationModal();
      return;
    }

    await this.chatStore.claimSession(email, this.consultantLicense(), forceTakeover);
  }

  public async releaseCurrentSession(): Promise<void> {
    const email = this.portfolioStore.selectedUserEmail();
    if (!email) return;

    await this.chatStore.releaseSession(email);
  }

  public onInputTyping(text: string): void {
    const email = this.portfolioStore.selectedUserEmail();
    if (!email) return;
    this.chatStore.sendTypingNotification(email, text.length > 0);
  }

  protected dispatchResponse(inputRef: HTMLInputElement): void {
    if (!this.isConsultantVerified()) {
      this.openVerificationModal();
      return;
    }

    const targetText = inputRef.value?.trim();
    const rawDestinationEmail = this.portfolioStore.selectedUserEmail();

    if (!targetText || !rawDestinationEmail) return;
    
    const normalizedEmail = rawDestinationEmail.trim().toLowerCase();

    // Check if session is locked by another advisor
    if (this.chatStore.isCurrentSessionLockedByOther()) {
      const otherAdvisor = this.chatStore.currentSession()?.assignedAdvisorName || 'Another Advisor';
      if (!confirm(`⚠️ Investor session is currently locked to ${otherAdvisor}. Would you like to TAKE OVER the session and transmit this advice?`)) {
        return;
      }
      // Advisor chose to take over
      this.claimCurrentSession(true).then((success) => {
        // Proceed with transmission
        this.sendFormattedReply(inputRef, normalizedEmail, targetText);
      });
      return;
    }

    this.sendFormattedReply(inputRef, normalizedEmail, targetText);
  }

  private sendFormattedReply(inputRef: HTMLInputElement, email: string, text: string): void {
    // Attach regulatory verification stamp
    const badgeLabel = this.consultantType() === 'SECP_ADVISOR' ? 'SECP Advisor' : 'FBR Tax Practitioner';
    const stampedMessage = `[Verified ${badgeLabel} #${this.consultantLicense()}] ${text}`;

    this.chatStore.transmitAgentMessage(email, stampedMessage);
    this.chatStore.sendTypingNotification(email, false);
    
    inputRef.value = '';
    this.shouldScrollToBottom = true;
  }

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
