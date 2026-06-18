import { Mistral } from "@mistralai/mistralai";

export const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

// Convert a piece of text into a vector embedding using Mistral's
// embedding model (1024 dimensions).
export async function getEmbedding(text) {
  const response = await mistral.embeddings.create({
    model: "mistral-embed",
    inputs: [text],
  });

  return response.data[0].embedding;
}
