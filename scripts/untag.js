const { execSync } = require("child_process");

const network = process.argv[2];
const version = process.argv[3];
const tag = process.argv[4];

const command = `goldsky subgraph tag delete ${network}/${version} --tag ${tag}`;

execSync(command, { stdio: "inherit" });
