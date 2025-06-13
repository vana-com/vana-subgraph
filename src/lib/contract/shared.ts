import {Dlp, User} from "../../../generated/schema";
import {getOrCreateTotals, getTotalsIdDlp} from "../entity/totals";

export function getOrCreateUser(userId: string): User {
  let user = User.load(userId);
  if (user == null) {
    user = new User(userId);
    user.save();
  }
  return user;
}

export function getOrCreateDlp(dlpId: string): Dlp {
  let dlp = Dlp.load(dlpId);
  if (dlp == null) {
    dlp = new Dlp(dlpId);

    const dlpTotalsId = getTotalsIdDlp(dlpId);
    getOrCreateTotals(dlpTotalsId);

    // Link totals to Dlp
    dlp.totals = dlpTotalsId;
    dlp.save();
  }
  return dlp;
}
