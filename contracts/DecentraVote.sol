// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DecentraVote is ReentrancyGuard {
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 voteIndex;
    }

    struct Proposal {
        bytes32 name;
        uint256 voteCount;
    }

    address public admin;
    bytes32 public topic;
    uint256 public votingStartTime;
    uint256 public votingEndTime;

    Proposal[] public proposals;
    mapping(address => Voter) public voters;
    uint256 public totalRegisteredVoters;

    event VoterRegistered(address voter);
    event VoteCasted(address voter, uint256 proposalIndex);
    event ProposalCreated(bytes32 name);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyRegistered() {
        require(voters[msg.sender].isRegistered, "Voter is not registered");
        _;
    }

    modifier onlyDuringVotingPeriod() {
        require(
            block.timestamp >= votingStartTime,
            "Voting has not started yet"
        );
        require(block.timestamp <= votingEndTime, "Voting has ended");
        _;
    }

    constructor(
        bytes32 _topic,
        bytes32[] memory proposalNames,
        uint256 _votingStartTime,
        uint256 _votingEndTime
    ) {
        require(
            _votingEndTime > _votingStartTime,
            "End time must be after start time"
        );

        admin = msg.sender;
        topic = _topic;
        votingStartTime = _votingStartTime;
        votingEndTime = _votingEndTime;

        // Initialize proposals
        for (uint256 i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({name: proposalNames[i], voteCount: 0}));
            emit ProposalCreated(proposalNames[i]);
        }
    }

    function registerVoter(address _voter) external onlyAdmin {
        require(!voters[_voter].isRegistered, "Voter already registered");
        voters[_voter].isRegistered = true;
        totalRegisteredVoters++;
        emit VoterRegistered(_voter);
    }

    function batchRegisterVoters(
        address[] calldata _voters
    ) external onlyAdmin {
        for (uint256 i = 0; i < _voters.length; i++) {
            if (!voters[_voters[i]].isRegistered) {
                voters[_voters[i]].isRegistered = true;
                totalRegisteredVoters++;
                emit VoterRegistered(_voters[i]);
            }
        }
    }

    function castVote(
        uint256 _proposalIndex
    ) external onlyRegistered onlyDuringVotingPeriod nonReentrant {
        require(!voters[msg.sender].hasVoted, "Voter already voted");
        require(_proposalIndex < proposals.length, "Invalid proposal index");

        voters[msg.sender].hasVoted = true;
        voters[msg.sender].voteIndex = _proposalIndex;
        proposals[_proposalIndex].voteCount++;

        emit VoteCasted(msg.sender, _proposalIndex);
    }

    function isVotingActive() public view returns (bool) {
        return
            block.timestamp >= votingStartTime &&
            block.timestamp <= votingEndTime;
    }

    function getTimeUntilVotingStarts() public view returns (uint256) {
        if (block.timestamp >= votingStartTime) return 0;
        return votingStartTime - block.timestamp;
    }

    function getTimeUntilVotingEnds() public view returns (uint256) {
        if (block.timestamp >= votingEndTime) return 0;
        return votingEndTime - block.timestamp;
    }

    function winningProposal() public view returns (uint256 winningIndex) {
        uint256 highestVotes = 0;
        for (uint256 i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > highestVotes) {
                highestVotes = proposals[i].voteCount;
                winningIndex = i;
            }
        }
    }

    function winnerName() external view returns (bytes32) {
        return proposals[winningProposal()].name;
    }

    // Frontend helper functions
    function getProposalCount() external view returns (uint256) {
        return proposals.length;
    }

    function getVoterInfo(
        address _voter
    )
        external
        view
        returns (bool isRegistered, bool hasVoted, uint256 voteIndex)
    {
        Voter memory voter = voters[_voter];
        return (voter.isRegistered, voter.hasVoted, voter.voteIndex);
    }

    function getVotingStats()
        external
        view
        returns (
            uint256 totalVotes,
            uint256 registeredVoters,
            bool votingActive
        )
    {
        uint256 totalVotesCast = 0;

        for (uint256 i = 0; i < proposals.length; i++) {
            totalVotesCast += proposals[i].voteCount;
        }

        return (totalVotesCast, totalRegisteredVoters, isVotingActive());
    }

    function getAllProposals()
        external
        view
        returns (bytes32[] memory names, uint256[] memory voteCounts)
    {
        names = new bytes32[](proposals.length);
        voteCounts = new uint256[](proposals.length);

        for (uint256 i = 0; i < proposals.length; i++) {
            names[i] = proposals[i].name;
            voteCounts[i] = proposals[i].voteCount;
        }

        return (names, voteCounts);
    }

    function addProposal(bytes32 _name) external onlyAdmin {
        require(
            block.timestamp < votingStartTime,
            "Cannot add proposal after voting has started"
        );
        proposals.push(Proposal({name: _name, voteCount: 0}));
        emit ProposalCreated(_name);
    }
}
