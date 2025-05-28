import { Dlp } from "../../../generated/schema";
import { newSubgraphAggregatorClient } from "../utils/subgraph-aggregator-client";

const vanaClient = newSubgraphAggregatorClient("vana");
const mokshaClient = newSubgraphAggregatorClient("moksha");

if (process.env.DISABLE_VANA != "true") {
  describe("Vana - DLPs", () => {
    it("should have matching dlp data", async () => {
      const query = `
        query getDlps {
          dlps(where: { id_in: ["1", "9", "3"] }) {
            id
            name
            activeStakedAmount
            delegatedStakedAmount
            performanceRating
            status
            creator
            owner
            address
            minStakeAmount
            stakersPercentage
          }
        }
      `;

      const results = await vanaClient.compareQuery<{ dlps: Dlp[] }>(query, {});

      const groundTruthDlps = results.ground_truth.dlps;
      const compareDlps = results.compare.dlps;

      expect(compareDlps.length).toBe(3);

      // Map DLPs by ID for easier comparison
      const groundTruthById = groundTruthDlps.reduce(
        (acc, dlp) => {
          acc[dlp.id] = dlp;
          return acc;
        },
        {} as Record<string, Dlp>,
      );

      const compareById = compareDlps.reduce(
        (acc, dlp) => {
          acc[dlp.id] = dlp;
          return acc;
        },
        {} as Record<string, Dlp>,
      );

      // VanaTensor
      expect(compareById["1"].name).toBe("VanaTensor");
      expect(compareById["1"].activeStakedAmount).toBe(
        groundTruthById["1"].activeStakedAmount,
      );
      expect(compareById["1"].delegatedStakedAmount).toBe(
        groundTruthById["1"].delegatedStakedAmount,
      );
      expect(compareById["1"].performanceRating).toBe(
        groundTruthById["1"].performanceRating,
      );
      expect(compareById["1"].status).toBe(groundTruthById["1"].status);
      expect(compareById["1"].creator).toBe(groundTruthById["1"].creator);
      expect(compareById["1"].owner).toBe(groundTruthById["1"].owner);
      expect(compareById["1"].address).toBe(groundTruthById["1"].address);
      expect(compareById["1"].minStakeAmount).toBe(
        groundTruthById["1"].minStakeAmount,
      );
      expect(compareById["1"].stakersPercentage).toBe(
        groundTruthById["1"].stakersPercentage,
      );

      // MindDAO
      expect(compareById["9"].name).toBe("MindDAO");
      expect(compareById["9"].activeStakedAmount).toBe(
        groundTruthById["9"].activeStakedAmount,
      );
      expect(compareById["9"].delegatedStakedAmount).toBe(
        groundTruthById["9"].delegatedStakedAmount,
      );
      expect(compareById["9"].performanceRating).toBe(
        groundTruthById["9"].performanceRating,
      );
      expect(compareById["9"].status).toBe(groundTruthById["9"].status);
      expect(compareById["9"].creator).toBe(groundTruthById["9"].creator);
      expect(compareById["9"].owner).toBe(groundTruthById["9"].owner);
      expect(compareById["9"].address).toBe(groundTruthById["9"].address);
      expect(compareById["9"].minStakeAmount).toBe(
        groundTruthById["9"].minStakeAmount,
      );
      expect(compareById["9"].stakersPercentage).toBe(
        groundTruthById["9"].stakersPercentage,
      );

      // PrimeInsights
      expect(compareById["3"].name).toBe("PrimeInsights");
      expect(compareById["3"].activeStakedAmount).toBe(
        groundTruthById["3"].activeStakedAmount,
      );
      expect(compareById["3"].delegatedStakedAmount).toBe(
        groundTruthById["3"].delegatedStakedAmount,
      );
      expect(compareById["3"].performanceRating).toBe(
        groundTruthById["3"].performanceRating,
      );
      expect(compareById["3"].status).toBe(groundTruthById["3"].status);
      expect(compareById["3"].creator).toBe(groundTruthById["3"].creator);
      expect(compareById["3"].owner).toBe(groundTruthById["3"].owner);
      expect(compareById["3"].address).toBe(groundTruthById["3"].address);
      expect(compareById["3"].minStakeAmount).toBe(
        groundTruthById["3"].minStakeAmount,
      );
      expect(compareById["3"].stakersPercentage).toBe(
        groundTruthById["3"].stakersPercentage,
      );
    });

    it("should have matching dlp data at end of epoch 1", async () => {
      const query = `
        query getDlps($block: Block_height) {
          dlps(block: $block, where: { id_in: ["1", "9", "3"] }) {
            id
            name
            activeStakedAmount
            delegatedStakedAmount
            performanceRating
            status
            creator
            owner
            address
            minStakeAmount
            stakersPercentage
          }
        }
      `;
      const epochOneEndBlock = 1288639;

      const results = await vanaClient.compareQuery<{ dlps: Dlp[] }>(
        query,
        {},
        {
          block: epochOneEndBlock,
        },
      );

      const groundTruthDlps = results.ground_truth.dlps;
      const compareDlps = results.compare.dlps;

      expect(compareDlps.length).toBe(3);

      // Map DLPs by ID for easier comparison
      const groundTruthById = groundTruthDlps.reduce(
        (acc, dlp) => {
          acc[dlp.id] = dlp;
          return acc;
        },
        {} as Record<string, Dlp>,
      );

      const compareById = compareDlps.reduce(
        (acc, dlp) => {
          acc[dlp.id] = dlp;
          return acc;
        },
        {} as Record<string, Dlp>,
      );

      // VanaTensor
      expect(compareById["1"].name).toBe("VanaTensor");
      expect(compareById["1"].activeStakedAmount).toBe(
        groundTruthById["1"].activeStakedAmount,
      );
      expect(compareById["1"].delegatedStakedAmount).toBe(
        groundTruthById["1"].delegatedStakedAmount,
      );
      expect(compareById["1"].performanceRating).toBe(
        groundTruthById["1"].performanceRating,
      );
      expect(compareById["1"].status).toBe(groundTruthById["1"].status);
      expect(compareById["1"].creator).toBe(groundTruthById["1"].creator);
      expect(compareById["1"].owner).toBe(groundTruthById["1"].owner);
      expect(compareById["1"].address).toBe(groundTruthById["1"].address);
      expect(compareById["1"].minStakeAmount).toBe(
        groundTruthById["1"].minStakeAmount,
      );
      expect(compareById["1"].stakersPercentage).toBe(
        groundTruthById["1"].stakersPercentage,
      );

      // MindDAO
      expect(compareById["9"].name).toBe("MindDAO");
      expect(compareById["9"].activeStakedAmount).toBe(
        groundTruthById["9"].activeStakedAmount,
      );
      expect(compareById["9"].delegatedStakedAmount).toBe(
        groundTruthById["9"].delegatedStakedAmount,
      );
      expect(compareById["9"].performanceRating).toBe(
        groundTruthById["9"].performanceRating,
      );
      expect(compareById["9"].status).toBe(groundTruthById["9"].status);
      expect(compareById["9"].creator).toBe(groundTruthById["9"].creator);
      expect(compareById["9"].owner).toBe(groundTruthById["9"].owner);
      expect(compareById["9"].address).toBe(groundTruthById["9"].address);
      expect(compareById["9"].minStakeAmount).toBe(
        groundTruthById["9"].minStakeAmount,
      );
      expect(compareById["9"].stakersPercentage).toBe(
        groundTruthById["9"].stakersPercentage,
      );

      // PrimeInsights
      expect(compareById["3"].name).toBe("PrimeInsights");
      expect(compareById["3"].activeStakedAmount).toBe(
        groundTruthById["3"].activeStakedAmount,
      );
      expect(compareById["3"].delegatedStakedAmount).toBe(
        groundTruthById["3"].delegatedStakedAmount,
      );
      expect(compareById["3"].performanceRating).toBe(
        groundTruthById["3"].performanceRating,
      );
      expect(compareById["3"].status).toBe(groundTruthById["3"].status);
      expect(compareById["3"].creator).toBe(groundTruthById["3"].creator);
      expect(compareById["3"].owner).toBe(groundTruthById["3"].owner);
      expect(compareById["3"].address).toBe(groundTruthById["3"].address);
      expect(compareById["3"].minStakeAmount).toBe(
        groundTruthById["3"].minStakeAmount,
      );
      expect(compareById["3"].stakersPercentage).toBe(
        groundTruthById["3"].stakersPercentage,
      );
    });
  });
}

if (process.env.DISABLE_MOKSHA != "true") {
  describe("Moksha - DLPs", () => {
    it("should have matching dlp data", async () => {
      const query = `
        query getDlps {
          dlps(where: { id_in: ["1", "22", "15"] }) {
            id
            name
            activeStakedAmount
            delegatedStakedAmount
            performanceRating
            status
            creator
            owner
            address
            minStakeAmount
            stakersPercentage
          }
        }
      `;

      const results = await mokshaClient.compareQuery<{ dlps: Dlp[] }>(
        query,
        {},
      );

      const groundTruthDlps = results.ground_truth.dlps;
      const compareDlps = results.compare.dlps;

      expect(compareDlps.length).toBe(3);

      // Map DLPs by ID for easier comparison
      const groundTruthById = groundTruthDlps.reduce(
        (acc, dlp) => {
          acc[dlp.id] = dlp;
          return acc;
        },
        {} as Record<string, Dlp>,
      );

      const compareById = compareDlps.reduce(
        (acc, dlp) => {
          acc[dlp.id] = dlp;
          return acc;
        },
        {} as Record<string, Dlp>,
      );

      // CookieDLP
      expect(compareById["1"].name).toBe("CookieDLP");
      expect(compareById["1"].activeStakedAmount).toBe(
        groundTruthById["1"].activeStakedAmount,
      );
      expect(compareById["1"].delegatedStakedAmount).toBe(
        groundTruthById["1"].delegatedStakedAmount,
      );
      expect(compareById["1"].performanceRating).toBe(
        groundTruthById["1"].performanceRating,
      );
      expect(compareById["1"].status).toBe(groundTruthById["1"].status);
      expect(compareById["1"].creator).toBe(groundTruthById["1"].creator);
      expect(compareById["1"].owner).toBe(groundTruthById["1"].owner);
      expect(compareById["1"].address).toBe(groundTruthById["1"].address);
      expect(compareById["1"].minStakeAmount).toBe(
        groundTruthById["1"].minStakeAmount,
      );
      expect(compareById["1"].stakersPercentage).toBe(
        groundTruthById["1"].stakersPercentage,
      );

      // TempDAO
      expect(compareById["22"].name).toBe("TempDAO");
      expect(compareById["22"].activeStakedAmount).toBe(
        groundTruthById["22"].activeStakedAmount,
      );
      expect(compareById["22"].delegatedStakedAmount).toBe(
        groundTruthById["22"].delegatedStakedAmount,
      );
      expect(compareById["22"].performanceRating).toBe(
        groundTruthById["22"].performanceRating,
      );
      expect(compareById["22"].status).toBe(groundTruthById["22"].status);
      expect(compareById["22"].creator).toBe(groundTruthById["22"].creator);
      expect(compareById["22"].owner).toBe(groundTruthById["22"].owner);
      expect(compareById["22"].address).toBe(groundTruthById["22"].address);
      expect(compareById["22"].minStakeAmount).toBe(
        groundTruthById["22"].minStakeAmount,
      );
      expect(compareById["22"].stakersPercentage).toBe(
        groundTruthById["22"].stakersPercentage,
      );

      // Volara
      expect(compareById["15"].name).toBe("Volara");
      expect(compareById["15"].activeStakedAmount).toBe(
        groundTruthById["15"].activeStakedAmount,
      );
      expect(compareById["15"].delegatedStakedAmount).toBe(
        groundTruthById["15"].delegatedStakedAmount,
      );
      expect(compareById["15"].performanceRating).toBe(
        groundTruthById["15"].performanceRating,
      );
      expect(compareById["15"].status).toBe(groundTruthById["15"].status);
      expect(compareById["15"].creator).toBe(groundTruthById["15"].creator);
      expect(compareById["15"].owner).toBe(groundTruthById["15"].owner);
      expect(compareById["15"].address).toBe(groundTruthById["15"].address);
      expect(compareById["15"].minStakeAmount).toBe(
        groundTruthById["15"].minStakeAmount,
      );
      expect(compareById["15"].stakersPercentage).toBe(
        groundTruthById["15"].stakersPercentage,
      );
    });

    it("should have matching dlp data at end of epoch 36", async () => {
      const query = `
        query getDlps($block: Block_height) {
          dlps(block: $block, where: { id_in: ["1", "22", "15"] }) {
            id
            name
            activeStakedAmount
            delegatedStakedAmount
            performanceRating
            status
            creator
            owner
            address
            minStakeAmount
            stakersPercentage
          }
        }
      `;
      const epochSixtyThreeEndBlock = 1250741;

      const results = await mokshaClient.compareQuery<{ dlps: Dlp[] }>(
        query,
        {},
        {
          block: epochSixtyThreeEndBlock,
        },
      );

      const groundTruthDlps = results.ground_truth.dlps;
      const compareDlps = results.compare.dlps;

      expect(compareDlps.length).toBe(3);

      // Map DLPs by ID for easier comparison
      const groundTruthById = groundTruthDlps.reduce(
        (acc, dlp) => {
          acc[dlp.id] = dlp;
          return acc;
        },
        {} as Record<string, Dlp>,
      );

      const compareById = compareDlps.reduce(
        (acc, dlp) => {
          acc[dlp.id] = dlp;
          return acc;
        },
        {} as Record<string, Dlp>,
      );

      // CookieDLP
      expect(compareById["1"].name).toBe("CookieDLP");
      expect(compareById["1"].activeStakedAmount).toBe(
        groundTruthById["1"].activeStakedAmount,
      );
      expect(compareById["1"].delegatedStakedAmount).toBe(
        groundTruthById["1"].delegatedStakedAmount,
      );
      expect(compareById["1"].performanceRating).toBe(
        groundTruthById["1"].performanceRating,
      );
      expect(compareById["1"].status).toBe(groundTruthById["1"].status);
      expect(compareById["1"].creator).toBe(groundTruthById["1"].creator);
      expect(compareById["1"].owner).toBe(groundTruthById["1"].owner);
      expect(compareById["1"].address).toBe(groundTruthById["1"].address);
      expect(compareById["1"].minStakeAmount).toBe(
        groundTruthById["1"].minStakeAmount,
      );
      expect(compareById["1"].stakersPercentage).toBe(
        groundTruthById["1"].stakersPercentage,
      );

      // TempDAO
      expect(compareById["22"].name).toBe("TempDAO");
      expect(compareById["22"].activeStakedAmount).toBe(
        groundTruthById["22"].activeStakedAmount,
      );
      expect(compareById["22"].delegatedStakedAmount).toBe(
        groundTruthById["22"].delegatedStakedAmount,
      );
      expect(compareById["22"].performanceRating).toBe(
        groundTruthById["22"].performanceRating,
      );
      expect(compareById["22"].status).toBe(groundTruthById["22"].status);
      expect(compareById["22"].creator).toBe(groundTruthById["22"].creator);
      expect(compareById["22"].owner).toBe(groundTruthById["22"].owner);
      expect(compareById["22"].address).toBe(groundTruthById["22"].address);
      expect(compareById["22"].minStakeAmount).toBe(
        groundTruthById["22"].minStakeAmount,
      );
      expect(compareById["22"].stakersPercentage).toBe(
        groundTruthById["22"].stakersPercentage,
      );

      // Volara
      expect(compareById["15"].name).toBe("Volara");
      expect(compareById["15"].activeStakedAmount).toBe(
        groundTruthById["15"].activeStakedAmount,
      );
      expect(compareById["15"].delegatedStakedAmount).toBe(
        groundTruthById["15"].delegatedStakedAmount,
      );
      expect(compareById["15"].performanceRating).toBe(
        groundTruthById["15"].performanceRating,
      );
      expect(compareById["15"].status).toBe(groundTruthById["15"].status);
      expect(compareById["15"].creator).toBe(groundTruthById["15"].creator);
      expect(compareById["15"].owner).toBe(groundTruthById["15"].owner);
      expect(compareById["15"].address).toBe(groundTruthById["15"].address);
      expect(compareById["15"].minStakeAmount).toBe(
        groundTruthById["15"].minStakeAmount,
      );
      expect(compareById["15"].stakersPercentage).toBe(
        groundTruthById["15"].stakersPercentage,
      );
    });
  });
}
