#!/usr/bin/env node
// Emits static HTML for /terms, /privacy and /refunds into client/dist, so a
// plain HTTP GET (no JavaScript) gets real policy content and a contact
// address — Workers Static Assets serves a file at `<slug>/index.html` for a
// request to `/<slug>` before falling back to the SPA. Run after `vite build`.
//
// Content comes from client/src/content/policyContent.js — the same data the
// React pages render — so there is one source of truth for the prose. The
// contact address comes from server/src/config/plans.js, the one file allowed
// to name it (see scripts/check-regressions.sh), so it is read here rather
// than duplicated.

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { POLICY_PAGES } from '../client/src/content/policyContent.js'
import { CONTACT_EMAIL } from '../server/src/config/plans.js'

const rootDir = path.dirname(fileURLToPath(import.meta.url)) + '/..'
const distDir = path.join(rootDir, 'client', 'dist')

const escapeHtml = (s) =>
  s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])

const renderPart = (part) => {
  if (typeof part === 'string') return escapeHtml(part)
  if (part.type === 'contact') return `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`
  return `<a href="${part.href}">${escapeHtml(part.text)}</a>`
}

const SLUGS = { terms: 'terms', privacy: 'privacy', refunds: 'refunds' }

const renderPage = (pageKey) => {
  const page = POLICY_PAGES[pageKey]
  const otherSlugs = Object.entries(SLUGS).filter(([key]) => key !== pageKey)
  const body = page.sections
    .map(
      (section) =>
        `<h2>${escapeHtml(section.heading)}</h2>\n` +
        section.paragraphs
          .map((paragraph) => `<p>${paragraph.map(renderPart).join('')}</p>`)
          .join('\n')
    )
    .join('\n')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(page.title)} — Tourney</title>
    <meta name="description" content="Tourney's ${escapeHtml(page.title.toLowerCase())}." />
    <style>
      body { font: 16px/1.6 system-ui, sans-serif; color: #1a1c23; background: #fff; max-width: 68ch; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
      h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
      h2 { font-size: 1.15rem; margin-top: 2rem; }
      p { color: #3a3d47; }
      a { color: #3454d1; }
      nav { margin-bottom: 2rem; font-size: 0.95rem; }
      nav a { margin-right: 1rem; }
    </style>
  </head>
  <body>
    <nav aria-label="Legal and contact">
      <a href="/">Tourney home</a>
      ${otherSlugs.map(([, slug]) => `<a href="/${slug}">${slug[0].toUpperCase()}${slug.slice(1)}</a>`).join('\n      ')}
      <a href="mailto:${CONTACT_EMAIL}">Contact</a>
    </nav>
    <h1>${escapeHtml(page.title)}</h1>
    ${body}
  </body>
</html>
`
}

for (const [pageKey, slug] of Object.entries(SLUGS)) {
  const dir = path.join(distDir, slug)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, 'index.html'), renderPage(pageKey))
}

console.log(`Prerendered ${Object.keys(SLUGS).length} policy pages into client/dist`)
