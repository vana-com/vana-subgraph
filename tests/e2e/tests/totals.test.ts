import { Totals } from "../../../generated/schema";
import { newSubgraphAggregatorClient } from "../utils/subgraph-aggregator-client";

if (process.env.DISABLE_VANA != "true") {
  const vanaClient = newSubgraphAggregatorClient("vana");
  describe("Vana - Totals", () => {
    it("should have matching global totals", async () => {
      const query = `
        query getTotals {
          totals(id: "global") {
            activeStakedAmount
            delegatedStakedAmount
            uniqueStakers
            totalFileContributions
            uniqueFileContributors
          }
        }
      `;

      const results = await vanaClient.compareQuery<{ totals: Totals }>(
        query,
        {},
      );

      const groundTruthTotals = results.ground_truth.totals;
      const compareTotals = results.compare.totals;

      expect(compareTotals.activeStakedAmount).toBe(
        groundTruthTotals.activeStakedAmount,
      );
      expect(compareTotals.delegatedStakedAmount).toBe(
        groundTruthTotals.delegatedStakedAmount,
      );
      expect(compareTotals.uniqueStakers).toBe(groundTruthTotals.uniqueStakers);
      expect(compareTotals.totalFileContributions).toBe(
        groundTruthTotals.totalFileContributions,
      );
      expect(compareTotals.uniqueFileContributors).toBe(
        groundTruthTotals.uniqueFileContributors,
      );
    });

    it("should have matching global totals at end of epoch 1", async () => {
      const query = `
        query getTotals($block: Block_height) {
          totals(block: $block, id: "global") {
            activeStakedAmount
            delegatedStakedAmount
            uniqueStakers
            totalFileContributions
            uniqueFileContributors
          }
        }
      `;
      const epochOneEndBlock = 1288639;

      const results = await vanaClient.compareQuery<{ totals: Totals }>(
        query,
        {},
        {
          block: epochOneEndBlock,
        },
      );

      const groundTruthTotals = results.ground_truth.totals;
      const compareTotals = results.compare.totals;

      expect(compareTotals.activeStakedAmount).toBe(
        groundTruthTotals.activeStakedAmount,
      );
      expect(compareTotals.delegatedStakedAmount).toBe(
        groundTruthTotals.delegatedStakedAmount,
      );
      expect(compareTotals.uniqueStakers).toBe(groundTruthTotals.uniqueStakers);
      expect(compareTotals.totalFileContributions).toBe(
        groundTruthTotals.totalFileContributions,
      );
      expect(compareTotals.uniqueFileContributors).toBe(
        groundTruthTotals.uniqueFileContributors,
      );
    });
  });
}

if (process.env.DISABLE_MOKSHA != "true") {
  const mokshaClient = newSubgraphAggregatorClient("moksha");
  describe("Moksha - Totals", () => {
    it("should have matching totals", async () => {
      const query = `
        query getTotals {
          totals(id: "global") {
            activeStakedAmount
            delegatedStakedAmount
            uniqueStakers
            totalFileContributions
            uniqueFileContributors
          }
        }
      `;

      const results = await mokshaClient.compareQuery<{ totals: Totals }>(
        query,
        {},
      );

      const groundTruthTotals = results.ground_truth.totals;
      const compareTotals = results.compare.totals;

      expect(compareTotals.activeStakedAmount).toBe(
        groundTruthTotals.activeStakedAmount,
      );
      expect(compareTotals.delegatedStakedAmount).toBe(
        groundTruthTotals.delegatedStakedAmount,
      );
      expect(compareTotals.uniqueStakers).toBe(groundTruthTotals.uniqueStakers);
      expect(compareTotals.totalFileContributions).toBe(
        groundTruthTotals.totalFileContributions,
      );
      expect(compareTotals.uniqueFileContributors).toBe(
        groundTruthTotals.uniqueFileContributors,
      );
    });

    it("should have matching totals at end of epoch 36", async () => {
      const query = `
        query getTotals($block: Block_height) {
          totals(block: $block, id: "global") {
            activeStakedAmount
            delegatedStakedAmount
            uniqueStakers
            totalFileContributions
            uniqueFileContributors
          }
        }
      `;
      const epochSixtyThreeEndBlock = 1250741;

      const results = await mokshaClient.compareQuery<{ totals: Totals }>(
        query,
        {},
        {
          block: epochSixtyThreeEndBlock,
        },
      );

      const groundTruthTotals = results.ground_truth.totals;
      const compareTotals = results.compare.totals;

      expect(compareTotals.activeStakedAmount).toBe(
        groundTruthTotals.activeStakedAmount,
      );
      expect(compareTotals.delegatedStakedAmount).toBe(
        groundTruthTotals.delegatedStakedAmount,
      );
      expect(compareTotals.uniqueStakers).toBe(groundTruthTotals.uniqueStakers);
      expect(compareTotals.totalFileContributions).toBe(
        groundTruthTotals.totalFileContributions,
      );
      expect(compareTotals.uniqueFileContributors).toBe(
        groundTruthTotals.uniqueFileContributors,
      );
    });
  });
}
