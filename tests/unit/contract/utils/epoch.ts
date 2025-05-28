import { Bytes, BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { Epoch } from "../../../../generated/schema";

export function epochDefaults(id: string): Epoch {
  const epoch = new Epoch(id);
  epoch.startBlock = GraphBigInt.fromI32(100);
  epoch.endBlock = GraphBigInt.fromI32(200);
  epoch.reward = GraphBigInt.fromString("400000000000000000000000");
  epoch.createdAt = GraphBigInt.zero();
  epoch.createdAtBlock = GraphBigInt.zero();
  epoch.createdTxHash = Bytes.fromHexString(
    "0x64d2db2dbfd04f79352be0ec93977a56f6399784210454b37faccf0d418cfa8b",
  );
  epoch.logIndex = GraphBigInt.zero();
  epoch.isFinalized = false;
  epoch.dlpIds = [];
  return epoch;
}

export function createNewEpoch(id: string): Epoch {
  const epoch = epochDefaults(id);
  epoch.save();
  return epoch;
}
