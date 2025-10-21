"""
MonaAI Training Script
Training AI models for the MonaAI platform
"""

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments
import json
from typing import List, Dict
import os


class MonaAIDataset(Dataset):
    """Custom dataset for MonaAI training"""

    def __init__(self, data_path: str, tokenizer, max_length: int = 512):
        """
        Initialize the dataset

        Args:
            data_path: Path to the training data (JSON file)
            tokenizer: Tokenizer for the model
            max_length: Maximum sequence length
        """
        self.tokenizer = tokenizer
        self.max_length = max_length

        # Load data
        with open(data_path, 'r') as f:
            self.data = json.load(f)

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]
        text = item['text'] if 'text' in item else str(item)

        # Tokenize
        encodings = self.tokenizer(
            text,
            truncation=True,
            max_length=self.max_length,
            padding='max_length',
            return_tensors='pt'
        )

        return {
            'input_ids': encodings['input_ids'].squeeze(),
            'attention_mask': encodings['attention_mask'].squeeze(),
            'labels': encodings['input_ids'].squeeze()
        }


class MonaAITrainer:
    """Trainer for MonaAI models"""

    def __init__(self, model_name: str, output_dir: str = "./models"):
        """
        Initialize the trainer

        Args:
            model_name: Name of the base model
            output_dir: Directory to save trained models
        """
        self.model_name = model_name
        self.output_dir = output_dir
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(model_name)

        # Add padding token if it doesn't exist
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

        os.makedirs(output_dir, exist_ok=True)

    def train(
        self,
        train_data_path: str,
        num_epochs: int = 3,
        batch_size: int = 4,
        learning_rate: float = 5e-5,
        save_steps: int = 500
    ):
        """
        Train the model

        Args:
            train_data_path: Path to training data
            num_epochs: Number of training epochs
            batch_size: Batch size for training
            learning_rate: Learning rate
            save_steps: Save checkpoint every N steps
        """
        # Create dataset
        train_dataset = MonaAIDataset(train_data_path, self.tokenizer)

        # Training arguments
        training_args = TrainingArguments(
            output_dir=self.output_dir,
            num_train_epochs=num_epochs,
            per_device_train_batch_size=batch_size,
            learning_rate=learning_rate,
            save_steps=save_steps,
            save_total_limit=2,
            logging_dir=f"{self.output_dir}/logs",
            logging_steps=100,
            warmup_steps=100,
            weight_decay=0.01,
        )

        # Create trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
        )

        # Train
        print("Starting training...")
        trainer.train()

        # Save model
        self.save_model()

    def save_model(self, save_path: str = None):
        """
        Save the trained model

        Args:
            save_path: Path to save the model
        """
        if save_path is None:
            save_path = f"{self.output_dir}/final_model"

        os.makedirs(save_path, exist_ok=True)
        self.model.save_pretrained(save_path)
        self.tokenizer.save_pretrained(save_path)
        print(f"Model saved to {save_path}")

    def fine_tune(
        self,
        dataset_path: str,
        epochs: int = 3,
        batch_size: int = 4
    ):
        """
        Fine-tune the model on custom data

        Args:
            dataset_path: Path to the dataset
            epochs: Number of epochs
            batch_size: Batch size
        """
        self.train(
            train_data_path=dataset_path,
            num_epochs=epochs,
            batch_size=batch_size
        )


def main():
    """Example usage"""
    # Initialize trainer
    trainer = MonaAITrainer(
        model_name="gpt2",
        output_dir="./trained_models"
    )

    # Train on custom data
    # trainer.train(train_data_path="./data/train.json")


if __name__ == "__main__":
    main()
