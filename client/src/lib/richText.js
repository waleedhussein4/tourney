import sanitizeHtml from 'sanitize-html'

/**
 * Host-authored HTML, sanitised again before it is rendered.
 *
 * The server already sanitises on the way in. Doing it again on the way out
 * costs almost nothing and means a gap in the server's allowlist — or a document
 * written before it was tightened — cannot become script running in a reader's
 * browser.
 */
const OPTIONS = {
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
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
  },
}

export const toSafeHtml = (html) => sanitizeHtml(String(html ?? ''), OPTIONS)

/**
 * The text a reader actually sees, with every tag stripped.
 *
 * Length limits are measured against this, not the markup, so a hundred bytes
 * of formatting cannot smuggle a thousand characters of prose past a cap. The
 * server measures the same way.
 */
export const toPlainText = (html) =>
  sanitizeHtml(String(html ?? ''), { allowedTags: [], allowedAttributes: {} }).trim()

/** True when the rich text has no actual content, so an empty state can show instead. */
export const isEmptyRichText = (html) => toPlainText(html).length === 0

/** A react-hook-form rule enforcing a plain-text limit on a rich text field. */
export const richTextLimit = (limit, label) => (value) =>
  toPlainText(value).length <= limit || `${label} is limited to ${limit} characters`
