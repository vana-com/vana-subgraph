import { log } from "@graphprotocol/graph-ts";
import { Refiner, Schema } from "../../../../generated/schema";
import {
  RefinerAdded,
  SchemaAdded,
} from "../../../../generated/DataRefinerRegistryImplementationV6/DataRefinerRegistryImplementationV6";
import { getOrCreateUser } from "../shared";

export function handleSchemaAdded(event: SchemaAdded): void {
  log.info("Handling SchemaAdded with transaction hash: {} and schemaId: {}", [
    event.transaction.hash.toHexString(),
    event.params.schemaId.toString(),
  ]);

  // Create new Schema entity
  const schema = new Schema(event.params.schemaId.toString());
  schema.name = event.params.name;
  schema.dialect = event.params.dialect;
  schema.definitionUrl = event.params.definitionUrl;
  schema.createdAt = event.block.timestamp;
  schema.createdAtBlock = event.block.number;
  schema.createdTxHash = event.transaction.hash;

  // Save the entity
  schema.save();
}

export function handleRefinerAddedV6(event: RefinerAdded): void {
  log.info(
    "Handling RefinerAdded v6 with transaction hash: {} and schemaId: {}",
    [event.transaction.hash.toHexString(), event.params.schemaId.toString()],
  );

  const ownerAddress = event.transaction.from;
  getOrCreateUser(ownerAddress.toHex());

  // Create new Refiner entity
  const refiner = new Refiner(event.params.refinerId.toString());
  refiner.dlp = event.params.dlpId.toString();
  refiner.owner = ownerAddress;
  refiner.name = event.params.name;
  refiner.schema = event.params.schemaId.toString(); // Link to Schema entity
  refiner.schemaDefinitionUrl = event.params.schemaDefinitionUrl; // Keep for backwards compatibility
  refiner.refinementInstructionUrl = event.params.refinementInstructionUrl;

  // Save the entity
  refiner.save();
}
