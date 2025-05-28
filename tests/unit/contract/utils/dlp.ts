import { Address, Bytes, BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { Dlp } from "../../../../generated/schema";

export function dlpDefaults(id: string, userId: string, totalsId: string): Dlp {
  const dlp = new Dlp(id);
  dlp.creator = Address.fromString(userId);
  dlp.address = Address.fromString(userId);
  dlp.createdAt = GraphBigInt.zero();
  dlp.createdAtBlock = GraphBigInt.zero();
  dlp.createdTxHash = Bytes.fromHexString(
    "0x64d2db2dbfd04f79352be0ec93977a56f6399784210454b37faccf0d418cfa8b",
  );
  dlp.status = GraphBigInt.zero(); // None
  dlp.name = "";
  dlp.iconUrl = "";
  dlp.website = "";
  dlp.metadata = "";
  dlp.performanceRating = GraphBigInt.zero();
  dlp.owner = Address.fromString(userId);
  dlp.treasury = Address.fromString(userId);
  dlp.totals = totalsId;
  return dlp;
}

export function createNewDlp(
  id: string,
  userId: string,
  totalsId: string,
): Dlp {
  const dlp = dlpDefaults(id, userId, totalsId);
  dlp.save();
  return dlp;
}
