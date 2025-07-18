import { Address, BigInt } from "@graphprotocol/graph-ts";
import { File } from "../../../../generated/schema";

export function fileDefaults(id: string, ownerAddress: string, url: string): File {
  const file = new File(id);
  file.owner = ownerAddress;
  file.url = url;
  file.schemaId = BigInt.zero();
  file.addedAtBlock = BigInt.zero();
  file.addedAtTimestamp = BigInt.zero();
  file.transactionHash = Address.zero();
  return file;
}

export function createNewFile(
  id: string,
  ownerAddress: string,
  url: string,
): File {
  const file = fileDefaults(id, ownerAddress, url);
  file.save();
  return file;
}
