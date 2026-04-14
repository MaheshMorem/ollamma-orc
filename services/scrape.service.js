const axios = require('axios');
const cheerio = require('cheerio');

async function directScrape(url) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 5000
  });

  const $ = cheerio.load(res.data);
  return $('p').map((i, el) => $(el).text()).get().join('\n');
}

async function jinaScrape(url) {
  const res = await axios.get(`https://r.jina.ai/${url}`);
  return res.data;
}

async function extractContent(url) {
  try {
    return await directScrape(url);
  } catch {}

  try {
    return await jinaScrape(url);
  } catch {}

  return null;
}

module.exports = { extractContent };