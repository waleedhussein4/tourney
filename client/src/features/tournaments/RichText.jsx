import { isEmptyRichText, toSafeHtml } from '/src/lib/richText.js'
import styles from './TournamentPage.module.css'

/**
 * Host-authored prose, sanitised again on the way out.
 *
 * This lives in its own module so it can be loaded lazily. `sanitize-html` and
 * the HTML parser under it are ~200 kB — the single heaviest thing the client
 * depends on — and the only reason any of it exists on the tournament page is
 * to render two blocks of text below the fold. Splitting it here keeps it out
 * of the bundle every other page has to download.
 *
 * The emptiness check lives here too, rather than in the caller: asking
 * "is this empty?" means stripping the tags, which is the very thing being
 * deferred.
 */
export default function RichText({ html, empty }) {
  if (isEmptyRichText(html)) return <p className={styles.muted}>{empty}</p>

  return <div className={styles.prose} dangerouslySetInnerHTML={{ __html: toSafeHtml(html) }} />
}
