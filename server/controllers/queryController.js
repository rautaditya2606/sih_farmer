const path = require('path');
const { saveQueryRecord } = require('../utils/storage');
const { transcribeAudio, translateToEnglish, askLLM, classifyPlantDisease, getWeatherStub } = require('../services/stubs');

const BASE_METADATA = {
  farmerLocation: 'Palakkad, Kerala, India',
  crop: 'Rice',
  season: 'Kharif'
};

function containsMalayalam(text) {
  return /[\u0D00-\u0D7F]/.test(text || '');
}

exports.handleQuery = async (req, res, next) => {
  try {
    const body = req.body || {};
    const text = typeof body.text === 'string' ? body.text : '';
    const hasFiles = req.files && (req.files.voice || req.files.image);

    let inputText = text;

    if (hasFiles && req.files.voice) {
      const voiceFile = req.files.voice;
      if (voiceFile && voiceFile.data) {
        inputText = await transcribeAudio(voiceFile.data);
      }
    }

    if (inputText && inputText.trim().length > 0) {
      const preferMalayalam = containsMalayalam(inputText);
      const englishText = await translateToEnglish(inputText);
      const weather = await getWeatherStub(BASE_METADATA.farmerLocation);
      const imageAttached = !!(req.files && req.files.image);
      const llmResponse = await askLLM(englishText, { ...BASE_METADATA, weather, preferMalayalam, imageAttached });

      const record = {
        id: Date.now().toString(),
        type: 'text',
        query: inputText,
        normalizedQuery: englishText,
        metadata: { ...BASE_METADATA, weather, preferMalayalam, imageAttached },
        response: llmResponse,
        createdAt: new Date().toISOString()
      };
      await saveQueryRecord(record);
      return res.json({ id: record.id, ...llmResponse });
    }

    if (hasFiles && req.files.image) {
      const imageFile = req.files.image;
      if (imageFile && imageFile.data) {
        const classify = await classifyPlantDisease(imageFile.data);

        const record = {
          id: Date.now().toString(),
          type: 'image',
          query: '[image upload]',
          normalizedQuery: null,
          metadata: BASE_METADATA,
          response: classify,
          createdAt: new Date().toISOString()
        };
        await saveQueryRecord(record);
        return res.json({ id: record.id, ...classify });
      }
    }

    return res.status(400).json({ error: 'No input provided. Provide text, voice, or image.' });
  } catch (err) {
    next(err);
  }
}; 