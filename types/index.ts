export interface PSACardData {
  isValid: boolean;
  error?: string;
  player?: string;
  year?: string;
  brand?: string;
  cardNumber?: string;
  psaGrade?: string;
  certificationNumber?: string;
  sport?: string;
}

export interface SearchQuery {
  textQuery?: string;
  imageQuery?: string; // base64 image
  filters?: {
    player?: string;
    year?: string;
    brand?: string;
    gradeMin?: number;
    gradeMax?: number;
  };
  weights?: {
    text: number;
    image: number;
  };
  limit?: number;
}

export interface SearchResult {
  id: string;
  player: string | null;
  year: string | null;
  brand: string | null;
  cardNumber: string | null;
  psaGrade: string | null;
  certificationNumber: string | null;
  sport: string | null;
  imageUrl: string;
  score: number;
  createdAt: Date | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  retrievedCards?: SearchResult[];
}


