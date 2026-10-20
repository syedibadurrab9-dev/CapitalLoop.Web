import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { AuthService } from '../services/auth.service';
import { ChatService, SupportSessionSummary } from '../services/chat.service';
import { environment } from '../../environments/environment';

export interface ActiveUserSession {
  email: string;
  name: string;
  messages: Array<{ isAgent: boolean; message: string; timestamp: Date }>;
  isOnline: boolean;
}

export interface AgentChatState {
  usersMap: Record<string, ActiveUserSession>;
  sessionsMap: Record<string, SupportSessionSummary>;
  selectedUserEmail: string | null;
  connectionStatus: 'Disconnected' | 'Connecting' | 'Connected' | 'Faulted';
  engagementWarning: string | null;
  typingMap: Record<string, boolean>;
}

const initialState: AgentChatState = {
  usersMap: {},
  sessionsMap: {},
  selectedUserEmail: null,
  connectionStatus: 'Disconnected',
  engagementWarning: null,
  typingMap: {}
};

export interface SupportThreadView {
  email: string;
  clientName: string;
  isOnline: boolean;
  lastMessageSnippet: string;
  status: 'UNASSIGNED' | 'ENGAGED' | 'RESOLVED';
  assignedAdvisorEmail?: string | null;
  assignedAdvisorName?: string | null;
  isLockedByOther: boolean;
  isLockedByMe: boolean;
  isTyping: boolean;
}

export interface TransmittedMessageView {
  id: string;
  senderName: string;
  isAgentSender: boolean;
  text: string;
  timestamp: Date;
}

export const ChatStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  
  withComputed((store) => {
    const authService = inject(AuthService);

    return {
      activeThreads: computed<SupportThreadView[]>(() => {
        const currentUserProfile = authService.currentUserProfile();
        const currentAdvisorEmail = (currentUserProfile?.email || '').trim().toLowerCase();

        const allEmails = new Set<string>([
          ...Object.keys(store.usersMap()),
          ...Object.keys(store.sessionsMap())
        ]);

        return Array.from(allEmails).map((email) => {
          const normEmail = email.trim().toLowerCase();
          const user = store.usersMap()[normEmail];
          const session = store.sessionsMap()[normEmail];

          const hasMessages = user && user.messages.length > 0;
          const lastMsg = hasMessages ? user.messages[user.messages.length - 1].message : '';
          const status = session?.status || 'UNASSIGNED';
          const assignedEmail = (session?.assignedAdvisorEmail || '').trim().toLowerCase();

          const isLockedByMe = status === 'ENGAGED' && currentAdvisorEmail !== '' && assignedEmail === currentAdvisorEmail;
          const isLockedByOther = status === 'ENGAGED' && (currentAdvisorEmail === '' || (assignedEmail !== '' && assignedEmail !== currentAdvisorEmail));
          const isTyping = !!store.typingMap()[normEmail];

          return {
            email: normEmail,
            clientName: session?.investorName || user?.name || normEmail,
            isOnline: user?.isOnline ?? (session?.isOnline ?? false),
            lastMessageSnippet: lastMsg.length > 36 ? `${lastMsg.substring(0, 36)}...` : lastMsg || 'Opened channel pipeline...',
            status,
            assignedAdvisorEmail: session?.assignedAdvisorEmail,
            assignedAdvisorName: session?.assignedAdvisorName,
            isLockedByOther,
            isLockedByMe,
            isTyping
          };
        });
      }),

      currentSession: computed<SupportSessionSummary | null>(() => {
        const activeEmail = store.selectedUserEmail();
        if (!activeEmail) return null;
        return store.sessionsMap()[activeEmail.toLowerCase()] || null;
      }),

      isCurrentSessionLockedByOther: computed<boolean>(() => {
        const activeEmail = store.selectedUserEmail();
        if (!activeEmail) return false;
        const session = store.sessionsMap()[activeEmail.toLowerCase()];
        if (!session || session.status !== 'ENGAGED') return false;

        const currentAdvisorEmail = (authService.currentUserProfile()?.email || '').trim().toLowerCase();
        const assignedEmail = (session.assignedAdvisorEmail || '').trim().toLowerCase();
        return currentAdvisorEmail === '' || (assignedEmail !== '' && assignedEmail !== currentAdvisorEmail);
      }),

      isCurrentSessionLockedByMe: computed<boolean>(() => {
        const activeEmail = store.selectedUserEmail();
        if (!activeEmail) return false;
        const session = store.sessionsMap()[activeEmail.toLowerCase()];
        if (!session || session.status !== 'ENGAGED') return false;

        const currentAdvisorEmail = (authService.currentUserProfile()?.email || '').trim().toLowerCase();
        const assignedEmail = (session.assignedAdvisorEmail || '').trim().toLowerCase();
        return currentAdvisorEmail !== '' && assignedEmail === currentAdvisorEmail;
      }),

      activeMessageStream: computed<TransmittedMessageView[]>(() => {
        const activeEmail = store.selectedUserEmail();
        if (!activeEmail) return [];

        const session = store.usersMap()[activeEmail.toLowerCase()];
        if (!session) return [];

        return session.messages.map((msg, index) => ({
          id: `${activeEmail.toLowerCase()}_${msg.timestamp.getTime()}_${index}`,
          senderName: session.name,
          isAgentSender: msg.isAgent,
          text: msg.message,
          timestamp: msg.timestamp
        }));
      })
    };
  }),

  withMethods((store) => {
    let hubConnection: HubConnection | null = null;
    const authService = inject(AuthService);
    const chatService = inject(ChatService);

    return {
      initSignalR(): void {
        const token = authService.appToken();
        if (!token) return;

        patchState(store, { connectionStatus: 'Connecting' });

        hubConnection = new HubConnectionBuilder()
          .withUrl(`${environment.apiUrl}/support-hub`, {
            accessTokenFactory: () => token
          })
          .withAutomaticReconnect()
          .build();

        // 1. Event: Initial state load of all active sessions
        hubConnection.on('ActiveSessionsLoaded', (sessions: any[]) => {
          if (!Array.isArray(sessions)) return;
          patchState(store, (state) => {
            const nextSessions = { ...state.sessionsMap };
            const nextUsers = { ...state.usersMap };

            for (const s of sessions) {
              const email = (s.investorEmail || s.clientEmail || '').trim().toLowerCase();
              if (!email) continue;

              nextSessions[email] = {
                investorEmail: email,
                investorName: s.investorName || s.clientName || email,
                status: s.status || 'UNASSIGNED',
                assignedAdvisorEmail: s.assignedAdvisorEmail || null,
                assignedAdvisorName: s.assignedAdvisorName || null,
                assignedAdvisorLicense: s.assignedAdvisorLicense || null,
                openedAt: s.openedAt ? new Date(s.openedAt) : new Date(),
                engagedAt: s.engagedAt ? new Date(s.engagedAt) : null,
                lastActivityAt: s.lastActivityAt ? new Date(s.lastActivityAt) : new Date(),
                isOnline: s.isOnline ?? true,
                unreadCountByAdvisor: s.unreadCountByAdvisor ?? 0
              };

              if (!nextUsers[email]) {
                nextUsers[email] = {
                  email,
                  name: s.investorName || s.clientName || email,
                  messages: [],
                  isOnline: s.isOnline ?? true
                };
              }
            }

            return { sessionsMap: nextSessions, usersMap: nextUsers };
          });
        });

        // 2. Event: Real-time advisor locking state changes
        hubConnection.on('InvestorEngagementChanged', (s: any) => {
          if (!s) return;
          const email = (s.investorEmail || s.clientEmail || '').trim().toLowerCase();
          if (!email) return;

          patchState(store, (state) => {
            const nextSessions = { ...state.sessionsMap };
            nextSessions[email] = {
              investorEmail: email,
              investorName: s.investorName || s.clientName || email,
              status: s.status || 'UNASSIGNED',
              assignedAdvisorEmail: s.assignedAdvisorEmail || null,
              assignedAdvisorName: s.assignedAdvisorName || null,
              assignedAdvisorLicense: s.assignedAdvisorLicense || null,
              openedAt: s.openedAt ? new Date(s.openedAt) : new Date(),
              engagedAt: s.engagedAt ? new Date(s.engagedAt) : null,
              lastActivityAt: s.lastActivityAt ? new Date(s.lastActivityAt) : new Date(),
              isOnline: s.isOnline ?? true,
              unreadCountByAdvisor: s.unreadCountByAdvisor ?? 0
            };
            return { sessionsMap: nextSessions };
          });
        });

        // 3. Event: Cross-advisor collision warning
        hubConnection.on('EngagementWarning', (warningText: string) => {
          patchState(store, { engagementWarning: warningText });
        });

        // 4. Event: Real-time typing status
        hubConnection.on('UserTyping', (senderEmail: string, senderName: string, isTyping: boolean) => {
          if (!senderEmail) return;
          const norm = senderEmail.trim().toLowerCase();
          patchState(store, (state) => ({
            typingMap: { ...state.typingMap, [norm]: isTyping }
          }));
        });

        // 5. Event: Investor status changes (online/offline)
        hubConnection.on('UserStatusChanged', (email: string, name: string, isOnline: boolean) => {
          if (!email) return;
          const normalizedEmail = email.trim().toLowerCase();

          patchState(store, (state) => {
            const currentMap = { ...state.usersMap };
            if (!currentMap[normalizedEmail]) {
              currentMap[normalizedEmail] = { email: normalizedEmail, name, messages: [], isOnline };
            } else {
              currentMap[normalizedEmail] = { ...currentMap[normalizedEmail], isOnline };
            }
            return { usersMap: currentMap };
          });
        });

        // 6. Event: Incoming messaging packet from mobile client
        hubConnection.on('ReceiveClientMessage', (email: string, name: string, payload: string) => {
          if (!email) return;
          const normalizedEmail = email.trim().toLowerCase();

          patchState(store, (state) => {
            const currentMap = { ...state.usersMap };
            if (!currentMap[normalizedEmail]) {
              currentMap[normalizedEmail] = { email: normalizedEmail, name, messages: [], isOnline: true };
            }
            
            currentMap[normalizedEmail].messages = [
              ...currentMap[normalizedEmail].messages,
              { isAgent: false, message: payload, timestamp: new Date() }
            ];

            return { usersMap: currentMap };
          });
        });

        // 7. Event: Server echoes back an agent reply
        hubConnection.on('ReceiveAgentMessage', (agentEmail: string, payload: string) => {
          // Handled via local optimistic updates and ChatUpdated notifications
        });

        hubConnection.on('ChatUpdated', (clientEmail: string) => {
          if (!clientEmail) return;
          const activeEmail = store.selectedUserEmail();
          if (activeEmail && activeEmail.toLowerCase() === clientEmail.trim().toLowerCase()) {
            this.loadActiveThreadStream(clientEmail);
          }
        });

        hubConnection.onreconnected(() => {
          patchState(store, { connectionStatus: 'Connected' });
          // Resync session list
          chatService.getActiveSessions().subscribe({
            next: (sessions) => {
              if (hubConnection && hubConnection.state === 'Connected') {
                hubConnection.invoke('GetActiveSessions').catch(() => {});
              }
            }
          });
        });

        hubConnection.start()
          .then(() => patchState(store, { connectionStatus: 'Connected' }))
          .catch(() => patchState(store, { connectionStatus: 'Faulted' }));
      },

      clearEngagementWarning(): void {
        patchState(store, { engagementWarning: null });
      },

      async claimSession(clientEmail: string, license?: string, forceTakeover: boolean = false): Promise<boolean> {
        if (!hubConnection || !clientEmail) return false;
        try {
          const res = await hubConnection.invoke('ClaimInvestorSession', clientEmail.trim().toLowerCase(), license, forceTakeover);
          if (res && res.success) {
            patchState(store, { engagementWarning: null });
            return true;
          } else if (res && res.message) {
            patchState(store, { engagementWarning: res.message });
            return false;
          }
          return false;
        } catch (err: any) {
          console.error('[CLAIM_SESSION_FAULT]', err);
          return false;
        }
      },

      async releaseSession(clientEmail: string): Promise<boolean> {
        if (!hubConnection || !clientEmail) return false;
        try {
          const res = await hubConnection.invoke('ReleaseInvestorSession', clientEmail.trim().toLowerCase());
          return res && res.success;
        } catch (err: any) {
          console.error('[RELEASE_SESSION_FAULT]', err);
          return false;
        }
      },

      sendTypingNotification(targetEmail: string, isTyping: boolean): void {
        if (!hubConnection || !targetEmail || hubConnection.state !== 'Connected') return;
        hubConnection.invoke('SendTypingNotification', targetEmail.trim().toLowerCase(), isTyping)
          .catch(() => {});
      },

      loadActiveThreadStream(email: string): void {
        if (!email) return;
        const normalizedEmail = email.trim().toLowerCase();

        patchState(store, { selectedUserEmail: normalizedEmail });

        chatService.getChatHistoryLog(normalizedEmail).subscribe({
          next: (historyLog) => {
            patchState(store, (state) => {
              const currentMap = { ...state.usersMap };
              
              const formattedMessages = historyLog.map(log => ({
                isAgent: log.isAgentSender,
                message: log.text,
                timestamp: new Date(log.timestamp)
              }));

              if (currentMap[normalizedEmail]) {
                currentMap[normalizedEmail] = {
                  ...currentMap[normalizedEmail],
                  messages: formattedMessages
                };
              } else {
                currentMap[normalizedEmail] = {
                  email: normalizedEmail,
                  name: historyLog[0]?.senderName || normalizedEmail,
                  messages: formattedMessages,
                  isOnline: false
                };
              }

              return { usersMap: currentMap };
            });

            chatService.markThreadAsRead(normalizedEmail).subscribe();
          },
          error: (err) => console.error('[REST_TRANSCRIPT_FETCH_FAULT]', err)
        });
      },

      transmitAgentMessage(clientEmail: string, text: string): void {
        if (!hubConnection || !clientEmail) return;
        const normalizedEmail = clientEmail.trim().toLowerCase();

        // Optimistic UI push
        patchState(store, (state) => {
          const currentMap = { ...state.usersMap };
          if (currentMap[normalizedEmail]) {
            currentMap[normalizedEmail].messages = [
              ...currentMap[normalizedEmail].messages,
              { isAgent: true, message: text, timestamp: new Date() }
            ];
          }
          return { usersMap: currentMap };
        });

        hubConnection.invoke('SendAgentReplyToClient', normalizedEmail, text)
          .catch((err: any) => {
            console.error('[REPLY_TRANSMISSION_FAULT] Reverting...', err);
            this.loadActiveThreadStream(normalizedEmail);
          });
      },

      destroyStore(): void {
        if (hubConnection) {
          hubConnection.stop();
        }
      }
    };
  })
);
