export interface Sticker {
  prompt: string;
  concept: string;
  stickerText: string;
  description: string;
  characterType: string;
}

export interface Pack {
  id: string;
  timestamp: string;
  category: string;
  event?: string;
  artStyle?: string;
  stickers: Sticker[];
}

export interface CategoryInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  sampleIdeas: string[];
}

export interface EventInfo {
  id: string;
  name: string;
  emoji: string;
  badge: string;
  description: string;
  sampleIdeas: string[];
}

export interface ArtStyleInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  previewClass: string;
}

export interface GeneratorConfig {
  category: string;
  event?: string;
  artStyle?: string;
  stickerCount: number;
  customInstructions: string;
}

export interface DatabaseStatus {
  conceptsCount: number;
  promptsCount: number;
  packsCount: number;
  concepts: string[];
  packs: Pack[];
}

