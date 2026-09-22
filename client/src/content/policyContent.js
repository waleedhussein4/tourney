// Single source of truth for the Terms / Privacy / Refunds prose.
//
// `TermsPage.jsx` etc. render this as React. `scripts/prerender-policies.mjs`
// serialises the same data to static HTML at build time (for the plain-HTTP
// fallback pages under client/dist). Edit the prose here once, both outputs
// follow.
//
// A paragraph is an array of parts: a plain string, `link(href, text)` for an
// in-app link, or `contact()` for the mailto address — resolved differently by
// each renderer (React renders <ContactEmail/>, the prerender script writes a
// mailto: link using the address from server/src/config/plans.js).

export const link = (href, text) => ({ type: 'link', href, text })
export const contact = () => ({ type: 'contact' })

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
            'You are responsible for what happens under your account. Keep your password to yourself, and tell us at ',
            contact(),
            ' if you think someone else has access to it.',
          ],
        ],
      },
      {
        heading: 'Hosting subscription',
        paragraphs: [
          [
            "Hosting more than the free plan's live tournaments requires a $5/month subscription, billed by Paddle as merchant of record. See the ",
            link('/refunds', 'refunds page'),
            ' for cancellation and refund terms.',
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
      {
        heading: 'Contact',
        paragraphs: [['Questions about these terms: ', contact(), '.']],
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    sections: [
      {
        heading: 'Who runs this',
        paragraphs: [
          [
            'Tourney (tourneylb.com) is operated by Walene HQ. Questions about your data: ',
            contact(),
            '.',
          ],
        ],
      },
      {
        heading: 'What we store',
        paragraphs: [
          [
            'Your email address, username, and a hashed password — never your password itself. The tournaments, teams, brackets, and standings you create or join. Nothing more.',
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
            'If you subscribe to hosting, your card is handled entirely by Paddle, our payment provider. We never see or store your card details.',
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
      {
        heading: 'Deleting your data',
        paragraphs: [['Email ', contact(), ' to have your account and its data removed.']],
      },
    ],
  },
  refunds: {
    title: 'Refunds',
    sections: [
      {
        heading: 'Hosting subscription',
        paragraphs: [
          [
            'The hosting subscription is $5/month, charged by Paddle, who acts as merchant of record for the transaction. You can cancel at any time from the ',
            link('/billing', 'billing page'),
            ' — cancelling stops future charges but does not refund the current period automatically.',
          ],
        ],
      },
      {
        heading: 'Refund window',
        paragraphs: [
          [
            'If you are charged and want a refund, email ',
            contact(),
            ' within 14 days of the charge and we will refund it.',
          ],
        ],
      },
    ],
  },
}
