const { saveFeedback } = require('../utils/storage');

exports.recordFeedback = async (req, res, next) => {
  try {
    const { queryId, helpful } = req.body;
    if (!queryId || typeof helpful === 'undefined') {
      return res.status(400).json({ error: 'queryId and helpful are required' });
    }

    const updated = await saveFeedback(queryId, helpful === true || helpful === 'true');
    if (!updated) {
      return res.status(404).json({ error: 'Query not found' });
    }

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}; 