"""
MonaAI Model Version Manager
Manage different versions of AI models
"""

import json
import os
import hashlib
from typing import Dict, List, Any, Optional
from datetime import datetime
import shutil


class ModelVersionManager:
    """Manage AI model versions"""

    def __init__(self, base_dir: str = "./model_versions"):
        """
        Initialize version manager

        Args:
            base_dir: Base directory for storing model versions
        """
        self.base_dir = base_dir
        self.metadata_file = os.path.join(base_dir, "versions.json")
        self.versions = {}

        # Create base directory if it doesn't exist
        os.makedirs(base_dir, exist_ok=True)

        # Load existing versions
        self._load_versions()

    def _load_versions(self):
        """Load version metadata from file"""
        if os.path.exists(self.metadata_file):
            with open(self.metadata_file, "r") as f:
                self.versions = json.load(f)
        else:
            self.versions = {}

    def _save_versions(self):
        """Save version metadata to file"""
        with open(self.metadata_file, "w") as f:
            json.dump(self.versions, f, indent=2)

    def _calculate_file_hash(self, file_path: str) -> str:
        """Calculate SHA256 hash of a file"""
        sha256_hash = hashlib.sha256()

        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)

        return sha256_hash.hexdigest()

    def add_version(
        self,
        model_name: str,
        model_path: str,
        version: str = None,
        description: str = "",
        metrics: Dict[str, Any] = None,
        tags: List[str] = None
    ) -> Dict[str, Any]:
        """
        Add a new model version

        Args:
            model_name: Name of the model
            model_path: Path to the model file/directory
            version: Version string (auto-generated if not provided)
            description: Version description
            metrics: Model performance metrics
            tags: Tags for categorization

        Returns:
            dict: Version metadata
        """
        # Auto-generate version if not provided
        if version is None:
            if model_name not in self.versions:
                version = "1.0.0"
            else:
                # Increment patch version
                latest = self.get_latest_version(model_name)
                if latest:
                    parts = latest["version"].split(".")
                    parts[2] = str(int(parts[2]) + 1)
                    version = ".".join(parts)
                else:
                    version = "1.0.0"

        # Create version directory
        version_dir = os.path.join(self.base_dir, model_name, version)
        os.makedirs(version_dir, exist_ok=True)

        # Copy model to version directory
        if os.path.isfile(model_path):
            dest_path = os.path.join(version_dir, os.path.basename(model_path))
            shutil.copy2(model_path, dest_path)
            file_hash = self._calculate_file_hash(model_path)
        elif os.path.isdir(model_path):
            shutil.copytree(model_path, version_dir, dirs_exist_ok=True)
            file_hash = "directory"
        else:
            raise ValueError(f"Invalid model path: {model_path}")

        # Create version metadata
        version_metadata = {
            "version": version,
            "model_name": model_name,
            "created_at": datetime.now().isoformat(),
            "description": description,
            "path": version_dir,
            "hash": file_hash,
            "metrics": metrics or {},
            "tags": tags or [],
            "status": "active"
        }

        # Store version
        if model_name not in self.versions:
            self.versions[model_name] = []

        self.versions[model_name].append(version_metadata)

        # Save metadata
        self._save_versions()

        print(f"Added version {version} for model {model_name}")

        return version_metadata

    def get_version(self, model_name: str, version: str) -> Optional[Dict[str, Any]]:
        """
        Get specific version metadata

        Args:
            model_name: Name of the model
            version: Version string

        Returns:
            dict: Version metadata or None
        """
        if model_name not in self.versions:
            return None

        for v in self.versions[model_name]:
            if v["version"] == version:
                return v

        return None

    def get_latest_version(self, model_name: str) -> Optional[Dict[str, Any]]:
        """
        Get latest version of a model

        Args:
            model_name: Name of the model

        Returns:
            dict: Latest version metadata or None
        """
        if model_name not in self.versions or not self.versions[model_name]:
            return None

        # Sort by version (simple string sort, could be improved)
        sorted_versions = sorted(
            self.versions[model_name],
            key=lambda x: [int(p) for p in x["version"].split(".")],
            reverse=True
        )

        return sorted_versions[0]

    def list_versions(self, model_name: str) -> List[Dict[str, Any]]:
        """
        List all versions of a model

        Args:
            model_name: Name of the model

        Returns:
            list: List of version metadata
        """
        if model_name not in self.versions:
            return []

        return sorted(
            self.versions[model_name],
            key=lambda x: [int(p) for p in x["version"].split(".")],
            reverse=True
        )

    def list_all_models(self) -> List[str]:
        """
        List all models

        Returns:
            list: List of model names
        """
        return list(self.versions.keys())

    def deprecate_version(self, model_name: str, version: str, reason: str = ""):
        """
        Deprecate a specific version

        Args:
            model_name: Name of the model
            version: Version to deprecate
            reason: Reason for deprecation
        """
        version_meta = self.get_version(model_name, version)

        if version_meta:
            version_meta["status"] = "deprecated"
            version_meta["deprecation_reason"] = reason
            version_meta["deprecated_at"] = datetime.now().isoformat()

            self._save_versions()
            print(f"Deprecated {model_name} version {version}")
        else:
            print(f"Version {version} not found for model {model_name}")

    def delete_version(self, model_name: str, version: str):
        """
        Delete a specific version

        Args:
            model_name: Name of the model
            version: Version to delete
        """
        if model_name not in self.versions:
            print(f"Model {model_name} not found")
            return

        # Find and remove version
        self.versions[model_name] = [
            v for v in self.versions[model_name]
            if v["version"] != version
        ]

        # Delete version directory
        version_dir = os.path.join(self.base_dir, model_name, version)
        if os.path.exists(version_dir):
            shutil.rmtree(version_dir)

        self._save_versions()
        print(f"Deleted {model_name} version {version}")

    def compare_versions(
        self,
        model_name: str,
        version1: str,
        version2: str
    ) -> Dict[str, Any]:
        """
        Compare two versions

        Args:
            model_name: Name of the model
            version1: First version
            version2: Second version

        Returns:
            dict: Comparison results
        """
        v1 = self.get_version(model_name, version1)
        v2 = self.get_version(model_name, version2)

        if not v1 or not v2:
            return {"error": "One or both versions not found"}

        comparison = {
            "model_name": model_name,
            "version_1": {
                "version": v1["version"],
                "created_at": v1["created_at"],
                "metrics": v1.get("metrics", {})
            },
            "version_2": {
                "version": v2["version"],
                "created_at": v2["created_at"],
                "metrics": v2.get("metrics", {})
            },
            "metric_differences": {}
        }

        # Calculate metric differences
        metrics1 = v1.get("metrics", {})
        metrics2 = v2.get("metrics", {})

        for key in set(metrics1.keys()) | set(metrics2.keys()):
            val1 = metrics1.get(key, 0)
            val2 = metrics2.get(key, 0)

            if isinstance(val1, (int, float)) and isinstance(val2, (int, float)):
                comparison["metric_differences"][key] = {
                    "v1": val1,
                    "v2": val2,
                    "difference": val2 - val1,
                    "percent_change": ((val2 - val1) / val1 * 100) if val1 != 0 else 0
                }

        return comparison

    def rollback(self, model_name: str, target_version: str) -> Optional[Dict[str, Any]]:
        """
        Rollback to a specific version (marks it as latest)

        Args:
            model_name: Name of the model
            target_version: Version to rollback to

        Returns:
            dict: Version metadata
        """
        version_meta = self.get_version(model_name, target_version)

        if version_meta:
            # Mark as latest by updating timestamp
            version_meta["rollback_at"] = datetime.now().isoformat()
            self._save_versions()
            print(f"Rolled back {model_name} to version {target_version}")
            return version_meta
        else:
            print(f"Version {target_version} not found")
            return None


def main():
    """Example usage"""
    manager = ModelVersionManager()

    # Example: Add a version
    # manager.add_version(
    #     model_name="my-gpt-model",
    #     model_path="./model.bin",
    #     version="1.0.0",
    #     description="Initial release",
    #     metrics={"accuracy": 0.85, "perplexity": 45.2},
    #     tags=["production", "stable"]
    # )

    # List all models
    # models = manager.list_all_models()
    # print("Models:", models)

    pass


if __name__ == "__main__":
    main()
