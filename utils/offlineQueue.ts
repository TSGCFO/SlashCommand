import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Message } from './storage';

const QUEUE_KEY = '@offline_queue';
const SYNC_STATUS_KEY = '@sync_status';

export interface QueuedMessage {
  id: string;
  sessionId: string;
  message: Message;
  timestamp: Date;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

export interface SyncStatus {
  lastSync: Date | null;
  pendingCount: number;
  failedCount: number;
  isOnline: boolean;
  isSyncing: boolean;
}

export class OfflineQueueService {
  private static queue: QueuedMessage[] = [];
  private static isOnline: boolean = true;
  private static syncListeners: Set<(status: SyncStatus) => void> = new Set();
  private static syncTimer: NodeJS.Timeout | null = null;
  private static initialized: boolean = false;

  /**
   * Initialize the offline queue service
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load existing queue from storage
      const storedQueue = await AsyncStorage.getItem(QUEUE_KEY);
      if (storedQueue) {
        this.queue = JSON.parse(storedQueue).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }

      // Set up network listener
      NetInfo.addEventListener(state => {
        const wasOffline = !this.isOnline;
        this.isOnline = state.isConnected ?? false;

        if (wasOffline && this.isOnline) {
          // Just came online - trigger sync
          this.syncQueue();
        }

        this.notifyListeners();
      });

      // Get initial network state
      const netState = await NetInfo.fetch();
      this.isOnline = netState.isConnected ?? false;

      // Start periodic sync (every 30 seconds when online)
      this.startPeriodicSync();

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing offline queue:', error);
      this.initialized = true;
    }
  }

  /**
   * Add a message to the offline queue
   */
  static async queueMessage(sessionId: string, message: Message): Promise<void> {
    const queuedMessage: QueuedMessage = {
      id: `${sessionId}_${message.id}_${Date.now()}`,
      sessionId,
      message,
      timestamp: new Date(),
      retryCount: 0,
      status: 'pending',
    };

    this.queue.push(queuedMessage);
    await this.saveQueue();
    this.notifyListeners();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncQueue();
    }
  }

  /**
   * Get all queued messages for a session
   */
  static getQueuedMessages(sessionId: string): QueuedMessage[] {
    return this.queue.filter(q => q.sessionId === sessionId && q.status !== 'failed');
  }

  /**
   * Get current sync status
   */
  static async getSyncStatus(): Promise<SyncStatus> {
    const pendingCount = this.queue.filter(q => q.status === 'pending').length;
    const failedCount = this.queue.filter(q => q.status === 'failed').length;

    const storedStatus = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    const lastSync = storedStatus ? new Date(JSON.parse(storedStatus).lastSync) : null;

    return {
      lastSync,
      pendingCount,
      failedCount,
      isOnline: this.isOnline,
      isSyncing: this.queue.some(q => q.status === 'syncing'),
    };
  }

  /**
   * Subscribe to sync status updates
   */
  static subscribeToSyncStatus(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  /**
   * Sync all pending messages
   */
  static async syncQueue(): Promise<void> {
    if (!this.isOnline) return;

    const pendingMessages = this.queue.filter(q => q.status === 'pending');
    if (pendingMessages.length === 0) return;

    // Mark messages as syncing
    pendingMessages.forEach(msg => {
      msg.status = 'syncing';
    });
    this.notifyListeners();

    for (const queuedMessage of pendingMessages) {
      try {
        // Attempt to send the message
        await this.sendMessage(queuedMessage);
        
        // Remove from queue if successful
        this.queue = this.queue.filter(q => q.id !== queuedMessage.id);
      } catch (error) {
        // Mark as failed after too many retries
        queuedMessage.retryCount++;
        if (queuedMessage.retryCount >= 3) {
          queuedMessage.status = 'failed';
          queuedMessage.error = error instanceof Error ? error.message : 'Unknown error';
        } else {
          queuedMessage.status = 'pending';
        }
      }
    }

    // Update last sync time
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
      lastSync: new Date().toISOString(),
    }));

    await this.saveQueue();
    this.notifyListeners();
  }

  /**
   * Send a queued message (implementation would depend on your backend)
   */
  private static async sendMessage(queuedMessage: QueuedMessage): Promise<void> {
    // This is where you would implement the actual API call
    // For now, we'll simulate with a timeout
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate for demo
          resolve();
        } else {
          reject(new Error('Network request failed'));
        }
      }, 1000);
    });
  }

  /**
   * Retry failed messages
   */
  static async retryFailed(): Promise<void> {
    const failedMessages = this.queue.filter(q => q.status === 'failed');
    
    failedMessages.forEach(msg => {
      msg.status = 'pending';
      msg.retryCount = 0;
      msg.error = undefined;
    });

    await this.saveQueue();
    this.syncQueue();
  }

  /**
   * Clear all queued messages
   */
  static async clearQueue(): Promise<void> {
    this.queue = [];
    await AsyncStorage.removeItem(QUEUE_KEY);
    this.notifyListeners();
  }

  /**
   * Remove specific message from queue
   */
  static async removeFromQueue(messageId: string): Promise<void> {
    this.queue = this.queue.filter(q => q.id !== messageId);
    await this.saveQueue();
    this.notifyListeners();
  }

  /**
   * Start periodic sync timer
   */
  private static startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline) {
        this.syncQueue();
      }
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Save queue to storage
   */
  private static async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  /**
   * Notify all listeners of status change
   */
  private static async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.syncListeners.forEach(listener => listener(status));
  }

  /**
   * Get network status
   */
  static isNetworkOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Force offline mode (for testing)
   */
  static setOfflineMode(offline: boolean): void {
    this.isOnline = !offline;
    this.notifyListeners();
    
    if (this.isOnline) {
      this.syncQueue();
    }
  }
}