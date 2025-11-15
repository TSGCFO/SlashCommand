export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class OpenAIService {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-3.5-turbo';
  }

  async generateTitle(messages: { role: string; content: string }[]): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Generate a very short title (3-5 words) for this conversation. Only return the title, no quotes or punctuation.',
            },
            ...messages.slice(0, 2),
          ],
          max_tokens: 20,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || 'New Chat';
    } catch (error) {
      console.error('Error generating title:', error);
      return 'New Chat';
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    // For now, return a mock embedding since we need actual OpenAI API for real embeddings
    // In production, this would use: await this.client.embeddings.create({ model: 'text-embedding-3-small', input: text })
    
    // Create a deterministic mock embedding based on text content
    const mockEmbedding: number[] = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // Generate 256-dimensional mock embedding
    for (let i = 0; i < 256; i++) {
      let value = 0;
      for (let j = 0; j < words.length; j++) {
        const word = words[j];
        if (word.length > 0) {
          const charCode = word.charCodeAt(j % word.length);
          value += Math.sin(charCode * (i + 1)) * 0.1;
        }
      }
      mockEmbedding.push(Math.tanh(value));
    }
    
    return mockEmbedding;
  }

  async transcribeAudio(audioUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'recording.wav',
      } as any);
      formData.append('model', 'whisper-1');

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription error: ${response.status}`);
      }

      const data = await response.json();
      return data.text || '';
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  async *streamChatCompletion(
    messages: { role: string; content: string }[],
    onChunk?: (chunk: string) => void
  ): AsyncGenerator<string, void, unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const json = JSON.parse(data);
              const chunk = json.choices[0]?.delta?.content || '';
              if (chunk) {
                if (onChunk) onChunk(chunk);
                yield chunk;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  }
}

// Singleton instance
let openAIInstance: OpenAIService | null = null;

export const initOpenAI = (apiKey: string) => {
  openAIInstance = new OpenAIService({ apiKey });
  return openAIInstance;
};

export const getOpenAI = (): OpenAIService => {
  if (!openAIInstance) {
    throw new Error('OpenAI not initialized. Please set your API key in settings.');
  }
  return openAIInstance;
};