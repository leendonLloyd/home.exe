// The deployed Apps Script the app talks to.
//
// Committed on purpose: redeploys happen from the laptop, and phones should
// just work rather than needing the URL pasted again each time.
//
// Be aware of what that means. The deployment is open to "Anyone", so this URL
// is the only thing protecting the planner sheet — and the built bundle is
// served publicly from GitHub Pages, so it is readable by anyone who opens the
// deployed site regardless of where it is kept. Anyone holding it can read and
// edit the to-do list, the payments tab and the guest list, and submit RSVPs.
//
// If it ever needs revoking: Apps Script → Deploy → Manage deployments →
// Archive, create a new deployment, and change the line below. The old URL dies
// with the old deployment.
export const DEFAULT_EXEC_URL =
  'https://script.google.com/macros/s/AKfycbzrRh_kImEDxG7aLh30_rhhCgeivNGO4_uNUit16t6JQbcmvn809JIDOapVq9LGcQrt3g/exec';
