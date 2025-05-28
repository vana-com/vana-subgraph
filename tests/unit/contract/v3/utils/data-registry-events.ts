import { Address, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import {
  FileAdded as FileAddedEvent,
  ProofAdded as FileProofAdded,
} from "../../../../../generated/DataRegistryImplementationV3/DataRegistryImplementationV3";

export function createFileAddedEvent(
  fileId: number,
  ownerAddress: string,
  url: string,
): FileAddedEvent {
  const normalizedAddr = ownerAddress.toLowerCase();
  const fileAddedEvent = changetype<FileAddedEvent>(newMockEvent());
  fileAddedEvent.parameters = new Array();
  fileAddedEvent.parameters.push(
    new ethereum.EventParam("fileId", ethereum.Value.fromI32(<i32>fileId)),
  );
  fileAddedEvent.parameters.push(
    new ethereum.EventParam(
      "ownerAddress",
      ethereum.Value.fromAddress(Address.fromString(normalizedAddr)),
    ),
  );
  fileAddedEvent.parameters.push(
    new ethereum.EventParam("url", ethereum.Value.fromString(url)),
  );
  return fileAddedEvent;
}

export function createProofAddedEvent(
  fileId: number,
  ownerAddress: string,
  proofIndex: number,
  dlpId: number,
  score: number,
  proofUrl: string,
): FileProofAdded {
  const normalizedAddr = ownerAddress.toLowerCase();
  const proofAddedEvent = changetype<FileProofAdded>(newMockEvent());
  proofAddedEvent.parameters = new Array();
  proofAddedEvent.parameters.push(
    new ethereum.EventParam("fileId", ethereum.Value.fromI32(<i32>fileId)),
  );
  proofAddedEvent.parameters.push(
    new ethereum.EventParam(
      "ownerAddress",
      ethereum.Value.fromAddress(Address.fromString(normalizedAddr)),
    ),
  );
  proofAddedEvent.parameters.push(
    new ethereum.EventParam(
      "proofIndex",
      ethereum.Value.fromI32(<i32>proofIndex),
    ),
  );
  proofAddedEvent.parameters.push(
    new ethereum.EventParam("dlpId", ethereum.Value.fromI32(<i32>dlpId)),
  );
  proofAddedEvent.parameters.push(
    new ethereum.EventParam("score", ethereum.Value.fromI32(<i32>score)),
  );
  proofAddedEvent.parameters.push(
    new ethereum.EventParam("proofUrl", ethereum.Value.fromString(proofUrl)),
  );
  return proofAddedEvent;
}
