(function () {
  var shareBtn = document.querySelector('.share-btn');
  var popup = document.getElementById('share-popup');
  if (!shareBtn || !popup) return;

  var productUrl = 'https://margaritaflare100.gumroad.com/l/peripartner';
  var pageTitle = 'Perimenopause guide for partners';

  function openPopup() {
    popup.hidden = false;
    shareBtn.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', closeOnClickOutside);
  }

  function closePopup() {
    popup.hidden = true;
    shareBtn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', closeOnClickOutside);
  }

  function closeOnClickOutside(e) {
    if (!popup.contains(e.target) && e.target !== shareBtn) {
      closePopup();
    }
  }

  shareBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (popup.hidden) {
      openPopup();
    } else {
      closePopup();
    }
  });

  popup.addEventListener('click', function (e) {
    var option = e.target.closest('[data-action]');
    if (!option) return;
    e.preventDefault();

    var action = option.getAttribute('data-action');
    var url = window.location.href;
    var text = pageTitle;

    if (action === 'x') {
      window.open(
        'https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text),
        '_blank',
        'noopener,noreferrer'
      );
    } else if (action === 'facebook') {
      window.open(
        'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url),
        '_blank',
        'noopener,noreferrer'
      );
    } else if (action === 'copy') {
      var linkToCopy = url;
      var origHtml = option.innerHTML;
      function showCopied() {
        option.textContent = 'Link copied!';
        setTimeout(function () { option.innerHTML = origHtml; }, 1500);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(linkToCopy).then(showCopied);
      } else {
        var ta = document.createElement('textarea');
        ta.value = linkToCopy;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          showCopied();
        } catch (err) {}
        document.body.removeChild(ta);
      }
    }
    closePopup();
  });
})();
