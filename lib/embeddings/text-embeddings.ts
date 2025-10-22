import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

/**
 * Generate text embedding using Google's text-embedding-004 model
 * @param text Text to embed
 * @returns 768-dimensional embedding vector
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Create searchable text from card metadata
 * @param cardData Card metadata object
 * @returns Concatenated text for embedding
 */
export function createCardText(cardData: {
  player?: string;
  year?: string;
  brand?: string;
  cardNumber?: string;
  psaGrade?: string;
  certificationNumber?: string;
  sport?: string;
}): string {
  const parts = [
    cardData.player,
    cardData.year,
    cardData.brand,
    cardData.cardNumber,
    cardData.psaGrade,
    cardData.sport,
  ].filter(Boolean);

  return parts.join(' ');
}


