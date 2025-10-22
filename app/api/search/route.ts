import { NextResponse } from 'next/server';
import { db } from '@/db';
import { cards } from '@/db/schema';
import { sql, and, or, ilike, gte, lte } from 'drizzle-orm';
import { generateTextEmbedding } from '@/lib/embeddings/text-embeddings';
import { generateImageEmbedding } from '@/lib/embeddings/image-embeddings';
import { mergeScores, parseVector, cosineSimilarity } from '@/lib/vector-search';
import type { SearchQuery, SearchResult } from '@/types';

export async function POST(req: Request) {
  try {
    const body: SearchQuery = await req.json();
    const {
      textQuery,
      imageQuery,
      filters = {},
      weights = { text: 0.5, image: 0.5 },
      limit = 10,
    } = body;

    // Build metadata filters
    const whereConditions = [];
    
    if (filters.player) {
      whereConditions.push(ilike(cards.player, `%${filters.player}%`));
    }
    
    if (filters.year) {
      whereConditions.push(sql`${cards.year} = ${filters.year}`);
    }
    
    if (filters.brand) {
      whereConditions.push(ilike(cards.brand, `%${filters.brand}%`));
    }

    // Extract PSA grade number for filtering
    if (filters.gradeMin !== undefined || filters.gradeMax !== undefined) {
      // PSA grades are like "PSA 10", "PSA 9.5", etc.
      // We'll filter on the numeric part
      if (filters.gradeMin !== undefined) {
        whereConditions.push(
          sql`CAST(REGEXP_REPLACE(${cards.psaGrade}, '[^0-9.]', '', 'g') AS FLOAT) >= ${filters.gradeMin}`
        );
      }
      if (filters.gradeMax !== undefined) {
        whereConditions.push(
          sql`CAST(REGEXP_REPLACE(${cards.psaGrade}, '[^0-9.]', '', 'g') AS FLOAT) <= ${filters.gradeMax}`
        );
      }
    }

    // Generate query embeddings
    let textEmbedding: number[] | null = null;
    let imageEmbedding: number[] | null = null;

    if (textQuery) {
      textEmbedding = await generateTextEmbedding(textQuery);
    }

    if (imageQuery) {
      imageEmbedding = await generateImageEmbedding(imageQuery);
    }

    // If no embeddings, just do metadata filtering
    if (!textEmbedding && !imageEmbedding) {
      const results = await db
        .select()
        .from(cards)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .limit(limit);

      return NextResponse.json({
        results: results.map((card) => ({
          ...card,
          score: 1.0, // No similarity score, just metadata match
        })),
      });
    }

    // Perform vector similarity search with hybrid scoring
    const query = sql`
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
        created_at as "createdAt",
        text_embedding,
        image_embedding,
        ${textEmbedding ? sql`1 - (text_embedding <=> ${JSON.stringify(textEmbedding)})` : sql`NULL`} as text_similarity,
        ${imageEmbedding ? sql`1 - (image_embedding <=> ${JSON.stringify(imageEmbedding)})` : sql`NULL`} as image_similarity
      FROM cards
      ${whereConditions.length > 0 ? sql`WHERE ${and(...whereConditions)}` : sql``}
      ORDER BY 
        ${
          textEmbedding && imageEmbedding
            ? sql`(
                COALESCE(1 - (text_embedding <=> ${JSON.stringify(textEmbedding)}), 0) * ${weights.text} +
                COALESCE(1 - (image_embedding <=> ${JSON.stringify(imageEmbedding)}), 0) * ${weights.image}
              ) DESC`
            : textEmbedding
            ? sql`text_embedding <=> ${JSON.stringify(textEmbedding)} ASC`
            : sql`image_embedding <=> ${JSON.stringify(imageEmbedding)} ASC`
        }
      LIMIT ${limit}
    `;

    const results = await db.execute(query);

    // Calculate final scores
    // postgres.RowList is array-like, use it directly
    const scoredResults = results.map((row: any) => {
      const scores = [];
      
      if (textEmbedding && row.text_similarity !== null) {
        scores.push({ value: parseFloat(row.text_similarity), weight: weights.text });
      }
      
      if (imageEmbedding && row.image_similarity !== null) {
        scores.push({ value: parseFloat(row.image_similarity), weight: weights.image });
      }

      const finalScore = scores.length > 0 ? mergeScores(scores) : 1.0;

      return {
        id: row.id,
        player: row.player,
        year: row.year,
        brand: row.brand,
        cardNumber: row.cardNumber,
        psaGrade: row.psaGrade,
        certificationNumber: row.certificationNumber,
        sport: row.sport,
        imageUrl: row.imageUrl,
        createdAt: row.createdAt,
        score: finalScore,
      };
    });

    return NextResponse.json({ results: scoredResults });
  } catch (error) {
    console.error('Error searching cards:', error);
    return NextResponse.json(
      { error: 'Failed to search cards. Please try again.' },
      { status: 500 }
    );
  }
}


