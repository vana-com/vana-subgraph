import { log } from "@graphprotocol/graph-ts";
import { Refiner } from "../../../../generated/schema";
import { RefinerAdded } from "../../../../generated/DataRefinerRegistryImplementation/DataRefinerRegistryImplementation";

export function handleRefinerAdded(event: RefinerAdded): void {
  log.info("Handling RefinerAdded with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  // Create new Refiner entity
  const refiner = new Refiner(event.params.refinerId.toString());
  refiner.dlp = event.params.dlpId.toString();
  refiner.owner = event.transaction.from;
  refiner.name = event.params.name;
  refiner.schemaDefinitionUrl = event.params.schemaDefinitionUrl;
  refiner.refinementInstructionUrl = event.params.refinementInstructionUrl;

  // Save the entity
  refiner.save();
}
