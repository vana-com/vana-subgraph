import {
  Address,
  BigInt as GraphBigInt,
  ethereum,
} from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import { RefinerAdded } from "../../../../../generated/DataRefinerRegistryImplementation/DataRefinerRegistryImplementation";

/**
 * Creates a mock RefinerAdded event for testing
 */
export function createRefinerAddedEvent(
  refinerId: number,
  dlpId: number,
  name: string,
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
