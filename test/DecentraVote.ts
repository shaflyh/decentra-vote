import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("DecentraVote", function () {
  async function deployVotingFixture() {
    const [admin, voter1, voter2, voter3, nonRegistered] =
      await hre.ethers.getSigners();
    const topic = hre.ethers.encodeBytes32String("Election 2025");

    const proposalNames = [
      hre.ethers.encodeBytes32String("Candidate A"),
      hre.ethers.encodeBytes32String("Candidate B"),
      hre.ethers.encodeBytes32String("Candidate C"),
    ];

    const DecentraVote = await hre.ethers.getContractFactory("DecentraVote");
    const voting = await DecentraVote.deploy(topic, proposalNames);
    await voting.waitForDeployment();

    return {
      voting,
      admin,
      voter1,
      voter2,
      voter3,
      nonRegistered,
      topic,
      proposalNames,
    };
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

    it("Should initialize proposals correctly", async function () {
      const { voting, proposalNames } = await loadFixture(deployVotingFixture);

      for (let i = 0; i < proposalNames.length; i++) {
        const proposal = await voting.proposals(i);
        expect(proposal.name).to.equal(proposalNames[i]);
        expect(proposal.voteCount).to.equal(0);
      }
    });

    it("Should start with voting inactive", async function () {
      const { voting } = await loadFixture(deployVotingFixture);
      expect(await voting.votingActive()).to.be.false;
    });
  });

  describe("Voter Registration", function () {
    it("Should allow admin to register voters", async function () {
      const { voting, voter1 } = await loadFixture(deployVotingFixture);
      await expect(voting.registerVoter(voter1.address))
        .to.emit(voting, "VoterRegistered")
        .withArgs(voter1.address);
      const voter = await voting.voters(voter1.address);
      expect(voter.isRegistered).to.be.true;
    });

    it("Should prevent double registration", async function () {
      const { voting, voter1 } = await loadFixture(deployVotingFixture);
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
      const { voting } = await loadFixture(deployVotingFixture);

      await expect(voting.startVoting()).to.emit(voting, "VotingStarted");
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
      const { voting, voter1 } = await loadFixture(deployVotingFixture);
      const proposalIndex = 1; // Voting for Candidate B

      await voting.registerVoter(voter1.address);
      await voting.startVoting();
      await expect(voting.connect(voter1).castVote(proposalIndex))
        .to.emit(voting, "VoteCasted")
        .withArgs(voter1.address, proposalIndex);
      const voter = await voting.voters(voter1.address);
      expect(voter.hasVoted).to.be.true;
    });

    it("Should prevent non-registered voters from voting", async function () {
      const { voting, nonRegistered } = await loadFixture(deployVotingFixture);
      const proposalIndex = 0;
      await voting.startVoting();
      await expect(
        voting.connect(nonRegistered).castVote(proposalIndex)
      ).to.be.revertedWith("Voter is not registered");
    });

    it("Should prevent voters from voting twice", async function () {
      const { voting, voter1 } = await loadFixture(deployVotingFixture);
      const proposalIndex = 2; // Voting for Candidate C

      await voting.registerVoter(voter1.address);
      await voting.startVoting();
      await voting.connect(voter1).castVote(proposalIndex);
      await expect(
        voting.connect(voter1).castVote(proposalIndex)
      ).to.be.revertedWith("Voter already voted");
    });

    it("Should count votes correctly", async function () {
      const { voting, voter1, voter2 } = await loadFixture(deployVotingFixture);
      const proposalIndex = 1;

      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      await voting.startVoting();
      await voting.connect(voter1).castVote(proposalIndex);
      await voting.connect(voter2).castVote(proposalIndex);
      await voting.endVoting();

      const proposal = await voting.proposals(proposalIndex);
      expect(proposal.voteCount).to.equal(2);
    });
  });

  describe("Winner Calculation", function () {
    it("Should return the correct winning proposal", async function () {
      const { voting, voter1, voter2 } = await loadFixture(deployVotingFixture);
      const proposalIndex = 0;

      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      await voting.startVoting();
      await voting.connect(voter1).castVote(proposalIndex);
      await voting.connect(voter2).castVote(proposalIndex);
      await voting.endVoting();

      expect(await voting.winningProposal()).to.equal(proposalIndex);
    });
  });
});
