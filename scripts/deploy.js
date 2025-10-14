const { execSync } = require("child_process");

const network = process.argv[2];
const version = process.argv[3];

// Validate arguments
if (!network || !version) {
  console.error("❌ Usage: yarn deploy:<network> <version>");
  console.error("   Example: yarn deploy:moksha 7.0.15");
  process.exit(1);
}

// Check if running in CI environment
const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

// Main deployment function
(async () => {
console.log(`\n🚀 Starting deployment for ${network} v${version}\n`);

// Skip git checks in CI (GitHub Actions will handle it)
if (!isCI) {
  // 1. Check for uncommitted changes
  console.log("🔍 Checking for uncommitted changes...");
  try {
    const status = execSync("git status --porcelain").toString();
    if (status) {
      console.error("❌ You have uncommitted changes:");
      console.log(status);
      console.error("\nOptions:");
      console.error(`  1. Auto-commit with message: "${version}"`);
      console.error("  2. Cancel and commit manually");

      // Prompt user for choice
      process.stdout.write("\nChoose option (1 or 2): ");

      const readline = require("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const choice = await new Promise((resolve) => {
        rl.question("", (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      });

      if (choice === "1") {
        console.log(`\n📝 Auto-committing with message: "${version}"`);
        try {
          execSync("git add .", { stdio: "inherit" });
          execSync(`git commit -m "${version}"`, { stdio: "inherit" });
          console.log("✅ Changes committed successfully");

          // Also push the commit
          const currentBranch = execSync("git branch --show-current").toString().trim();
          console.log(`📤 Pushing commit to remote...`);
          execSync(`git push origin ${currentBranch}`, { stdio: "inherit" });
          console.log("✅ Commit pushed successfully\n");
        } catch (commitError) {
          console.error("❌ Failed to commit/push changes:", commitError.message);
          process.exit(1);
        }
      } else if (choice === "2") {
        console.error("\n❌ Deployment cancelled. Please commit manually:");
        console.error("  git add .");
        console.error('  git commit -m "Your commit message"');
        process.exit(1);
      } else {
        console.error("\n❌ Invalid choice. Deployment cancelled.");
        process.exit(1);
      }
    } else {
      console.log("✅ No uncommitted changes\n");
    }
  } catch (error) {
    console.error("❌ Git check failed:", error.message);
    process.exit(1);
  }

  // 2. Check for unpushed commits
  console.log("🔍 Checking for unpushed commits...");
  try {
    const currentBranch = execSync("git branch --show-current")
      .toString()
      .trim();

    // Check if branch has upstream
    try {
      execSync(`git rev-parse --abbrev-ref ${currentBranch}@{upstream}`, { stdio: 'pipe' });

      // Check if there are unpushed commits
      const unpushedCommits = execSync(
        `git log @{u}..HEAD --oneline`
      ).toString();

      if (unpushedCommits) {
        console.error("❌ You have unpushed commits:");
        console.log(unpushedCommits);
        console.error(`\nPlease push to remote first:`);
        console.error(`  git push origin ${currentBranch}`);
        process.exit(1);
      }
    } catch (upstreamError) {
      // Branch has no upstream, warn but allow deployment
      console.warn(`⚠️  Branch '${currentBranch}' has no upstream. Proceeding anyway...`);
    }

    console.log("✅ All commits are pushed\n");
  } catch (error) {
    console.error("❌ Git push check failed:", error.message);
    process.exit(1);
  }

  // 3. Get current commit info
  const commitHash = execSync("git rev-parse HEAD").toString().trim();
  const shortHash = commitHash.substring(0, 7);
  const currentBranch = execSync("git branch --show-current")
    .toString()
    .trim();

  console.log(`📌 Commit: ${shortHash} (${currentBranch})\n`);

  // 4. Create git tag (matching Goldsky format: network/version)
  const tagName = `${network}/${version}`;
  console.log(`🏷️  Creating git tag: ${tagName}...`);

  try {
    // Check if tag already exists
    try {
      execSync(`git rev-parse ${tagName}`, { stdio: 'pipe' });
      console.error(`❌ Tag ${tagName} already exists!`);
      console.error(`\nIf you want to redeploy, either:`);
      console.error(`  1. Use a new version number`);
      console.error(`  2. Delete the existing tag: git tag -d ${tagName} && git push origin :refs/tags/${tagName}`);
      process.exit(1);
    } catch {
      // Tag doesn't exist, proceed
    }

    execSync(
      `git tag -a ${tagName} -m "Deploy ${network} subgraph v${version}\n\nCommit: ${commitHash}\nNetwork: ${network}\nDate: ${new Date().toISOString()}"`,
      { stdio: "inherit" }
    );
    console.log(`✅ Created git tag: ${tagName}\n`);
  } catch (error) {
    console.error("❌ Failed to create git tag:", error.message);
    process.exit(1);
  }

  // 5. Push tag to remote immediately
  console.log(`📤 Pushing tag to remote...`);
  try {
    execSync(`git push origin ${tagName}`, { stdio: "inherit" });
    console.log(`✅ Tag pushed to remote\n`);
  } catch (error) {
    console.error("❌ Failed to push tag to remote!");
    // Rollback: delete local tag
    console.log(`🔄 Rolling back local tag...`);
    execSync(`git tag -d ${tagName}`);
    process.exit(1);
  }

  console.log("─".repeat(50));
  console.log(`📦 Deploying to Goldsky...`);
  console.log("─".repeat(50));
  console.log("");

  // 6. Deploy to Goldsky
  const deployCommand = `goldsky subgraph deploy ${network}/${version} --path .`;
  try {
    execSync(deployCommand, { stdio: "inherit" });
    console.log("");
    console.log("─".repeat(50));
    console.log(`✅ Successfully deployed ${network} v${version}!`);
    console.log("─".repeat(50));
    console.log("");
    console.log("📋 Deployment summary:");
    console.log(`   Network:  ${network}`);
    console.log(`   Version:  ${version}`);
    console.log(`   Git tag:  ${tagName}`);
    console.log(`   Commit:   ${shortHash}`);
    console.log("");
    console.log("🔗 Next steps:");
    console.log(`   • View in Goldsky dashboard`);
    console.log(`   • Tag environment: yarn tag:${network} ${version} <stag|prod>`);
    console.log("");
  } catch (error) {
    console.error("");
    console.error("─".repeat(50));
    console.error("❌ Deployment failed!");
    console.error("─".repeat(50));
    console.error("");

    // Rollback: delete tag from remote and local
    console.log("🔄 Rolling back git tag...");
    try {
      execSync(`git push origin :refs/tags/${tagName}`, { stdio: "inherit" });
      execSync(`git tag -d ${tagName}`, { stdio: "inherit" });
      console.log("✅ Git tag rolled back successfully");
    } catch (rollbackError) {
      console.error("⚠️  Failed to rollback git tag. You may need to delete it manually:");
      console.error(`   git tag -d ${tagName}`);
      console.error(`   git push origin :refs/tags/${tagName}`);
    }

    process.exit(1);
  }
} else {
  // Running in CI - just deploy (GitHub Actions handles git tags)
  console.log("🤖 Running in CI mode - skipping git operations\n");
  const deployCommand = `goldsky subgraph deploy ${network}/${version} --path .`;
  execSync(deployCommand, { stdio: "inherit" });
}
})().catch((error) => {
  console.error("❌ Unexpected error:", error.message);
  process.exit(1);
});
