import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Session, Message } from './storage';

export class ExportService {
  /**
   * Export conversation as text file
   */
  static async exportAsText(session: Session): Promise<void> {
    const content = this.formatAsText(session);
    const fileName = `${session.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.txt`;
    const fileUri = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, content);
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Share Conversation',
      });
    }
  }

  /**
   * Export conversation as JSON
   */
  static async exportAsJSON(session: Session): Promise<void> {
    const content = JSON.stringify(session, null, 2);
    const fileName = `${session.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
    const fileUri = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, content);
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Conversation Data',
      });
    }
  }

  /**
   * Export conversation as Markdown
   */
  static async exportAsMarkdown(session: Session): Promise<void> {
    const content = this.formatAsMarkdown(session);
    const fileName = `${session.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.md`;
    const fileUri = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, content);
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/markdown',
        dialogTitle: 'Share Conversation',
      });
    }
  }

  /**
   * Import conversation from JSON file
   */
  static async importFromJSON(): Promise<Session | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const content = await FileSystem.readAsStringAsync(result.uri);
        const session = JSON.parse(content) as Session;
        
        // Convert date strings back to Date objects
        session.createdAt = new Date(session.createdAt);
        session.updatedAt = new Date(session.updatedAt);
        session.messages = session.messages.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));

        return session;
      }
    } catch (error) {
      console.error('Error importing conversation:', error);
    }

    return null;
  }

  /**
   * Share text directly without file
   */
  static async shareText(text: string, title: string = 'Share'): Promise<void> {
    if (await Sharing.isAvailableAsync()) {
      // Create temporary file for sharing
      const fileName = `share_${Date.now()}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, text);
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: title,
      });
      
      // Clean up temporary file
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  }

  /**
   * Format session as plain text
   */
  private static formatAsText(session: Session): string {
    let content = `Conversation: ${session.title}\n`;
    content += `Date: ${session.createdAt.toLocaleDateString()}\n`;
    content += `${'='.repeat(50)}\n\n`;

    session.messages.forEach(message => {
      const role = message.role === 'user' ? 'You' : 'Assistant';
      const time = new Date(message.timestamp).toLocaleTimeString();
      content += `[${time}] ${role}:\n${message.content}\n\n`;
    });

    return content;
  }

  /**
   * Format session as Markdown
   */
  private static formatAsMarkdown(session: Session): string {
    let content = `# ${session.title}\n\n`;
    content += `> *Created: ${session.createdAt.toLocaleDateString()}*\n\n`;
    content += `---\n\n`;

    session.messages.forEach(message => {
      const role = message.role === 'user' ? '👤 You' : '🤖 Assistant';
      const time = new Date(message.timestamp).toLocaleTimeString();
      
      content += `### ${role} *(${time})*\n\n`;
      content += `${message.content}\n\n`;
      content += `---\n\n`;
    });

    return content;
  }

  /**
   * Generate shareable summary of conversation
   */
  static generateShareableSummary(session: Session): string {
    const messageCount = session.messages.length;
    const wordCount = session.messages.reduce((acc, m) => acc + m.content.split(' ').length, 0);
    const duration = session.updatedAt.getTime() - session.createdAt.getTime();
    const durationMinutes = Math.round(duration / 60000);

    let summary = `📱 AI Chat Conversation\n\n`;
    summary += `💬 "${session.title}"\n`;
    summary += `📊 ${messageCount} messages | ${wordCount} words\n`;
    summary += `⏱️ ${durationMinutes} minutes\n\n`;
    
    // Add first and last message preview
    if (session.messages.length > 0) {
      const firstUserMessage = session.messages.find(m => m.role === 'user');
      if (firstUserMessage) {
        summary += `First question: "${firstUserMessage.content.slice(0, 100)}${firstUserMessage.content.length > 100 ? '...' : ''}"\n`;
      }
    }

    return summary;
  }
}