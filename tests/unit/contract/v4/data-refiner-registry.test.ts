import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { Address } from "@graphprotocol/graph-ts";
import { handleRefinerAdded } from "../../../../src/lib/contract/v4/data-refiner-registry";
import { createRefinerAddedEvent } from "./utils/data-refiner-registry-events";
import { createNewDlp } from "../utils";

// Clear the store before each test
beforeEach(() => {
  clearStore();
});

describe("handleRefinerAdded", () => {
  test("creates a new Refiner entity with correct fields", () => {
    // Create prerequisites - a DLP that the refiner will belong to
    const dlpId = "1";
    const ownerAddressStr = "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce";
    const ownerAddress = Address.fromString(ownerAddressStr);
    createNewDlp(dlpId, ownerAddressStr, "Test DLP");

    // Create the RefinerAdded event
    const name = "Test Refiner";
    const schemaDefinitionUrl = "https://example.com/schema.json";
    const refinementInstructionUrl = "https://example.com/instructions.json";

    const refinerAddedEvent = createRefinerAddedEvent(
      1,
      1,
      name,
      schemaDefinitionUrl,
      refinementInstructionUrl,
    );

    // Set transaction sender (owner) for the event
    refinerAddedEvent.transaction.from = ownerAddress;

    // Call the handler with our event
    handleRefinerAdded(refinerAddedEvent);

    // Check that the Refiner entity was created
    assert.entityCount("Refiner", 1);

    // Check that all fields were set correctly
    assert.fieldEquals("Refiner", "1", "dlp", dlpId);
    assert.fieldEquals("Refiner", "1", "owner", ownerAddressStr);
    assert.fieldEquals("Refiner", "1", "name", name);
    assert.fieldEquals(
      "Refiner",
      "1",
      "schemaDefinitionUrl",
      schemaDefinitionUrl,
    );
    assert.fieldEquals(
      "Refiner",
      "1",
      "refinementInstructionUrl",
      refinementInstructionUrl,
    );
  });

  test("handles multiple refiner additions", () => {
    // Create prerequisites - DLPs
    const dlp1Id = "1";
    const dlp2Id = "2";
    const ownerAddressStr = "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce";
    const ownerAddress = Address.fromString(ownerAddressStr);
    createNewDlp(dlp1Id, ownerAddressStr, "Test DLP 1");
    createNewDlp(dlp2Id, ownerAddressStr, "Test DLP 2");

    // Create and process first refiner
    const refiner1Event = createRefinerAddedEvent(
      1,
      1,
      "Refiner 1",
      "https://example.com/schema1.json",
      "https://example.com/instructions1.json",
    );

    refiner1Event.transaction.from = ownerAddress;
    handleRefinerAdded(refiner1Event);

    // Create and process second refiner
    const refiner2Event = createRefinerAddedEvent(
      2,
      2,
      "Refiner 2",
      "https://example.com/schema2.json",
      "https://example.com/instructions2.json",
    );

    refiner2Event.transaction.from = ownerAddress;
    handleRefinerAdded(refiner2Event);

    // Check that both refiners were created
    assert.entityCount("Refiner", 2);

    // Check first refiner
    assert.fieldEquals("Refiner", "1", "dlp", dlp1Id);
    assert.fieldEquals("Refiner", "1", "name", "Refiner 1");

    // Check second refiner
    assert.fieldEquals("Refiner", "2", "dlp", dlp2Id);
    assert.fieldEquals("Refiner", "2", "name", "Refiner 2");
  });
});
