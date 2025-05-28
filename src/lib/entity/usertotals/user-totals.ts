import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { UserTotals } from "../../../../generated/schema";
import { getUserTotalsId, getUserTotalsIdDlp } from "./constants";

export function getOrCreateUserTotalsForUser(userId: string): UserTotals {
  const userTotalsId = getUserTotalsId(userId);
  return getOrCreateUserTotals(userTotalsId);
}

export function getOrCreateUserTotalsForDlp(
  userId: string,
  dlpId: string,
): UserTotals {
  const userTotalsId = getUserTotalsIdDlp(userId, dlpId);
  return getOrCreateUserTotals(userTotalsId);
}

export function getOrCreateUserTotals(id: string): UserTotals {
  let userTotals = UserTotals.load(id);
  if (userTotals == null) {
    userTotals = new UserTotals(id);
    userTotals.fileContributionsCount = GraphBigInt.zero();
    userTotals.save();
  }
  return userTotals;
}
