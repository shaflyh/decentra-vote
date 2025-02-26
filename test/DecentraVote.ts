import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("DecentraVote", function () {
  // Deploy the contract before each test using a fixture
  async function deployVotingFixture() {
    const [admin, voter1, voter2, nonRegistered] =
      await hre.ethers.getSigners();
    const topic = hre.ethers.encodeBytes32String("Election 2025");

    const DecentraVote = await hre.ethers.getContractFactory("DecentraVote");
    const voting = await DecentraVote.deploy(topic);
    await voting.waitForDeployment();

    return { voting, admin, voter1, voter2, nonRegistered, topic };
  }

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      const { voting, admin } = await loadFixture(deployVotingFixture);
      expect(await voting.admin()).to.equal(admin.address);
    });

    it("Should set the correct voting topic", async function () {
      const { voting, topic } = await loadFixture(deployVotingFixture);
      expect(await voting.topic()).to.equal(topic);
    });

    it("Should start with voting inactive", async function () {
      const { voting } = await loadFixture(deployVotingFixture);
      expect(await voting.votingActive()).to.be.false;
    });
  });

  describe("Voter Registration", function () {
    it("Should allow admin to register voters", async function () {
      const { voting, admin, voter1 } = await loadFixture(deployVotingFixture);
      await expect(voting.registerVoter(voter1.address))
        .to.emit(voting, "VoterRegistered")
        .withArgs(voter1.address);
      const voter = await voting.voters(voter1.address);
      expect(voter.isRegistered).to.be.true;
    });

    it("Should prevent double registration", async function () {
      const { voting, admin, voter1 } = await loadFixture(deployVotingFixture);
      await voting.registerVoter(voter1.address);
      await expect(voting.registerVoter(voter1.address)).to.be.revertedWith(
        "Voter already registered"
      );
    });

    it("Should prevent non-admins from registering voters", async function () {
      const { voting, voter1, voter2 } = await loadFixture(deployVotingFixture);
      await expect(
        voting.connect(voter1).registerVoter(voter2.address)
      ).to.be.revertedWith("Only admin can call this function");
    });
  });

  describe("Voting Process", function () {
    it("Should allow admin to start and stop voting", async function () {
      const { voting, admin } = await loadFixture(deployVotingFixture);

      await expect(voting.startVoting()).to.not.be.reverted;
      expect(await voting.votingActive()).to.be.true;

      await expect(voting.endVoting()).to.emit(voting, "VotingEnded");
      expect(await voting.votingActive()).to.be.false;
    });

    it("Should prevent non-admins from starting/stopping voting", async function () {
      const { voting, voter1 } = await loadFixture(deployVotingFixture);
      await expect(voting.connect(voter1).startVoting()).to.be.revertedWith(
        "Only admin can call this function"
      );
      await expect(voting.connect(voter1).endVoting()).to.be.revertedWith(
        "Only admin can call this function"
      );
    });

    it("Should allow registered voters to cast votes", async function () {
      const { voting, admin, voter1 } = await loadFixture(deployVotingFixture);
      const choice = hre.ethers.encodeBytes32String("CandidateA");

      await voting.registerVoter(voter1.address);
      await voting.startVoting();
      await expect(voting.connect(voter1).castVote(choice))
        .to.emit(voting, "VoteCasted")
        .withArgs(voter1.address, choice);
      const voter = await voting.voters(voter1.address);
      expect(voter.hasVoted).to.be.true;
    });

    it("Should prevent non-registered voters from voting", async function () {
      const { voting, nonRegistered } = await loadFixture(deployVotingFixture);
      const choice = hre.ethers.encodeBytes32String("CandidateA");
      await voting.startVoting();
      await expect(
        voting.connect(nonRegistered).castVote(choice)
      ).to.be.revertedWith("Voter is not registered");
    });

    it("Should prevent voters from voting twice", async function () {
      const { voting, voter1 } = await loadFixture(deployVotingFixture);
      const choice = hre.ethers.encodeBytes32String("CandidateA");

      await voting.registerVoter(voter1.address);
      await voting.startVoting();
      await voting.connect(voter1).castVote(choice);
      await expect(voting.connect(voter1).castVote(choice)).to.be.revertedWith(
        "Voter already voted"
      );
    });

    it("Should count votes correctly", async function () {
      const { voting, voter1, voter2 } = await loadFixture(deployVotingFixture);
      const choice = hre.ethers.encodeBytes32String("CandidateA");

      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      await voting.startVoting();
      await voting.connect(voter1).castVote(choice);
      await voting.connect(voter2).castVote(choice);
      await voting.endVoting();

      expect(await voting.getResult(choice)).to.equal(2);
    });
  });

  describe("Security Considerations", function () {
    it("Should prevent voting when voting is inactive", async function () {
      const { voting, voter1 } = await loadFixture(deployVotingFixture);
      const choice = hre.ethers.encodeBytes32String("CandidateA");

      await voting.registerVoter(voter1.address);
      await expect(voting.connect(voter1).castVote(choice)).to.be.revertedWith(
        "Voting is not active"
      );
    });

    it("Should prevent getting results while voting is active", async function () {
      const { voting, admin } = await loadFixture(deployVotingFixture);
      const choice = hre.ethers.encodeBytes32String("CandidateA");

      await voting.startVoting();
      await expect(voting.getResult(choice)).to.be.revertedWith(
        "Voting is still active"
      );
    });
  });
});
