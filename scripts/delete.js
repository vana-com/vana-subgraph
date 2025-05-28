const { execSync } = require("child_process");

const network = process.argv[2];
const version = process.argv[3];

const command = `goldsky subgraph delete ${network}/${version}`;

execSync(command, { stdio: "inherit" });
