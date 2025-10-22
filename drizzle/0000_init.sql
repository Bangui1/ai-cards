-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player TEXT,
  year TEXT,
  brand TEXT,
  card_number TEXT,
  psa_grade TEXT,
  certification_number TEXT,
  sport TEXT,
  image_url TEXT NOT NULL,
  text_embedding vector(768),
  image_embedding vector(512),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for vector similarity search
CREATE INDEX IF NOT EXISTS cards_text_embedding_idx ON cards USING ivfflat (text_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS cards_image_embedding_idx ON cards USING ivfflat (image_embedding vector_cosine_ops);

-- Create indexes for metadata filtering
CREATE INDEX IF NOT EXISTS cards_player_idx ON cards(player);
CREATE INDEX IF NOT EXISTS cards_year_idx ON cards(year);
CREATE INDEX IF NOT EXISTS cards_psa_grade_idx ON cards(psa_grade);


