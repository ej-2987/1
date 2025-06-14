
import type { Chat } from '@google/genai';
import { CHARACTER_ROLES } from './constants';

export interface CaseDetails {
  overview: string;
  issues: string[];
  plan: string[];
}

export type CharacterRole = typeof CHARACTER_ROLES[keyof typeof CHARACTER_ROLES];

export interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export type ChatHistory = Message[];

export type ChatHistories = {
  [key in CharacterRole]: ChatHistory;
};

export type SummarizedLogs = {
  [key in CharacterRole]: string;
};

export type GeminiChats = {
  [key in CharacterRole]: Chat | null;
};

export interface GenerateContentResponseText {
    text: string;
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}
export interface GroundingChunk {
  web?: GroundingChunkWeb;
  retrievedContext?: object; // or a more specific type if known
  // other potential types for grounding chunks
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  // other grounding metadata fields if any
}
export interface Candidate {
  groundingMetadata?: GroundingMetadata;
  // other candidate fields
}
export interface GenerateContentResponseWithGrounding {
  text: string; // Assuming text is still directly available
  candidates?: Candidate[];
  // other fields from GenerateContentResponse
}
