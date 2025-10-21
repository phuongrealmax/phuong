"""
MonaAI Model Handler
Handles AI model inference and blockchain integration
"""

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from web3 import Web3
import ipfshttpclient
import json
import os
from typing import Dict, Any, Optional


class MonaAIModelHandler:
    """Handler for AI models integrated with blockchain"""

    def __init__(self, contract_address: str, rpc_url: str, ipfs_gateway: str = "/ip4/127.0.0.1/tcp/5001"):
        """
        Initialize the model handler

        Args:
            contract_address: Address of the MonaAI smart contract
            rpc_url: RPC URL for blockchain connection
            ipfs_gateway: IPFS gateway URL
        """
        self.contract_address = contract_address
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.ipfs_client = None
        self.model = None
        self.tokenizer = None

        try:
            self.ipfs_client = ipfshttpclient.connect(ipfs_gateway)
        except Exception as e:
            print(f"Warning: Could not connect to IPFS: {e}")

    def load_model_from_ipfs(self, ipfs_hash: str) -> bool:
        """
        Load a model from IPFS

        Args:
            ipfs_hash: IPFS hash of the model

        Returns:
            bool: True if successful, False otherwise
        """
        if not self.ipfs_client:
            print("IPFS client not available")
            return False

        try:
            # Download model from IPFS
            model_data = self.ipfs_client.cat(ipfs_hash)

            # Save temporarily and load
            temp_path = f"/tmp/model_{ipfs_hash}"
            os.makedirs(temp_path, exist_ok=True)

            with open(f"{temp_path}/model.bin", "wb") as f:
                f.write(model_data)

            # Load the model
            self.model = torch.load(f"{temp_path}/model.bin")
            print(f"Model loaded from IPFS: {ipfs_hash}")
            return True

        except Exception as e:
            print(f"Error loading model from IPFS: {e}")
            return False

    def load_pretrained_model(self, model_name: str):
        """
        Load a pretrained model from HuggingFace

        Args:
            model_name: Name of the model on HuggingFace
        """
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForCausalLM.from_pretrained(model_name)
            print(f"Loaded pretrained model: {model_name}")
        except Exception as e:
            print(f"Error loading pretrained model: {e}")

    def upload_to_ipfs(self, file_path: str) -> Optional[str]:
        """
        Upload a model to IPFS

        Args:
            file_path: Path to the model file

        Returns:
            str: IPFS hash if successful, None otherwise
        """
        if not self.ipfs_client:
            print("IPFS client not available")
            return None

        try:
            result = self.ipfs_client.add(file_path)
            ipfs_hash = result['Hash']
            print(f"Model uploaded to IPFS: {ipfs_hash}")
            return ipfs_hash
        except Exception as e:
            print(f"Error uploading to IPFS: {e}")
            return None

    def infer(self, input_text: str, max_length: int = 100) -> str:
        """
        Run inference on the loaded model

        Args:
            input_text: Input text for the model
            max_length: Maximum length of generated text

        Returns:
            str: Generated text
        """
        if not self.model or not self.tokenizer:
            return "Error: No model loaded"

        try:
            inputs = self.tokenizer(input_text, return_tensors="pt")
            outputs = self.model.generate(**inputs, max_length=max_length)
            result = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            return result
        except Exception as e:
            return f"Error during inference: {e}"

    def get_model_from_blockchain(self, model_id: int) -> Optional[Dict[str, Any]]:
        """
        Get model information from the blockchain

        Args:
            model_id: ID of the model on the blockchain

        Returns:
            dict: Model information
        """
        # This would interact with the smart contract
        # Implementation depends on the contract ABI
        pass


def main():
    """Example usage"""
    # Initialize handler
    handler = MonaAIModelHandler(
        contract_address="0x...",
        rpc_url="http://localhost:8545"
    )

    # Load a small model for testing
    # handler.load_pretrained_model("gpt2")

    # Run inference
    # result = handler.infer("Hello, I am MonaAI")
    # print(f"Result: {result}")


if __name__ == "__main__":
    main()
