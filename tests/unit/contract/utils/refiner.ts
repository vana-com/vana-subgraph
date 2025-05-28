import { Address } from "@graphprotocol/graph-ts";
import { Refiner } from "../../../../generated/schema";

export function refinerDefaults(
  id: string,
  dlpId: string,
  ownerAddress: string,
  name: string,
): Refiner {
  const refiner = new Refiner(id);
  refiner.dlp = dlpId;
  refiner.owner = Address.fromString(ownerAddress);
  refiner.name = name;
  refiner.schemaDefinitionUrl = "https://example.com/schema";
  refiner.refinementInstructionUrl = "https://example.com/instructions";
  return refiner;
}

export function createNewRefiner(
  id: string,
  dlpId: string,
  ownerAddress: string,
  name: string,
): Refiner {
  const refiner = refinerDefaults(id, dlpId, ownerAddress, name);
  refiner.save();
  return refiner;
}
