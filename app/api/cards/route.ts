import { NextResponse } from 'next/server';
import { db } from '@/db';
import { cards } from '@/db/schema';
import { uploadImageToS3, extractContentType } from '@/lib/s3-upload';
import { generateTextEmbedding, createCardText } from '@/lib/embeddings/text-embeddings';
import { generateImageEmbedding } from '@/lib/embeddings/image-embeddings';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const PSACardSchema = z.object({
  isValid: z.boolean(),
  error: z.string().optional(),
  player: z.string().optional(),
  year: z.string().optional(),
  brand: z.string().optional(),
  cardNumber: z.string().optional(),
  psaGrade: z.string().optional(),
  certificationNumber: z.string().optional(),
  sport: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Step 1: Validate and extract card data using existing logic
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const model = google('gemini-2.5-flash');

    const { object: cardData } = await generateObject({
      model,
      schema: PSACardSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert at analyzing PSA graded sports cards. Analyze this image and determine if it is a valid NBA PSA graded card.

VALIDATION RULES:
1. The card MUST be PSA graded (look for PSA holder/slab with PSA branding)
2. The card MUST be from the NBA or feature an NBA basketball player
3. The card should have visible PSA certification details

If the image is NOT a valid NBA PSA graded card, set isValid to false and provide a clear error message explaining why.

If the image IS a valid NBA PSA graded card, set isValid to true and extract the following information:
- Player name
- Year of the card
- Card brand/manufacturer
- Card number
- PSA grade (the numerical grade like "PSA 10" or "PSA 9")
- PSA certification number (if visible)
- Sport (should be Basketball or NBA)`,
            },
            {
              type: 'image',
              image: base64Data,
            },
          ],
        },
      ],
    });

    if (!cardData.isValid) {
      return NextResponse.json(
        { error: cardData.error || 'Invalid NBA PSA card' },
        { status: 400 }
      );
    }

    // Step 2: Upload image to S3 first (needed for image embedding)
    const contentType = extractContentType(image);
    const imageUrl = await uploadImageToS3(image, contentType);

    // Step 3: Generate text embedding from metadata
    const cardText = createCardText(cardData);
    const textEmbedding = await generateTextEmbedding(cardText);

    // Step 4: Generate image embedding using CLIP from S3 URL
    const imageEmbedding = await generateImageEmbedding(imageUrl);

    // Step 5: Store in database
    // Note: Drizzle ORM handles vector type conversion automatically
    const [newCard] = await db.insert(cards).values({
      player: cardData.player,
      year: cardData.year,
      brand: cardData.brand,
      cardNumber: cardData.cardNumber,
      psaGrade: cardData.psaGrade,
      certificationNumber: cardData.certificationNumber,
      sport: cardData.sport,
      imageUrl,
      textEmbedding: textEmbedding as any,
      imageEmbedding: imageEmbedding as any,
    }).returning();

    return NextResponse.json({
      success: true,
      cardId: newCard.id,
      card: {
        ...cardData,
        imageUrl,
      },
    });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json(
      { error: 'Failed to create card. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const allCards = await db.select({
      id: cards.id,
      player: cards.player,
      year: cards.year,
      brand: cards.brand,
      cardNumber: cards.cardNumber,
      psaGrade: cards.psaGrade,
      certificationNumber: cards.certificationNumber,
      sport: cards.sport,
      imageUrl: cards.imageUrl,
      createdAt: cards.createdAt,
    }).from(cards).orderBy(cards.createdAt);

    return NextResponse.json({ cards: allCards });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}


