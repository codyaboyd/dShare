const fs = require('fs');
const path = require('path');
const https = require('https');
const FormData = require('form-data');
const crypto = require('crypto');

const NFT_STORAGE_API = 'https://api.nft.storage/upload';
var API_TOKEN;
var MAX_SIZE = 70 * 1024 * 1024;

const encryptData = (data, encryptionKey) => {
  const hash = crypto.createHash('sha256');
  hash.update(encryptionKey);
  const key = hash.digest().slice(0, 32);
  const iv = Buffer.alloc(16, 0);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const uploadToNFTStorage = (data, fileName) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', data, fileName);

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        ...formData.getHeaders()
      },
      host: 'api.nft.storage',
      path: '/upload'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`${response.value.cid} created at ${response.value.created}`);
          resolve(response.value.cid);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => reject(error));
    formData.pipe(req);
  });
};

const splitAndUploadFile = async (inputFile, outputDir, apiKey, encryptionKey = '') => {
  if (encryptionKey != '') {
    MAX_SIZE = 35 * 1024 * 1024;
  }
  API_TOKEN = apiKey;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const originalFileName = path.basename(inputFile);
  console.log("Splitting: " + originalFileName);
  let part = 0;
  let masterJson = {
    originalFileName: encryptionKey ? encryptData(originalFileName, encryptionKey) : originalFileName,
    parts: [],
    type: encryptionKey ? "encrypted" : "open"
  };

  const stream = fs.createReadStream(inputFile, { highWaterMark: MAX_SIZE });
  for await (const chunk of stream) {
    console.log("Processing Chunk " + part);

    // Convert chunk to base64 and optionally encrypt
    const b64Chunk = chunk.toString('base64');
    const encryptedOrPlainData = encryptionKey ? encryptData(b64Chunk, encryptionKey) : b64Chunk;
    const jsonChunk = JSON.stringify({ data: encryptedOrPlainData });

    const cid = await uploadToNFTStorage(Buffer.from(jsonChunk), `${part}.json`);
    masterJson.parts.push({ order: part, cid: cid });
    console.log(`Chunk ${part} for CID ${cid} indexed in master`);

    part++;
  }

  const masterJsonString = JSON.stringify(masterJson, null, 2);
  const masterCid = await uploadToNFTStorage(Buffer.from(masterJsonString), 'master.json');
  console.log(`Master CID: ${masterCid}`);

  return `Master file IPFS URL: https://ipfs.io/ipfs/${masterCid}`;
};

module.exports = splitAndUploadFile;
