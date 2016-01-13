export type Patch = any;

export interface PatchMessage {
  patch: Patch;
}

export interface BoardMessage {
  board: Board;
}

export type Message = PatchMessage | BoardMessage;

export interface Note {
  title?: string;
  content?: string;
  posX?: number;
  posY?: number;
}

export interface Board {
  name?: string;
  color?: string;
  notes?: Dictionary<Note>;
}
