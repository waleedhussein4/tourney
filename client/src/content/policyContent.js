// Single source of truth for the Terms / Privacy prose.
//
// `TermsPage.jsx` and `PrivacyPage.jsx` render this as React.
// `scripts/prerender-policies.mjs` serialises the same data to static HTML at
// build time (for the plain-HTTP fallback pages under client/dist). Edit the
// prose here once, both outputs follow.
//
// A paragraph is an array of parts: a plain string, or `link(href, text)` for
// an in-app link.

export const link = (href, text) => ({ type: 'link', href, text })

export const POLICY_PAGES = {
  terms: {
    title: 'Terms of service',
    sections: [
      {
        heading: 'The service',
        paragraphs: [
          [
            'Tourney (tourneylb.com) is a tool for organizing and tracking tournaments. It lets a host create a bracket or battle-royale tournament, take sign-ups from players or teams, run rounds, and record standings. That is the whole of what the site does.',
          ],
        ],
      },
      {
        heading: 'Accounts',
        paragraphs: [
          [
            'You are responsible for what happens under your account. Keep your password to yourself.',
          ],
        ],
      },
      {
        heading: 'Credits are a demo currency',
        paragraphs: [
          [
            'Tourney runs on credits, which are used for entry fees, prizes and becoming a host. Credits are not money: they cannot be bought with real money, cannot be cashed out, and have no value outside the site. The checkout is a demonstration. Its card fields exist only to show how a checkout looks, and nothing you type into them leaves your browser.',
          ],
        ],
      },
      {
        heading: 'Changes',
        paragraphs: [
          [
            'We may update these terms as the service changes. Continuing to use the site after a change means you accept the update.',
          ],
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    sections: [
      {
        heading: 'What we store',
        paragraphs: [
          [
            'Your email address, username, and a hashed password — never your password itself. The tournaments, teams, brackets, and standings you create or join, your credit balance and its history, and the notifications the site sends you. Nothing more.',
          ],
        ],
      },
      {
        heading: 'Cookies',
        paragraphs: [
          [
            'One cookie: the session cookie that keeps you signed in. It is not used to track you across other sites. We do not run analytics and we do not load any third-party trackers.',
          ],
        ],
      },
      {
        heading: 'Payment data',
        paragraphs: [
          [
            'The site takes no real payments. The demo checkout shows card fields for illustration only; whatever you type into them stays in your browser and is never sent to us or to anyone else.',
          ],
        ],
      },
      {
        heading: 'Sharing',
        paragraphs: [
          [
            'We do not sell your data or share it with advertisers. Tournament data you create — brackets, standings, team rosters — is visible to other users of the site by design, since that is what the service is for.',
          ],
        ],
      },
    ],
  },
}
