import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { AuthService } from '../services/auth.service';
import { ChatService } from '../services/chat.service';

export interface ActiveUserSession {
  email: string;
  name: string;
  messages: Array<{ isAgent: boolean; message: string; timestamp: Date }>;
  isOnline: boolean;
}

export interface AgentChatState {
  usersMap: Record<string, ActiveUserSession>;
  selectedUserEmail: string | null;
  connectionStatus: 'Disconnected' | 'Connecting' | 'Connected' | 'Faulted';
}

const initialState: AgentChatState = {
  usersMap: {},
  selectedUserEmail: null,
  connectionStatus: 'Disconnected'
};

export interface SupportThreadView {
  email: string;
  clientName: string;
  isOnline: boolean;
  lastMessageSnippet: string;
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
  
  withComputed((store) => ({
    activeThreads: computed<SupportThreadView[]>(() => {
      return Object.values(store.usersMap()).map((user) => {
        const hasMessages = user.messages.length > 0;
        const lastMsg = hasMessages ? user.messages[user.messages.length - 1].message : '';
        return {
          email: user.email,
          clientName: user.name,
          isOnline: user.isOnline,
          lastMessageSnippet: lastMsg.length > 36 ? `${lastMsg.substring(0, 36)}...` : lastMsg || 'Opened channel pipeline...'
        };
      });
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
  })),

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
          .withUrl('https://periodically-emails-whereas-evans.trycloudflare.com/support-hub', {
            accessTokenFactory: () => token
          })
          .withAutomaticReconnect()
          .build();

        // 1. Event: User status changes or joins channel
        hubConnection.on('UserStatusChanged', (email: string, name: string, isOnline: boolean) => {
          if (!email) return;
          const normalizedEmail = email.trim().toLowerCase(); // ✅ Normalize case

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

        // 2. Event: Incoming messaging packet from mobile client
        hubConnection.on('ReceiveClientMessage', (email: string, name: string, payload: string) => {
          if (!email) return;
          const normalizedEmail = email.trim().toLowerCase(); // ✅ Normalize case

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

        // 3. Event: Server echoes back an agent reply
        hubConnection.on('ReceiveAgentMessage', (agentEmail: string, payload: string) => {
          // Handled via local optimistic updates, hooks into synchronized tabs if multi-agent
        });

        hubConnection.start()
          .then(() => patchState(store, { connectionStatus: 'Connected' }))
          .catch(() => patchState(store, { connectionStatus: 'Faulted' }));
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
                  name: historyLog[0]?.senderName || 'System User',
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

        // Optimistic UI push matching lowercase storage key bounds
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