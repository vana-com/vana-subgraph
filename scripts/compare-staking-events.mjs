import { ethers } from "ethers";

const SUBGRAPH_URL =
  "https://api.goldsky.com/api/public/project_cm168cz887zva010j39il7a6p/subgraphs/moksha/staking-only/gn";
const RPC_URL =
  "https://falling-tame-liquid.vana-moksha.quiknode.pro/522e4e45df28df82a4d7729726e68cdc7d630011";
const STAKING_CONTRACT = "0x641C18E2F286c86f96CE95C8ec1EB9fC0415Ca0e";
const START_BLOCK = 2101757;

// ABI for Staked and Unstaked events
const STAKING_ABI = [
  "event Staked(uint256 indexed entityId, address indexed staker, uint256 amount, uint256 sharesIssued)",
  "event Unstaked(uint256 indexed entityId, address indexed staker, uint256 amount, uint256 sharesBurned)",
];

async function fetchSubgraphEvents() {
  const allEvents = [];
  let skip = 0;
  const first = 1000;

  while (true) {
    const query = `
      query {
        stakeEvents(
          first: ${first}
          skip: ${skip}
          orderBy: blockNumber
          orderDirection: asc
        ) {
          id
          eventType
          staker
          entity {
            id
          }
          amount
          shares
          blockNumber
          txHash
        }
      }
    `;

    const response = await fetch(SUBGRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const json = await response.json();
    const events = json.data?.stakeEvents || [];

    if (events.length === 0) break;

    allEvents.push(...events);
    skip += first;

    if (events.length < first) break;
  }

  return allEvents;
}

async function fetchChainEvents() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, provider);

  const latestBlock = await provider.getBlockNumber();
  console.log(`Fetching events from block ${START_BLOCK} to ${latestBlock}`);

  const allEvents = [];

  // Fetch in chunks to avoid RPC limits
  const chunkSize = 10000;
  for (let fromBlock = START_BLOCK; fromBlock <= latestBlock; fromBlock += chunkSize) {
    const toBlock = Math.min(fromBlock + chunkSize - 1, latestBlock);

    // Fetch Staked events
    const stakedFilter = contract.filters.Staked();
    const stakedEvents = await contract.queryFilter(stakedFilter, fromBlock, toBlock);

    for (const event of stakedEvents) {
      allEvents.push({
        eventType: "stake",
        entityId: event.args[0].toString(),
        staker: event.args[1].toLowerCase(),
        amount: event.args[2].toString(),
        shares: event.args[3].toString(),
        blockNumber: event.blockNumber,
        txHash: event.transactionHash,
        logIndex: event.index,
      });
    }

    // Fetch Unstaked events
    const unstakedFilter = contract.filters.Unstaked();
    const unstakedEvents = await contract.queryFilter(unstakedFilter, fromBlock, toBlock);

    for (const event of unstakedEvents) {
      allEvents.push({
        eventType: "unstake",
        entityId: event.args[0].toString(),
        staker: event.args[1].toLowerCase(),
        amount: event.args[2].toString(),
        shares: event.args[3].toString(),
        blockNumber: event.blockNumber,
        txHash: event.transactionHash,
        logIndex: event.index,
      });
    }

    console.log(`Processed blocks ${fromBlock} - ${toBlock}`);
  }

  // Sort by block number and log index
  allEvents.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
    return a.logIndex - b.logIndex;
  });

  return allEvents;
}

function compareEvents(subgraphEvents, chainEvents) {
  console.log("\n========== COMPARISON RESULTS ==========\n");
  console.log(`Subgraph events: ${subgraphEvents.length}`);
  console.log(`Chain events: ${chainEvents.length}`);

  // Create maps for quick lookup
  const subgraphMap = new Map();
  for (const event of subgraphEvents) {
    // Key: txHash-eventType-entityId-staker
    const key = `${event.txHash.toLowerCase()}-${event.eventType}-${event.entity.id}-${event.staker.toLowerCase()}`;
    subgraphMap.set(key, event);
  }

  const chainMap = new Map();
  for (const event of chainEvents) {
    const key = `${event.txHash.toLowerCase()}-${event.eventType}-${event.entityId}-${event.staker.toLowerCase()}`;
    chainMap.set(key, event);
  }

  // Find events in chain but not in subgraph
  const missingInSubgraph = [];
  for (const event of chainEvents) {
    const key = `${event.txHash.toLowerCase()}-${event.eventType}-${event.entityId}-${event.staker.toLowerCase()}`;
    if (!subgraphMap.has(key)) {
      missingInSubgraph.push(event);
    }
  }

  // Find events in subgraph but not in chain
  const missingInChain = [];
  for (const event of subgraphEvents) {
    const key = `${event.txHash.toLowerCase()}-${event.eventType}-${event.entity.id}-${event.staker.toLowerCase()}`;
    if (!chainMap.has(key)) {
      missingInChain.push(event);
    }
  }

  // Find events with mismatched amounts/shares
  const mismatched = [];
  for (const event of chainEvents) {
    const key = `${event.txHash.toLowerCase()}-${event.eventType}-${event.entityId}-${event.staker.toLowerCase()}`;
    const subgraphEvent = subgraphMap.get(key);
    if (subgraphEvent) {
      if (
        subgraphEvent.amount !== event.amount ||
        subgraphEvent.shares !== event.shares
      ) {
        mismatched.push({ subgraph: subgraphEvent, chain: event });
      }
    }
  }

  console.log(`\n----- Missing in Subgraph (${missingInSubgraph.length}) -----`);
  for (const event of missingInSubgraph) {
    console.log(
      `  ${event.eventType.toUpperCase()} | Entity: ${event.entityId} | Staker: ${event.staker} | Amount: ${event.amount} | Shares: ${event.shares} | Block: ${event.blockNumber} | TX: ${event.txHash}`
    );
  }

  console.log(`\n----- Missing in Chain (${missingInChain.length}) -----`);
  for (const event of missingInChain) {
    console.log(
      `  ${event.eventType.toUpperCase()} | Entity: ${event.entity.id} | Staker: ${event.staker} | Amount: ${event.amount} | Shares: ${event.shares} | Block: ${event.blockNumber} | TX: ${event.txHash}`
    );
  }

  console.log(`\n----- Mismatched Values (${mismatched.length}) -----`);
  for (const { subgraph, chain } of mismatched) {
    console.log(`  TX: ${chain.txHash}`);
    console.log(`    Chain:    Amount=${chain.amount}, Shares=${chain.shares}`);
    console.log(`    Subgraph: Amount=${subgraph.amount}, Shares=${subgraph.shares}`);
  }

  // Summary by entity
  console.log("\n----- Summary by Entity -----");
  const entitySummary = new Map();

  for (const event of chainEvents) {
    if (!entitySummary.has(event.entityId)) {
      entitySummary.set(event.entityId, {
        chainStaked: 0n,
        chainUnstaked: 0n,
        chainStakedShares: 0n,
        chainUnstakedShares: 0n,
        subgraphStaked: 0n,
        subgraphUnstaked: 0n,
        subgraphStakedShares: 0n,
        subgraphUnstakedShares: 0n,
      });
    }
    const summary = entitySummary.get(event.entityId);
    if (event.eventType === "stake") {
      summary.chainStaked += BigInt(event.amount);
      summary.chainStakedShares += BigInt(event.shares);
    } else {
      summary.chainUnstaked += BigInt(event.amount);
      summary.chainUnstakedShares += BigInt(event.shares);
    }
  }

  for (const event of subgraphEvents) {
    if (!entitySummary.has(event.entity.id)) {
      entitySummary.set(event.entity.id, {
        chainStaked: 0n,
        chainUnstaked: 0n,
        chainStakedShares: 0n,
        chainUnstakedShares: 0n,
        subgraphStaked: 0n,
        subgraphUnstaked: 0n,
        subgraphStakedShares: 0n,
        subgraphUnstakedShares: 0n,
      });
    }
    const summary = entitySummary.get(event.entity.id);
    if (event.eventType === "stake") {
      summary.subgraphStaked += BigInt(event.amount);
      summary.subgraphStakedShares += BigInt(event.shares);
    } else {
      summary.subgraphUnstaked += BigInt(event.amount);
      summary.subgraphUnstakedShares += BigInt(event.shares);
    }
  }

  for (const [entityId, summary] of entitySummary) {
    const stakedDiff = summary.chainStaked - summary.subgraphStaked;
    const unstakedDiff = summary.chainUnstaked - summary.subgraphUnstaked;
    const stakedSharesDiff = summary.chainStakedShares - summary.subgraphStakedShares;
    const unstakedSharesDiff = summary.chainUnstakedShares - summary.subgraphUnstakedShares;

    console.log(`\n  Entity ${entityId}:`);
    console.log(`    Chain Staked:         ${summary.chainStaked}`);
    console.log(`    Subgraph Staked:      ${summary.subgraphStaked}`);
    console.log(`    Staked Amount Diff:   ${stakedDiff}`);
    console.log(`    Chain Staked Shares:     ${summary.chainStakedShares}`);
    console.log(`    Subgraph Staked Shares:  ${summary.subgraphStakedShares}`);
    console.log(`    Staked Shares Diff:      ${stakedSharesDiff}`);
    console.log(`    ---`);
    console.log(`    Chain Unstaked:       ${summary.chainUnstaked}`);
    console.log(`    Subgraph Unstaked:    ${summary.subgraphUnstaked}`);
    console.log(`    Unstaked Amount Diff: ${unstakedDiff}`);

    // Net difference (what's missing in activeRewardPool and totalShares)
    const netAmountDiff = stakedDiff - unstakedDiff;
    const netSharesDiff = stakedSharesDiff - unstakedSharesDiff;
    if (netAmountDiff !== 0n || netSharesDiff !== 0n) {
      console.log(`    *** NET AMOUNT DIFF (activeRewardPool): ${netAmountDiff}`);
      console.log(`    *** NET SHARES DIFF (totalShares): ${netSharesDiff}`);
    }
  }
}

async function main() {
  console.log("Fetching events from subgraph...");
  const subgraphEvents = await fetchSubgraphEvents();
  console.log(`Found ${subgraphEvents.length} events in subgraph`);

  console.log("\nFetching events from chain...");
  const chainEvents = await fetchChainEvents();
  console.log(`Found ${chainEvents.length} events on chain`);

  compareEvents(subgraphEvents, chainEvents);
}

main().catch(console.error);
