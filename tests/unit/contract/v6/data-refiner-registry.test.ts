import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { Address } from "@graphprotocol/graph-ts";
import {
  handleRefinerAdded,
  handleSchemaAdded,
} from "../../../../src/lib/contract/v6/data-refiner-registry";
import {
  createRefinerAddedEventV6,
  createSchemaAddedEvent,
} from "./utils/data-refiner-registry-events";
import { createNewDlp } from "../utils";

// Clear the store before each test
beforeEach(() => {
  clearStore();
});

describe("handleSchemaAdded", () => {
  test("creates a new Schema entity with correct fields", () => {
    // Create the SchemaAdded event
    const schemaId = 1;
    const name = "Test Schema";
    const dialect = "JSON";
    const definitionUrl = "https://example.com/schema.json";

    const schemaAddedEvent = createSchemaAddedEvent(
      schemaId,
      name,
      dialect,
      definitionUrl,
    );

    // Call the handler with our event
    handleSchemaAdded(schemaAddedEvent);

    // Check that the Schema entity was created
    assert.entityCount("Schema", 1);

    // Check that all fields were set correctly
    assert.fieldEquals("Schema", "1", "name", name);
    assert.fieldEquals("Schema", "1", "dialect", dialect);
    assert.fieldEquals("Schema", "1", "definitionUrl", definitionUrl);
    assert.fieldEquals(
      "Schema",
      "1",
      "createdAt",
      schemaAddedEvent.block.timestamp.toString(),
    );
    assert.fieldEquals(
      "Schema",
      "1",
      "createdAtBlock",
      schemaAddedEvent.block.number.toString(),
    );
    assert.fieldEquals(
      "Schema",
      "1",
      "createdTxHash",
      schemaAddedEvent.transaction.hash.toHexString(),
    );
  });

  test("handles multiple schema additions", () => {
    // Create and process first schema
    const schema1Event = createSchemaAddedEvent(
      1,
      "Schema 1",
      "JSON",
      "https://example.com/schema1.json",
    );
    handleSchemaAdded(schema1Event);

    // Create and process second schema
    const schema2Event = createSchemaAddedEvent(
      2,
      "Schema 2",
      "XML",
      "https://example.com/schema2.xml",
    );
    handleSchemaAdded(schema2Event);

    // Check that both schemas were created
    assert.entityCount("Schema", 2);

    // Check first schema
    assert.fieldEquals("Schema", "1", "name", "Schema 1");
    assert.fieldEquals("Schema", "1", "dialect", "JSON");

    // Check second schema
    assert.fieldEquals("Schema", "2", "name", "Schema 2");
    assert.fieldEquals("Schema", "2", "dialect", "XML");
  });
});

describe("handleRefinerAdded v6", () => {
  test("creates a new Refiner entity with schema reference", () => {
    // Create prerequisites - a DLP and Schema
    const dlpId = "1";
    const schemaId = 1;
    const ownerAddressStr = "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce";
    const ownerAddress = Address.fromString(ownerAddressStr);
    createNewDlp(dlpId, ownerAddressStr, "Test DLP");

    // Create the schema first
    const schemaEvent = createSchemaAddedEvent(
      schemaId,
      "Test Schema",
      "JSON",
      "https://example.com/schema.json",
    );
    handleSchemaAdded(schemaEvent);

    // Create the RefinerAdded event
    const name = "Test Refiner";
    const schemaDefinitionUrl = "https://example.com/schema.json";
    const refinementInstructionUrl = "https://example.com/instructions.json";

    const refinerAddedEvent = createRefinerAddedEventV6(
      1,
      1,
      name,
      schemaId,
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
    assert.fieldEquals("Refiner", "1", "schema", schemaId.toString());
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

  test("multiple refiners can reference the same schema", () => {
    // Create prerequisites
    const dlp1Id = "1";
    const dlp2Id = "2";
    const schemaId = 1;
    const ownerAddressStr = "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce";
    const ownerAddress = Address.fromString(ownerAddressStr);

    createNewDlp(dlp1Id, ownerAddressStr, "Test DLP 1");
    createNewDlp(dlp2Id, ownerAddressStr, "Test DLP 2");

    // Create a single schema
    const schemaEvent = createSchemaAddedEvent(
      schemaId,
      "Shared Schema",
      "JSON",
      "https://example.com/shared-schema.json",
    );
    handleSchemaAdded(schemaEvent);

    // Create first refiner using the schema
    const refiner1Event = createRefinerAddedEventV6(
      1,
      1,
      "Refiner 1",
      schemaId,
      "https://example.com/schema.json",
      "https://example.com/instructions1.json",
    );
    refiner1Event.transaction.from = ownerAddress;
    handleRefinerAdded(refiner1Event);

    // Create second refiner using the same schema
    const refiner2Event = createRefinerAddedEventV6(
      2,
      2,
      "Refiner 2",
      schemaId,
      "https://example.com/schema.json",
      "https://example.com/instructions2.json",
    );
    refiner2Event.transaction.from = ownerAddress;
    handleRefinerAdded(refiner2Event);

    // Check that both refiners were created
    assert.entityCount("Refiner", 2);
    assert.entityCount("Schema", 1);

    // Check that both refiners reference the same schema
    assert.fieldEquals("Refiner", "1", "schema", schemaId.toString());
    assert.fieldEquals("Refiner", "2", "schema", schemaId.toString());
  });
});
