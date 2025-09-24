const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');
const queriesPath = path.join(dataDir, 'queries.json');
const farmersPath = path.join(dataDir, 'farmers.json');

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    const parsed = JSON.parse(raw || '[]');
    return parsed;
  } catch (e) {
    return [];
  }
}

function writeJson(filePath, data) {
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  fs.renameSync(tmpPath, filePath);
}

async function saveQueryRecord(record) {
  const records = readJson(queriesPath);
  records.push(record);
  writeJson(queriesPath, records);
  return true;
}

async function saveFeedback(queryId, helpful) {
  const records = readJson(queriesPath);
  const idx = records.findIndex(r => r.id === queryId);
  if (idx === -1) return false;
  records[idx].feedback = { helpful: !!helpful, at: new Date().toISOString() };
  writeJson(queriesPath, records);
  return true;
}

async function getFarmers() {
  return readJson(farmersPath);
}

async function addFarmer(farmer) {
  const farmers = readJson(farmersPath);
  farmers.push(farmer);
  writeJson(farmersPath, farmers);
  return true;
}

module.exports = {
  saveQueryRecord,
  saveFeedback,
  getFarmers,
  addFarmer
}; 