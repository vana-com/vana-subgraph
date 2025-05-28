import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import {
  getCurrentEpochReference,
  saveCurrentEpochReference,
} from "../../../../../src/lib/entity/epoch/epoch-reference";
import { EPOCH_REFERENCE_ID_CURRENT } from "../../../../../src/lib/entity/epoch/constants";
import { createNewEpochReference } from "../../../contract/utils";

beforeEach(() => {
  clearStore();
});

describe("getCurrentEpochReference", () => {
  test("returns epoch reference when it exists", () => {
    createNewEpochReference(EPOCH_REFERENCE_ID_CURRENT, "1");

    const result = getCurrentEpochReference();

    assert.assertNotNull(result);
    assert.fieldEquals(
      "EpochReference",
      EPOCH_REFERENCE_ID_CURRENT,
      "epoch",
      "1",
    );
  });

  test("returns null when no current epoch reference exists", () => {
    const result = getCurrentEpochReference();

    assert.assertNull(result);
  });
});

describe("saveCurrentEpochReference", () => {
  test("updates epoch reference when it exists", () => {
    createNewEpochReference(EPOCH_REFERENCE_ID_CURRENT, "1");

    const result = saveCurrentEpochReference("2");

    assert.assertNotNull(result);
    assert.fieldEquals(
      "EpochReference",
      EPOCH_REFERENCE_ID_CURRENT,
      "epoch",
      "2",
    );
  });

  test("creates epoch reference when no current epoch reference exists", () => {
    const result = saveCurrentEpochReference("1");

    assert.assertNotNull(result);
    assert.fieldEquals(
      "EpochReference",
      EPOCH_REFERENCE_ID_CURRENT,
      "epoch",
      "1",
    );
  });
});
