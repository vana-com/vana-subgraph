import { log } from "@graphprotocol/graph-ts";
import { Refiner } from "../../../../generated/schema";
import { RefinerAdded } from "../../../../generated/DataRefinerRegistryImplementation/DataRefinerRegistryImplementation";
import { getOrCreateUser, getOrCreateRefiner } from "../shared";

export function handleRefinerAddedV4(event: RefinerAdded): void {
  log.info("Handling RefinerAdded with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const ownerAddress = event.transaction.from;
  getOrCreateUser(ownerAddress.toHex());

  // Get or create Refiner entity (may already exist if PaymentReceived was processed first)
  const refiner = getOrCreateRefiner(event.params.refinerId.toString());
  refiner.dlp = event.params.dlpId.toString();
  refiner.owner = ownerAddress;
  refiner.name = event.params.name;
  refiner.schemaDefinitionUrl = event.params.schemaDefinitionUrl;
  refiner.refinementInstructionUrl = event.params.refinementInstructionUrl;

  // Save the entity
  refiner.save();
}
