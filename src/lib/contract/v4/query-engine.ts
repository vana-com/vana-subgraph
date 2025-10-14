import { log } from "@graphprotocol/graph-ts";
import { PaymentReceived, Refiner } from "../../../../generated/schema";
import { PaymentReceived as PaymentReceivedEvent } from "../../../../generated/QueryEngineImplementation/QueryEngineImplementation";
import {
  getOrCreateTotals,
  getOrCreateTotalsGlobal,
  getTotalsDlpId,
} from "../../entity/totals";
import { getTokenAmountInVana, getOrCreateRefiner } from "../shared";

export function handlePaymentReceived(event: PaymentReceivedEvent): void {
  // Create unique ID from transaction hash and log index
  const id = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;

  // Get or create refiner (handles race condition when events are processed out of order)
  const refinerId = event.params.refinerId.toString();
  const refiner = getOrCreateRefiner(refinerId);

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

  const amountInVana = getTokenAmountInVana(
    event.params.token,
    event.params.amount,
  );

  //save totals
  // Update global unique file contribution totals
  const totals = getOrCreateTotalsGlobal();
  totals.dataAccessFees = totals.dataAccessFees.plus(amountInVana);
  totals.save();

  // Update dlp file contribution totals
  const dlpTotalsId = getTotalsDlpId(refiner.dlp);
  const dlpTotals = getOrCreateTotals(dlpTotalsId);
  dlpTotals.dataAccessFees = dlpTotals.dataAccessFees.plus(amountInVana);
  dlpTotals.save();
}
