import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
  log,
} from "matchstick-as/assembly/index";
import {
  BigInt as GraphBigInt,
  ethereum,
  Bytes,
  Address,
} from "@graphprotocol/graph-ts";
import {
  handlePermissionAdded,
  handlePermissionRevoked,
} from "../../../../src/lib/contract/v6/data-portability-permissions";
import {
  handleGranteeRegistered,
} from "../../../../src/lib/contract/v6/data-portability-grantees";
import {
  getOrCreateGrantee,
  getOrCreateUser,
} from "../../../../src/lib/contract/shared";
import { Grantee, Permission, User, File, PermissionFile } from "../../../../generated/schema";

// Event creation helpers
function createGranteeRegisteredEvent(
  granteeId: i32,
  owner: string,
  granteeAddress: string,
  publicKey: string,
): ethereum.Event {
  const event = newMockEvent();

  const granteeIdParam = new ethereum.EventParam(
    "granteeId",
    ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(granteeId))
  );
  const ownerParam = new ethereum.EventParam(
    "owner",
    ethereum.Value.fromAddress(Address.fromString(owner))
  );
  const granteeAddressParam = new ethereum.EventParam(
    "granteeAddress",
    ethereum.Value.fromAddress(Address.fromString(granteeAddress))
  );
  const publicKeyParam = new ethereum.EventParam(
    "publicKey",
    ethereum.Value.fromString(publicKey)
  );

  event.parameters = [granteeIdParam, ownerParam, granteeAddressParam, publicKeyParam];
  return event;
}

function createPermissionAddedEvent(
  permissionId: i32,
  user: string,
  granteeId: i32,
  grant: string,
  fileIds: i32[],
): ethereum.Event {
  const event = newMockEvent();

  const permissionIdParam = new ethereum.EventParam(
    "permissionId",
    ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(permissionId))
  );
  const userParam = new ethereum.EventParam(
    "user",
    ethereum.Value.fromAddress(Address.fromString(user))
  );
  const granteeIdParam = new ethereum.EventParam(
    "granteeId",
    ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(granteeId))
  );
  const grantParam = new ethereum.EventParam(
    "grant",
    ethereum.Value.fromString(grant)
  );

  const fileIdArray: Array<ethereum.Value> = [];
  for (let i = 0; i < fileIds.length; i++) {
    fileIdArray.push(ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(fileIds[i])));
  }
  const fileIdsParam = new ethereum.EventParam(
    "fileIds",
    ethereum.Value.fromArray(fileIdArray)
  );

  event.parameters = [permissionIdParam, userParam, granteeIdParam, grantParam, fileIdsParam];
  return event;
}

function createPermissionRevokedEvent(permissionId: i32): ethereum.Event {
  const event = newMockEvent();

  const permissionIdParam = new ethereum.EventParam(
    "permissionId",
    ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(permissionId))
  );

  event.parameters = [permissionIdParam];
  return event;
}

function newMockEvent(): ethereum.Event {
  const event = changetype<ethereum.Event>(newMockCall());
  event.block.number = GraphBigInt.fromI32(1);
  event.block.timestamp = GraphBigInt.fromI32(1000000);
  event.transaction.hash = Bytes.fromHexString("0x1234567890123456789012345678901234567890123456789012345678901234");
  event.address = Address.fromString("0x0000000000000000000000000000000000000000");
  return event;
}

function newMockCall(): ethereum.Call {
  return new ethereum.Call(
    Address.fromString("0x0000000000000000000000000000000000000000"),
    Address.fromString("0x0000000000000000000000000000000000000001"),
    null,
    null,
    [],
    [],
    [],
  );
}

// Clear the store before each test
beforeEach(() => {
  clearStore();
});

describe("getOrCreateGrantee", () => {
  test("creates a new grantee with placeholder values when it doesn't exist", () => {
    const granteeId = "1";

    // Verify grantee doesn't exist initially
    assert.assertNull(Grantee.load(granteeId));

    // Call getOrCreateGrantee
    const grantee = getOrCreateGrantee(granteeId);

    // Verify grantee was created with placeholder values
    assert.assertNotNull(grantee);
    assert.stringEquals(grantee.id, granteeId);
    assert.stringEquals(grantee.owner, "");
    assert.bytesEquals(grantee.address, Bytes.empty());
    assert.stringEquals(grantee.publicKey, "");
    assert.bigIntEquals(grantee.registeredAtBlock, GraphBigInt.zero());
    assert.bigIntEquals(grantee.registeredAtTimestamp, GraphBigInt.zero());
    assert.bytesEquals(grantee.transactionHash, Bytes.empty());

    // Verify it's saved to the store
    const loadedGrantee = Grantee.load(granteeId);
    assert.assertNotNull(loadedGrantee);
  });

  test("returns existing grantee without modification when it exists", () => {
    const granteeId = "1";
    const ownerAddress = "0x1111111111111111111111111111111111111111";
    const granteeAddress = "0x2222222222222222222222222222222222222222";

    // Create and handle a GranteeRegistered event first
    const event = createGranteeRegisteredEvent(
      1,
      ownerAddress,
      granteeAddress,
      "test-public-key"
    );
    handleGranteeRegistered(changetype<any>(event));

    // Load the created grantee
    const existingGrantee = Grantee.load(granteeId);
    assert.assertNotNull(existingGrantee);

    // Call getOrCreateGrantee on existing grantee
    const grantee = getOrCreateGrantee(granteeId);

    // Verify it returns the existing grantee with original values
    assert.stringEquals(grantee.owner, ownerAddress.toLowerCase());
    assert.bytesEquals(grantee.address, Address.fromString(granteeAddress));
    assert.stringEquals(grantee.publicKey, "test-public-key");
    assert.bigIntEquals(grantee.registeredAtBlock, GraphBigInt.fromI32(1));
  });
});

describe("handlePermissionAdded", () => {
  test("creates permission with placeholder grantee if grantee doesn't exist", () => {
    const permissionId = 1;
    const userAddress = "0x1111111111111111111111111111111111111111";
    const granteeId = 1;
    const grant = "read";
    const fileIds = [100, 101];

    // Handle permission added event without creating grantee first
    const event = createPermissionAddedEvent(
      permissionId,
      userAddress,
      granteeId,
      grant,
      fileIds
    );
    handlePermissionAdded(changetype<any>(event));

    // Verify permission was created
    const permission = Permission.load(permissionId.toString());
    assert.assertNotNull(permission);
    assert.stringEquals(permission!.grantor, userAddress.toLowerCase());
    assert.stringEquals(permission!.grantee, granteeId.toString());
    assert.stringEquals(permission!.grant, grant);

    // Verify placeholder grantee was created
    const grantee = Grantee.load(granteeId.toString());
    assert.assertNotNull(grantee);
    assert.stringEquals(grantee!.owner, ""); // Placeholder value
    assert.bytesEquals(grantee!.address, Bytes.empty()); // Placeholder value

    // Verify permission files were created
    const permissionFile1 = PermissionFile.load(`${permissionId}-100`);
    const permissionFile2 = PermissionFile.load(`${permissionId}-101`);
    assert.assertNotNull(permissionFile1);
    assert.assertNotNull(permissionFile2);
  });

  test("handles events in wrong order: permission before grantee registration", () => {
    const granteeId = 1;
    const permissionId = 1;
    const userAddress = "0x1111111111111111111111111111111111111111";
    const granteeAddress = "0x2222222222222222222222222222222222222222";

    // Step 1: Permission added event arrives first (wrong order)
    const permissionEvent = createPermissionAddedEvent(
      permissionId,
      userAddress,
      granteeId,
      "write",
      [200]
    );
    handlePermissionAdded(changetype<any>(permissionEvent));

    // Verify placeholder grantee was created
    let grantee = Grantee.load(granteeId.toString());
    assert.assertNotNull(grantee);
    assert.stringEquals(grantee!.owner, ""); // Placeholder

    // Step 2: Grantee registration event arrives later
    const granteeEvent = createGranteeRegisteredEvent(
      granteeId,
      userAddress,
      granteeAddress,
      "real-public-key"
    );
    handleGranteeRegistered(changetype<any>(granteeEvent));

    // Verify grantee now has real values
    grantee = Grantee.load(granteeId.toString());
    assert.assertNotNull(grantee);
    assert.stringEquals(grantee!.owner, userAddress.toLowerCase());
    assert.bytesEquals(grantee!.address, Address.fromString(granteeAddress));
    assert.stringEquals(grantee!.publicKey, "real-public-key");

    // Verify permission still exists and is properly linked
    const permission = Permission.load(permissionId.toString());
    assert.assertNotNull(permission);
    assert.stringEquals(permission!.grantee, granteeId.toString());
  });
});

describe("handlePermissionRevoked", () => {
  test("sets endBlock on existing permission", () => {
    const permissionId = 1;
    const userAddress = "0x1111111111111111111111111111111111111111";
    const granteeId = 1;

    // First create a permission
    const addEvent = createPermissionAddedEvent(
      permissionId,
      userAddress,
      granteeId,
      "read",
      []
    );
    handlePermissionAdded(changetype<any>(addEvent));

    // Verify permission exists without endBlock
    let permission = Permission.load(permissionId.toString());
    assert.assertNotNull(permission);
    assert.assertNull(permission!.endBlock);

    // Revoke the permission
    const revokeEvent = createPermissionRevokedEvent(permissionId);
    revokeEvent.block.number = GraphBigInt.fromI32(100);
    handlePermissionRevoked(changetype<any>(revokeEvent));

    // Verify endBlock is now set
    permission = Permission.load(permissionId.toString());
    assert.assertNotNull(permission);
    assert.bigIntEquals(permission!.endBlock!, GraphBigInt.fromI32(100));
  });

  test("handles revoke event for non-existent permission gracefully", () => {
    const permissionId = 999;

    // Try to revoke a permission that doesn't exist
    const revokeEvent = createPermissionRevokedEvent(permissionId);

    // Should not throw, just log a warning
    handlePermissionRevoked(changetype<any>(revokeEvent));

    // Verify no permission was created
    assert.assertNull(Permission.load(permissionId.toString()));
  });
});