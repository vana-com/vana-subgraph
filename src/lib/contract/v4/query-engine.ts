import { log } from "@graphprotocol/graph-ts";
import { PaymentReceived, Refiner } from "../../../../generated/schema";
import { PaymentReceived as PaymentReceivedEvent } from "../../../../generated/QueryEngineImplementation/QueryEngineImplementation";

export function handlePaymentReceived(event: PaymentReceivedEvent): void {
  // Create unique ID from transaction hash and log index
  const id = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;

  // Check if refiner exists
  const refinerId = event.params.refinerId.toString();
  const refiner = Refiner.load(refinerId);
  if (!refiner) {
    log.error(
      "Payment received for unknown refiner: {}. TX: {}. This payment will not be tracked!",
      [refinerId, event.transaction.hash.toHexString()],
    );
    return;
  }

  // Create new PaymentReceived entity
  const payment = new PaymentReceived(id);
  payment.token = event.params.token;
  payment.amount = event.params.amount;
  payment.jobId = event.params.jobId;
  payment.refiner = refinerId;
  payment.receivedAt = event.block.timestamp;
  payment.receivedAtBlock = event.block.number;
  payment.receivedTxHash = event.transaction.hash;

  // Save the entity
  payment.save();
}
