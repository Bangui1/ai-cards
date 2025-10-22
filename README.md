# NBA PSA Card RAG System

A Retrieval-Augmented Generation (RAG) powered application for analyzing, storing, and searching NBA PSA graded cards using multimodal embeddings (text + image).

## Quick Setup

1. Clone and install
   ```bash
   git clone <your-repo>
   cd nba-cards
   npm install
   ```

2. Create `.env.local`
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=your-bucket-name
   ```

3. Prepare PostgreSQL (Neon recommended). Ensure pgvector is enabled:
   ```sql
   -- Only if your provider doesn't auto-enable it
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

4. Push the schema
   ```bash
   npm run db:push
   ```

5. Start the dev server
   ```bash
   npm run dev
   ```

Open http://localhost:3000




