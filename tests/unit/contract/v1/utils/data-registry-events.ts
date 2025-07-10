import { Address, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import { FileAdded as FileAddedEvent } from "../../../../../generated/DataRegistryImplementationV1/DataRegistryImplementationV1";

export function createFileAddedEvent(
  fileId: i32,
  ownerAddress: string,
  url: string,
): FileAddedEvent {
  const normalizedAddr = ownerAddress.toLowerCase();
  const fileAddedEvent = changetype<FileAddedEvent>(newMockEvent());
  fileAddedEvent.parameters = new Array();

  fileAddedEvent.parameters.push(
    new ethereum.EventParam("fileId", ethereum.Value.fromI32(fileId)),
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
