import { Bytes, BigInt as GraphBigInt, Address } from "@graphprotocol/graph-ts";

export class TxParams {
  txHash: Bytes;
  txTimestamp: GraphBigInt;
  txBlockNumber: GraphBigInt;
  txInitiator: Address;

  constructor(
    txHash: Bytes,
    txTimestamp: GraphBigInt,
    txBlockNumber: GraphBigInt,
    txInitiator: Address,
  ) {
    this.txHash = txHash;
    this.txTimestamp = txTimestamp;
    this.txBlockNumber = txBlockNumber;
    this.txInitiator = txInitiator;
  }
}
