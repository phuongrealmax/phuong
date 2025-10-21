"""
MonaAI Model Evaluator
Evaluate AI model performance and quality metrics
"""

import torch
import numpy as np
from typing import Dict, List, Any, Optional
from transformers import AutoTokenizer, AutoModelForCausalLM
import json
import time


class ModelEvaluator:
    """Evaluate AI models with various metrics"""

    def __init__(self, model_path: str = None, model_name: str = None):
        """
        Initialize the evaluator

        Args:
            model_path: Path to local model
            model_name: HuggingFace model name
        """
        self.model_path = model_path
        self.model_name = model_name
        self.model = None
        self.tokenizer = None
        self.metrics = {}

        if model_name:
            self.load_model(model_name)

    def load_model(self, model_name: str):
        """Load model for evaluation"""
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForCausalLM.from_pretrained(model_name)
            print(f"Model loaded: {model_name}")
        except Exception as e:
            print(f"Error loading model: {e}")

    def calculate_perplexity(self, texts: List[str]) -> float:
        """
        Calculate perplexity on a set of texts

        Args:
            texts: List of text samples

        Returns:
            float: Average perplexity
        """
        if not self.model or not self.tokenizer:
            return 0.0

        total_loss = 0.0
        count = 0

        self.model.eval()

        with torch.no_grad():
            for text in texts:
                inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
                outputs = self.model(**inputs, labels=inputs["input_ids"])
                total_loss += outputs.loss.item()
                count += 1

        avg_loss = total_loss / count if count > 0 else 0
        perplexity = np.exp(avg_loss)

        return perplexity

    def measure_inference_speed(self, num_samples: int = 10, max_length: int = 50) -> Dict[str, float]:
        """
        Measure inference speed

        Args:
            num_samples: Number of samples to test
            max_length: Maximum generation length

        Returns:
            dict: Speed metrics
        """
        if not self.model or not self.tokenizer:
            return {}

        times = []
        test_prompts = [f"Sample prompt {i}" for i in range(num_samples)]

        for prompt in test_prompts:
            start_time = time.time()

            inputs = self.tokenizer(prompt, return_tensors="pt")
            _ = self.model.generate(**inputs, max_length=max_length)

            elapsed = time.time() - start_time
            times.append(elapsed)

        return {
            "avg_time_seconds": np.mean(times),
            "min_time_seconds": np.min(times),
            "max_time_seconds": np.max(times),
            "std_time_seconds": np.std(times),
            "samples_tested": num_samples
        }

    def calculate_model_size(self) -> Dict[str, Any]:
        """
        Calculate model size metrics

        Returns:
            dict: Size metrics
        """
        if not self.model:
            return {}

        total_params = sum(p.numel() for p in self.model.parameters())
        trainable_params = sum(p.numel() for p in self.model.parameters() if p.requires_grad)

        # Estimate size in MB
        param_size = sum(p.numel() * p.element_size() for p in self.model.parameters())
        buffer_size = sum(b.numel() * b.element_size() for b in self.model.buffers())
        size_mb = (param_size + buffer_size) / 1024 / 1024

        return {
            "total_parameters": total_params,
            "trainable_parameters": trainable_params,
            "non_trainable_parameters": total_params - trainable_params,
            "size_mb": size_mb,
            "size_gb": size_mb / 1024
        }

    def evaluate_quality(
        self,
        test_texts: List[str],
        benchmark_texts: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive quality evaluation

        Args:
            test_texts: Texts for evaluation
            benchmark_texts: Optional benchmark texts for comparison

        Returns:
            dict: Quality metrics
        """
        metrics = {}

        # Perplexity
        perplexity = self.calculate_perplexity(test_texts)
        metrics["perplexity"] = perplexity

        # Inference speed
        speed_metrics = self.measure_inference_speed()
        metrics["speed"] = speed_metrics

        # Model size
        size_metrics = self.calculate_model_size()
        metrics["size"] = size_metrics

        # Quality score (simple heuristic)
        quality_score = self._calculate_quality_score(perplexity, speed_metrics, size_metrics)
        metrics["quality_score"] = quality_score

        return metrics

    def _calculate_quality_score(
        self,
        perplexity: float,
        speed_metrics: Dict[str, float],
        size_metrics: Dict[str, Any]
    ) -> float:
        """
        Calculate overall quality score (0-100)

        Lower perplexity = better
        Faster inference = better
        Smaller size = better (with trade-offs)
        """
        # Normalize perplexity (assume good models have perplexity < 50)
        perplexity_score = max(0, 100 - (perplexity / 50) * 100)

        # Normalize speed (assume good inference < 1 second)
        avg_time = speed_metrics.get("avg_time_seconds", 1.0)
        speed_score = max(0, 100 - (avg_time / 1.0) * 100)

        # Normalize size (smaller is generally better for deployment)
        size_gb = size_metrics.get("size_gb", 1.0)
        size_score = max(0, 100 - (size_gb / 5.0) * 100)

        # Weighted average
        quality_score = (
            perplexity_score * 0.5 +
            speed_score * 0.3 +
            size_score * 0.2
        )

        return min(100, max(0, quality_score))

    def generate_evaluation_report(
        self,
        test_texts: List[str],
        output_path: str = "evaluation_report.json"
    ) -> Dict[str, Any]:
        """
        Generate comprehensive evaluation report

        Args:
            test_texts: Texts for evaluation
            output_path: Path to save report

        Returns:
            dict: Evaluation report
        """
        report = {
            "model_name": self.model_name or self.model_path,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "metrics": self.evaluate_quality(test_texts)
        }

        # Save to file
        with open(output_path, "w") as f:
            json.dump(report, f, indent=2)

        print(f"Evaluation report saved to: {output_path}")

        return report

    def compare_models(
        self,
        other_model_name: str,
        test_texts: List[str]
    ) -> Dict[str, Any]:
        """
        Compare this model with another model

        Args:
            other_model_name: Name of model to compare with
            test_texts: Test texts for comparison

        Returns:
            dict: Comparison results
        """
        # Evaluate current model
        current_metrics = self.evaluate_quality(test_texts)

        # Evaluate other model
        other_evaluator = ModelEvaluator(model_name=other_model_name)
        other_metrics = other_evaluator.evaluate_quality(test_texts)

        comparison = {
            "model_1": {
                "name": self.model_name,
                "metrics": current_metrics
            },
            "model_2": {
                "name": other_model_name,
                "metrics": other_metrics
            },
            "winner": self._determine_winner(current_metrics, other_metrics)
        }

        return comparison

    def _determine_winner(self, metrics1: Dict, metrics2: Dict) -> str:
        """Determine which model is better based on quality score"""
        score1 = metrics1.get("quality_score", 0)
        score2 = metrics2.get("quality_score", 0)

        if score1 > score2:
            return "model_1"
        elif score2 > score1:
            return "model_2"
        else:
            return "tie"


def main():
    """Example usage"""
    # Example: Evaluate a model
    # evaluator = ModelEvaluator(model_name="gpt2")

    # test_texts = [
    #     "The quick brown fox jumps over the lazy dog.",
    #     "Artificial intelligence is transforming the world.",
    #     "Machine learning models require training data."
    # ]

    # report = evaluator.generate_evaluation_report(test_texts)
    # print(json.dumps(report, indent=2))
    pass


if __name__ == "__main__":
    main()
