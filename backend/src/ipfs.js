const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

/**
 * IPFS Integration for MonaAI
 * Supports local IPFS node and Pinata cloud service
 */

class IPFSService {
  constructor(config = {}) {
    this.localGateway = config.localGateway || process.env.IPFS_GATEWAY || 'http://127.0.0.1:5001';
    this.pinataApiKey = config.pinataApiKey || process.env.PINATA_API_KEY;
    this.pinataSecretKey = config.pinataSecretKey || process.env.PINATA_SECRET_KEY;
    this.usePinata = !!this.pinataApiKey && !!this.pinataSecretKey;
  }

  /**
   * Upload file to IPFS
   */
  async uploadFile(filePath, options = {}) {
    if (this.usePinata) {
      return await this.uploadToPinata(filePath, options);
    } else {
      return await this.uploadToLocal(filePath);
    }
  }

  /**
   * Upload to local IPFS node
   */
  async uploadToLocal(filePath) {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));

      const response = await axios.post(
        `${this.localGateway}/api/v0/add`,
        formData,
        {
          headers: formData.getHeaders()
        }
      );

      return {
        success: true,
        hash: response.data.Hash,
        size: response.data.Size
      };
    } catch (error) {
      console.error('Error uploading to local IPFS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload to Pinata (cloud IPFS service)
   */
  async uploadToPinata(filePath, options = {}) {
    try {
      const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));

      if (options.name) {
        formData.append('pinataMetadata', JSON.stringify({
          name: options.name
        }));
      }

      if (options.keyvalues) {
        formData.append('pinataOptions', JSON.stringify({
          cidVersion: 0,
          customPinPolicy: {
            regions: [
              {
                id: 'FRA1',
                desiredReplicationCount: 1
              },
              {
                id: 'NYC1',
                desiredReplicationCount: 1
              }
            ]
          }
        }));
      }

      const response = await axios.post(url, formData, {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        }
      });

      return {
        success: true,
        hash: response.data.IpfsHash,
        timestamp: response.data.Timestamp,
        size: response.data.PinSize
      };
    } catch (error) {
      console.error('Error uploading to Pinata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload JSON data to IPFS
   */
  async uploadJSON(data, options = {}) {
    try {
      if (this.usePinata) {
        const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

        const response = await axios.post(url, data, {
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey
          }
        });

        return {
          success: true,
          hash: response.data.IpfsHash
        };
      } else {
        // For local node, save JSON to temp file and upload
        const tempFile = `/tmp/ipfs-${Date.now()}.json`;
        fs.writeFileSync(tempFile, JSON.stringify(data));

        const result = await this.uploadToLocal(tempFile);

        // Clean up temp file
        fs.unlinkSync(tempFile);

        return result;
      }
    } catch (error) {
      console.error('Error uploading JSON to IPFS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retrieve file from IPFS
   */
  async getFile(hash) {
    try {
      const gateway = this.usePinata
        ? `https://gateway.pinata.cloud/ipfs/${hash}`
        : `${this.localGateway}/api/v0/cat?arg=${hash}`;

      const response = await axios.get(gateway, {
        responseType: 'arraybuffer'
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error retrieving from IPFS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retrieve JSON from IPFS
   */
  async getJSON(hash) {
    try {
      const result = await this.getFile(hash);

      if (result.success) {
        const json = JSON.parse(result.data.toString());
        return {
          success: true,
          data: json
        };
      }

      return result;
    } catch (error) {
      console.error('Error retrieving JSON from IPFS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Pin hash (ensure it stays in IPFS)
   */
  async pinHash(hash) {
    try {
      if (this.usePinata) {
        const url = 'https://api.pinata.cloud/pinning/pinByHash';

        const response = await axios.post(url, {
          hashToPin: hash
        }, {
          headers: {
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey
          }
        });

        return {
          success: true,
          pinned: true
        };
      } else {
        const response = await axios.post(
          `${this.localGateway}/api/v0/pin/add?arg=${hash}`
        );

        return {
          success: true,
          pinned: true
        };
      }
    } catch (error) {
      console.error('Error pinning hash:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unpin hash (remove from IPFS)
   */
  async unpinHash(hash) {
    try {
      if (this.usePinata) {
        const url = `https://api.pinata.cloud/pinning/unpin/${hash}`;

        await axios.delete(url, {
          headers: {
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey
          }
        });

        return {
          success: true,
          unpinned: true
        };
      } else {
        await axios.post(
          `${this.localGateway}/api/v0/pin/rm?arg=${hash}`
        );

        return {
          success: true,
          unpinned: true
        };
      }
    } catch (error) {
      console.error('Error unpinning hash:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get pinned items list
   */
  async listPinned() {
    try {
      if (this.usePinata) {
        const url = 'https://api.pinata.cloud/data/pinList?status=pinned';

        const response = await axios.get(url, {
          headers: {
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey
          }
        });

        return {
          success: true,
          pins: response.data.rows
        };
      } else {
        const response = await axios.post(
          `${this.localGateway}/api/v0/pin/ls`
        );

        return {
          success: true,
          pins: Object.keys(response.data.Keys || {})
        };
      }
    } catch (error) {
      console.error('Error listing pinned items:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if IPFS is available
   */
  async isAvailable() {
    try {
      if (this.usePinata) {
        const url = 'https://api.pinata.cloud/data/testAuthentication';

        const response = await axios.get(url, {
          headers: {
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey
          }
        });

        return response.data.message === 'Congratulations! You are communicating with the Pinata API!';
      } else {
        const response = await axios.post(`${this.localGateway}/api/v0/version`);
        return !!response.data.Version;
      }
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
let ipfsService = null;

const getIPFSService = (config) => {
  if (!ipfsService) {
    ipfsService = new IPFSService(config);
  }
  return ipfsService;
};

module.exports = {
  IPFSService,
  getIPFSService
};
