import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listMyTournaments, listTrending, tournamentKeys } from '/src/api/tournaments.js'
import { useAuth } from '/src/features/auth/useAuth.js'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import { Button, EmptyState, ErrorState, LoadingState } from '/src/components/ui/index.js'
import { TournamentCard } from '/src/features/tournaments/TournamentCard.jsx'
import './HomePage.css'

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
      <section className="hero">
        <h1 className="hero__title">Run the tournament. Or win it.</h1>
        <p className="hero__body">
          Brackets and battle royales, solo or in teams. Entry fees go into an escrow bank that has
          to cover the prizes before anything starts.
        </p>
        <div className="hero__actions">
          <Link className="btn btn--primary btn--md" to="/tournaments">
            Browse tournaments
          </Link>
          {isHost ? (
            <Link className="btn btn--secondary btn--md" to="/host">
              Create a tournament
            </Link>
          ) : (
            <Link
              className="btn btn--secondary btn--md"
              to={isAuthenticated ? '/become-host' : '/signup'}
            >
              {isAuthenticated ? 'Become a host' : 'Create an account'}
            </Link>
          )}
        </div>
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
            <Link className="btn btn--primary btn--md" to="/tournaments">
              Browse tournaments
            </Link>
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
    <section className="rail">
      <header className="rail__header">
        <div>
          <h2 className="rail__title">{title}</h2>
          <p className="rail__description">{description}</p>
        </div>
        {tournaments.length > 0 && (
          <div className="rail__controls">
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
        <ul className="rail__track" ref={rail}>
          {tournaments.map((tournament) => (
            <li key={tournament.id} className="rail__item">
              <TournamentCard tournament={tournament} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
