const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MonaAIMarketplace", function () {
  let monaAI;
  let marketplace;
  let owner;
  let seller;
  let buyer;

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();

    // Deploy MonaAI contract
    const MonaAI = await ethers.getContractFactory("MonaAI");
    monaAI = await MonaAI.deploy();
    await monaAI.waitForDeployment();

    // Deploy Marketplace contract
    const Marketplace = await ethers.getContractFactory("MonaAIMarketplace");
    marketplace = await Marketplace.deploy(await monaAI.getAddress());
    await marketplace.waitForDeployment();

    // Register a model
    await monaAI.connect(seller).registerModel("Test Model", "QmTestHash");
  });

  describe("Listing Creation", function () {
    it("Should create a listing", async function () {
      const listingFee = await marketplace.listingFee();
      const price = ethers.parseEther("1.0");

      await expect(
        marketplace.connect(seller).createListing(1, price, { value: listingFee })
      )
        .to.emit(marketplace, "ListingCreated")
        .withArgs(1, 1, seller.address, price);

      const listing = await marketplace.listings(1);
      expect(listing.price).to.equal(price);
      expect(listing.isActive).to.be.true;
    });

    it("Should fail if listing fee not paid", async function () {
      const price = ethers.parseEther("1.0");

      await expect(
        marketplace.connect(seller).createListing(1, price, { value: 0 })
      ).to.be.revertedWith("Insufficient listing fee");
    });

    it("Should fail if not model creator", async function () {
      const listingFee = await marketplace.listingFee();
      const price = ethers.parseEther("1.0");

      await expect(
        marketplace.connect(buyer).createListing(1, price, { value: listingFee })
      ).to.be.revertedWith("Only model creator can list");
    });
  });

  describe("Model Purchase", function () {
    beforeEach(async function () {
      const listingFee = await marketplace.listingFee();
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing(1, price, { value: listingFee });
    });

    it("Should allow purchase of listed model", async function () {
      const price = ethers.parseEther("1.0");

      await expect(
        marketplace.connect(buyer).purchaseModel(1, { value: price })
      )
        .to.emit(marketplace, "ModelPurchased")
        .withArgs(1, 1, buyer.address, price);

      const hasPurchased = await marketplace.hasPurchased(buyer.address, 1);
      expect(hasPurchased).to.be.true;
    });

    it("Should fail if insufficient payment", async function () {
      const lowPrice = ethers.parseEther("0.5");

      await expect(
        marketplace.connect(buyer).purchaseModel(1, { value: lowPrice })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should prevent duplicate purchase", async function () {
      const price = ethers.parseEther("1.0");

      await marketplace.connect(buyer).purchaseModel(1, { value: price });

      await expect(
        marketplace.connect(buyer).purchaseModel(1, { value: price })
      ).to.be.revertedWith("Already purchased");
    });
  });

  describe("Listing Management", function () {
    beforeEach(async function () {
      const listingFee = await marketplace.listingFee();
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing(1, price, { value: listingFee });
    });

    it("Should allow seller to cancel listing", async function () {
      await expect(marketplace.connect(seller).cancelListing(1))
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(1);

      const listing = await marketplace.listings(1);
      expect(listing.isActive).to.be.false;
    });

    it("Should allow seller to update price", async function () {
      const newPrice = ethers.parseEther("2.0");

      await expect(marketplace.connect(seller).updatePrice(1, newPrice))
        .to.emit(marketplace, "PriceUpdated")
        .withArgs(1, newPrice);

      const listing = await marketplace.listings(1);
      expect(listing.price).to.equal(newPrice);
    });
  });
});
