CodeMirror.defineExtension('autoFormatRange', function(from, to) {
	var cm = this
	var outer = cm.getMode(),
		text = cm.getRange(from, to).split('\n')
	var state = CodeMirror.copyState(outer, cm.getTokenAt(from).state)
	var tabSize = cm.getOption('tabSize')

	var out = '',
		lines = 0,
		atSol = from.ch == 0
	function newline() {
		out += '\n'
		atSol = true
		++lines
	}

	for (var i = 0; i < text.length; ++i) {
		var stream = new CodeMirror.StringStream(text[i], tabSize)
		while (!stream.eol()) {
			var inner = CodeMirror.innerMode(outer, state)
			var style = outer.token(stream, state),
				cur = stream.current()
			stream.start = stream.pos
			if (!atSol || /\S/.test(cur)) {
				out += cur
				atSol = false
			}
			if (
				!atSol &&
				inner.mode.newlineAfterToken &&
				inner.mode.newlineAfterToken(
					style,
					cur,
					stream.string.slice(stream.pos) || text[i + 1] || '',
					inner.state
				)
			)
				newline()
		}
		if (!stream.pos && outer.blankLine) outer.blankLine(state)
		if (!atSol) newline()
	}

	cm.operation(function() {
		cm.replaceRange(out, from, to)
		for (var cur = from.line + 1, end = from.line + lines; cur <= end; ++cur)
			cm.indentLine(cur, 'smart')
	})
})

// Applies automatic mode-aware indentation to the specified range
CodeMirror.defineExtension('autoIndentRange', function(from, to) {
	var cmInstance = this
	this.operation(function() {
		for (var i = from.line; i <= to.line; i++) {
			cmInstance.indentLine(i, 'smart')
		}
	})
})

CodeMirror.defineMode('highlightPatterns', function(config, parserConfig) {
	var patterns = parserConfig.patterns || []
	var searchOverlay = {
		token: function(stream, state) {
			for (i = 0; i < patterns.length; i++) {
				if (stream.match(patterns[i])) {
					return 'highlightPatterns'
				}
			}

			skip: while (stream.next() != null) {
				for (i = 0; i < patterns.length; i++) {
					if (stream.match(patterns[i], false)) {
						break skip
					}
				}
			}
			return null
		},
	}
	return CodeMirror.overlayMode(
		CodeMirror.getMode(config, parserConfig.backdrop || 'text/html'),
		searchOverlay
	)
})

var styleguide = styleguide || {}

;(function() {
	function isDomReady(whenState) {
		return document.readyState === 'complete' || document.readyState == whenState
	}
	var domReady = function(whenState, callback) {
		isDomReady(whenState)
			? callback()
			: document.addEventListener('readystatechange', checkState, false)
		function checkState() {
			if (isDomReady(whenState)) {
				document.removeEventListener('readystatechange', checkState, false)
				callback()
			}
		}
	}

	function collectExampleCode() {
		var exampleElements = document.querySelectorAll('.styleguide-example')
		for (var i = 0; i < exampleElements.length; i++) {
			var html = exampleElements[i].innerHTML
			exampleElements[i].__rawHTML = html
		}
	}

	function showExampleCode(target) {
		var $target = $(target).parent()
		var $example = $target.prev('.styleguide-example')
		var patterns = $example.data('highlight')
		if (patterns) {
			patterns = patterns.split(' || ').map(function(item) {
				return new RegExp(item)
			})
		}
		var html = $example.get(0).__rawHTML

		html = html.replace(/<!--[\s\S]*?-->/g, '') // removes comments
		// html = html_beautify(html, {
		// 	preserve_newlines: false
		// });
		$code = $('<div class="styleguide-code is-new"></div>')
		$target.before($code)
		var editor = CodeMirror($code.get(0), {
			value: html,
			lineWrapping: true,
			indentUnit: 4,
			mode: {
				name: 'highlightPatterns',
				patterns: patterns,
			},
		})
		var totalLines = editor.lineCount()
		editor.autoFormatRange({ line: 0, ch: 0 }, { line: totalLines })

		editor.on('changes', function() {
			$example.html(editor.getValue())
		})
		var charWidth = editor.defaultCharWidth(),
			basePadding = 4

		// indent wrapped lines:
		editor.on('renderLine', function(cm, line, elt) {
			var off =
				CodeMirror.countColumn(line.text, null, cm.getOption('tabSize')) * charWidth +
				4 * charWidth
			elt.style.textIndent = '-' + off + 'px'
			elt.style.paddingLeft = basePadding + off + 'px'
		})
		editor.refresh()

		$target.slideUp(300, function() {
			$target.remove()
		})
		setTimeout(function() {
			$code.removeClass('is-new')
		}, 0)
	}

	function fetchNav(options) {
		if (!options) options = {}
		var linkEl = document.getElementById('styleguide-nav')
		var destEl = linkEl.parentNode
		var href = linkEl.getAttribute('href')
		var rootPath = linkEl.getAttribute('data-root')
		var pagePath = linkEl.getAttribute('data-current')
		var useLocalStorage = options.useLocalStorage || false
		var localStorageKey = document.location.href.match(/\/\/.+?\/(.+\/\d{8})\//)

		if (localStorageKey) {
			localStorageKey = 'styleguide-nav-' + localStorageKey[1].replace(/\W/g, '_')
		} else {
			localStorageKey = 'styleguide-nav'
		}

		function load() {
			var r = new XMLHttpRequest()
			r.open('GET', href, true)
			r.onreadystatechange = function() {
				if (r.readyState != 4 || r.status != 200) return
				localStorage.setItem(localStorageKey, r.responseText)
				render(r.responseText)
			}
			r.send()
		}

		function render(html) {
			destEl.innerHTML = html
			// make all href relative to this document
			var relativeToRoot = href.match(/[\.\/]+/)[0]
			destEl.querySelectorAll('a[href]').forEach(function(el) {
				var href = el.getAttribute('href')
				relHref = rootPath + href.substr(1)
				el.setAttribute('href', relHref)
				if (href == pagePath) {
					activateNavigation(el)
				}
			})
		}

		function activateNavigation(el) {
			while ((el = el.parentNode)) {
				if (el.nodeName == 'LI') {
					el.classList.add('is-active')
				}
			}
		}

		linkEl.parentNode.removeChild(linkEl)

		var html = localStorage.getItem(localStorageKey)
		if (html) {
			render(html)
			if (!useLocalStorage) {
				load() // to get changes
			}
		} else {
			load()
		}
	}

	var collectedNav = {}
	function collectNav(options) {
		if (collectedNav[options.target]) {
			return
		}
		var $target = $(options.target)
		var $nav = $target.find(options.element)
		var navData = {}
		navData.items = $nav
		navData.expressions = $nav.toArray().map(function(item) {
			return options.text
				? $(item)
						.find(options.text)
						.text()
				: $(item).text()
		})
		collectedNav[options.target] = navData
	}

	function filterNav(input, options) {
		options = $.extend(
			{
				group: 'none',
				element: 'a',
				text: false,
			},
			options
		)
		var $input = $(input)
		var $target = $(options.target)
		var $elements = $target.find(options.element)
		validate()

		function show($items) {
			$items &&
				$items
					.show()
					.closest(options.group)
					.show()
		}
		function hide($items) {
			$items &&
				$items
					.hide()
					.closest(options.group)
					.hide()
		}
		function validate() {
			if (!input.value) {
				$target.removeClass('is-filtered')
				if (collectedNav[options.target]) {
					show(collectedNav[options.target].items)
				}
				return
			}
			collectNav(options)
			var navData = collectedNav[options.target]

			var result = styleguide.search.search(navData.expressions, input.value, {
				returnIndex: true,
			})

			$target.addClass('is-filtered')
			hide(navData.items)
			for (var i = 0; i < result.length; i++) {
				show(navData.items.eq(result[i]))
			}
		}
		$input.on('keyup.styleguide', function(event) {
			validate()
		})
		$input.on('keydown.styleguide', function(event) {
			if (event.keyCode === 40 /*DOWN*/ || (event.keyCode === 9 /*TAB*/ && input.value)) {
				event.preventDefault()
				$target
					.find('a:visible')
					.first()
					.focus()
			}
		})
		$input.on('blur.styleguide', function(event) {
			$(input).off('.styleguide')
		})
	}

	domReady('complete', function() {
		$(document).on('click', '.styleguide_nav--category', function(event) {
			event.preventDefault()
			$(event.currentTarget)
				.parent()
				.toggleClass('is-active')
		})

		$(document).on('click', '.js-styleguide--togglenav', function(event) {
			event.preventDefault()
			$('.styleguide_grid--nav').toggleClass('collapsed')
			var isCollapsed = $('.styleguide_grid--nav').hasClass('collapsed')
			window.localStorage.styleguideNav = isCollapsed ? 'collapsed' : 'expanded'
		})

		$(window).on('resize', function(event) {
			if (document.body.clientWidth < 600) {
				$('.styleguide_grid--nav').addClass('collapsed')
			}
		})
	})

	domReady('interactive', function() {
		if (window.localStorage.styleguideNav == 'collapsed') {
			var nav = document.querySelector('.styleguide_grid--nav')
			if (nav) {
				var navClass = nav.getAttribute('class')
				nav.setAttribute('class', navClass + ' collapsed')
			}
		}
	})

	styleguide.collectExampleCode = collectExampleCode
	styleguide.filterNav = filterNav
	styleguide.fetchNav = fetchNav
	styleguide.showExampleCode = showExampleCode
})()
