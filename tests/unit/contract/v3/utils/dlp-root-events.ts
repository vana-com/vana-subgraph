import { Address, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import { StakeCreated as StakeCreatedEvent } from "../../../../../generated/DlpRootImplementationV3/DlpRootImplementationV3";

export function createStakeCreatedEvent(
  stakeId: number,
  stakerAddr: string,
  dlpId: number,
  stakeAmount: number,
): StakeCreatedEvent {
  const normalizedAddr = stakerAddr.toLowerCase();
  const stakeCreatedEvent = changetype<StakeCreatedEvent>(newMockEvent());
  stakeCreatedEvent.parameters = new Array();
  stakeCreatedEvent.parameters.push(
    new ethereum.EventParam("stakeId", ethereum.Value.fromI32(<i32>stakeId)),
  );
  stakeCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "staker",
      ethereum.Value.fromAddress(Address.fromString(normalizedAddr)),
    ),
  );
  stakeCreatedEvent.parameters.push(
    new ethereum.EventParam("dlpId", ethereum.Value.fromI32(<i32>dlpId)),
  );
  stakeCreatedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromI32(<i32>stakeAmount)),
  );
  return stakeCreatedEvent;
}
