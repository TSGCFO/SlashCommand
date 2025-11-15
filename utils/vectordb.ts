import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, Session } from './storage';
import { getOpenAI } from './openai';

interface VectorDocument {
  id: string;
  sessionId: string;
  messageId: string;
  content: string;
  embedding: number[];
  timestamp: Date;
  metadata: {
    role: 'user' | 'assistant';
    sessionTitle: string;
  };
}

interface SearchResult {
  sessionId: string;
  messageId: string;
  content: string;
  score: number;
  sessionTitle: string;
  timestamp: Date;
}

const VECTOR_DB_KEY = '@vector_db';
const EMBEDDING_CACHE_KEY = '@embedding_cache';

export class VectorDatabase {
  private static documents: Map<string, VectorDocument> = new Map();
  private static embeddingCache: Map<string, number[]> = new Map();
  private static initialized = false;

  /**
   * Initialize the vector database
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load existing documents from storage
      const storedDocs = await AsyncStorage.getItem(VECTOR_DB_KEY);
      if (storedDocs) {
        const parsed = JSON.parse(storedDocs);
        this.documents = new Map(Object.entries(parsed));
      }

      // Load embedding cache
      const storedCache = await AsyncStorage.getItem(EMBEDDING_CACHE_KEY);
      if (storedCache) {
        const parsed = JSON.parse(storedCache);
        this.embeddingCache = new Map(Object.entries(parsed));
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing vector database:', error);
      this.initialized = true;
    }
  }

  /**
   * Add or update documents in the vector database
   */
  static async indexSession(session: Session): Promise<void> {
    await this.initialize();

    const openAI = getOpenAI();
    const newDocs: VectorDocument[] = [];

    for (const message of session.messages) {
      const docId = `${session.id}_${message.id}`;
      
      // Skip if already indexed and unchanged
      const existingDoc = this.documents.get(docId);
      if (existingDoc && existingDoc.content === message.content) {
        continue;
      }

      // Get or create embedding
      let embedding = this.embeddingCache.get(message.content);
      if (!embedding) {
        try {
          embedding = await openAI.createEmbedding(message.content);
          this.embeddingCache.set(message.content, embedding);
        } catch (error) {
          console.error('Error creating embedding:', error);
          continue;
        }
      }

      const doc: VectorDocument = {
        id: docId,
        sessionId: session.id,
        messageId: message.id,
        content: message.content,
        embedding,
        timestamp: message.timestamp,
        metadata: {
          role: message.role,
          sessionTitle: session.title,
        },
      };

      newDocs.push(doc);
      this.documents.set(docId, doc);
    }

    // Persist to storage
    await this.saveToStorage();
  }

  /**
   * Remove all documents for a session
   */
  static async removeSession(sessionId: string): Promise<void> {
    await this.initialize();

    // Remove all documents for this session
    const keysToRemove: string[] = [];
    for (const [key, doc] of this.documents) {
      if (doc.sessionId === sessionId) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.documents.delete(key));
    await this.saveToStorage();
  }

  /**
   * Perform semantic search across all documents
   */
  static async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    await this.initialize();

    if (this.documents.size === 0) {
      return [];
    }

    const openAI = getOpenAI();
    
    try {
      // Get query embedding
      const queryEmbedding = await openAI.createEmbedding(query);

      // Calculate cosine similarity with all documents
      const results: Array<{ doc: VectorDocument; score: number }> = [];
      
      for (const doc of this.documents.values()) {
        const score = this.cosineSimilarity(queryEmbedding, doc.embedding);
        results.push({ doc, score });
      }

      // Sort by score and return top results
      results.sort((a, b) => b.score - a.score);
      
      return results.slice(0, limit).map(({ doc, score }) => ({
        sessionId: doc.sessionId,
        messageId: doc.messageId,
        content: doc.content,
        score,
        sessionTitle: doc.metadata.sessionTitle,
        timestamp: doc.timestamp,
      }));
    } catch (error) {
      console.error('Error performing semantic search:', error);
      return [];
    }
  }

  /**
   * Find similar messages to a given message
   */
  static async findSimilar(messageContent: string, excludeSessionId?: string, limit: number = 5): Promise<SearchResult[]> {
    await this.initialize();

    const openAI = getOpenAI();
    
    try {
      // Get message embedding
      let embedding = this.embeddingCache.get(messageContent);
      if (!embedding) {
        embedding = await openAI.createEmbedding(messageContent);
      }

      // Find similar documents
      const results: Array<{ doc: VectorDocument; score: number }> = [];
      
      for (const doc of this.documents.values()) {
        // Skip messages from excluded session or exact matches
        if ((excludeSessionId && doc.sessionId === excludeSessionId) || doc.content === messageContent) {
          continue;
        }

        const score = this.cosineSimilarity(embedding, doc.embedding);
        if (score > 0.7) { // Threshold for similarity
          results.push({ doc, score });
        }
      }

      // Sort by score and return top results
      results.sort((a, b) => b.score - a.score);
      
      return results.slice(0, limit).map(({ doc, score }) => ({
        sessionId: doc.sessionId,
        messageId: doc.messageId,
        content: doc.content,
        score,
        sessionTitle: doc.metadata.sessionTitle,
        timestamp: doc.timestamp,
      }));
    } catch (error) {
      console.error('Error finding similar messages:', error);
      return [];
    }
  }

  /**
   * Get search suggestions based on query
   */
  static async getSuggestions(partialQuery: string, limit: number = 5): Promise<string[]> {
    await this.initialize();

    if (!partialQuery || partialQuery.length < 2) {
      return [];
    }

    const lowerQuery = partialQuery.toLowerCase();
    const suggestions = new Set<string>();

    // Extract keywords from documents
    for (const doc of this.documents.values()) {
      const words = doc.content.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.startsWith(lowerQuery) && word.length > 3) {
          suggestions.add(word);
          if (suggestions.size >= limit) break;
        }
      }
      if (suggestions.size >= limit) break;
    }

    return Array.from(suggestions);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private static cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      console.warn('Vector length mismatch');
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Save vector database to storage
   */
  private static async saveToStorage(): Promise<void> {
    try {
      // Convert Map to object for JSON serialization
      const docsObject: { [key: string]: VectorDocument } = {};
      for (const [key, value] of this.documents) {
        docsObject[key] = value;
      }
      await AsyncStorage.setItem(VECTOR_DB_KEY, JSON.stringify(docsObject));

      // Save embedding cache (limit size to prevent storage overflow)
      if (this.embeddingCache.size > 1000) {
        // Keep only the most recent 500 embeddings
        const entries = Array.from(this.embeddingCache.entries());
        this.embeddingCache = new Map(entries.slice(-500));
      }

      const cacheObject: { [key: string]: number[] } = {};
      for (const [key, value] of this.embeddingCache) {
        cacheObject[key] = value;
      }
      await AsyncStorage.setItem(EMBEDDING_CACHE_KEY, JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Error saving vector database:', error);
    }
  }

  /**
   * Clear the entire vector database
   */
  static async clear(): Promise<void> {
    this.documents.clear();
    this.embeddingCache.clear();
    await AsyncStorage.removeItem(VECTOR_DB_KEY);
    await AsyncStorage.removeItem(EMBEDDING_CACHE_KEY);
  }

  /**
   * Get statistics about the vector database
   */
  static getStats(): { documentCount: number; cacheSize: number; storageSize: number } {
    const storageSize = JSON.stringify(Array.from(this.documents.values())).length +
                       JSON.stringify(Array.from(this.embeddingCache.values())).length;
    
    return {
      documentCount: this.documents.size,
      cacheSize: this.embeddingCache.size,
      storageSize: Math.round(storageSize / 1024), // in KB
    };
  }
}