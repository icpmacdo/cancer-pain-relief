/* ============================================
   CANCER PAIN RELIEF — live markdown renderer
   Fetches a markdown file and renders it into
   the minimalist document shell.
   ============================================ */

(function () {
	'use strict';

	var MD_FILE = 'cancer-pain-relief.md';
	var docEl = document.getElementById('doc');

	function render(markdown) {
		marked.setOptions({
			gfm: true,
			breaks: false,
			headerIds: true,
			mangle: false
		});

		docEl.innerHTML = marked.parse(markdown);
		docEl.removeAttribute('aria-busy');

		// Use the first <h1> as the page title, if present.
		var firstH1 = docEl.querySelector('h1');
		if (firstH1 && firstH1.textContent.trim()) {
			document.title = firstH1.textContent.trim();
		}

		// Open external links in a new tab.
		var links = docEl.querySelectorAll('a[href^="http"]');
		links.forEach(function (a) {
			a.setAttribute('target', '_blank');
			a.setAttribute('rel', 'noopener noreferrer');
		});

		// If the page loaded with a #hash, jump to it now that content exists.
		if (window.location.hash) {
			var target = document.getElementById(window.location.hash.slice(1));
			if (target) target.scrollIntoView();
		}
	}

	function showError(message) {
		docEl.removeAttribute('aria-busy');
		docEl.innerHTML =
			'<p class="doc-status doc-error">Could not load the document.</p>' +
			'<p class="doc-status">' + message + '</p>';
	}

	fetch(MD_FILE, { cache: 'no-cache' })
		.then(function (res) {
			if (!res.ok) throw new Error('HTTP ' + res.status);
			return res.text();
		})
		.then(render)
		.catch(function (err) {
			showError(
				'Tip: open this page over HTTP (e.g. <code>python3 -m http.server</code>) ' +
				'rather than the <code>file://</code> protocol. (' + err.message + ')'
			);
		});

	/* ---- Scroll to top button ---- */
	var scrollBtn = document.getElementById('scrollToTop');
	if (scrollBtn) {
		window.addEventListener('scroll', function () {
			if (window.scrollY > 400) {
				scrollBtn.classList.add('visible');
			} else {
				scrollBtn.classList.remove('visible');
			}
		});
		scrollBtn.addEventListener('click', function () {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}
})();
