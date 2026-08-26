import { useNavigate } from 'react-router-dom'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import { Button, EmptyState } from '/src/components/ui/index.js'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <PageShell width="narrow">
      <EmptyState
        title="That page does not exist"
        body="The link may be out of date, or the tournament may have been cancelled."
        action={
          <>
            <Button variant="primary" onClick={() => navigate('/tournaments')}>
              Browse tournaments
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')}>
              Go home
            </Button>
          </>
        }
      />
    </PageShell>
  )
}
