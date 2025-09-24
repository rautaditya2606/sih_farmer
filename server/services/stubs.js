function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function transcribeAudio(buffer) {
  await delay(200);
  return 'Transcribed Malayalam/English text from voice note (stub)';
}

async function translateToEnglish(text) {
  await delay(100);
  return text;
}

async function askLLM(prompt, metadata) {
  const apiKey = process.env.GEMINI_API_KEY;
  const weatherStr = metadata?.weather ? ` Weather: temp ${metadata.weather.tempC}°C, humidity ${metadata.weather.humidity}%, condition ${metadata.weather.condition}.` : '';
  const langHint = metadata?.preferMalayalam ? 'Respond in Malayalam.' : 'Respond in English.';
  const multimodal = metadata?.imageAttached ? 'An image is attached; incorporate likely visual cues if relevant.' : '';
  const formatHint = 'Use concise Markdown with short sentences and up to 3 bullets. Give rates per hectare and, in parentheses, per acre equivalents.';
  const system = 'You are an agronomy assistant for Indian smallholders. Be practical, safe, and IPM-first. Add one caution only if needed.';
  const composed = `${system}\n${langHint} ${multimodal}\n${formatHint}\nContext: crop=${metadata.crop}, season=${metadata.season}, location=${metadata.farmerLocation}.${weatherStr}\nQuestion: ${prompt}`;
  if (apiKey) {
    try {
      const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [ { parts: [ { text: composed } ] } ] })
      });
      const json = await resp.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer';
      return { answer: text, confidence: 0.9, source: 'gemini-2.0-flash' };
    } catch (e) {}
  }
  await delay(200);
  const fallback = metadata?.preferMalayalam
    ? '**IPM മുൻഗണന:**\n- പ്രതി ഹെക്ടർ: നെൽ NPK സമതുലിതമായി (ഏക്കറിന് ~0.4 ഗുണം).\n- പെറോമോൺ ട്രാപ്, ബയോ ഏജന്റ്സ് ഉപയോഗിച്ച് നിരീക്ഷണം.\n- 5–7 സെ.മീ വെള്ളം നിലനിർത്തുക; മണ്ണ് കട്ടിയെങ്കിൽ ലഘു ഹരറിംഗ്.\n\nശ്രദ്ധിക്കുക: കീടനാശിനി ഉപയോഗിക്കുമ്പോൾ സംരക്ഷണ ഉപകരണങ്ങൾ ധരിക്കുക.'
    : '**IPM first:**\n- Per hectare: balanced NPK (per acre ~0.4×).\n- Monitor twice weekly; use pheromone traps and bio-agents.\n- Maintain 5–7 cm water; light harrowing if soil is compacted.\n\nCaution: Wear PPE when spraying.';
  return { answer: fallback, confidence: 0.82, source: 'stub:local-llm' };
}

async function classifyPlantDisease(imageBuffer) {
  await delay(250);
  return {
    answer: 'Likely leaf blight: remove affected leaves; apply copper oxychloride (label rate per hectare). Improve drainage; avoid overhead irrigation. Integrate with IPM scouting.',
    confidence: 0.76,
    source: 'stub:plant-disease-model'
  };
}

async function getWeatherStub(location) {
  await delay(80);
  return { tempC: 30, humidity: 70, condition: 'Partly cloudy' };
}

module.exports = {
  transcribeAudio,
  translateToEnglish,
  askLLM,
  classifyPlantDisease,
  getWeatherStub
}; 