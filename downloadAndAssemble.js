const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const decryptData = (encryptedData, decryptionKey) => {
  const key = crypto.createHash('sha256').update(decryptionKey).digest();
  const iv = Buffer.alloc(16, 0);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const downloadFile = (cid, outputDir, outputFileName) => {
  return new Promise((resolve, reject) => {
    const url = `https://cloudflare-ipfs.com/ipfs/${cid}/${outputFileName}`;
    const filePath = path.join(outputDir, outputFileName);
    const file = fs.createWriteStream(filePath);

    console.log('Downloading: ' + url);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Downloaded: ' + url);
        resolve(filePath);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => reject(err));
    });
  });
};

const b64ToBinary = (b64String, decryptionKey = '') => {
  const data = decryptionKey ? decryptData(b64String, decryptionKey) : b64String;
  return Buffer.from(data, 'base64');
};

const reassembleFile = async (masterCid, outputDir, decryptionKey = '') => {
  const masterJsonPath = await downloadFile(masterCid, outputDir, 'master.json');
  const masterData = JSON.parse(fs.readFileSync(masterJsonPath, 'utf-8'));
  console.log('Master JSON Fetched');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const originalFileName = masterData.type === "encrypted" ? decryptData(masterData.originalFileName, decryptionKey) : masterData.originalFileName;
  const outputFilePath = path.join(outputDir, originalFileName);

  await new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(outputFilePath);

    fileStream.on('finish', () => {
      console.log(`File reassembled: ${outputFilePath}`);
      resolve();
    });

    fileStream.on('error', reject);

    (async () => {
      for (const chunkInfo of masterData.parts) {
        const chunkFileName = `${chunkInfo.order}.json`;
        console.log(`Fetching CID: ${chunkInfo.cid}`);
        const chunkPath = await downloadFile(chunkInfo.cid, outputDir, chunkFileName);

        const chunkJson = JSON.parse(fs.readFileSync(chunkPath, 'utf-8'));
        const chunkData = b64ToBinary(chunkJson.data, masterData.type === "encrypted" ? decryptionKey : '');

        if (!fileStream.write(chunkData)) {
          await new Promise(resolve => fileStream.once('drain', resolve));
        }

        fs.unlinkSync(chunkPath);
      }

      fileStream.end();
    })().catch(error => {
      console.error("An error occurred:", error);
      fileStream.close();
      reject(error);
    });
  });
};

module.exports = reassembleFile;
