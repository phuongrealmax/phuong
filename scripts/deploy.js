const hre = require("hardhat");

async function main() {
  console.log("Deploying MonaAI contract...");

  // Get the contract factory
  const MonaAI = await hre.ethers.getContractFactory("MonaAI");

  // Deploy the contract
  const monaAI = await MonaAI.deploy();

  // Wait for deployment to finish
  await monaAI.waitForDeployment();

  const address = await monaAI.getAddress();

  console.log("MonaAI contract deployed to:", address);
  console.log("Save this address for your backend configuration!");

  // Verify deployment
  const owner = await monaAI.owner();
  const totalModels = await monaAI.totalModels();

  console.log("Contract owner:", owner);
  console.log("Total models:", totalModels.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
