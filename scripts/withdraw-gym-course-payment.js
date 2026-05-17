const fs = require("fs");
const path = require("path");

async function main() {
  const deploymentPath = path.join(
    __dirname,
    "..",
    "web_1",
    "js",
    "gym-course-payment-deployment.json",
  );

  if (!fs.existsSync(deploymentPath)) {
    throw new Error("Missing web_1/js/gym-course-payment-deployment.json. Deploy first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deployment.contractAddress;
  const [admin] = await ethers.getSigners();

  if (!admin) {
    throw new Error("Missing admin signer. Check DEPLOYER_PRIVATE_KEY in .env.");
  }

  const contract = await ethers.getContractAt(
    "GymCoursePayment",
    contractAddress,
    admin,
  );

  const owner = await contract.owner();
  if (owner.toLowerCase() !== admin.address.toLowerCase()) {
    throw new Error(
      `Only owner can withdraw. Owner is ${owner}, signer is ${admin.address}.`,
    );
  }

  const contractBalance = await ethers.provider.getBalance(contractAddress);
  console.log("Contract:", contractAddress);
  console.log("Admin:", admin.address);
  console.log("Contract balance:", ethers.formatEther(contractBalance), "TEST");

  if (contractBalance === 0n) {
    console.log("No funds to withdraw.");
    return;
  }

  const adminBefore = await ethers.provider.getBalance(admin.address);
  const tx = await contract.withdrawFunds();
  console.log("Withdraw tx:", tx.hash);
  await tx.wait();

  const adminAfter = await ethers.provider.getBalance(admin.address);
  const contractAfter = await ethers.provider.getBalance(contractAddress);

  console.log("Admin balance before:", ethers.formatEther(adminBefore), "TEST");
  console.log("Admin balance after:", ethers.formatEther(adminAfter), "TEST");
  console.log("Contract balance after:", ethers.formatEther(contractAfter), "TEST");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
