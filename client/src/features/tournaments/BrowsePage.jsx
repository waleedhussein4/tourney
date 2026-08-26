import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listCategories, listTournaments, tournamentKeys } from '/src/api/tournaments.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Select,
} from '/src/components/ui/index.js'
import { useDebounced } from '/src/lib/useDebounced.js'
import { TournamentCard } from './TournamentCard.jsx'
import styles from './BrowsePage.module.css'

const PAGE_SIZE = 12

/** Empty means "no filter" and is left out of both the URL and the request. */
const EMPTY = ''

function readFilters(searchParams) {
  return {
    search: searchParams.get('search') ?? EMPTY,
    category: searchParams.get('category') ?? EMPTY,
    type: searchParams.get('type') ?? EMPTY,
    accessibility: searchParams.get('accessibility') ?? EMPTY,
    status: searchParams.get('status') ?? EMPTY,
    minEntryFee: searchParams.get('minEntryFee') ?? EMPTY,
    maxEntryFee: searchParams.get('maxEntryFee') ?? EMPTY,
    page: Number(searchParams.get('page') ?? 1),
  }
}

export function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readFilters(searchParams)

  // The search box is local so it stays responsive, and only reaches the URL —
  // and the network — once typing stops.
  const [searchDraft, setSearchDraft] = useState(filters.search)
  const debouncedSearch = useDebounced(searchDraft)

  useEffect(() => {
    if (debouncedSearch === filters.search) return
    updateFilters({ search: debouncedSearch })
    // `filters.search` is the value being synced to; including it would undo the
    // edit on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  /**
   * Writes filter changes to the URL.
   *
   * Any change other than the page itself sends the reader back to page one.
   * The original appended each new page to the list without clearing it, so
   * changing a filter added its results to the ones it was meant to replace.
   */
  function updateFilters(changes) {
    const next = new URLSearchParams(searchParams)

    for (const [key, value] of Object.entries(changes)) {
      if (value === EMPTY || value === undefined) next.delete(key)
      else next.set(key, String(value))
    }

    if (!('page' in changes)) next.delete('page')

    setSearchParams(next, { replace: true })
  }

  const query = useQuery({
    queryKey: tournamentKeys.list(filters),
    queryFn: () =>
      listTournaments({
        page: filters.page,
        limit: PAGE_SIZE,
        search: filters.search || undefined,
        category: filters.category || undefined,
        type: filters.type || undefined,
        accessibility: filters.accessibility || undefined,
        status: filters.status || undefined,
        minEntryFee: filters.minEntryFee || undefined,
        maxEntryFee: filters.maxEntryFee || undefined,
      }),
    // Keeps the previous page on screen while the next one loads, instead of
    // flashing the whole list away.
    placeholderData: (previous) => previous,
  })

  const categories = useQuery({
    queryKey: tournamentKeys.categories,
    queryFn: listCategories,
    staleTime: Infinity,
  })

  const hasFilters = Object.entries(filters).some(
    ([key, value]) => key !== 'page' && value !== EMPTY
  )

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Catalogue"
        title="Browse tournaments"
        description="Every open tournament, and everything currently under way."
      />

      <div className={styles.browse}>
        <form className={styles.filters} onSubmit={(event) => event.preventDefault()}>
          <h2 className={styles.filtersTitle}>Filters</h2>

          <Field label="Search">
            {(field) => (
              <Input
                {...field}
                type="search"
                placeholder="Title or description"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
              />
            )}
          </Field>

          <Field label="Category">
            {(field) => (
              <Select
                {...field}
                value={filters.category}
                onChange={(event) => updateFilters({ category: event.target.value })}
              >
                <option value={EMPTY}>All categories</option>
                {(categories.data?.categories ?? []).map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Format">
            {(field) => (
              <Select
                {...field}
                value={filters.type}
                onChange={(event) => updateFilters({ type: event.target.value })}
              >
                <option value={EMPTY}>Any format</option>
                <option value="brackets">Brackets</option>
                <option value="battle royale">Battle royale</option>
              </Select>
            )}
          </Field>

          <Field label="Entry">
            {(field) => (
              <Select
                {...field}
                value={filters.accessibility}
                onChange={(event) => updateFilters({ accessibility: event.target.value })}
              >
                <option value={EMPTY}>Any</option>
                <option value="open">Open to all</option>
                <option value="application required">Application required</option>
              </Select>
            )}
          </Field>

          <Field label="Status">
            {(field) => (
              <Select
                {...field}
                value={filters.status}
                onChange={(event) => updateFilters({ status: event.target.value })}
              >
                <option value={EMPTY}>Any</option>
                <option value="upcoming">Not started</option>
                <option value="live">Under way</option>
                <option value="ended">Finished</option>
              </Select>
            )}
          </Field>

          <div className={styles.feeRange}>
            <Field label="Min fee">
              {(field) => (
                <Input
                  {...field}
                  type="number"
                  min="0"
                  value={filters.minEntryFee}
                  onChange={(event) => updateFilters({ minEntryFee: event.target.value })}
                />
              )}
            </Field>
            <Field label="Max fee">
              {(field) => (
                <Input
                  {...field}
                  type="number"
                  min="0"
                  value={filters.maxEntryFee}
                  onChange={(event) => updateFilters({ maxEntryFee: event.target.value })}
                />
              )}
            </Field>
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchDraft(EMPTY)
                setSearchParams(new URLSearchParams(), { replace: true })
              }}
            >
              Clear filters
            </Button>
          )}
        </form>

        <section className={styles.results} aria-live="polite" aria-busy={query.isFetching}>
          <Results
            query={query}
            filters={filters}
            hasFilters={hasFilters}
            onPage={(page) => updateFilters({ page })}
            onClear={() => {
              setSearchDraft(EMPTY)
              setSearchParams(new URLSearchParams(), { replace: true })
            }}
          />
        </section>
      </div>
    </PageShell>
  )
}

function Results({ query, filters, hasFilters, onPage, onClear }) {
  if (query.isPending) return <LoadingState label="Loading tournaments" rows={4} />

  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />
  }

  const { tournaments, pagination } = query.data

  if (tournaments.length === 0) {
    return hasFilters ? (
      <EmptyState
        title="Nothing matches those filters"
        body="Try widening the search, or clear the filters to see everything."
        action={
          <Button variant="primary" onClick={onClear}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        title="No tournaments yet"
        body="Nobody has created one. If you are a host, you could be first."
      />
    )
  }

  return (
    <>
      <p className={styles.count}>
        <strong>{pagination.total}</strong> {pagination.total === 1 ? 'tournament' : 'tournaments'}
      </p>

      <div className={styles.grid}>
        {tournaments.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>

      {pagination.pages > 1 && (
        <nav className={styles.pager} aria-label="Pagination">
          <Button disabled={filters.page <= 1} onClick={() => onPage(filters.page - 1)}>
            Previous
          </Button>
          <span className={styles.pageOf}>
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            disabled={filters.page >= pagination.pages}
            onClick={() => onPage(filters.page + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </>
  )
}
