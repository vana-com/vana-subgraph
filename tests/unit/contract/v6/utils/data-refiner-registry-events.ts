import {
  Address,
  BigInt as GraphBigInt,
  ethereum,
} from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import {
  RefinerAdded,
  SchemaAdded,
} from "../../../../../generated/DataRefinerRegistryImplementationV6/DataRefinerRegistryImplementationV6";

/**
 * Creates a mock SchemaAdded event for testing
 */
export function createSchemaAddedEvent(
  schemaId: number,
  name: string,
  dialect: string,
  definitionUrl: string,
): SchemaAdded {
  const schemaAddedEvent = changetype<SchemaAdded>(newMockEvent());

  schemaAddedEvent.parameters = new Array();

  // Add parameters in the same order as the contract emits them
  schemaAddedEvent.parameters.push(
    new ethereum.EventParam(
      "schemaId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>schemaId)),
    ),
  );
  schemaAddedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name)),
  );
  schemaAddedEvent.parameters.push(
    new ethereum.EventParam("dialect", ethereum.Value.fromString(dialect)),
  );
  schemaAddedEvent.parameters.push(
    new ethereum.EventParam(
      "definitionUrl",
      ethereum.Value.fromString(definitionUrl),
    ),
  );

  return schemaAddedEvent;
}

/**
 * Creates a mock RefinerAdded event for testing (v6 with schemaId)
 */
export function createRefinerAddedEventV6(
  refinerId: number,
  dlpId: number,
  name: string,
  schemaId: number,
  schemaDefinitionUrl: string,
  refinementInstructionUrl: string,
): RefinerAdded {
  const refinerAddedEvent = changetype<RefinerAdded>(newMockEvent());

  refinerAddedEvent.parameters = new Array();

  // Add parameters in the same order as the contract emits them
  refinerAddedEvent.parameters.push(
    new ethereum.EventParam(
      "refinerId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>refinerId)),
    ),
  );
  refinerAddedEvent.parameters.push(
    new ethereum.EventParam(
      "dlpId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>dlpId)),
    ),
  );
  refinerAddedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name)),
  );
  refinerAddedEvent.parameters.push(
    new ethereum.EventParam(
      "schemaId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>schemaId)),
    ),
  );
  refinerAddedEvent.parameters.push(
    new ethereum.EventParam(
      "schemaDefinitionUrl",
      ethereum.Value.fromString(schemaDefinitionUrl),
    ),
  );
  refinerAddedEvent.parameters.push(
    new ethereum.EventParam(
      "refinementInstructionUrl",
      ethereum.Value.fromString(refinementInstructionUrl),
    ),
  );

  return refinerAddedEvent;
}
