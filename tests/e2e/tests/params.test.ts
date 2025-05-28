import { Params } from "../../../generated/schema";
import { newSubgraphAggregatorClient } from "../utils/subgraph-aggregator-client";

if (process.env.DISABLE_VANA != "true") {
  const vanaClient = newSubgraphAggregatorClient("vana");
  describe("Vana - Params", () => {
    it("should have matching current params", async () => {
      const query = `
        query getParams {
          params(id: "current") {
            subEligibilityThreshold
            eligibilityThreshold
            stakeWithdrawalDelay
            daySize
            epochSize
            epochRewardAmount
            eligibleDlpsLimit
            minDlpStakersPercentage
            maxDlpStakersPercentage
            minStakeAmount
            rewardClaimDelay
            minDlpRegistrationStake
            performanceRatingPercentage
            stakeRatingPercentage
          }
        }
      `;

      const results = await vanaClient.compareQuery<{ params: Params }>(
        query,
        {},
      );

      const groundTruthParams = results.ground_truth.params;
      const compareParams = results.compare.params;

      expect(compareParams.subEligibilityThreshold).toBe(
        groundTruthParams.subEligibilityThreshold,
      );
      expect(compareParams.eligibilityThreshold).toBe(
        groundTruthParams.eligibilityThreshold,
      );
      expect(compareParams.stakeWithdrawalDelay).toBe(
        groundTruthParams.stakeWithdrawalDelay,
      );
      expect(compareParams.daySize).toBe(groundTruthParams.daySize);
      expect(compareParams.epochSize).toBe(groundTruthParams.epochSize);
      expect(compareParams.epochRewardAmount).toBe(
        groundTruthParams.epochRewardAmount,
      );
      expect(compareParams.eligibleDlpsLimit).toBe(
        groundTruthParams.eligibleDlpsLimit,
      );
      expect(compareParams.minDlpStakersPercentage).toBe(
        groundTruthParams.minDlpStakersPercentage,
      );
      expect(compareParams.maxDlpStakersPercentage).toBe(
        groundTruthParams.maxDlpStakersPercentage,
      );
      expect(compareParams.minStakeAmount).toBe(
        groundTruthParams.minStakeAmount,
      );
      expect(compareParams.rewardClaimDelay).toBe(
        groundTruthParams.rewardClaimDelay,
      );
      expect(compareParams.minDlpRegistrationStake).toBe(
        groundTruthParams.minDlpRegistrationStake,
      );
      expect(compareParams.performanceRatingPercentage).toBe(
        groundTruthParams.performanceRatingPercentage,
      );
      expect(compareParams.stakeRatingPercentage).toBe(
        groundTruthParams.stakeRatingPercentage,
      );
    });

    it("should have matching params at end of epoch 1", async () => {
      const query = `
        query getParams($block: Block_height) {
          params(block: $block, id: "current") {
            subEligibilityThreshold
            eligibilityThreshold
            stakeWithdrawalDelay
            daySize
            epochSize
            epochRewardAmount
            eligibleDlpsLimit
            minDlpStakersPercentage
            maxDlpStakersPercentage
            minStakeAmount
            rewardClaimDelay
            minDlpRegistrationStake
            performanceRatingPercentage
            stakeRatingPercentage
          }
        }
      `;
      const epochOneEndBlock = 1288639;

      const results = await vanaClient.compareQuery<{ params: Params }>(
        query,
        {},
        {
          block: epochOneEndBlock,
        },
      );

      const groundTruthParams = results.ground_truth.params;
      const compareParams = results.compare.params;

      expect(compareParams.subEligibilityThreshold).toBe(
        groundTruthParams.subEligibilityThreshold,
      );
      expect(compareParams.eligibilityThreshold).toBe(
        groundTruthParams.eligibilityThreshold,
      );
      expect(compareParams.stakeWithdrawalDelay).toBe(
        groundTruthParams.stakeWithdrawalDelay,
      );
      expect(compareParams.daySize).toBe(groundTruthParams.daySize);
      expect(compareParams.epochSize).toBe(groundTruthParams.epochSize);
      expect(compareParams.epochRewardAmount).toBe(
        groundTruthParams.epochRewardAmount,
      );
      expect(compareParams.eligibleDlpsLimit).toBe(
        groundTruthParams.eligibleDlpsLimit,
      );
      expect(compareParams.minDlpStakersPercentage).toBe(
        groundTruthParams.minDlpStakersPercentage,
      );
      expect(compareParams.maxDlpStakersPercentage).toBe(
        groundTruthParams.maxDlpStakersPercentage,
      );
      expect(compareParams.minStakeAmount).toBe(
        groundTruthParams.minStakeAmount,
      );
      expect(compareParams.rewardClaimDelay).toBe(
        groundTruthParams.rewardClaimDelay,
      );
      expect(compareParams.minDlpRegistrationStake).toBe(
        groundTruthParams.minDlpRegistrationStake,
      );
      expect(compareParams.performanceRatingPercentage).toBe(
        groundTruthParams.performanceRatingPercentage,
      );
      expect(compareParams.stakeRatingPercentage).toBe(
        groundTruthParams.stakeRatingPercentage,
      );
    });
  });
}

if (process.env.DISABLE_MOKSHA != "true") {
  const mokshaClient = newSubgraphAggregatorClient("moksha");
  describe("Moksha - Params", () => {
    it("should have matching current params", async () => {
      const query = `
        query getParams {
          params(id: "current") {
            subEligibilityThreshold
            eligibilityThreshold
            stakeWithdrawalDelay
            daySize
            epochSize
            epochRewardAmount
            eligibleDlpsLimit
            minDlpStakersPercentage
            maxDlpStakersPercentage
            minStakeAmount
            rewardClaimDelay
            minDlpRegistrationStake
            performanceRatingPercentage
            stakeRatingPercentage
          }
        }
      `;

      const results = await mokshaClient.compareQuery<{ params: Params }>(
        query,
        {},
      );

      const groundTruthParams = results.ground_truth.params;
      const compareParams = results.compare.params;

      expect(compareParams.subEligibilityThreshold).toBe(
        groundTruthParams.subEligibilityThreshold,
      );
      expect(compareParams.eligibilityThreshold).toBe(
        groundTruthParams.eligibilityThreshold,
      );
      expect(compareParams.stakeWithdrawalDelay).toBe(
        groundTruthParams.stakeWithdrawalDelay,
      );
      expect(compareParams.daySize).toBe(groundTruthParams.daySize);
      expect(compareParams.epochSize).toBe(groundTruthParams.epochSize);
      expect(compareParams.epochRewardAmount).toBe(
        groundTruthParams.epochRewardAmount,
      );
      expect(compareParams.eligibleDlpsLimit).toBe(
        groundTruthParams.eligibleDlpsLimit,
      );
      expect(compareParams.minDlpStakersPercentage).toBe(
        groundTruthParams.minDlpStakersPercentage,
      );
      expect(compareParams.maxDlpStakersPercentage).toBe(
        groundTruthParams.maxDlpStakersPercentage,
      );
      expect(compareParams.minStakeAmount).toBe(
        groundTruthParams.minStakeAmount,
      );
      expect(compareParams.rewardClaimDelay).toBe(
        groundTruthParams.rewardClaimDelay,
      );
      expect(compareParams.minDlpRegistrationStake).toBe(
        groundTruthParams.minDlpRegistrationStake,
      );
      expect(compareParams.performanceRatingPercentage).toBe(
        groundTruthParams.performanceRatingPercentage,
      );
      expect(compareParams.stakeRatingPercentage).toBe(
        groundTruthParams.stakeRatingPercentage,
      );
    });

    it("should have matching params at end of epoch 36", async () => {
      const query = `
        query getParams($block: Block_height) {
          params(block: $block, id: "current") {
            subEligibilityThreshold
            eligibilityThreshold
            stakeWithdrawalDelay
            daySize
            epochSize
            epochRewardAmount
            eligibleDlpsLimit
            minDlpStakersPercentage
            maxDlpStakersPercentage
            minStakeAmount
            rewardClaimDelay
            minDlpRegistrationStake
            performanceRatingPercentage
            stakeRatingPercentage
          }
        }
      `;
      const epochSixtyThreeEndBlock = 1250741;

      const results = await mokshaClient.compareQuery<{ params: Params }>(
        query,
        {},
        {
          block: epochSixtyThreeEndBlock,
        },
      );

      const groundTruthParams = results.ground_truth.params;
      const compareParams = results.compare.params;

      expect(compareParams.subEligibilityThreshold).toBe(
        groundTruthParams.subEligibilityThreshold,
      );
      expect(compareParams.eligibilityThreshold).toBe(
        groundTruthParams.eligibilityThreshold,
      );
      expect(compareParams.stakeWithdrawalDelay).toBe(
        groundTruthParams.stakeWithdrawalDelay,
      );
      expect(compareParams.daySize).toBe(groundTruthParams.daySize);
      expect(compareParams.epochSize).toBe(groundTruthParams.epochSize);
      expect(compareParams.epochRewardAmount).toBe(
        groundTruthParams.epochRewardAmount,
      );
      expect(compareParams.eligibleDlpsLimit).toBe(
        groundTruthParams.eligibleDlpsLimit,
      );
      expect(compareParams.minDlpStakersPercentage).toBe(
        groundTruthParams.minDlpStakersPercentage,
      );
      expect(compareParams.maxDlpStakersPercentage).toBe(
        groundTruthParams.maxDlpStakersPercentage,
      );
      expect(compareParams.minStakeAmount).toBe(
        groundTruthParams.minStakeAmount,
      );
      expect(compareParams.rewardClaimDelay).toBe(
        groundTruthParams.rewardClaimDelay,
      );
      expect(compareParams.minDlpRegistrationStake).toBe(
        groundTruthParams.minDlpRegistrationStake,
      );
      expect(compareParams.performanceRatingPercentage).toBe(
        groundTruthParams.performanceRatingPercentage,
      );
      expect(compareParams.stakeRatingPercentage).toBe(
        groundTruthParams.stakeRatingPercentage,
      );
    });
  });
}
