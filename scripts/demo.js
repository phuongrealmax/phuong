const hre = require("hardhat");

/**
 * Demo script showcasing MonaAI platform features
 */
async function main() {
  console.log("🚀 MonaAI Platform Demo Starting...\n");

  // Get signers
  const [owner, user1, user2, user3] = await hre.ethers.getSigners();

  console.log("👥 Demo Accounts:");
  console.log("   Owner:", owner.address);
  console.log("   User1:", user1.address);
  console.log("   User2:", user2.address);
  console.log("   User3:", user3.address);
  console.log();

  // Deploy MonaAI Contract
  console.log("📝 Deploying MonaAI Contract...");
  const MonaAI = await hre.ethers.getContractFactory("MonaAI");
  const monaAI = await MonaAI.deploy();
  await monaAI.waitForDeployment();
  const monaAIAddress = await monaAI.getAddress();
  console.log("   ✅ MonaAI deployed at:", monaAIAddress);
  console.log();

  // Deploy Marketplace Contract
  console.log("📝 Deploying Marketplace Contract...");
  const Marketplace = await hre.ethers.getContractFactory("MonaAIMarketplace");
  const marketplace = await Marketplace.deploy(monaAIAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("   ✅ Marketplace deployed at:", marketplaceAddress);
  console.log();

  // Deploy Token Contract
  console.log("📝 Deploying MonaToken Contract...");
  const MonaToken = await hre.ethers.getContractFactory("MonaToken");
  const monaToken = await MonaToken.deploy(1000000); // 1M initial supply
  await monaToken.waitForDeployment();
  const tokenAddress = await monaToken.getAddress();
  console.log("   ✅ MonaToken deployed at:", tokenAddress);
  console.log();

  // Demo 1: Register AI Models
  console.log("🤖 Demo 1: Registering AI Models");
  console.log("   User1 registering 'GPT-Mona'...");
  let tx = await monaAI.connect(user1).registerModel("GPT-Mona", "QmGPTMona123");
  await tx.wait();
  console.log("   ✅ GPT-Mona registered");

  console.log("   User2 registering 'Image-Classifier-Pro'...");
  tx = await monaAI.connect(user2).registerModel("Image-Classifier-Pro", "QmImageClass456");
  await tx.wait();
  console.log("   ✅ Image-Classifier-Pro registered");

  console.log("   User3 registering 'Sentiment-Analyzer'...");
  tx = await monaAI.connect(user3).registerModel("Sentiment-Analyzer", "QmSentiment789");
  await tx.wait();
  console.log("   ✅ Sentiment-Analyzer registered");
  console.log();

  // Demo 2: Create Marketplace Listings
  console.log("🏪 Demo 2: Creating Marketplace Listings");
  const listingFee = await marketplace.listingFee();

  console.log("   User1 listing GPT-Mona for 0.5 ETH...");
  tx = await marketplace.connect(user1).createListing(
    1,
    hre.ethers.parseEther("0.5"),
    { value: listingFee }
  );
  await tx.wait();
  console.log("   ✅ Listing created");

  console.log("   User2 listing Image-Classifier-Pro for 1.2 ETH...");
  tx = await marketplace.connect(user2).createListing(
    2,
    hre.ethers.parseEther("1.2"),
    { value: listingFee }
  );
  await tx.wait();
  console.log("   ✅ Listing created");

  console.log("   User3 listing Sentiment-Analyzer for 0.3 ETH...");
  tx = await marketplace.connect(user3).createListing(
    3,
    hre.ethers.parseEther("0.3"),
    { value: listingFee }
  );
  await tx.wait();
  console.log("   ✅ Listing created");
  console.log();

  // Demo 3: Purchase Models
  console.log("🛒 Demo 3: Purchasing Models");
  console.log("   User2 purchasing GPT-Mona from User1...");
  tx = await marketplace.connect(user2).purchaseModel(
    1,
    { value: hre.ethers.parseEther("0.5") }
  );
  await tx.wait();
  console.log("   ✅ Model purchased");

  console.log("   User1 purchasing Sentiment-Analyzer from User3...");
  tx = await marketplace.connect(user1).purchaseModel(
    3,
    { value: hre.ethers.parseEther("0.3") }
  );
  await tx.wait();
  console.log("   ✅ Model purchased");
  console.log();

  // Demo 4: Token Operations
  console.log("🪙 Demo 4: MonaToken Operations");

  // Transfer tokens
  console.log("   Distributing tokens to users...");
  tx = await monaToken.transfer(user1.address, hre.ethers.parseEther("1000"));
  await tx.wait();
  tx = await monaToken.transfer(user2.address, hre.ethers.parseEther("1000"));
  await tx.wait();
  tx = await monaToken.transfer(user3.address, hre.ethers.parseEther("1000"));
  await tx.wait();
  console.log("   ✅ Tokens distributed");

  // Staking
  console.log("   User1 staking 500 MONA tokens...");
  tx = await monaToken.connect(user1).stake(hre.ethers.parseEther("500"));
  await tx.wait();
  console.log("   ✅ Tokens staked");

  // Governance Proposal
  console.log("   User1 creating governance proposal...");
  tx = await monaToken.connect(user1).createProposal("Reduce listing fee to 0.0005 ETH");
  await tx.wait();
  console.log("   ✅ Proposal created");

  console.log("   User2 voting on proposal...");
  tx = await monaToken.connect(user2).vote(1, true);
  await tx.wait();
  console.log("   ✅ Vote cast");
  console.log();

  // Display Final Stats
  console.log("📊 Final Statistics:");

  const totalModels = await monaAI.totalModels();
  console.log("   Total Models Registered:", totalModels.toString());

  const totalListings = await marketplace.totalListings();
  console.log("   Total Marketplace Listings:", totalListings.toString());

  const totalTokenSupply = await monaToken.totalSupply();
  console.log("   Total Token Supply:", hre.ethers.formatEther(totalTokenSupply), "MONA");

  const totalStaked = await monaToken.totalStaked();
  console.log("   Total Tokens Staked:", hre.ethers.formatEther(totalStaked), "MONA");

  const proposalCount = await monaToken.proposalCount();
  console.log("   Total Proposals:", proposalCount.toString());

  console.log();
  console.log("✨ Demo Completed Successfully!");
  console.log();
  console.log("📋 Contract Addresses:");
  console.log("   MonaAI:", monaAIAddress);
  console.log("   Marketplace:", marketplaceAddress);
  console.log("   MonaToken:", tokenAddress);
  console.log();
  console.log("💡 Next Steps:");
  console.log("   1. Update backend/.env with these contract addresses");
  console.log("   2. Start the backend server: cd backend && npm start");
  console.log("   3. Start the frontend: cd frontend && npm start");
  console.log("   4. Connect MetaMask and explore the platform!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
