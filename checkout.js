(function () {
  var basePrice = 19.99;
  var tipPercent = 0;
  var customTip = 0;

  var tipAmountEl = document.getElementById('tip-amount');
  var summarySubtotalEl = document.getElementById('summary-subtotal');
  var summaryTotalEl = document.getElementById('summary-total');
  var customTipInput = document.getElementById('custom-tip');
  var tipBtns = document.querySelectorAll('.tip-btn');

  function getTipValue() {
    if (customTip > 0) return customTip;
    return basePrice * (tipPercent / 100);
  }

  function getTotal() {
    return basePrice + getTipValue();
  }

  function formatMoney(n) {
    return 'US$' + n.toFixed(2);
  }

  function updateUI() {
    var tip = getTipValue();
    var total = getTotal();
    if (tipAmountEl) tipAmountEl.textContent = formatMoney(tip);
    if (summarySubtotalEl) summarySubtotalEl.textContent = formatMoney(basePrice);
    if (summaryTotalEl) summaryTotalEl.textContent = formatMoney(total);
  }

  if (tipBtns && tipBtns.length) {
    tipBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tipBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        tipPercent = parseInt(btn.getAttribute('data-tip') || '0', 10);
        customTip = 0;
        if (customTipInput) customTipInput.value = '';
        updateUI();
      });
    });
  }

  if (customTipInput) {
    customTipInput.addEventListener('input', function () {
      var val = parseFloat(customTipInput.value) || 0;
      customTip = val > 0 ? val : 0;
      if (customTip > 0) tipPercent = 0;
      tipBtns.forEach(function (b) { b.classList.remove('active'); });
      if (customTip === 0 && tipBtns[0]) tipBtns[0].classList.add('active');
      updateUI();
    });
  }

  // Stripe Payment Link — goes directly to Stripe (avoids Render cold start on Pay).
  // Production href is in checkout.html; local dev uses the test link below.
  var STRIPE_PAYMENT_LINK_TEST = 'https://buy.stripe.com/test_9B614m98N2OsceAdNNd7q00';

  var stripePay = document.getElementById('stripe-pay-link');
  if (stripePay) {
    if (location.port === '3000') {
      stripePay.href = STRIPE_PAYMENT_LINK_TEST;
    }
    stripePay.addEventListener('click', function (e) {
      var url = stripePay.getAttribute('href');
      if (!url || url.indexOf('buy.stripe.com') === -1) return;
      e.preventDefault();
      window.location.href = url;
    });
  }

  updateUI();
})();
