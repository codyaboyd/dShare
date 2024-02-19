# dShare: Decentralized File Sharing

dShare is a Node.js-based tool for securely splitting, encrypting, uploading, downloading, and reassembling files using NFT.Storage. It enables users to share large files over the decentralized web, with optional encryption for added security.

## Features

- **File Splitting and Uploading**: Breaks down large files into smaller chunks and uploads them to NFT.Storage.
- **File Downloading and Reassembling**: Downloads file chunks from NFT.Storage and reassembles them into the original file.
- **Encryption and Decryption**: Offers an option to encrypt files before uploading and decrypt them after downloading, ensuring data privacy.

## Prerequisites

Before you begin, ensure you have Node.js installed on your system. You will also need an API token from NFT.Storage.

## Installation

1. Clone the repository to your local machine.
2. Navigate to the cloned directory and install the required dependencies:
    ```
    npm install
    ```
3. Create a `token.json` file in the root directory and add your NFT.Storage API token:
    ```json
    {
      "API_TOKEN": "Your_NFT.Storage_API_Token_Here"
    }
    ```
4. Compile to binary:
    ```
     npx pkg dShare.js -t node18-x64-linux
     npx pkg dShare.js -t node18-x64-windows
     npx pkg dShare.js -t node18-x64-macos
     npx pkg dShare.js -t node18-arm64-linux
     npx pkg dShare.js -t node18-arm64-macos
    ```

## Usage

### Uploading a File

To upload a file, use the following command:

```
./dShare up <input file> <output directory> [-e <encryption key>]
```

- `<input file>`: The path to the file you wish to upload.
- `<output directory>`: The directory where the uploaded file's metadata will be stored.
- `-e <encryption key>`: (Optional) An encryption key for securing your file.

### Downloading a File

To download a file, use the following command:

```
./dShare down <master cid> <output directory> [-e <decryption key>]
```


- `<master cid>`: The master CID returned after uploading a file.
- `<output directory>`: The directory where the downloaded file will be saved.
- `-e <decryption key>`: (Optional) The decryption key, if the file was encrypted.

## Note

Ensure to update the `token.json` with your NFT.Storage API key for uploading operations. The encryption and decryption keys are optional and can be used to secure your files during transit.

## Contributing

Contributions are welcome! Feel free to fork the repository and submit pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
