import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";

export default buildModule("DecentraVoteModule", (m) => {
  const topic = m.getParameter(
    "topic",
    ethers.encodeBytes32String("Election 2025")
  );

  const decentraVote = m.contract("DecentraVote", [topic]);

  return { decentraVote };
});
