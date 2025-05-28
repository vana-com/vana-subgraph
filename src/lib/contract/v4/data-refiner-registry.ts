import { log } from "@graphprotocol/graph-ts";
import { Refiner } from "../../../../generated/schema";
import { RefinerAdded } from "../../../../generated/DataRefinerRegistryImplementation/DataRefinerRegistryImplementation";
import { getOrCreateUser } from "../shared";

export function handleRefinerAdded(event: RefinerAdded): void {
  log.info("Handling RefinerAdded with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const ownerAddress = event.transaction.from;
  getOrCreateUser(ownerAddress.toHex());

  // Create new Refiner entity
  const refiner = new Refiner(event.params.refinerId.toString());
  refiner.dlp = event.params.dlpId.toString();
  refiner.owner = ownerAddress;
  refiner.name = event.params.name;
  refiner.schemaDefinitionUrl = event.params.schemaDefinitionUrl;
  refiner.refinementInstructionUrl = event.params.refinementInstructionUrl;

  // Save the entity
  refiner.save();
}
