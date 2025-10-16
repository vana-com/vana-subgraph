const fs = require("fs");
const path = require("path");
const https = require("https");

const network = process.argv[2];

if (!network || !["moksha", "vana"].includes(network)) {
  console.error("❌ Usage: yarn fetch-abis:<network>");
  console.error("   Example: yarn fetch-abis:moksha");
  process.exit(1);
}

// Block explorer API endpoints (Vanascan v2 API)
const EXPLORERS = {
  moksha: "https://moksha.vanascan.io/api/v2",
  vana: "https://vanascan.io/api/v2",
};

// Skip list for addresses that should not be fetched
const SKIP_ADDRESSES = [
  "0x0000000000000000000000000000000000000000", // Dummy address
  "0xc2a0d530e57B1275fbce908031DA636f95EA1E38", // Skip reason here
].map((addr) => addr.toLowerCase());

// Parse subgraph YAML to extract contracts
function parseSubgraphYaml(network) {
  const projectRoot = path.join(__dirname, "..");

  // Try subgraph.yaml first (if already prepared), otherwise use network-specific file
  let yamlPath = path.join(projectRoot, "subgraph.yaml");
  if (!fs.existsSync(yamlPath)) {
    yamlPath = path.join(projectRoot, `subgraph.${network}.yaml`);
  }

  if (!fs.existsSync(yamlPath)) {
    throw new Error(
      `Subgraph YAML not found: subgraph.yaml or subgraph.${network}.yaml`,
    );
  }

  console.log(`📖 Reading ${path.basename(yamlPath)}...`);

  const yaml = fs.readFileSync(yamlPath, "utf8");
  const lines = yaml.split("\n");
  const contracts = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Look for start of a dataSource: "- kind: ethereum/contract"
    if (line.trim() === "- kind: ethereum/contract") {
      let dataSourceName = null;
      let address = null;
      let abiFile = null;

      // Parse this dataSource block
      let hasEndBlock = false;

      i++;
      while (i < lines.length) {
        const currentLine = lines[i].trim();

        // Stop if we hit the next dataSource or templates section
        if (
          currentLine === "- kind: ethereum/contract" ||
          currentLine === "templates:"
        ) {
          i--; // Step back so outer loop processes this line
          break;
        }

        // Get dataSource name: "name: DataRegistryImplementationV1"
        if (currentLine.startsWith("name:") && !dataSourceName) {
          dataSourceName = currentLine.split("name:")[1].trim();
        }

        // Get address: 'address: "0x..."'
        if (currentLine.startsWith("address:")) {
          const match = currentLine.match(/address:\s*["']?(0x[a-fA-F0-9]{40})["']?/);
          if (match) {
            address = match[1];
          }
        }

        // Check for endBlock (indicates contract was upgraded, skip it)
        if (currentLine.startsWith("endBlock:")) {
          hasEndBlock = true;
        }

        // Get ABI file when we're in the abis section and name matches dataSource name
        if (currentLine.startsWith("- name:")) {
          const abiName = currentLine.split("- name:")[1].trim();

          // Check if this ABI name matches the dataSource name
          if (abiName === dataSourceName) {
            // Look for the file: line right after
            i++;
            if (i < lines.length) {
              const fileLine = lines[i].trim();
              if (fileLine.startsWith("file:")) {
                const fileMatch = fileLine.match(/file:\s*\.\/abis\/(.+\.json)/);
                if (fileMatch) {
                  abiFile = fileMatch[1].replace(".json", "");
                }
              }
            }
            i--; // Step back since we'll increment at end of loop
          }
        }

        i++;
      }

      // Only add contracts without endBlock (current/active contracts)
      if (address && abiFile && dataSourceName && !hasEndBlock) {
        contracts.push({
          name: dataSourceName,
          address: address,
          abiPath: abiFile,
        });
      }
    }

    i++;
  }

  return contracts;
}

// Fetch contract info from Vanascan v2 API
async function fetchContractInfo(address, explorerUrl) {
  return new Promise((resolve, reject) => {
    const url = `${explorerUrl}/smart-contracts/${address}`;

    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

// Get implementation address for proxy contracts
async function getImplementationAddress(proxyAddress, explorerUrl) {
  const contractInfo = await fetchContractInfo(proxyAddress, explorerUrl);

  if (contractInfo.implementations?.[0]?.address) {
    return contractInfo.implementations[0].address;
  }

  return null; // Not a proxy or no implementation found
}

// Fetch ABI from Vanascan v2 API
async function fetchABI(address, explorerUrl) {
  const contractInfo = await fetchContractInfo(address, explorerUrl);

  if (!contractInfo.abi) {
    throw new Error(`No ABI found for contract ${address}`);
  }

  return contractInfo.abi;
}

// Main function
async function main() {
  const explorerUrl = EXPLORERS[network];

  console.log(`\n📡 Fetching ABIs for ${network} from ${explorerUrl}\n`);

  // Parse YAML to get contracts
  const contracts = parseSubgraphYaml(network);

  if (contracts.length === 0) {
    console.warn(`⚠️  No contracts found in subgraph YAML`);
    console.log("✅ Skipping ABI fetch\n");
    return;
  }

  console.log(`Found ${contracts.length} contracts to fetch\n`);

  let fetchedCount = 0;
  let errorCount = 0;
  const processedAddresses = new Set();

  for (const contract of contracts) {
    const { name, address, abiPath } = contract;
    const abiFile = path.join(__dirname, "..", "abis", `${abiPath}.json`);

    // Skip if address is in skip list
    if (SKIP_ADDRESSES.includes(address.toLowerCase())) {
      console.log(`  ⏭️  Skipping ${name} (address in skip list)`);
      continue;
    }

    // Skip if we already fetched this address (same address used for multiple versions)
    if (processedAddresses.has(`${address}-${abiPath}`)) {
      console.log(`  ⏭️  Skipping ${name} (already fetched)`);
      continue;
    }

    try {
      console.log(`  Fetching ${name} (${address})...`);

      // Try to get implementation address for proxy contracts
      const implementationAddress = await getImplementationAddress(
        address,
        explorerUrl,
      );

      let abiAddress = address;
      if (implementationAddress) {
        console.log(`    📋 Detected proxy, using implementation: ${implementationAddress}`);
        abiAddress = implementationAddress;
      }

      // Fetch ABI from the correct address
      const abi = await fetchABI(abiAddress, explorerUrl);

      // Ensure directory exists
      const dir = path.dirname(abiFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write ABI to file
      fs.writeFileSync(abiFile, JSON.stringify(abi, null, 2));

      console.log(`  ✅ Saved to abis/${abiPath}.json`);
      fetchedCount++;
      processedAddresses.add(`${address}-${abiPath}`);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 250));
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log("\n" + "─".repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   Fetched: ${fetchedCount}`);
  if (errorCount > 0) {
    console.log(`   Errors:  ${errorCount}`);
  }
  console.log("─".repeat(50));
  console.log("");

  if (errorCount > 0) {
    console.error("⚠️  Some ABIs failed to fetch. Check errors above.");
    process.exit(1);
  }

  console.log("✅ All ABIs fetched successfully!\n");
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error.message);
  process.exit(1);
});
