import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import {dlps} from "../../../mapping";
import {getOrCreateDlp} from "../../contract/shared";

export function handleBootstrap(block: ethereum.Block): void {
  for (let i = 0; i < dlps.length; i++) {
    const dlp = getOrCreateDlp(dlps[i].id.toString());
    dlp.verificationBlockNumber = BigInt.fromI32(
      dlps[i].verificationBlockNumber,
    );

        dlp.save();
    }
}
