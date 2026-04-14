const express = require('express');
const router = express.Router();
const { runResearchPipeline } = require('../services/pipeline.service');

router.post('/', async (req, res) => {
  const { query } = req.body;

  if (!query) return res.status(400).json({ error: 'query required' });

  try {
    const result = await runResearchPipeline(query);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'pipeline failed' });
  }
});

module.exports = router;