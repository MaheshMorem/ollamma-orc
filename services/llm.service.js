async function callLLM(model, prompt) {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        num_predict: 500,   // 🔥 increase output size
        temperature: 0.2,   // factual
        top_p: 0.9
      }
    })
  });

  const data = await res.json();
  return data.response;
}

module.exports = { callLLM };