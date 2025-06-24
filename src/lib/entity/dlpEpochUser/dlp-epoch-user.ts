import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { getDlpEpochUserId } from "./constants";
import {DlpEpochUser} from "../../../../generated/schema";

export function getOrCreateDlpEpochUser(dlpId: string, epochId: string, userId: string): DlpEpochUser {
  const id = getDlpEpochUserId(dlpId, epochId, userId);
  let dlpEpochUser = DlpEpochUser.load(id);
  if (dlpEpochUser == null) {
    dlpEpochUser = new DlpEpochUser(id);
    dlpEpochUser.dlp = dlpId;
    dlpEpochUser.epoch = epochId;
    dlpEpochUser.user = userId;
    dlpEpochUser.fileContributionsCount = GraphBigInt.zero();
    dlpEpochUser.lastContributionBlock = GraphBigInt.zero();
    dlpEpochUser.save();
  }
  return dlpEpochUser;
}
