const NodeCache = require('node-cache');

// stdTTL: time to live in seconds for every new entry
const cache = new NodeCache({ stdTTL: 600 });

module.exports = cache;
