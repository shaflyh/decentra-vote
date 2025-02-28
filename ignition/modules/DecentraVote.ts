import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";

export default buildModule("DecentraVoteModule", (m) => {
  // Parameters with defaults
  const topic = m.getParameter(
    "topic",
    ethers.encodeBytes32String("Election 2025")
  );

  // Default proposal names (example: "Candidate A", "Candidate B", "Candidate C")
  const proposalNames = m.getParameter("proposalNames", [
    ethers.encodeBytes32String("Candidate A"),
    ethers.encodeBytes32String("Candidate B"),
    ethers.encodeBytes32String("Candidate C"),
  ]);

  // Default voting period: starts 1 day from deployment and lasts for 7 days
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const votingStartTime = m.getParameter(
    "votingStartTime",
    currentTimestamp + 86400 // 1 day from now
  );

  const votingEndTime = m.getParameter(
    "votingEndTime",
    currentTimestamp + 86400 * 8 // 8 days from now (7 days of voting)
  );

  // Deploy the contract with all parameters
  const decentraVote = m.contract("DecentraVote", [
    topic,
    proposalNames,
    votingStartTime,
    votingEndTime,
  ]);

  return { decentraVote };
});
