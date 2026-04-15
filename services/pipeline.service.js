const { searchWeb } = require('./search.service');
const { extractContent } = require('./scrape.service');
const { chunkText } = require('../utils/chunk.util');
const { callLLM } = require('./llm.service');

function scoreChunk(chunk, query) {
  const words = query.toLowerCase().split(' ');
  let score = 0;

  words.forEach(w => {
    if (chunk.toLowerCase().includes(w)) score++;
  });

  return score;
}

async function runResearchPipeline(query) {
  console.log("🔍 Query:", query);

  // 1. search
  const urls = await searchWeb(query);

  console.log("URLs", urls)

  // 2. scrape parallel
  const contents = await Promise.all(
    urls.map(url => extractContent(url))
  );

  console.log("contents", contents);

  const validContents = contents.filter(Boolean);

  // 3. chunk
  let chunks = [];
  validContents.forEach(text => {
    chunks.push(...chunkText(text));
  });

  chunks = chunks.slice(0, 5);

  // 4. summarize (tiny model)
  // const summaries = await Promise.all(
  //   chunks.map(chunk =>
  //     callLLM('tinyllama', `Summarize:\n${chunk}`)
  //   )
  // );

  // console.log("summaries", summaries)

  // 5. final answer (mistral)

  chunks = chunks
  .map(c => ({ text: c, score: scoreChunk(c, query) }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 5)
  .map(c => c.text);

  const context = chunks.join('\n\n');

  const finalPrompt = `
    You are a precise and factual research assistant.

    Instructions:
    - Answer using ONLY the provided context
    - Be detailed and structured
    - If context is insufficient, say "Not enough information"

    Context:
    ${context}

    Question:
    ${query}

    Answer:
    `;

  const answer = await callLLM('mistral', finalPrompt);

  return {
    answer,
    sources: urls
  };
}

module.exports = { runResearchPipeline };