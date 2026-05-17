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
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contract = await ethers.getContractAt(
    "GymCoursePayment",
    deployment.contractAddress,
  );
  const latestBlock = await ethers.provider.getBlockNumber();
  const fromBlock = Math.max(0, latestBlock - 100);
  const events = await contract.queryFilter(
    contract.filters.CoursePaid(),
    fromBlock,
    latestBlock,
  );

  if (events.length === 0) {
    console.log("No CoursePaid events found.");
    return;
  }

  for (const event of events) {
    console.log({
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
      student: event.args.student,
      courseId: event.args.courseId.toString(),
      amountTEST: ethers.formatEther(event.args.amount),
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
