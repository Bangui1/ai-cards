import { pipeline, env } from '@huggingface/transformers';

// Configure transformers to use local models (cached)
env.allowLocalModels = true;
env.allowRemoteModels = true;

let clipModel: any = null;

/**
 * Initialize CLIP model (lazy loading)
 */
async function getClipModel() {
  if (!clipModel) {
    clipModel = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32');
  }
  return clipModel;
}

/**
 * Generate image embedding using CLIP model
 * @param imageInput Can be: URL (http/https), data URI (base64), or raw base64 string
 * @returns 512-dimensional embedding vector (for CLIP)
 */
export async function generateImageEmbedding(imageInput: string): Promise<number[]> {
  const model = await getClipModel();

  let inputForModel: any = imageInput;

  const isHttp = imageInput.startsWith('http://') || imageInput.startsWith('https://');
  const isDataUri = imageInput.startsWith('data:');

  if (!isHttp) {
    // Handle data URI or raw base64 by converting to a Blob
    let contentType = 'image/jpeg';
    let base64Data = imageInput;

    if (isDataUri) {
      const match = imageInput.match(/^data:(image\/[\w.+-]+);base64,(.*)$/);
      if (match) {
        contentType = match[1];
        base64Data = match[2];
      }
    } else {
      // raw base64 provided without data URI prefix
      base64Data = imageInput;
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: contentType });
    inputForModel = blob;
  }

  // Generate embedding with pooling and normalization
  const output = await model(inputForModel, {
    pooling: 'mean',
    normalize: true,
  } as any);

  // Extract embedding from output
  if (output && (output as any).data) {
    const data = Array.from((output as any).data) as number[];
    const dims = (output as any).dims || [];

    if (Array.isArray(dims) && dims.length === 2 && dims[0] === 1) {
      return data; // already flat pooled vector
    }

    if (Array.isArray(dims) && dims.length === 3 && dims[0] === 1) {
      const hiddenSize = dims[2];
      return data.slice(0, hiddenSize);
    }

    return data.slice(0, 512);
  }

  if (Array.isArray(output)) {
    const flat = Array.isArray(output[0]) ? output[0] : (output as number[]);
    return (flat as number[]).slice(0, 512);
  }

  throw new Error('Unexpected output format from CLIP model');
}

/**
 * Preload the CLIP model (optional, for warming up)
 */
export async function preloadClipModel() {
  await getClipModel();
}


