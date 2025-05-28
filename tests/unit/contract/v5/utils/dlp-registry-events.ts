import {
  Address,
  ethereum,
  BigInt as GraphBigInt,
} from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import {
  DlpRegistered,
  DlpUpdated,
  DlpStatusUpdated,
  DlpSubEligibilityThresholdUpdated,
  DlpVerificationUpdated,
  DlpTokenUpdated,
} from "../../../../../generated/DLPRegistryImplementationV5/DLPRegistryImplementationV5";

export function createDlpRegisteredEvent(
  dlpId: number,
  dlpAddress: string,
  ownerAddress: string,
  treasuryAddress: string,
  name: string,
  iconUrl: string,
  website: string,
  metadata: string,
): DlpRegistered {
  const event = changetype<DlpRegistered>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "dlpId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>dlpId)),
    ),
    new ethereum.EventParam(
      "dlpAddress",
      ethereum.Value.fromAddress(Address.fromString(dlpAddress)),
    ),
    new ethereum.EventParam(
      "ownerAddress",
      ethereum.Value.fromAddress(Address.fromString(ownerAddress)),
    ),
    new ethereum.EventParam(
      "treasuryAddress",
      ethereum.Value.fromAddress(Address.fromString(treasuryAddress)),
    ),
    new ethereum.EventParam("name", ethereum.Value.fromString(name)),
    new ethereum.EventParam("iconUrl", ethereum.Value.fromString(iconUrl)),
    new ethereum.EventParam("website", ethereum.Value.fromString(website)),
    new ethereum.EventParam("metadata", ethereum.Value.fromString(metadata)),
  ];

  return event;
}

export function createDlpUpdatedEvent(
  dlpId: number,
  dlpAddress: string,
  ownerAddress: string,
  treasuryAddress: string,
  name: string,
  iconUrl: string,
  website: string,
  metadata: string,
): DlpUpdated {
  const event = changetype<DlpUpdated>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "dlpId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>dlpId)),
    ),
    new ethereum.EventParam(
      "dlpAddress",
      ethereum.Value.fromAddress(Address.fromString(dlpAddress)),
    ),
    new ethereum.EventParam(
      "ownerAddress",
      ethereum.Value.fromAddress(Address.fromString(ownerAddress)),
    ),
    new ethereum.EventParam(
      "treasuryAddress",
      ethereum.Value.fromAddress(Address.fromString(treasuryAddress)),
    ),
    new ethereum.EventParam("name", ethereum.Value.fromString(name)),
    new ethereum.EventParam("iconUrl", ethereum.Value.fromString(iconUrl)),
    new ethereum.EventParam("website", ethereum.Value.fromString(website)),
    new ethereum.EventParam("metadata", ethereum.Value.fromString(metadata)),
  ];

  return event;
}

export function createDlpStatusUpdatedEvent(
  dlpId: number,
  newStatus: number,
): DlpStatusUpdated {
  const event = changetype<DlpStatusUpdated>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "dlpId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>dlpId)),
    ),
    new ethereum.EventParam(
      "newStatus",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>newStatus)),
    ),
  ];

  return event;
}

export function createDlpEligibilityThresholdUpdatedEvent(
  newDlpSubEligibilityThreshold: number,
): DlpSubEligibilityThresholdUpdated {
  const event = changetype<DlpSubEligibilityThresholdUpdated>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "newDlpSubEligibilityThreshold",
      ethereum.Value.fromUnsignedBigInt(
        GraphBigInt.fromI32(<i32>newDlpSubEligibilityThreshold),
      ),
    ),
  ];

  return event;
}

export function createDlpVerificationUpdatedEvent(
  dlpId: number,
  verified: boolean,
): DlpVerificationUpdated {
  const event = changetype<DlpVerificationUpdated>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "dlpId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>dlpId)),
    ),
    new ethereum.EventParam("verified", ethereum.Value.fromBoolean(verified)),
  ];

  return event;
}

export function createDlpTokenUpdatedEvent(
  dlpId: number,
  tokenAddress: string,
): DlpTokenUpdated {
  const event = changetype<DlpTokenUpdated>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "dlpId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>dlpId)),
    ),
    new ethereum.EventParam(
      "tokenAddress",
      ethereum.Value.fromAddress(Address.fromString(tokenAddress)),
    ),
  ];

  return event;
}
