const axios = require('axios');

async function searchWeb(query) {
  try {
    const res = await axios.post(
      'https://google.serper.dev/search',
      { q: query },
      {
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.data.organic.map(r => r.link).slice(0, 3);
  } catch (err) {
    console.error("Search failed:", err.response?.status);

    // fallback (important for product reliability)
    return [];
  }
}

module.exports = { searchWeb };