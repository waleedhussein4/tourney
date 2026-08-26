import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listMyTournaments, listTrending, tournamentKeys } from '/src/api/tournaments.js'
import { useAuth } from '/src/features/auth/useAuth.js'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import {
  BracketRule,
  BracketTree,
  CATEGORY_SLUGS,
  CategoryArt,
} from '/src/components/brand/index.js'
import {
  Button,
  ButtonLink,
  EmptyState,
  ErrorState,
  LoadingState,
} from '/src/components/ui/index.js'
import { TournamentCard } from '/src/features/tournaments/TournamentCard.jsx'
import { categoryName } from '/src/components/brand/categories.js'
import styles from './HomePage.module.css'

export function HomePage() {
  const { isAuthenticated, isHost } = useAuth()

  const trending = useQuery({ queryKey: tournamentKeys.trending, queryFn: () => listTrending(10) })

  const mine = useQuery({
    queryKey: tournamentKeys.mine,
    queryFn: listMyTournaments,
    enabled: isAuthenticated,
  })

  return (
    <PageShell width="wide">
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Brackets &amp; battle royale</span>
          <h1 className={styles.title}>
            Run the tournament. Or <em>win it.</em>
          </h1>
          <p className={styles.body}>
            Solo or in teams, open to all or by application. Entry fees go into an escrow bank that
            has to cover the prizes before anything starts.
          </p>
          <div className={styles.actions}>
            <ButtonLink variant="primary" to="/tournaments">
              Browse tournaments
            </ButtonLink>
            {isHost ? (
              <ButtonLink to="/host">Create a tournament</ButtonLink>
            ) : (
              <ButtonLink to={isAuthenticated ? '/become-host' : '/signup'}>
                {isAuthenticated ? 'Become a host' : 'Create an account'}
              </ButtonLink>
            )}
          </div>
        </div>

        <BracketTree className={styles.heroArt} entrants={8} />
      </section>

      <section className={styles.categories}>
        <BracketRule label="Browse by category" />
        <ul className={styles.categoryGrid}>
          {CATEGORY_SLUGS.map((slug) => (
            <li key={slug}>
              <Link
                className={styles.categoryTile}
                to={`/tournaments?category=${slug}`}
                aria-label={`Browse ${categoryName(slug)} tournaments`}
              >
                <CategoryArt slug={slug} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Carousel
        title="Filling up now"
        description="Open tournaments with the most entrants."
        query={trending}
        emptyTitle="Nothing open right now"
        emptyBody="Check back soon, or create one yourself."
      />

      {isAuthenticated && (
        <Carousel
          title="Your tournaments"
          description="Everything you host or compete in."
          query={mine}
          emptyTitle="You are not in any tournaments yet"
          emptyBody="Browsing is the quickest way to find one."
          emptyAction={
            <ButtonLink variant="primary" to="/tournaments">
              Browse tournaments
            </ButtonLink>
          }
        />
      )}
    </PageShell>
  )
}

/**
 * A horizontally scrolling rail of tournaments.
 *
 * The rail is a real scroll container, so it works by touch, trackpad and
 * keyboard on its own; the buttons are a convenience on top of that rather than
 * the only way to move it.
 */
function Carousel({ title, description, query, emptyTitle, emptyBody, emptyAction }) {
  const rail = useRef(null)

  const scrollBy = (direction) => {
    const el = rail.current
    if (!el) return
    el.scrollBy({ left: direction * (el.clientWidth * 0.8), behavior: 'smooth' })
  }

  const tournaments = query.data?.tournaments ?? []

  return (
    <section className={styles.rail}>
      <header className={styles.railHeader}>
        <div>
          <h2 className={styles.railTitle}>{title}</h2>
          <p className={styles.railDescription}>{description}</p>
        </div>
        {tournaments.length > 0 && (
          <div className={styles.railControls}>
            <Button size="sm" onClick={() => scrollBy(-1)} aria-label={`Scroll ${title} left`}>
              &larr;
            </Button>
            <Button size="sm" onClick={() => scrollBy(1)} aria-label={`Scroll ${title} right`}>
              &rarr;
            </Button>
          </div>
        )}
      </header>

      {query.isPending ? (
        <LoadingState label={`Loading ${title.toLowerCase()}`} rows={1} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : tournaments.length === 0 ? (
        <EmptyState title={emptyTitle} body={emptyBody} action={emptyAction} />
      ) : (
        <ul className={styles.railTrack} ref={rail}>
          {tournaments.map((tournament) => (
            <li key={tournament.id} className={styles.railItem}>
              <TournamentCard tournament={tournament} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
