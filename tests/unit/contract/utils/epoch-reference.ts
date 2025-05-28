import { EpochReference } from "../../../../generated/schema";

export function epochReferenceDefaults(
  id: string,
  epochId: string,
): EpochReference {
  const epochReference = new EpochReference(id);
  epochReference.epoch = epochId;
  return epochReference;
}

export function createNewEpochReference(
  id: string,
  epochId: string,
): EpochReference {
  const epochReference = epochReferenceDefaults(id, epochId);
  epochReference.save();
  return epochReference;
}
