// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MonaAI.sol";

/**
 * @title MonaAIMarketplace
 * @dev Marketplace for buying and selling AI models
 */
contract MonaAIMarketplace {
    address public owner;
    MonaAI public monaAIContract;
    uint256 public listingFee = 0.001 ether;
    uint256 public totalListings;

    struct Listing {
        uint256 id;
        uint256 modelId;
        address seller;
        uint256 price;
        bool isActive;
        uint256 purchases;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => uint256) public modelToListing; // modelId => listingId
    mapping(address => uint256[]) public userListings;
    mapping(address => mapping(uint256 => bool)) public hasPurchased;

    event ListingCreated(uint256 indexed listingId, uint256 indexed modelId, address seller, uint256 price);
    event ModelPurchased(uint256 indexed listingId, uint256 indexed modelId, address buyer, uint256 price);
    event ListingCancelled(uint256 indexed listingId);
    event PriceUpdated(uint256 indexed listingId, uint256 newPrice);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor(address _monaAIAddress) {
        owner = msg.sender;
        monaAIContract = MonaAI(_monaAIAddress);
        totalListings = 0;
    }

    /**
     * @dev Create a listing for an AI model
     */
    function createListing(uint256 _modelId, uint256 _price) public payable returns (uint256) {
        require(msg.value >= listingFee, "Insufficient listing fee");
        require(_price > 0, "Price must be greater than 0");

        // Verify model exists and sender is the creator
        (uint256 id, , , address creator, , bool isActive) = monaAIContract.models(_modelId);
        require(id > 0, "Model does not exist");
        require(creator == msg.sender, "Only model creator can list");
        require(isActive, "Model is not active");
        require(modelToListing[_modelId] == 0, "Model already listed");

        totalListings++;

        listings[totalListings] = Listing({
            id: totalListings,
            modelId: _modelId,
            seller: msg.sender,
            price: _price,
            isActive: true,
            purchases: 0
        });

        modelToListing[_modelId] = totalListings;
        userListings[msg.sender].push(totalListings);

        emit ListingCreated(totalListings, _modelId, msg.sender, _price);

        return totalListings;
    }

    /**
     * @dev Purchase access to an AI model
     */
    function purchaseModel(uint256 _listingId) public payable {
        Listing storage listing = listings[_listingId];

        require(listing.isActive, "Listing is not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot purchase own model");
        require(!hasPurchased[msg.sender][listing.modelId], "Already purchased");

        // Transfer payment to seller
        payable(listing.seller).transfer(listing.price);

        // Mark as purchased
        hasPurchased[msg.sender][listing.modelId] = true;
        listing.purchases++;

        emit ModelPurchased(_listingId, listing.modelId, msg.sender, listing.price);

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
    }

    /**
     * @dev Cancel a listing
     */
    function cancelListing(uint256 _listingId) public {
        Listing storage listing = listings[_listingId];

        require(listing.seller == msg.sender || msg.sender == owner, "Not authorized");
        require(listing.isActive, "Listing already inactive");

        listing.isActive = false;
        modelToListing[listing.modelId] = 0;

        emit ListingCancelled(_listingId);
    }

    /**
     * @dev Update listing price
     */
    function updatePrice(uint256 _listingId, uint256 _newPrice) public {
        Listing storage listing = listings[_listingId];

        require(listing.seller == msg.sender, "Only seller can update price");
        require(listing.isActive, "Listing is not active");
        require(_newPrice > 0, "Price must be greater than 0");

        listing.price = _newPrice;

        emit PriceUpdated(_listingId, _newPrice);
    }

    /**
     * @dev Get all active listings
     */
    function getActiveListings() public view returns (uint256[] memory) {
        uint256 activeCount = 0;

        // Count active listings
        for (uint256 i = 1; i <= totalListings; i++) {
            if (listings[i].isActive) {
                activeCount++;
            }
        }

        // Create array of active listing IDs
        uint256[] memory activeListings = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= totalListings; i++) {
            if (listings[i].isActive) {
                activeListings[index] = i;
                index++;
            }
        }

        return activeListings;
    }

    /**
     * @dev Check if user has purchased a model
     */
    function hasUserPurchased(address _user, uint256 _modelId) public view returns (bool) {
        return hasPurchased[_user][_modelId];
    }

    /**
     * @dev Update listing fee
     */
    function setListingFee(uint256 _newFee) public onlyOwner {
        listingFee = _newFee;
    }

    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
