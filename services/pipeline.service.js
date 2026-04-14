const { searchWeb } = require('./search.service');
const { extractContent } = require('./scrape.service');
const { chunkText } = require('../utils/chunk.util');
const { callLLM } = require('./llm.service');

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
  const summaries = await Promise.all(
    chunks.map(chunk =>
      callLLM('tinyllama', `Summarize:\n${chunk}`)
    )
  );

  console.log("summaries", summaries)

  // 5. final answer (mistral)
  const finalPrompt = `
Answer the question using the context below:

${summaries.join('\n')}

Question: ${query}
`;

  const answer = await callLLM('mistral', finalPrompt);

  return {
    answer,
    sources: urls
  };
}

module.exports = { runResearchPipeline };