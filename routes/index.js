const express = require('express');
const router = express.Router();

router.get('/@:username', (req, res) => {
  const username = req.params.username;
  const width = req.query.width || req.query.w || req.query.size || req.query.s || 128;
  const height = req.query.height || req.query.h || req.query.size || req.query.s || 128;
  let size = 'medium';
  size = width > 128 || height > 128 ? 'large' : size;
  size = width <= 64 || height <= 64 ? 'small' : size;
  res.redirect(`https://steemitimages.com/u/${username}/avatar/${size}`);
});

router.get('/@:username/cover', (req, res) => {
  res.redirect('https://gateway.ipfs.io/ipfs/QmTTtAi3ZwLdGpEzy2LHpFKQHFqLUrHy61miko9LSbVp72');
});

module.exports = router;
