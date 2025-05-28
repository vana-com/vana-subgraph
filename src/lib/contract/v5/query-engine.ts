import { log } from "@graphprotocol/graph-ts";
import { Refiner, PaymentReceived } from "../../../../generated/schema";
import { PaymentReceived as PaymentReceivedEvent } from "../../../../generated/QueryEngineImplementation/QueryEngineImplementation";

export function handlePaymentReceived(event: PaymentReceivedEvent): void {
  log.info("Handling PaymentReceived for refiner: {}", [
    event.params.refinerId.toString(),
  ]);

  // Create a unique ID for this payment
  const paymentId = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;

  // Load the associated refiner
  const refiner = Refiner.load(event.params.refinerId.toString());

  if (refiner) {
    // Create payment entity
    const payment = new PaymentReceived(paymentId);
    payment.refiner = refiner.id;
    payment.token = event.params.token;
    payment.amount = event.params.amount;
    payment.jobId = event.params.jobId;
    payment.receivedAt = event.block.timestamp;
    payment.receivedAtBlock = event.block.number;
    payment.receivedTxHash = event.transaction.hash;
    payment.save();
  } else {
    log.error("Payment received for unknown refiner: {}", [
      event.params.refinerId.toString(),
    ]);
  }
}
