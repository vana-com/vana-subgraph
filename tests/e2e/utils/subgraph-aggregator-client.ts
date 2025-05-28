import { GraphQLClient } from "graphql-request";
import dotenv from "dotenv";

dotenv.config();

export type SubgraphEndpoint = {
  name: string;
  network: string;
  version: string;
};

const getSubgraphUrl = (network: string, version: string) => {
  return `${process.env.SUBGRAPH_BASE_URL}/${network}/${version}/gn`;
};

export function newSubgraphAggregatorClient(network: string) {
  return new SubgraphAggregatorClient([
    {
      name: "ground_truth",
      network: network,
      version: process.env.GROUND_TRUTH_VERSION!,
    },
    {
      name: "compare",
      network: network,
      version: process.env.COMPARE_VERSION!,
    },
  ]);
}

export class SubgraphAggregatorClient {
  private clients: Map<string, GraphQLClient> = new Map();

  constructor(endpoints: SubgraphEndpoint[]) {
    for (const { name, network, version } of endpoints) {
      this.clients.set(
        name,
        new GraphQLClient(getSubgraphUrl(network, version)),
      );
    }
  }

  async compareQuery<T>(
    query: string,
    variables: Record<string, any>,
    options: {
      block?: number;
      endpoints?: string[];
    } = {},
  ): Promise<Record<string, T>> {
    const results: Record<string, T> = {};
    const endpointsToQuery =
      options.endpoints || Array.from(this.clients.keys());

    for (const endpoint of endpointsToQuery) {
      const client = this.clients.get(endpoint);
      if (!client) continue;

      const result = await client.request<T>(query, {
        ...variables,
        block: options.block ? { number: options.block } : undefined,
      });

      results[endpoint] = result;
    }

    return results;
  }
}
