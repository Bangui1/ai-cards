# NBA PSA Card RAG System

A Retrieval-Augmented Generation (RAG) powered application for analyzing, storing, and searching NBA PSA graded cards using multimodal embeddings (text + image).

## Features

- **Card Analysis & Validation**: Upload NBA PSA card images and extract metadata using Gemini vision
- **Multimodal Embeddings**: Generate text embeddings (Google text-embedding-004) and image embeddings (CLIP)
- **Hybrid Vector Search**: Search by text, image, or both with adjustable weights
- **Metadata Filtering**: Filter by player, year, brand, and PSA grade
- **RAG-Powered Chat**: Natural language chat interface that answers questions based only on your collection
- **PostgreSQL + pgvector**: Efficient vector similarity search with SQL filtering

## Architecture

- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Drizzle ORM
- **Storage**: AWS S3 for card images
- **AI Models**:
  - Google Gemini 2.5 Flash (card analysis & chat)
  - Google text-embedding-004 (768-dim text embeddings)
  - CLIP via transformers.js (512-dim image embeddings)

## Prerequisites

### 1. PostgreSQL with pgvector

Choose one of these options:

#### Option A: Neon (Recommended - Free Tier)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. pgvector is automatically enabled

#### Option B: Supabase (Free Tier)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Copy the connection string from Settings > Database

#### Option C: Local PostgreSQL
```bash
# Install PostgreSQL and pgvector
brew install postgresql pgvector  # macOS
# or
sudo apt-get install postgresql postgresql-contrib  # Ubuntu

# Enable pgvector
psql -d your_database -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 2. AWS S3 Setup

1. Go to [AWS Console](https://console.aws.amazon.com/s3/)
2. Create a new S3 bucket (e.g., `nba-cards-storage`)
3. Set bucket permissions (public read or use presigned URLs)
4. Create IAM user with S3 access:
   - Go to IAM > Users > Create User
   - Attach policy: `AmazonS3FullAccess` (or create custom policy)
   - Generate access keys

### 3. Google AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create or select a project
3. Generate API key
4. Enable both Gemini and Embedding APIs

## Installation

### 1. Clone and Install Dependencies

```bash
git clone <your-repo>
cd nba-cards
npm install
```

### 2. Environment Variables

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
DATABASE_URL=postgresql://user:password@host:5432/dbname
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
```

### 3. Database Migration

Run the SQL migration to create tables and indexes:

```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL

# Run the migration
\i drizzle/0000_init.sql
```

Or use Drizzle Kit:

```bash
npx drizzle-kit push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### 1. Upload & Analyze Cards

1. Go to the home page
2. Upload an NBA PSA card image
3. Click "Analyze Card" to extract metadata
4. Click "Save to Collection" to store in database with embeddings

### 2. Search Collection

1. Navigate to "Search Collection"
2. Enter text query (e.g., "LeBron James rookie")
3. OR upload a similar card image for visual search
4. Apply filters (player, year, grade, brand)
5. Adjust text/image weights for hybrid search
6. View ranked results with similarity scores

### 3. Chat with Collection

1. Navigate to "Chat with Collection"
2. Ask natural language questions
3. AI retrieves relevant cards and answers based only on your collection
4. Examples:
   - "What Michael Jordan cards do I have?"
   - "Show me all PSA 10 graded cards"
   - "Find rookie cards from the 1990s"

## Database Schema

```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player TEXT,
  year TEXT,
  brand TEXT,
  card_number TEXT,
  psa_grade TEXT,
  certification_number TEXT,
  sport TEXT,
  image_url TEXT NOT NULL,
  text_embedding vector(768),      -- Google text-embedding-004
  image_embedding vector(512),     -- CLIP embeddings
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vector similarity indexes
CREATE INDEX cards_text_embedding_idx ON cards 
  USING ivfflat (text_embedding vector_cosine_ops);
  
CREATE INDEX cards_image_embedding_idx ON cards 
  USING ivfflat (image_embedding vector_cosine_ops);
```

## API Routes

### POST `/api/cards`
Upload and store a new card with embeddings

**Request:**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "cardId": "uuid",
  "card": { ... }
}
```

### POST `/api/search`
Hybrid vector similarity search

**Request:**
```json
{
  "textQuery": "LeBron James rookie",
  "imageQuery": "data:image/jpeg;base64,...",
  "filters": {
    "player": "LeBron",
    "year": "2003",
    "gradeMin": 9,
    "gradeMax": 10
  },
  "weights": {
    "text": 0.5,
    "image": 0.5
  },
  "limit": 10
}
```

### POST `/api/chat`
RAG-powered conversational interface

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "What Jordan cards do I have?" }
  ]
}
```

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL + pgvector** - Vector database
- **AWS S3** - Image storage
- **Google Gemini** - Card analysis & chat
- **Google Embeddings** - Text embeddings (768-dim)
- **Transformers.js** - CLIP image embeddings (512-dim)
- **Vercel AI SDK** - Streaming chat responses

## Performance Notes

- **CLIP model**: First load downloads ~500MB model (cached afterward)
- **Text embeddings**: ~$0.00001 per card via Google API
- **Image embeddings**: Free (runs serverless with transformers.js)
- **Vector search**: Sub-100ms for thousands of cards

## Troubleshooting

### "pgvector extension not found"
- Ensure pgvector is installed and enabled in your PostgreSQL database
- Run: `CREATE EXTENSION IF NOT EXISTS vector;`

### "AWS S3 access denied"
- Check IAM user has S3 permissions
- Verify AWS credentials in `.env.local`
- Ensure bucket policy allows uploads

### "CLIP model download timeout"
- Increase serverless function timeout (Vercel: 60s for Pro)
- Or preload model during build

## License

MIT


