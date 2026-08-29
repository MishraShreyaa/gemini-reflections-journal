export type AIInteractionMode = 'reflection' | 'summary' | 'brainstorm' | 'coaching';

export interface InteractionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: AIInteractionMode;
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  mode?: AIInteractionMode;
  tags?: string[];
  summary?: string;
  keyInsights?: string[];
  interactions: InteractionMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export interface GeminiReflectRequest {
  prompt: string;
  history?: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>;
  mode?: AIInteractionMode;
  contextContent?: string;
  entryTitle?: string;
}

export interface GeminiReflectResponse {
  reply: string;
  modelUsed: string;
  summary?: string;
  keyInsights?: string[];
}
