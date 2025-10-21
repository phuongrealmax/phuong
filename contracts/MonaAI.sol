// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MonaAI
 * @dev Main smart contract for MonaAI blockchain AI platform
 */
contract MonaAI {
    // State variables
    address public owner;
    uint256 public totalModels;

    struct AIModel {
        uint256 id;
        string name;
        string ipfsHash;
        address creator;
        uint256 timestamp;
        bool isActive;
    }

    mapping(uint256 => AIModel) public models;
    mapping(address => uint256[]) public userModels;

    // Events
    event ModelRegistered(uint256 indexed modelId, string name, address indexed creator);
    event ModelUpdated(uint256 indexed modelId, string ipfsHash);
    event ModelDeactivated(uint256 indexed modelId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier modelExists(uint256 _modelId) {
        require(_modelId > 0 && _modelId <= totalModels, "Model does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
        totalModels = 0;
    }

    /**
     * @dev Register a new AI model on the blockchain
     * @param _name Name of the AI model
     * @param _ipfsHash IPFS hash where the model is stored
     */
    function registerModel(string memory _name, string memory _ipfsHash) public returns (uint256) {
        totalModels++;

        models[totalModels] = AIModel({
            id: totalModels,
            name: _name,
            ipfsHash: _ipfsHash,
            creator: msg.sender,
            timestamp: block.timestamp,
            isActive: true
        });

        userModels[msg.sender].push(totalModels);

        emit ModelRegistered(totalModels, _name, msg.sender);

        return totalModels;
    }

    /**
     * @dev Update an existing AI model
     * @param _modelId ID of the model to update
     * @param _ipfsHash New IPFS hash for the model
     */
    function updateModel(uint256 _modelId, string memory _ipfsHash) public modelExists(_modelId) {
        require(models[_modelId].creator == msg.sender, "Only creator can update model");
        require(models[_modelId].isActive, "Model is not active");

        models[_modelId].ipfsHash = _ipfsHash;
        models[_modelId].timestamp = block.timestamp;

        emit ModelUpdated(_modelId, _ipfsHash);
    }

    /**
     * @dev Deactivate a model
     * @param _modelId ID of the model to deactivate
     */
    function deactivateModel(uint256 _modelId) public modelExists(_modelId) {
        require(models[_modelId].creator == msg.sender || msg.sender == owner, "Not authorized");

        models[_modelId].isActive = false;

        emit ModelDeactivated(_modelId);
    }

    /**
     * @dev Get model details
     * @param _modelId ID of the model
     */
    function getModel(uint256 _modelId) public view modelExists(_modelId) returns (AIModel memory) {
        return models[_modelId];
    }

    /**
     * @dev Get all models created by a user
     * @param _user Address of the user
     */
    function getUserModels(address _user) public view returns (uint256[] memory) {
        return userModels[_user];
    }
}
