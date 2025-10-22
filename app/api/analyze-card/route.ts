import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const PSACardSchema = z.object({
  isValid: z.boolean().describe('Whether this is a valid NBA PSA graded card'),
  error: z.string().optional().describe('Error message if the card is not valid'),
  player: z.string().optional().describe('Player name on the card'),
  year: z.string().optional().describe('Year of the card'),
  brand: z.string().optional().describe('Card brand (e.g., Topps, Upper Deck, Panini)'),
  cardNumber: z.string().optional().describe('Card number from the set'),
  psaGrade: z.string().optional().describe('PSA grade (e.g., PSA 10, PSA 9)'),
  certificationNumber: z.string().optional().describe('PSA certification number'),
  sport: z.string().optional().describe('Sport (should be Basketball/NBA)'),
});

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { isValid: false, error: 'No image provided' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { isValid: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const model = google('gemini-2.5-flash');

    const { object } = await generateObject({
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

If the image is NOT a valid NBA PSA graded card, set isValid to false and provide a clear error message explaining why (e.g., "Not a PSA graded card", "Not an NBA card", "Image is unclear or not a sports card").

If the image IS a valid NBA PSA graded card, set isValid to true and extract the following information:
- Player name
- Year of the card
- Card brand/manufacturer
- Card number
- PSA grade (the numerical grade like "PSA 10" or "PSA 9")
- PSA certification number (if visible)
- Sport (should be Basketball or NBA)

Be thorough in your validation. If you cannot clearly see PSA grading elements or NBA/basketball content, mark it as invalid.`,
            },
            {
              type: 'image',
              image: base64Data,
            },
          ],
        },
      ],
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error('Error analyzing card:', error);
    return NextResponse.json(
      {
        isValid: false,
        error: 'Failed to analyze card. Please try again.',
      },
      { status: 500 }
    );
  }
}

