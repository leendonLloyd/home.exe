// Talks to the Apps Script web app. Two details matter and both are CORS:
//
//  1. POST bodies go out as text/plain. Sending application/json would make
//     the browser fire a preflight OPTIONS, which Apps Script doesn't answer,
//     and the request fails before it ever reaches the script.
//  2. Apps Script answers with a 302 to googleusercontent.com. fetch follows
//     it automatically and the final response carries the CORS header, so a
//     plain fetch works — but only if the deployment is open to "Anyone".

const URL_KEY = 'home.exe:todo:url';
const CACHE_KEY = 'home.exe:todo:cache:v1';

export const readUrl = () => {
  try {
    return window.localStorage.getItem(URL_KEY) || '';
  } catch {
    return '';
  }
};

export const writeUrl = (url) => {
  try {
    if (url) window.localStorage.setItem(URL_KEY, url.trim());
    else window.localStorage.removeItem(URL_KEY);
  } catch {
    /* storage unavailable — the app still works for this session */
  }
};

export const readCache = () => {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const writeCache = (payload) => {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* cache is a convenience, not a requirement */
  }
};

export const looksLikeExecUrl = (url) =>
  /^https:\/\/script\.google\.com\/.*\/exec(\?.*)?$/.test(url.trim());

// Apps Script serves an HTML error page when a deployment is misconfigured,
// so a parse failure is far more likely to be a setup problem than a bug.
async function parse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    if (/<\s*html/i.test(text)) {
      throw new Error(
        'The script returned a web page instead of data. Check the deployment is a Web app with access set to "Anyone".'
      );
    }
    throw new Error(`Unexpected response from the script: ${text.slice(0, 120)}`);
  }
}

function failed(error) {
  // A blocked or redirected-to-login request surfaces as a bare TypeError.
  if (error instanceof TypeError) {
    return new Error(
      'Could not reach the script. Check the URL, and that the deployment allows "Anyone" rather than "Anyone with a Google account".'
    );
  }
  return error;
}

export async function fetchTasks(url) {
  try {
    const payload = await parse(await fetch(url, { method: 'GET', redirect: 'follow' }));
    if (!payload.ok) throw new Error(payload.error || 'The script reported a failure.');
    return payload;
  } catch (error) {
    throw failed(error);
  }
}

export async function sendAction(url, body) {
  try {
    const payload = await parse(
      await fetch(url, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
      })
    );
    if (!payload.ok) {
      const error = new Error(payload.error || 'The script reported a failure.');
      error.stale = Boolean(payload.stale);
      throw error;
    }
    return payload;
  } catch (error) {
    throw failed(error);
  }
}
