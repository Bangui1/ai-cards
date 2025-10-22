import { streamText, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { db } from '@/db';
import { cards } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { generateTextEmbedding } from '@/lib/embeddings/text-embeddings';

// Extract plain text from UI/Core message content per Vercel AI SDK
function extractTextFromMessage(message: any): string {
  const content = message?.content;
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .filter((part: any) => part && part.type === 'text' && typeof part.text === 'string')
      .map((part: any) => part.text)
      .join(' ');
  }
  if (Array.isArray(message?.parts)) {
    return message.parts
      .filter((part: any) => part && part.type === 'text' && typeof part.text === 'string')
      .map((part: any) => part.text)
      .join(' ');
  }
  return '';
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    // Get the last user message and extract text
    const lastMessage = messages[messages.length - 1];
    const userQuery = extractTextFromMessage(lastMessage).trim();

    if (!userQuery) {
      return new Response('No valid text content in message', { status: 400 });
    }

    // Step 1: Retrieve relevant cards using RAG
    const queryEmbedding = await generateTextEmbedding(userQuery);

    // Search for top 5 most relevant cards
    const retrievalQuery = sql`
      SELECT 
        id,
        player,
        year,
        brand,
        card_number as "cardNumber",
        psa_grade as "psaGrade",
        certification_number as "certificationNumber",
        sport,
        image_url as "imageUrl",
        1 - (text_embedding <=> ${JSON.stringify(queryEmbedding)}) as similarity
      FROM cards
      WHERE text_embedding IS NOT NULL
      ORDER BY text_embedding <=> ${JSON.stringify(queryEmbedding)}
      LIMIT 5
    `;

    const retrievedCards = await db.execute<{
      id: string;
      player: string;
      year: string;
      brand: string;
      cardNumber: string;
      psaGrade: string;
      certificationNumber: string;
      sport: string;
      imageUrl: string;
      similarity: number;
    }>(retrievalQuery);

    // Step 2: Build context from retrieved cards
    let context = '';
    
    if (retrievedCards.length > 0) {
      context = 'Here are the relevant NBA cards from the collection:\n\n';
      retrievedCards.forEach((card: any, index: number) => {
        context += `Card ${index + 1}:\n`;
        context += `- Player: ${card.player || 'Unknown'}\n`;
        context += `- Year: ${card.year || 'Unknown'}\n`;
        context += `- Brand: ${card.brand || 'Unknown'}\n`;
        context += `- Card Number: ${card.cardNumber || 'Unknown'}\n`;
        context += `- PSA Grade: ${card.psaGrade || 'Unknown'}\n`;
        context += `- Certification: ${card.certificationNumber || 'N/A'}\n`;
        context += `- Similarity Score: ${(parseFloat(card.similarity) * 100).toFixed(1)}%\n\n`;
      });
    } else {
      context = 'No relevant cards found in the collection.';
    }

    // Step 3: Create system prompt with constraints
    const systemPrompt = `You are a helpful assistant for an NBA PSA card collection. 

IMPORTANT RULES:
1. You can ONLY answer questions based on the cards provided in the context below
2. If the user asks about cards that are NOT in the context, politely tell them those cards are not in the collection
3. Do not make up or infer information about cards that are not explicitly mentioned
4. Be concise and helpful
5. If asked about cards you don't have information about, suggest what cards ARE in the collection

${context}`;

    // Step 4: Stream response using Gemini
    const result = streamText({
      model: google('gemini-2.0-flash-exp'),
      system: systemPrompt,
      messages: convertToModelMessages(messages),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in chat:', error);
    return new Response('Failed to process chat request', { status: 500 });
  }
}


