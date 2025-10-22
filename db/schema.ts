import { pgTable, text, uuid, timestamp, vector } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  player: text('player'),
  year: text('year'),
  brand: text('brand'),
  cardNumber: text('card_number'),
  psaGrade: text('psa_grade'),
  certificationNumber: text('certification_number'),
  sport: text('sport'),
  imageUrl: text('image_url').notNull(),
  textEmbedding: vector('text_embedding', { dimensions: 768 }),
  imageEmbedding: vector('image_embedding', { dimensions: 512 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;


