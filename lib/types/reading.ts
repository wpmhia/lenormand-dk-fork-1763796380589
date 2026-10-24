export interface SavedReading {
  id: string;
  timestamp: number;
  question: string;
  spreadType: string;
  cards: {
    id: number;
    name: string;
    position: string;
  }[];
  /** AI interpretation preview and full text. Absent for a classic-only saved reading. */
  interpretationPreview?: string;
  interpretationFull?: string;
  /** Whether an AI interpretation was generated for this reading. Older entries predate the flag. */
  hasAIInterpretation?: boolean;
  notes?: string;
}
