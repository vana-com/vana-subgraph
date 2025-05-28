import { DlpList } from "../../../generated/schema";

export const DLP_LIST_ID = "all_dlps";

export function getOrCreateDlpList(): DlpList {
  let dlpList = DlpList.load(DLP_LIST_ID);

  if (dlpList == null) {
    dlpList = new DlpList(DLP_LIST_ID);
    dlpList.dlpIds = [];
    dlpList.save();
  }

  return dlpList;
}
