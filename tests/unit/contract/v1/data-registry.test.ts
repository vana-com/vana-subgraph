import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { handleFileAddedV1 } from "../../../../src/lib/contract/v1/data-registry";
import { createFileAddedEvent } from "./utils/data-registry-events";

// Hook to clear the store before each test, ensuring test isolation
beforeEach(() => {
  clearStore();
});

describe("handleFileAddedV1", () => {
  test("creates both a File and a FileOwner entity", () => {
    // 1. ARRANGE: Set up test data and create the mock event
    const fileId = 1;
    const ownerAddress = "0x1234567890123456789012345678901234567890";
    const url = "ipfs://Qm...";

    const fileAddedEvent = createFileAddedEvent(fileId, ownerAddress, url);

    // 2. ACT: Call the handler function with the mock event
    handleFileAddedV1(fileAddedEvent);

    // 3. ASSERT: Check that the store is in the correct state

    // --- Assert the NEW functionality ---
    assert.entityCount("File", 1);
    assert.fieldEquals("File", fileId.toString(), "id", fileId.toString());
    assert.fieldEquals("File", fileId.toString(), "owner", ownerAddress);
    assert.fieldEquals("File", fileId.toString(), "url", url);
    assert.fieldEquals("File", fileId.toString(), "schemaId", "0"); // Important check for V1
    assert.fieldEquals(
      "File",
      fileId.toString(),
      "transactionHash",
      fileAddedEvent.transaction.hash.toHexString(),
    );

    // Also check that the associated User was created
    assert.entityCount("User", 1);
    assert.fieldEquals("User", ownerAddress, "id", ownerAddress);

    // --- Assert the ORIGINAL functionality (prevents regression) ---
    assert.entityCount("FileOwner", 1);
    assert.fieldEquals("FileOwner", fileId.toString(), "id", fileId.toString());
    assert.fieldEquals(
      "FileOwner",
      fileId.toString(),
      "ownerAddress",
      ownerAddress,
    );
  });
});
