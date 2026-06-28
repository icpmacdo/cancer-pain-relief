/* ============================================
   CANCER PAIN RELIEF — live markdown renderer
   Fetches a markdown file and renders it into
   the minimalist document shell. Auto-builds a
   sidebar table of contents with scroll-spy and
   a reading-progress indicator.
   ============================================ */

(function () {
	'use strict';

	function getMarkdownFile() {
		var body = document.body;
		var paramName = body.dataset.mdParam;
		var basePath = body.dataset.mdBase;

		if (paramName && basePath) {
			var params = new URLSearchParams(window.location.search);
			var slug = params.get(paramName);
			if (slug && /^[a-z0-9-]+$/.test(slug)) {
				return basePath.replace(/\/+$/, '') + '/' + slug + '.md';
			}
			return null;
		}

		return body.dataset.mdFile || 'cancer-pain-relief.md';
	}

	var MD_FILE = getMarkdownFile();
	var docEl = document.getElementById('doc');

	/* ---- Turn an <h2> heading into a stable slug id ---- */
	function slugify(text) {
		return text
			.toLowerCase()
			.replace(/[^\w]+/g, '-')   // runs of non-word chars -> hyphen
			.replace(/^-+|-+$/g, '');  // trim leading/trailing hyphens
	}

	/* ---- Wrap each <h2> + its following body in a .mapping-section ----
	   The source is plain markdown; the section/id/class structure that the
	   TOC and scroll-spy depend on is derived here at render time. Content
	   before the first <h2> (title, blockquote, figure) is left untouched. */
	function wrapSections() {
		var children = Array.prototype.slice.call(docEl.children);
		var section = null;
		children.forEach(function (el) {
			if (el.tagName === 'H2') {
				section = document.createElement('section');
				section.className = 'mapping-section';
				section.id = slugify(el.textContent.trim());
				docEl.insertBefore(section, el);
				section.appendChild(el);
			} else if (section) {
				section.appendChild(el);
			}
		});
	}

	/* ---- Build a TOC from the section headings ---- */
		function buildToc() {
			var sections = docEl.querySelectorAll('.mapping-section');
			if (!sections.length) return null;

		var nav = document.createElement('nav');
		nav.id = 'toc';
		nav.className = 'toc';
		nav.setAttribute('aria-label', 'Document sections');

		var list = document.createElement('ol');
		list.className = 'toc-list';

		sections.forEach(function (section, i) {
			var num = i + 1;
			var h2 = section.querySelector('h2');
			var title = h2 ? h2.textContent.trim() : 'Section ' + num;

			var li = document.createElement('li');
			var a = document.createElement('a');
			a.className = 'toc-item';
			a.href = '#' + section.id;
			a.dataset.target = section.id;
			a.innerHTML = '<span class="toc-label"></span>';
			a.querySelector('.toc-label').textContent = title;
			li.appendChild(a);
			list.appendChild(li);
		});

		nav.appendChild(list);
			docEl.parentNode.insertBefore(nav, docEl);
			return nav;
		}

		function buildBreadcrumb(firstH1) {
			var body = document.body;
			var homeLabel = body.dataset.homeLabel;
			var homeHref = body.dataset.homeHref;
			var parentLabel = body.dataset.parentLabel;
			var parentHref = body.dataset.parentHref;

			if (!homeLabel || !homeHref || !firstH1) return;

			var currentLabel = firstH1.textContent.trim();
			if (!currentLabel) return;

			var nav = document.createElement('nav');
			nav.className = 'breadcrumb';
			nav.setAttribute('aria-label', 'Breadcrumb');

			var home = document.createElement('a');
			home.href = homeHref;
			home.textContent = homeLabel;

			var parent = document.createElement('a');
			parent.href = parentHref;
			parent.textContent = parentLabel;

			var current = document.createElement('span');
			current.setAttribute('aria-current', 'page');
			current.textContent = currentLabel;

			function separator() {
				var span = document.createElement('span');
				span.className = 'breadcrumb-separator';
				span.setAttribute('aria-hidden', 'true');
				span.textContent = '/';
				return span;
			}

			nav.appendChild(home);
			nav.appendChild(separator());
			if (parentLabel && parentHref) {
				nav.appendChild(parent);
				nav.appendChild(separator());
			}
			nav.appendChild(current);
			docEl.insertBefore(nav, firstH1);
		}

	/* ---- Reading progress + active-section highlight ---- */
	function setupScrollSpy(nav) {
		var sections = Array.prototype.slice.call(
			docEl.querySelectorAll('.mapping-section')
		);
		var progress = document.getElementById('reading-progress');
		var items = {};
		if (nav) {
			nav.querySelectorAll('.toc-item').forEach(function (a) {
				items[a.dataset.target] = a;
			});
		}

		var ticking = false;

		function update() {
			ticking = false;

			if (progress) {
				var scrollable =
					document.documentElement.scrollHeight - window.innerHeight;
				var pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
				progress.style.width = Math.max(0, Math.min(100, pct)) + '%';
			}

			if (!sections.length) return;

			// Active = the last section whose top has crossed the offset line.
			var offset = 140;
			var current = sections[0];
			sections.forEach(function (s) {
				if (s.getBoundingClientRect().top <= offset) current = s;
			});
			Object.keys(items).forEach(function (id) {
				items[id].classList.toggle('active', id === current.id);
			});
		}

		function onScroll() {
			if (!ticking) {
				ticking = true;
				window.requestAnimationFrame(update);
			}
		}

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll, { passive: true });
		update();
	}

	function setupImageZoom() {
		var images = Array.prototype.slice.call(docEl.querySelectorAll('img'));
		if (!images.length) return;

		var overlay = document.createElement('div');
		overlay.className = 'image-lightbox';
		overlay.hidden = true;
		overlay.setAttribute('role', 'dialog');
		overlay.setAttribute('aria-modal', 'true');
		overlay.setAttribute('aria-label', 'Expanded image');
		overlay.tabIndex = -1;
		overlay.innerHTML =
			'<figure class="image-lightbox-figure">' +
				'<img class="image-lightbox-image" alt="">' +
				'<figcaption class="image-lightbox-caption"></figcaption>' +
			'</figure>';
		document.body.appendChild(overlay);

		var lightboxImage = overlay.querySelector('.image-lightbox-image');
		var caption = overlay.querySelector('.image-lightbox-caption');
		var lastFocus = null;

		function closeLightbox() {
			if (overlay.hidden) return;
			overlay.hidden = true;
			document.body.classList.remove('lightbox-open');
			lightboxImage.removeAttribute('src');
			lightboxImage.style.removeProperty('--zoom-width');
			if (lastFocus && typeof lastFocus.focus === 'function') {
				lastFocus.focus({ preventScroll: true });
			}
		}

		function openLightbox(image) {
			var captionText = image.getAttribute('alt') || '';
			var naturalWidth = image.naturalWidth || 1600;
			var targetWidth = Math.min(
				naturalWidth,
				Math.max(window.innerWidth * 1.6, 1100),
				2000
			);
			lastFocus = document.activeElement;
			lightboxImage.src = image.currentSrc || image.src;
			lightboxImage.alt = captionText;
			lightboxImage.style.setProperty('--zoom-width', Math.round(targetWidth) + 'px');
			caption.textContent = captionText;
			caption.hidden = !captionText;
			document.body.classList.add('lightbox-open');
			overlay.hidden = false;
			overlay.focus({ preventScroll: true });
		}

		images.forEach(function (image) {
			if (image.closest('a, button')) return;

			var trigger = document.createElement('button');
			trigger.type = 'button';
			trigger.className = 'image-zoom-trigger';
			trigger.setAttribute(
				'aria-label',
				'Expand image' + (image.alt ? ': ' + image.alt : '')
			);

			image.parentNode.insertBefore(trigger, image);
			trigger.appendChild(image);
			trigger.addEventListener('click', function () {
				openLightbox(image);
			});
		});

		lightboxImage.addEventListener('click', closeLightbox);
		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape') closeLightbox();
		});
	}

	function render(markdown) {
		marked.setOptions({
			gfm: true,
			breaks: false,
			headerIds: false, // ids live on the wrapping <section>, not the <h2>
			mangle: false
		});

		docEl.innerHTML = marked.parse(markdown);
		docEl.removeAttribute('aria-busy');

		wrapSections();

			// Use the first <h1> as the page title, if present.
			var firstH1 = docEl.querySelector('h1');
			if (firstH1 && firstH1.textContent.trim()) {
				document.title = firstH1.textContent.trim();
			}
			buildBreadcrumb(firstH1);

			// Open external links in a new tab.
		var links = docEl.querySelectorAll('a[href^="http"]');
		links.forEach(function (a) {
			a.setAttribute('target', '_blank');
			a.setAttribute('rel', 'noopener noreferrer');
		});

		var nav = buildToc();
		if (!nav) document.body.classList.add('toc-collapsed');
		setupScrollSpy(nav);
		setupImageZoom();

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

	if (!MD_FILE) {
		showError('Missing or invalid page parameter.');
	} else {
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
	}
})();
