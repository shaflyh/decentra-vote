// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
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
    bool public votingActive;

    Proposal[] public proposals;
    mapping(address => Voter) public voters;

    event VoterRegistered(address voter);
    event VoteCasted(address voter, uint256 proposalIndex);
    event VotingStarted();
    event VotingEnded();
    event ProposalCreated(bytes32 name);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyRegistered() {
        require(voters[msg.sender].isRegistered, "Voter is not registered");
        _;
    }

    modifier onlyActive() {
        require(votingActive, "Voting is not active");
        _;
    }

    constructor(bytes32 _topic, bytes32[] memory proposalNames) {
        admin = msg.sender;
        topic = _topic;
        votingActive = false;

        // Initialize proposals
        for (uint256 i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({name: proposalNames[i], voteCount: 0}));
            emit ProposalCreated(proposalNames[i]);
        }
    }

    function registerVoter(address _voter) external onlyAdmin {
        require(!voters[_voter].isRegistered, "Voter already registered");
        voters[_voter].isRegistered = true;
        emit VoterRegistered(_voter);
    }

    function startVoting() external onlyAdmin {
        require(!votingActive, "Voting is already active");
        votingActive = true;
        emit VotingStarted();
    }

    function endVoting() external onlyAdmin {
        require(votingActive, "Voting is not active");
        votingActive = false;
        emit VotingEnded();
    }

    function castVote(
        uint256 _proposalIndex
    ) external onlyRegistered onlyActive nonReentrant {
        require(!voters[msg.sender].hasVoted, "Voter already voted");
        require(_proposalIndex < proposals.length, "Invalid proposal index");

        voters[msg.sender].hasVoted = true;
        voters[msg.sender].voteIndex = _proposalIndex;
        proposals[_proposalIndex].voteCount++;

        emit VoteCasted(msg.sender, _proposalIndex);
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
}
