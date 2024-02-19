const fs = require('fs');
const path = require('path');
const splitAndUpload = require('./splitAndUpload.js');
const reassembleFile = require('./downloadAndAssemble.js');

const TOKEN_FILE = 'token.json';
const DEFAULT_TOKEN = 'NFT.STORAGE_KEY_HERE';

const printHelpMessage = () => {
    console.log('Usage:');
    console.log('  ./dShare up <input file> <output directory> [-e <encryption key>]');
    console.log('  ./dShare down <master cid> <output directory> [-e <decryption key>]');
    console.log('\nNote:');
    console.log('  Ensure to update token.json with your NFT.Storage API key for the up operation.');
    console.log('  The -e option allows you to specify an encryption key for uploading or a decryption key for downloading.');
};

const checkAndGetToken = () => {
    if (!fs.existsSync(TOKEN_FILE)) {
        fs.writeFileSync(TOKEN_FILE, JSON.stringify({ API_TOKEN: DEFAULT_TOKEN }, null, 2));
        console.error('token.json file created. Please add your NFT.Storage API token to it.');
        process.exit(1);
    }

    const tokenData = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    if (tokenData.API_TOKEN === DEFAULT_TOKEN) {
        console.error('Add your NFT.Storage API token to token.json');
        process.exit(1);
    }

    return tokenData.API_TOKEN;
};

// Enhanced argument processing to detect and handle -e option
const processArguments = (args) => {
    const options = {
        inputFile: '',
        outputDir: '',
        key: '',
        masterCid: ''
    };

    if (args.includes('-e')) {
        const keyIndex = args.indexOf('-e');
        if (keyIndex !== -1 && args.length > keyIndex + 1) {
            options.key = args[keyIndex + 1];
            args.splice(keyIndex, 2); // Remove the key and its flag from the arguments list
        }
    }

    if (args[0] === 'up' && args.length === 3) {
        options.inputFile = args[1];
        options.outputDir = args[2];
    } else if (args[0] === 'down' && args.length === 3) {
        options.masterCid = args[1];
        options.outputDir = args[2];
    }

    return options;
};

const args = process.argv.slice(2);

if (args.length < 2 || args.includes('--help') || args.includes('-h')) {
    printHelpMessage();
    process.exit(0);
}

const command = args[0];
const options = processArguments(args);

const run = async () => {
    if (command === 'up') {
        if (!options.inputFile || !options.outputDir) {
            console.error('Incorrect number of arguments for up command');
            process.exit(1);
        }
        const apiToken = checkAndGetToken();
        await splitAndUpload(options.inputFile, options.outputDir, apiToken, options.key); // Pass encryption key if provided
    } else if (command === 'down') {
        if (!options.masterCid || !options.outputDir) {
            console.error('Incorrect number of arguments for down command');
            process.exit(1);
        }
        await reassembleFile(options.masterCid, options.outputDir, options.key); // Pass decryption key if provided
    } else {
        console.error('Invalid command. Available commands: up, down, --help');
        process.exit(1);
    }
};

run().catch(err => {
    console.error(err);
    process.exit(1);
});
