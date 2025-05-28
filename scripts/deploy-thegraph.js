const { execSync } = require("child_process");

const network = process.argv[2];

if (!network) {
  console.error("Error: Network is required.");
  process.exit(1);
}

// Define deploy keys for each network
const deployKeys = {
  vana: "to_set",
  moksha: "ea5c595a951d96d5ee5fc64496807738",
};

// Get the correct deploy key
const deployKey = deployKeys[network];

if (!deployKey) {
  console.error(`Error: No deploy key found for network "${network}".`);
  process.exit(1);
}

const command = `npx graph deploy ${network} --deploy-key ${deployKey}`;

try {
  console.log(`Deploying to ${network}...`);
  execSync(command, { stdio: "inherit" });
  console.log("Deployment successful!");
} catch (error) {
  console.error("Deployment failed:", error.message);
  process.exit(1);
}
