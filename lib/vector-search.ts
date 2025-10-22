/**
 * Calculate cosine similarity between two vectors
 * @param a First vector
 * @param b Second vector
 * @returns Cosine similarity score (0 to 1)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Normalize a score to 0-1 range
 * @param score Raw score
 * @param min Minimum possible score
 * @param max Maximum possible score
 * @returns Normalized score
 */
export function normalizeScore(score: number, min: number = -1, max: number = 1): number {
  return (score - min) / (max - min);
}

/**
 * Merge multiple scores with weights
 * @param scores Array of score objects with value and weight
 * @returns Weighted combined score
 */
export function mergeScores(scores: { value: number; weight: number }[]): number {
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = scores.reduce((sum, s) => sum + s.value * s.weight, 0);
  return weightedSum / totalWeight;
}

/**
 * Convert PostgreSQL vector string to number array
 * @param vectorString Vector string from database (e.g., "[0.1,0.2,0.3]")
 * @returns Number array
 */
export function parseVector(vectorString: string | null): number[] | null {
  if (!vectorString) return null;
  
  // Remove brackets and split by comma
  const cleaned = vectorString.replace(/[\[\]]/g, '');
  return cleaned.split(',').map(Number);
}

/**
 * Format number array to PostgreSQL vector string
 * @param vector Number array
 * @returns Vector string for database
 */
export function formatVector(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

