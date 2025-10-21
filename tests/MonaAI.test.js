const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MonaAI Contract", function () {
  let monaAI;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const MonaAI = await ethers.getContractFactory("MonaAI");
    monaAI = await MonaAI.deploy();
    await monaAI.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await monaAI.owner()).to.equal(owner.address);
    });

    it("Should initialize totalModels to 0", async function () {
      expect(await monaAI.totalModels()).to.equal(0);
    });
  });

  describe("Model Registration", function () {
    it("Should register a new model", async function () {
      const modelName = "GPT-Mona-1";
      const ipfsHash = "QmTest123456789";

      await expect(monaAI.connect(user1).registerModel(modelName, ipfsHash))
        .to.emit(monaAI, "ModelRegistered")
        .withArgs(1, modelName, user1.address);

      const model = await monaAI.getModel(1);
      expect(model.name).to.equal(modelName);
      expect(model.ipfsHash).to.equal(ipfsHash);
      expect(model.creator).to.equal(user1.address);
      expect(model.isActive).to.equal(true);
    });

    it("Should increment totalModels", async function () {
      await monaAI.connect(user1).registerModel("Model1", "QmHash1");
      expect(await monaAI.totalModels()).to.equal(1);

      await monaAI.connect(user1).registerModel("Model2", "QmHash2");
      expect(await monaAI.totalModels()).to.equal(2);
    });

    it("Should track user models", async function () {
      await monaAI.connect(user1).registerModel("Model1", "QmHash1");
      await monaAI.connect(user1).registerModel("Model2", "QmHash2");

      const userModels = await monaAI.getUserModels(user1.address);
      expect(userModels.length).to.equal(2);
      expect(userModels[0]).to.equal(1);
      expect(userModels[1]).to.equal(2);
    });
  });

  describe("Model Updates", function () {
    beforeEach(async function () {
      await monaAI.connect(user1).registerModel("TestModel", "QmHash1");
    });

    it("Should allow creator to update model", async function () {
      const newHash = "QmNewHash123";

      await expect(monaAI.connect(user1).updateModel(1, newHash))
        .to.emit(monaAI, "ModelUpdated")
        .withArgs(1, newHash);

      const model = await monaAI.getModel(1);
      expect(model.ipfsHash).to.equal(newHash);
    });

    it("Should not allow non-creator to update model", async function () {
      await expect(
        monaAI.connect(user2).updateModel(1, "QmNewHash")
      ).to.be.revertedWith("Only creator can update model");
    });

    it("Should not update inactive model", async function () {
      await monaAI.connect(user1).deactivateModel(1);

      await expect(
        monaAI.connect(user1).updateModel(1, "QmNewHash")
      ).to.be.revertedWith("Model is not active");
    });
  });

  describe("Model Deactivation", function () {
    beforeEach(async function () {
      await monaAI.connect(user1).registerModel("TestModel", "QmHash1");
    });

    it("Should allow creator to deactivate model", async function () {
      await expect(monaAI.connect(user1).deactivateModel(1))
        .to.emit(monaAI, "ModelDeactivated")
        .withArgs(1);

      const model = await monaAI.getModel(1);
      expect(model.isActive).to.equal(false);
    });

    it("Should allow owner to deactivate any model", async function () {
      await expect(monaAI.connect(owner).deactivateModel(1))
        .to.emit(monaAI, "ModelDeactivated")
        .withArgs(1);
    });

    it("Should not allow unauthorized deactivation", async function () {
      await expect(
        monaAI.connect(user2).deactivateModel(1)
      ).to.be.revertedWith("Not authorized");
    });
  });
});
