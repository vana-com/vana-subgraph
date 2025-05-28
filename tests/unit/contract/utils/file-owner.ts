import { FileOwner } from "../../../../generated/schema";
import { Address } from "@graphprotocol/graph-ts";

export function fileOwnerDefaults(id: string, ownerAddress: string): FileOwner {
  const file = new FileOwner(id);
  file.ownerAddress = Address.fromString(ownerAddress);
  return file;
}

export function createNewFileOwner(
  id: string,
  ownerAddress: string,
): FileOwner {
  const file = fileOwnerDefaults(id, ownerAddress);
  file.save();
  return file;
}
