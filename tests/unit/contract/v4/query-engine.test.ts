import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
  newMockEvent,
  afterEach,
} from "matchstick-as/assembly/index";
import { Address, BigInt as GraphBigInt, Bytes } from "@graphprotocol/graph-ts";
import { handlePaymentReceived } from "../../../../src/lib/contract/v4/query-engine";
import { createPaymentReceivedEvent } from "./utils/query-engine-events";
import { createNewDlp, createNewRefiner } from "../utils";

// Clear the store before each test
beforeEach(() => {
  clearStore();
});

// Clear the store after each test
afterEach(() => {
  clearStore();
});

describe("handlePaymentReceived", () => {
  test("creates a new PaymentReceived entity with correct fields", () => {
    // Create prerequisites - a DLP and refiner
    const dlpId = "1";
    const ownerAddressStr = "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce";
    const ownerAddress = Address.fromString(ownerAddressStr);
    createNewDlp(dlpId, ownerAddressStr, "Test DLP");
    createNewRefiner("1", dlpId, ownerAddressStr, "Test Refiner");

    // Create the PaymentReceived event
    const token = "0x1111111111111111111111111111111111111111";
    const amount = GraphBigInt.fromI32(100);
    const jobId = GraphBigInt.fromI32(1);

    const paymentReceivedEvent = createPaymentReceivedEvent(
      1,
      Address.fromString(token),
      amount,
      jobId,
    );

    // Call the handler with our event
    handlePaymentReceived(paymentReceivedEvent);

    // Check that the PaymentReceived entity was created
    assert.entityCount("PaymentReceived", 1);

    // Check that all fields were set correctly
    const expectedId = `${paymentReceivedEvent.transaction.hash.toHexString()}-${paymentReceivedEvent.logIndex.toString()}`;

    assert.fieldEquals("PaymentReceived", expectedId, "refiner", "1");
    assert.fieldEquals("PaymentReceived", expectedId, "token", token);
    assert.fieldEquals(
      "PaymentReceived",
      expectedId,
      "amount",
      amount.toString(),
    );
    assert.fieldEquals(
      "PaymentReceived",
      expectedId,
      "jobId",
      jobId.toString(),
    );
    assert.fieldEquals(
      "PaymentReceived",
      expectedId,
      "receivedAt",
      paymentReceivedEvent.block.timestamp.toString(),
    );
    assert.fieldEquals(
      "PaymentReceived",
      expectedId,
      "receivedAtBlock",
      paymentReceivedEvent.block.number.toString(),
    );
    assert.fieldEquals(
      "PaymentReceived",
      expectedId,
      "receivedTxHash",
      paymentReceivedEvent.transaction.hash.toHexString(),
    );
  });

  test("handles multiple payment events", () => {
    // Create prerequisites - a DLP and multiple refiners
    const dlpId = "1";
    const ownerAddressStr = "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce";

    createNewDlp(dlpId, ownerAddressStr, "Test DLP");
    createNewRefiner("1", dlpId, ownerAddressStr, "Refiner 1");
    createNewRefiner("2", dlpId, ownerAddressStr, "Refiner 2");

    // Token address
    const token = "0x1111111111111111111111111111111111111111";

    // First payment - create a mock event with unique transaction hash
    const amount1 = GraphBigInt.fromI32(100);
    const jobId1 = GraphBigInt.fromI32(1);

    const mockEvent1 = newMockEvent();
    mockEvent1.transaction.hash = Bytes.fromHexString(
      "0x1111111111111111111111111111111111111111",
    ) as Bytes;
    mockEvent1.logIndex = GraphBigInt.fromI32(1);

    const paymentEvent1 = createPaymentReceivedEvent(
      1,
      Address.fromString(token),
      amount1,
      jobId1,
      mockEvent1,
    );

    handlePaymentReceived(paymentEvent1);

    // Second payment - create another mock event with different transaction hash
    const amount2 = GraphBigInt.fromI32(200);
    const jobId2 = GraphBigInt.fromI32(2);

    const mockEvent2 = newMockEvent();
    mockEvent2.transaction.hash = Bytes.fromHexString(
      "0x2222222222222222222222222222222222222222",
    ) as Bytes;
    mockEvent2.logIndex = GraphBigInt.fromI32(2);

    const paymentEvent2 = createPaymentReceivedEvent(
      2,
      Address.fromString(token),
      amount2,
      jobId2,
      mockEvent2,
    );

    handlePaymentReceived(paymentEvent2);

    // Check that both payment entities were created
    assert.entityCount("PaymentReceived", 2);

    // Check first payment
    const expectedId1 = `${paymentEvent1.transaction.hash.toHexString()}-${paymentEvent1.logIndex.toString()}`;
    assert.fieldEquals("PaymentReceived", expectedId1, "refiner", "1");
    assert.fieldEquals(
      "PaymentReceived",
      expectedId1,
      "amount",
      amount1.toString(),
    );
    assert.fieldEquals(
      "PaymentReceived",
      expectedId1,
      "jobId",
      jobId1.toString(),
    );

    // Check second payment
    const expectedId2 = `${paymentEvent2.transaction.hash.toHexString()}-${paymentEvent2.logIndex.toString()}`;
    assert.fieldEquals("PaymentReceived", expectedId2, "refiner", "2");
    assert.fieldEquals(
      "PaymentReceived",
      expectedId2,
      "amount",
      amount2.toString(),
    );
    assert.fieldEquals(
      "PaymentReceived",
      expectedId2,
      "jobId",
      jobId2.toString(),
    );
  });

  test("handles large amount values correctly", () => {
    // Create prerequisites
    const dlpId = "1";
    const ownerAddressStr = "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce";
    createNewDlp(dlpId, ownerAddressStr, "Test DLP");
    createNewRefiner("1", dlpId, ownerAddressStr, "Test Refiner");

    // Create event with a large amount (1 billion tokens with 18 decimals)
    const token = "0x1111111111111111111111111111111111111111";
    const largeAmount = GraphBigInt.fromString("1000000000000000000000000000");
    const jobId = GraphBigInt.fromI32(1);

    const paymentEvent = createPaymentReceivedEvent(
      1,
      Address.fromString(token),
      largeAmount,
      jobId,
    );

    handlePaymentReceived(paymentEvent);

    // Verify entity was created with correct large amount
    assert.entityCount("PaymentReceived", 1);
    const expectedId = `${paymentEvent.transaction.hash.toHexString()}-${paymentEvent.logIndex.toString()}`;
    assert.fieldEquals(
      "PaymentReceived",
      expectedId,
      "amount",
      largeAmount.toString(),
    );
  });

  test("handles multiple payments for the same refiner", () => {
    // Create prerequisites
    const dlpId = "1";
    const ownerAddressStr = "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce";
    createNewDlp(dlpId, ownerAddressStr, "Test DLP");
    createNewRefiner("1", dlpId, ownerAddressStr, "Test Refiner");

    // Create multiple payments for the same refiner
    const token = "0x1111111111111111111111111111111111111111";
    const refinerId = 1;

    // Payment 1
    const mockEvent1 = newMockEvent();
    mockEvent1.transaction.hash = Bytes.fromHexString(
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1",
    ) as Bytes;
    mockEvent1.logIndex = GraphBigInt.fromI32(1);
    const paymentEvent1 = createPaymentReceivedEvent(
      refinerId,
      Address.fromString(token),
      GraphBigInt.fromI32(100),
      GraphBigInt.fromI32(1),
      mockEvent1,
    );

    // Payment 2 - same refiner, different tx
    const mockEvent2 = newMockEvent();
    mockEvent2.transaction.hash = Bytes.fromHexString(
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa2",
    ) as Bytes;
    mockEvent2.logIndex = GraphBigInt.fromI32(1);
    const paymentEvent2 = createPaymentReceivedEvent(
      refinerId,
      Address.fromString(token),
      GraphBigInt.fromI32(200),
      GraphBigInt.fromI32(2),
      mockEvent2,
    );

    // Handle both events
    handlePaymentReceived(paymentEvent1);
    handlePaymentReceived(paymentEvent2);

    // Verify both entities were created
    assert.entityCount("PaymentReceived", 2);

    // Check first payment
    const expectedId1 = `${paymentEvent1.transaction.hash.toHexString()}-${paymentEvent1.logIndex.toString()}`;
    assert.fieldEquals("PaymentReceived", expectedId1, "refiner", "1");
    assert.fieldEquals("PaymentReceived", expectedId1, "amount", "100");

    // Check second payment
    const expectedId2 = `${paymentEvent2.transaction.hash.toHexString()}-${paymentEvent2.logIndex.toString()}`;
    assert.fieldEquals("PaymentReceived", expectedId2, "refiner", "1");
    assert.fieldEquals("PaymentReceived", expectedId2, "amount", "200");
  });

  test("correctly handles multiple payments in same transaction (different log indexes)", () => {
    // Create prerequisites
    const dlpId = "1";
    const ownerAddressStr = "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce";
    createNewDlp(dlpId, ownerAddressStr, "Test DLP");
    createNewRefiner("1", dlpId, ownerAddressStr, "Refiner 1");
    createNewRefiner("2", dlpId, ownerAddressStr, "Refiner 2");

    // Create events with same transaction hash but different log indexes
    const token = "0x1111111111111111111111111111111111111111";
    const txHash = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    // Payment 1
    const mockEvent1 = newMockEvent();
    mockEvent1.transaction.hash = Bytes.fromHexString(txHash) as Bytes;
    mockEvent1.logIndex = GraphBigInt.fromI32(1);
    const paymentEvent1 = createPaymentReceivedEvent(
      1,
      Address.fromString(token),
      GraphBigInt.fromI32(100),
      GraphBigInt.fromI32(1),
      mockEvent1,
    );

    // Payment 2 - same tx, different log index
    const mockEvent2 = newMockEvent();
    mockEvent2.transaction.hash = Bytes.fromHexString(txHash) as Bytes;
    mockEvent2.logIndex = GraphBigInt.fromI32(2);
    const paymentEvent2 = createPaymentReceivedEvent(
      2,
      Address.fromString(token),
      GraphBigInt.fromI32(200),
      GraphBigInt.fromI32(2),
      mockEvent2,
    );

    // Handle both events
    handlePaymentReceived(paymentEvent1);
    handlePaymentReceived(paymentEvent2);

    // Verify both entities were created with distinct IDs
    assert.entityCount("PaymentReceived", 2);

    // Check first payment
    const expectedId1 = `${txHash}-1`;
    assert.fieldEquals("PaymentReceived", expectedId1, "refiner", "1");

    // Check second payment
    const expectedId2 = `${txHash}-2`;
    assert.fieldEquals("PaymentReceived", expectedId2, "refiner", "2");
  });
});
