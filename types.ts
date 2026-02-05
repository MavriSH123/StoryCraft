
export enum SceneStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in-progress',
  DONE = 'done'
}

export interface Character {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  status: SceneStatus;
  characterIds: string[];
}

export interface Chapter {
  id: string;
  title: string;
  goalChars: number;
  currentChars: number;
  scenes: Scene[];
}

export interface WorldBlock {
  id: string;
  title: string;
  content: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  characters: Character[];
  chapters: Chapter[];
  worldBlocks: WorldBlock[];
  updatedAt: number;
}
