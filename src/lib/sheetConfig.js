// The deployed Apps Script the To Do and Payments screens talk to.
//
// Supplied at build time from the VITE_SHEET_EXEC_URL repository variable, and
// from .env.local when running locally — so a phone is set up without anyone
// pasting anything, and a redeploy from the laptop doesn't change that.
//
// Unlike the Firebase config this one really is a credential: the deployment is
// open to "Anyone", so holding the URL means being able to read and edit the
// planner sheet. Keeping it out of the source does not hide it — Vite inlines
// it and GitHub Pages serves that bundle publicly — so the way to revoke it is
// Apps Script → Deploy → Manage deployments → Archive, then deploy again and
// update the variable. The old URL dies with the old deployment.
export const DEFAULT_EXEC_URL = import.meta.env.VITE_SHEET_EXEC_URL || '';
