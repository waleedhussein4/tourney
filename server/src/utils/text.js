import sanitizeHtml from 'sanitize-html'

// Rich text the host writes (description, rules) is stored as HTML and rendered
// as HTML, so it is sanitised on the way in with a conservative allowlist: no
// script, no style, no event handlers, no embedded images.
const RICH_TEXT_OPTIONS = {
  allowedTags: [
    'p',
    'br',
    'hr',
    'blockquote',
    'pre',
    'code',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'b',
    'i',
    'strong',
    'em',
    'u',
    's',
    'strike',
    'a',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ],
  allowedAttributes: { a: ['href', 'title', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  // Stop `target="_blank"` from handing the opener to the linked page.
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
  disallowedTagsMode: 'discard',
}

/** Sanitises host-authored rich text, keeping a safe subset of HTML. */
export function sanitizeRichText(html) {
  if (typeof html !== 'string') return ''
  return sanitizeHtml(html, RICH_TEXT_OPTIONS).trim()
}

/**
 * Strips every tag and decodes entities, leaving plain text.
 *
 * Used to measure a length limit against what a reader actually sees, so a
 * hundred bytes of markup cannot smuggle a thousand characters of prose past a
 * cap — and vice versa. `sanitize-html` with an empty allowlist does this
 * correctly, which is why the old jsdom dependency is gone.
 */
export function toPlainText(html) {
  if (typeof html !== 'string') return ''
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
