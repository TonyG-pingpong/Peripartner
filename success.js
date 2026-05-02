(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search || '');
    return params.get(name);
  }

  var statusEl = $('status');
  var downloadBtn = $('downloadBtn');
  var hintEl = $('hint');

  var sessionId = getQueryParam('session_id');
  if (!sessionId) {
    statusEl.textContent = 'Missing session_id. Please return to the checkout and try again.';
    return;
  }

  // API base:
  // - If you set `window.PERIPARTNER_API_BASE` in the HTML, that wins.
  // - Local dev: if the site is served on :3000, call the local backend on :4000.
  // - Production: call the public API on `api.peripartner.com` (Render).
  var apiBase =
    window.PERIPARTNER_API_BASE ||
    (location.port === '3000'
      ? location.protocol + '//' + location.hostname + ':4000'
      : 'https://api.peripartner.com');

  function showError(msg) {
    statusEl.textContent = msg;
    statusEl.style.color = '#b00020';
  }

  function showDownload(url) {
    statusEl.textContent = 'Your download is ready.';
    statusEl.style.color = '#1a1a1a';
    downloadBtn.href = url;
    downloadBtn.style.display = 'inline-block';
    hintEl.style.display = 'block';
  }

  fetch(apiBase + '/api/stripe/fulfill?session_id=' + encodeURIComponent(sessionId), {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  })
    .then(function (res) {
      return res.json().then(function (json) {
        return { ok: res.ok, status: res.status, json: json };
      });
    })
    .then(function (result) {
      if (!result.ok) {
        var msg = (result.json && result.json.error) ? result.json.error : ('Request failed (' + result.status + ')');
        if (result.status === 402) {
          msg = 'Payment not completed yet. Please wait a moment and refresh this page.';
        }
        return showError(msg);
      }

      if (!result.json || !result.json.downloadUrl) {
        return showError('No download URL returned. Please contact support.');
      }

      showDownload(result.json.downloadUrl);
    })
    .catch(function (err) {
      showError('Could not reach the download service. Make sure the backend is running on ' + apiBase + '.');
      console.error(err);
    });
})();

