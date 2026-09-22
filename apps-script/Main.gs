/**
 * The only doGet/doPost in the project. Apps Script allows exactly one of
 * each, so every feature routes through here rather than declaring its own —
 * that is what lets several scripts live in one project behind one URL.
 *
 * Add a feature by writing its own file and adding a line to each router.
 */

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};

    // Entourage and RSVP came from a separate project and keep their original
    // query shape, because the live RSVP form already points at this URL.
    const guests = guestsRoute_(params);
    if (guests) return guests;

    const view = params.view || 'todo';

    if (view === 'ping') {
      return json_({
        ok: true,
        build: BUILD,
        views: VIEWS_,
        endpoints: ENDPOINTS_,
        tabs: book_().getSheets().map((s) => s.getName()),
      });
    }
    if (view === 'todo') return json_({ ok: true, ...readAll_() });
    if (view === 'payments') return json_({ ok: true, ...readPayments_() });

    return json_({ ok: false, error: 'Unknown view "' + view + '". Known views: ' + VIEWS_.join(', ') });
  } catch (err) {
    return fail_(err);
  }
}

const VIEWS_ = ['ping', 'todo', 'payments'];

// Endpoints that predate ?view= and keep their own query shape.
const ENDPOINTS_ = ['?list=entourage', '?rsvp=lookup&name=', '?rsvp=submit&m=&mobile='];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = String(body.action || '');

    // Namespaced actions answer with their own feature's fresh state.
    if (action === 'payments.pay') {
      const paid = payVendor_(body);
      return json_(paid.ok ? { ...paid, ...readPayments_() } : paid);
    }

    // Unprefixed actions belong to the to-do list, which shipped before
    // anything else was here. New features should namespace theirs as
    // "feature.action" so they can never collide with these.
    const result =
      action === 'update' ? update_(body) :
      action === 'add' ? add_(body) :
      action === 'remove' ? remove_(body) :
      { ok: false, error: 'Unknown action: ' + action };

    // Mutations answer with fresh state, so the app never has to guess what
    // the sheet looks like afterwards.
    return json_(result.ok ? { ...result, ...readAll_() } : result);
  } catch (err) {
    return fail_(err);
  }
}
