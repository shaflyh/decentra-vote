// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DecentraVote {
    struct Voter {
        bool isRegistered;
        bool hasVoted;
    }

    mapping(address => Voter) public voters;
    mapping(bytes32 => uint256) public voteCount;

    address public admin;
    bytes32 public topic;
    bool public votingActive;

    event VoterRegistered(address voter);
    event VoteCasted(address voter, bytes32 choice);
    event VotingEnded();

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

    constructor(bytes32 _topic) {
        admin = msg.sender;
        topic = _topic;
        votingActive = false;
    }

    function registerVoter(address _voter) external onlyAdmin {
        require(!voters[_voter].isRegistered, "Voter already registered");
        voters[_voter].isRegistered = true;
        emit VoterRegistered(_voter);
    }

    function startVoting() external onlyAdmin {
        require(!votingActive, "Voting is already active");
        votingActive = true;
    }

    function endVoting() external onlyAdmin {
        require(votingActive, "Voting is not active");
        votingActive = false;
        emit VotingEnded();
    }

    function castVote(bytes32 _choice) external onlyRegistered onlyActive {
        require(!voters[msg.sender].hasVoted, "Voter already voted");
        voters[msg.sender].hasVoted = true;
        voteCount[_choice]++;
        emit VoteCasted(msg.sender, _choice);
    }

    function getResult(bytes32 _choice) external view returns (uint256) {
        require(!votingActive, "Voting is still active");
        return voteCount[_choice];
    }
}
