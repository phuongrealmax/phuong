const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MonaToken", function () {
  let monaToken;
  let owner;
  let user1;
  let user2;
  let user3;

  const INITIAL_SUPPLY = 1000000;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const MonaToken = await ethers.getContractFactory("MonaToken");
    monaToken = await MonaToken.deploy(INITIAL_SUPPLY);
    await monaToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await monaToken.owner()).to.equal(owner.address);
    });

    it("Should assign total supply to owner", async function () {
      const ownerBalance = await monaToken.balanceOf(owner.address);
      const totalSupply = await monaToken.totalSupply();
      expect(ownerBalance).to.equal(totalSupply);
    });

    it("Should have correct name and symbol", async function () {
      expect(await monaToken.name()).to.equal("MonaAI Token");
      expect(await monaToken.symbol()).to.equal("MONA");
    });

    it("Should have 18 decimals", async function () {
      expect(await monaToken.decimals()).to.equal(18);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const amount = ethers.parseEther("100");

      await monaToken.transfer(user1.address, amount);
      expect(await monaToken.balanceOf(user1.address)).to.equal(amount);

      await monaToken.connect(user1).transfer(user2.address, amount);
      expect(await monaToken.balanceOf(user2.address)).to.equal(amount);
      expect(await monaToken.balanceOf(user1.address)).to.equal(0);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialBalance = await monaToken.balanceOf(owner.address);

      await expect(
        monaToken.connect(user1).transfer(owner.address, ethers.parseEther("1"))
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should emit Transfer event", async function () {
      const amount = ethers.parseEther("100");

      await expect(monaToken.transfer(user1.address, amount))
        .to.emit(monaToken, "Transfer")
        .withArgs(owner.address, user1.address, amount);
    });
  });

  describe("Allowances", function () {
    it("Should approve tokens for delegated transfer", async function () {
      const amount = ethers.parseEther("100");

      await monaToken.approve(user1.address, amount);
      expect(await monaToken.allowance(owner.address, user1.address)).to.equal(amount);
    });

    it("Should allow delegated transfer", async function () {
      const amount = ethers.parseEther("100");

      await monaToken.approve(user1.address, amount);
      await monaToken.connect(user1).transferFrom(owner.address, user2.address, amount);

      expect(await monaToken.balanceOf(user2.address)).to.equal(amount);
    });

    it("Should fail if allowance exceeded", async function () {
      const amount = ethers.parseEther("100");

      await monaToken.approve(user1.address, amount);

      await expect(
        monaToken.connect(user1).transferFrom(
          owner.address,
          user2.address,
          ethers.parseEther("200")
        )
      ).to.be.revertedWith("Allowance exceeded");
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      // Transfer tokens to user1 for staking
      await monaToken.transfer(user1.address, ethers.parseEther("1000"));
    });

    it("Should allow users to stake tokens", async function () {
      const stakeAmount = ethers.parseEther("500");

      await monaToken.connect(user1).stake(stakeAmount);

      const stake = await monaToken.stakes(user1.address);
      expect(stake.amount).to.equal(stakeAmount);

      const balance = await monaToken.balanceOf(user1.address);
      expect(balance).to.equal(ethers.parseEther("500"));

      const totalStaked = await monaToken.totalStaked();
      expect(totalStaked).to.equal(stakeAmount);
    });

    it("Should calculate staking rewards", async function () {
      const stakeAmount = ethers.parseEther("1000");

      await monaToken.connect(user1).stake(stakeAmount);

      // Advance time by 1 year
      await time.increase(365 * 24 * 60 * 60);

      const reward = await monaToken.calculateReward(user1.address);

      // Should be approximately 10% (stakingRewardRate)
      const expectedReward = ethers.parseEther("100"); // 10% of 1000
      expect(reward).to.be.closeTo(expectedReward, ethers.parseEther("1"));
    });

    it("Should allow users to unstake and claim rewards", async function () {
      const stakeAmount = ethers.parseEther("500");

      await monaToken.connect(user1).stake(stakeAmount);

      // Advance time
      await time.increase(180 * 24 * 60 * 60); // 6 months

      const initialBalance = await monaToken.balanceOf(user1.address);

      await monaToken.connect(user1).unstake();

      const finalBalance = await monaToken.balanceOf(user1.address);

      // Should receive staked amount plus rewards
      expect(finalBalance).to.be.gt(initialBalance + stakeAmount);
    });

    it("Should fail if no stake exists", async function () {
      await expect(
        monaToken.connect(user2).unstake()
      ).to.be.revertedWith("No stake found");
    });
  });

  describe("Governance", function () {
    beforeEach(async function () {
      // Distribute tokens for voting
      await monaToken.transfer(user1.address, ethers.parseEther("200"));
      await monaToken.transfer(user2.address, ethers.parseEther("150"));
      await monaToken.transfer(user3.address, ethers.parseEther("100"));
    });

    it("Should allow creating proposals", async function () {
      await expect(
        monaToken.connect(user1).createProposal("Reduce listing fee")
      )
        .to.emit(monaToken, "ProposalCreated")
        .withArgs(1, user1.address, "Reduce listing fee");

      const proposal = await monaToken.getProposalResults(1);
      expect(proposal.proposer).to.equal(user1.address);
      expect(proposal.description).to.equal("Reduce listing fee");
    });

    it("Should fail if proposer doesn't have enough tokens", async function () {
      await expect(
        monaToken.connect(user3).createProposal("Test proposal")
      ).to.be.revertedWith("Need 100 MONA to propose");
    });

    it("Should allow voting on proposals", async function () {
      await monaToken.connect(user1).createProposal("Test proposal");

      await expect(
        monaToken.connect(user2).vote(1, true)
      )
        .to.emit(monaToken, "Voted")
        .withArgs(1, user2.address, true, ethers.parseEther("150"));

      const proposal = await monaToken.getProposalResults(1);
      expect(proposal.votesFor).to.equal(ethers.parseEther("150"));
    });

    it("Should prevent double voting", async function () {
      await monaToken.connect(user1).createProposal("Test proposal");

      await monaToken.connect(user2).vote(1, true);

      await expect(
        monaToken.connect(user2).vote(1, false)
      ).to.be.revertedWith("Already voted");
    });

    it("Should count staked tokens in voting power", async function () {
      await monaToken.connect(user1).createProposal("Test proposal");

      // Stake some tokens
      await monaToken.connect(user2).stake(ethers.parseEther("50"));

      await monaToken.connect(user2).vote(1, true);

      const proposal = await monaToken.getProposalResults(1);
      // Voting power should include both balance and staked tokens
      expect(proposal.votesFor).to.equal(ethers.parseEther("150"));
    });

    it("Should not allow voting after proposal ends", async function () {
      await monaToken.connect(user1).createProposal("Test proposal");

      // Advance time past proposal duration (7 days)
      await time.increase(8 * 24 * 60 * 60);

      await expect(
        monaToken.connect(user2).vote(1, true)
      ).to.be.revertedWith("Voting ended");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint new tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      const initialSupply = await monaToken.totalSupply();

      await monaToken.mint(user1.address, mintAmount);

      const finalSupply = await monaToken.totalSupply();
      expect(finalSupply).to.equal(initialSupply + mintAmount);

      const balance = await monaToken.balanceOf(user1.address);
      expect(balance).to.equal(mintAmount);
    });

    it("Should fail if non-owner tries to mint", async function () {
      await expect(
        monaToken.connect(user1).mint(user2.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Only owner");
    });
  });
});
