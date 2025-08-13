import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { getDlpEpochUserId } from "./constants";
import { PerformanceDlpEpochUser } from "../../../../generated/schema";

export function getOrCreateDlpEpochUser(
  dlpId: string,
  epochId: string,
  userId: string,
): PerformanceDlpEpochUser {
  const id = getDlpEpochUserId(dlpId, epochId, userId);
  let dlpEpochUser = PerformanceDlpEpochUser.load(id);
  if (dlpEpochUser == null) {
    dlpEpochUser = new PerformanceDlpEpochUser(id);
    dlpEpochUser.save();
  }
  return dlpEpochUser;
}
