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

interface SubgraphStakeEvent {
  id: string;
  eventType: string;
  staker: string;
  entity: { id: string };
  amount: string;
  shares: string;
  blockNumber: string;
  txHash: string;
}

interface ChainEvent {
  eventType: string;
  entityId: string;
  staker: string;
  amount: string;
  shares: string;
  blockNumber: number;
  txHash: string;
  logIndex: number;
}

async function fetchSubgraphEvents(): Promise<SubgraphStakeEvent[]> {
  const allEvents: SubgraphStakeEvent[] = [];
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

async function fetchChainEvents(): Promise<ChainEvent[]> {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, provider);

  const latestBlock = await provider.getBlockNumber();
  console.log(`Fetching events from block ${START_BLOCK} to ${latestBlock}`);

  const allEvents: ChainEvent[] = [];

  // Fetch in chunks to avoid RPC limits
  const chunkSize = 10000;
  for (let fromBlock = START_BLOCK; fromBlock <= latestBlock; fromBlock += chunkSize) {
    const toBlock = Math.min(fromBlock + chunkSize - 1, latestBlock);

    // Fetch Staked events
    const stakedFilter = contract.filters.Staked();
    const stakedEvents = await contract.queryFilter(stakedFilter, fromBlock, toBlock);

    for (const event of stakedEvents) {
      const log = event as ethers.EventLog;
      allEvents.push({
        eventType: "stake",
        entityId: log.args[0].toString(),
        staker: log.args[1].toLowerCase(),
        amount: log.args[2].toString(),
        shares: log.args[3].toString(),
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
        logIndex: log.index,
      });
    }

    // Fetch Unstaked events
    const unstakedFilter = contract.filters.Unstaked();
    const unstakedEvents = await contract.queryFilter(unstakedFilter, fromBlock, toBlock);

    for (const event of unstakedEvents) {
      const log = event as ethers.EventLog;
      allEvents.push({
        eventType: "unstake",
        entityId: log.args[0].toString(),
        staker: log.args[1].toLowerCase(),
        amount: log.args[2].toString(),
        shares: log.args[3].toString(),
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
        logIndex: log.index,
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

function compareEvents(
  subgraphEvents: SubgraphStakeEvent[],
  chainEvents: ChainEvent[]
): void {
  console.log("\n========== COMPARISON RESULTS ==========\n");
  console.log(`Subgraph events: ${subgraphEvents.length}`);
  console.log(`Chain events: ${chainEvents.length}`);

  // Create maps for quick lookup
  const subgraphMap = new Map<string, SubgraphStakeEvent>();
  for (const event of subgraphEvents) {
    // Key: txHash-eventType-entityId-staker
    const key = `${event.txHash.toLowerCase()}-${event.eventType}-${event.entity.id}-${event.staker.toLowerCase()}`;
    subgraphMap.set(key, event);
  }

  const chainMap = new Map<string, ChainEvent>();
  for (const event of chainEvents) {
    const key = `${event.txHash.toLowerCase()}-${event.eventType}-${event.entityId}-${event.staker.toLowerCase()}`;
    chainMap.set(key, event);
  }

  // Find events in chain but not in subgraph
  const missingInSubgraph: ChainEvent[] = [];
  for (const event of chainEvents) {
    const key = `${event.txHash.toLowerCase()}-${event.eventType}-${event.entityId}-${event.staker.toLowerCase()}`;
    if (!subgraphMap.has(key)) {
      missingInSubgraph.push(event);
    }
  }

  // Find events in subgraph but not in chain
  const missingInChain: SubgraphStakeEvent[] = [];
  for (const event of subgraphEvents) {
    const key = `${event.txHash.toLowerCase()}-${event.eventType}-${event.entity.id}-${event.staker.toLowerCase()}`;
    if (!chainMap.has(key)) {
      missingInChain.push(event);
    }
  }

  // Find events with mismatched amounts/shares
  const mismatched: { subgraph: SubgraphStakeEvent; chain: ChainEvent }[] = [];
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
  const entitySummary = new Map<
    string,
    { chainStaked: bigint; chainUnstaked: bigint; subgraphStaked: bigint; subgraphUnstaked: bigint }
  >();

  for (const event of chainEvents) {
    if (!entitySummary.has(event.entityId)) {
      entitySummary.set(event.entityId, {
        chainStaked: 0n,
        chainUnstaked: 0n,
        subgraphStaked: 0n,
        subgraphUnstaked: 0n,
      });
    }
    const summary = entitySummary.get(event.entityId)!;
    if (event.eventType === "stake") {
      summary.chainStaked += BigInt(event.amount);
    } else {
      summary.chainUnstaked += BigInt(event.amount);
    }
  }

  for (const event of subgraphEvents) {
    if (!entitySummary.has(event.entity.id)) {
      entitySummary.set(event.entity.id, {
        chainStaked: 0n,
        chainUnstaked: 0n,
        subgraphStaked: 0n,
        subgraphUnstaked: 0n,
      });
    }
    const summary = entitySummary.get(event.entity.id)!;
    if (event.eventType === "stake") {
      summary.subgraphStaked += BigInt(event.amount);
    } else {
      summary.subgraphUnstaked += BigInt(event.amount);
    }
  }

  for (const [entityId, summary] of entitySummary) {
    const stakedDiff = summary.chainStaked - summary.subgraphStaked;
    const unstakedDiff = summary.chainUnstaked - summary.subgraphUnstaked;

    if (stakedDiff !== 0n || unstakedDiff !== 0n) {
      console.log(`  Entity ${entityId}:`);
      console.log(`    Chain Staked:     ${summary.chainStaked}`);
      console.log(`    Subgraph Staked:  ${summary.subgraphStaked}`);
      console.log(`    Staked Diff:      ${stakedDiff}`);
      console.log(`    Chain Unstaked:   ${summary.chainUnstaked}`);
      console.log(`    Subgraph Unstaked: ${summary.subgraphUnstaked}`);
      console.log(`    Unstaked Diff:    ${unstakedDiff}`);
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
