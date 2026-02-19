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
  interpretationPreview: string;
  interpretationFull: string;
  notes?: string;
}
