export interface TestQuestion {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  voice: string;
}

export enum GameState {
  START,
  LOADING_QUESTIONS,
  IN_PROGRESS,
  SHOWING_RESULTS,
  ERROR,
}