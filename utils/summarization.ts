import { Message } from './storage';
import { getOpenAI } from './openai';

export interface ConversationInsights {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  wordCount: number;
  questionCount: number;
}

export class SummarizationService {
  /**
   * Generate a comprehensive summary of the conversation
   */
  static async generateSummary(messages: Message[]): Promise<string> {
    if (messages.length === 0) return 'No messages to summarize';

    const openAI = getOpenAI();
    const conversationText = this.formatMessagesForSummary(messages);

    const prompt = `Please provide a concise summary of the following conversation:

${conversationText}

Summary:`;

    try {
      const response = await openAI.createChatCompletion([
        { role: 'system', content: 'You are a helpful assistant that creates clear, concise summaries.' },
        { role: 'user', content: prompt }
      ]);

      return response;
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Unable to generate summary';
    }
  }

  /**
   * Extract key insights from the conversation
   */
  static async extractInsights(messages: Message[]): Promise<ConversationInsights> {
    if (messages.length === 0) {
      return {
        summary: 'No messages to analyze',
        keyPoints: [],
        actionItems: [],
        topics: [],
        sentiment: 'neutral',
        wordCount: 0,
        questionCount: 0,
      };
    }

    const openAI = getOpenAI();
    const conversationText = this.formatMessagesForSummary(messages);

    const prompt = `Analyze the following conversation and provide insights in JSON format:

${conversationText}

Please provide the analysis in this exact JSON format:
{
  "summary": "A 2-3 sentence summary of the conversation",
  "keyPoints": ["Key point 1", "Key point 2", ...],
  "actionItems": ["Action item 1", "Action item 2", ...],
  "topics": ["Topic 1", "Topic 2", ...],
  "sentiment": "positive|neutral|negative|mixed"
}`;

    try {
      const response = await openAI.createChatCompletion([
        { role: 'system', content: 'You are an AI that analyzes conversations and extracts structured insights. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ]);

      // Parse JSON response
      const parsed = JSON.parse(response);
      
      // Calculate additional metrics
      const wordCount = messages.reduce((acc, m) => acc + m.content.split(' ').length, 0);
      const questionCount = messages.filter(m => m.role === 'user').length;

      return {
        ...parsed,
        wordCount,
        questionCount,
      };
    } catch (error) {
      console.error('Error extracting insights:', error);
      
      // Fallback to basic metrics
      const wordCount = messages.reduce((acc, m) => acc + m.content.split(' ').length, 0);
      const questionCount = messages.filter(m => m.role === 'user').length;

      return {
        summary: 'Unable to generate summary',
        keyPoints: [],
        actionItems: [],
        topics: [],
        sentiment: 'neutral',
        wordCount,
        questionCount,
      };
    }
  }

  /**
   * Generate a title for the conversation
   */
  static async generateTitle(messages: Message[]): Promise<string> {
    if (messages.length === 0) return 'New Chat';

    const openAI = getOpenAI();
    const firstMessages = messages.slice(0, 4);
    const conversationStart = this.formatMessagesForSummary(firstMessages);

    const prompt = `Based on this conversation beginning, generate a short, descriptive title (max 5 words):

${conversationStart}

Title:`;

    try {
      const response = await openAI.createChatCompletion([
        { role: 'system', content: 'You are a helpful assistant that creates concise titles. Respond with only the title, nothing else.' },
        { role: 'user', content: prompt }
      ]);

      return response.trim().replace(/^["']|["']$/g, '');
    } catch (error) {
      console.error('Error generating title:', error);
      return 'Chat';
    }
  }

  /**
   * Identify key questions from the conversation
   */
  static extractQuestions(messages: Message[]): string[] {
    return messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .filter(content => content.includes('?') || 
        content.toLowerCase().startsWith('how') ||
        content.toLowerCase().startsWith('what') ||
        content.toLowerCase().startsWith('why') ||
        content.toLowerCase().startsWith('when') ||
        content.toLowerCase().startsWith('where') ||
        content.toLowerCase().startsWith('who') ||
        content.toLowerCase().startsWith('can') ||
        content.toLowerCase().startsWith('could') ||
        content.toLowerCase().startsWith('would') ||
        content.toLowerCase().startsWith('should')
      );
  }

  /**
   * Generate chapter markers for long conversations
   */
  static async generateChapters(messages: Message[]): Promise<Array<{ index: number; title: string; summary: string }>> {
    if (messages.length < 10) return [];

    const chapters: Array<{ index: number; title: string; summary: string }> = [];
    const chunkSize = Math.ceil(messages.length / 5); // Divide into ~5 chapters

    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, Math.min(i + chunkSize, messages.length));
      const summary = await this.generateSummary(chunk);
      const title = await this.generateTitle(chunk);

      chapters.push({
        index: i,
        title,
        summary,
      });
    }

    return chapters;
  }

  /**
   * Format messages for summary generation
   */
  private static formatMessagesForSummary(messages: Message[]): string {
    return messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');
  }

  /**
   * Analyze conversation flow and patterns
   */
  static analyzeConversationFlow(messages: Message[]): {
    avgResponseLength: number;
    avgQuestionLength: number;
    topicChanges: number;
    conversationDepth: number;
  } {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    const avgQuestionLength = userMessages.length > 0
      ? userMessages.reduce((acc, m) => acc + m.content.length, 0) / userMessages.length
      : 0;

    const avgResponseLength = assistantMessages.length > 0
      ? assistantMessages.reduce((acc, m) => acc + m.content.length, 0) / assistantMessages.length
      : 0;

    // Simple topic change detection (significant context shifts)
    let topicChanges = 0;
    let lastTopicWords = new Set<string>();
    
    for (const msg of messages) {
      const currentWords = new Set(
        msg.content.toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 4)
      );
      
      const overlap = [...currentWords].filter(w => lastTopicWords.has(w)).length;
      if (lastTopicWords.size > 0 && overlap < currentWords.size * 0.3) {
        topicChanges++;
      }
      
      lastTopicWords = currentWords;
    }

    // Conversation depth (back-and-forth exchanges)
    const conversationDepth = Math.floor(messages.length / 2);

    return {
      avgResponseLength,
      avgQuestionLength,
      topicChanges,
      conversationDepth,
    };
  }
}