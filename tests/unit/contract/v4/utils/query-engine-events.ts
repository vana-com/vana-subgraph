import {
  Address,
  BigInt as GraphBigInt,
  ethereum,
} from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import { PaymentReceived } from "../../../../../generated/QueryEngineImplementation/QueryEngineImplementation";

/**
 * Creates a mock PaymentReceived event for testing
 */
export function createPaymentReceivedEvent(
  refinerId: number,
  token: Address,
  amount: GraphBigInt,
  jobId: GraphBigInt,
  customMockEvent: ethereum.Event | null = null,
): PaymentReceived {
  // Create a new mock event or use provided one
  const mockEvent = customMockEvent ? customMockEvent : newMockEvent();

  // Use changetype to convert to the specific event type
  const paymentReceivedEvent = changetype<PaymentReceived>(mockEvent);

  // Set up the parameters for the event
  paymentReceivedEvent.parameters = new Array();

  // Add token parameter
  paymentReceivedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token)),
  );

  // Add amount parameter
  paymentReceivedEvent.parameters.push(
    new ethereum.EventParam(
      "amount",
      ethereum.Value.fromUnsignedBigInt(amount),
    ),
  );

  // Add jobId parameter
  paymentReceivedEvent.parameters.push(
    new ethereum.EventParam("jobId", ethereum.Value.fromUnsignedBigInt(jobId)),
  );

  // Add refinerId parameter
  paymentReceivedEvent.parameters.push(
    new ethereum.EventParam(
      "refinerId",
      ethereum.Value.fromI32(<i32>refinerId),
    ),
  );

  return paymentReceivedEvent;
}
