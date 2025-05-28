import { UserTotals } from "../../../generated/schema";
import { newSubgraphAggregatorClient } from "../utils/subgraph-aggregator-client";

if (process.env.DISABLE_VANA != "true") {
  const vanaClient = newSubgraphAggregatorClient("vana");
  describe("Vana - UserTotals", () => {
    it("should have matching userTotals", async () => {
      const query = `
        query getUserTotals {
          userTotals(id: "user-0x616c5cd938bbf6ea7186bf845438b4fe61b4732b") {
            activeStakesCount
            delegatedStakesCount
            activeStakedAmount
            delegatedStakedAmount
            fileContributionsCount  
          }
        }
      `;

      const results = await vanaClient.compareQuery<{ userTotals: UserTotals }>(
        query,
        {},
      );

      const groundTruthTotals = results.ground_truth.userTotals;
      const compareTotals = results.compare.userTotals;

      expect(compareTotals.activeStakesCount).not.toBe("0");
      expect(compareTotals.activeStakesCount).toBe(
        groundTruthTotals.activeStakesCount,
      );

      expect(compareTotals.activeStakedAmount).not.toBe("0");
      expect(compareTotals.activeStakedAmount).toBe(
        groundTruthTotals.activeStakedAmount,
      );

      expect(compareTotals.delegatedStakesCount).not.toBe("0");
      expect(compareTotals.delegatedStakesCount).toBe(
        groundTruthTotals.delegatedStakesCount,
      );

      expect(compareTotals.delegatedStakedAmount).not.toBe("0");
      expect(compareTotals.delegatedStakedAmount).toBe(
        groundTruthTotals.delegatedStakedAmount,
      );

      expect(compareTotals.fileContributionsCount).not.toBe("0");
      expect(compareTotals.fileContributionsCount).toBe(
        groundTruthTotals.fileContributionsCount,
      );
    });
  });
}

if (process.env.DISABLE_MOKSHA != "true") {
  const mokshaClient = newSubgraphAggregatorClient("moksha");
  describe("Moksha - UserTotals", () => {
    it("should have matching userTotals", async () => {
      const query = `
        query getTotals {
          userTotals(id: "user-0xfebae8100a833c481250fdfb08db567216e15357") {
            activeStakesCount
            delegatedStakesCount
            activeStakedAmount
            delegatedStakedAmount
            fileContributionsCount  
          }
        }
      `;

      const results = await mokshaClient.compareQuery<{
        userTotals: UserTotals;
      }>(query, {});

      const groundTruthTotals = results.ground_truth.userTotals;
      const compareTotals = results.compare.userTotals;

      expect(compareTotals.activeStakesCount).not.toBe("0");
      expect(compareTotals.activeStakesCount).toBe(
        groundTruthTotals.activeStakesCount,
      );

      expect(compareTotals.activeStakedAmount).not.toBe("0");
      expect(compareTotals.activeStakedAmount).toBe(
        groundTruthTotals.activeStakedAmount,
      );

      expect(compareTotals.delegatedStakesCount).not.toBe("0");
      expect(compareTotals.delegatedStakesCount).toBe(
        groundTruthTotals.delegatedStakesCount,
      );

      expect(compareTotals.delegatedStakedAmount).not.toBe("0");
      expect(compareTotals.delegatedStakedAmount).toBe(
        groundTruthTotals.delegatedStakedAmount,
      );

      expect(compareTotals.fileContributionsCount).not.toBe("0");
      expect(compareTotals.fileContributionsCount).toBe(
        groundTruthTotals.fileContributionsCount,
      );
    });
  });
}
