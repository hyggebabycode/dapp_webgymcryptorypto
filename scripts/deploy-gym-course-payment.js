const fs = require("fs");
const path = require("path");

async function main() {
  const privateKey = (process.env.DEPLOYER_PRIVATE_KEY || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");

  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error(
      "DEPLOYER_PRIVATE_KEY khong hop le. Private key phai co dang 0x + 64 ky tu hex. Vi du: 0xabc123... du 66 ky tu tinh ca 0x.",
    );
  }

  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error(
      "Missing deployer account. Set DEPLOYER_PRIVATE_KEY in your .env file.",
    );
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deploying GymCoursePayment...");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "TEST");

  const GymCoursePayment = await ethers.getContractFactory("GymCoursePayment");
  const contract = await GymCoursePayment.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("GymCoursePayment deployed to:", address);

  const outputPath = path.join(
    __dirname,
    "..",
    "web_1",
    "js",
    "gym-course-payment-deployment.json",
  );

  const deployment = {
    network: "Oasis Sapphire Testnet",
    chainId: 23295,
    contractName: "GymCoursePayment",
    contractAddress: address,
    adminWallet: "0xC91DD3d721f7146e4DC759716b158546F2a4E551",
    deployedBy: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(outputPath, JSON.stringify(deployment, null, 2));
  console.log("Saved deployment info to:", outputPath);

  const frontendConfigPath = path.join(
    __dirname,
    "..",
    "web_1",
    "js",
    "web3-contract-config.js",
  );
  fs.writeFileSync(
    frontendConfigPath,
    `window.GYMHEART_PAYMENT_CONTRACT_ADDRESS = "${address}";\n`,
  );
  console.log("Updated frontend config:", frontendConfigPath);
  console.log("");
  console.log("Next step:");
  console.log("Reload web_1/services.html and test MetaMask payment.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
