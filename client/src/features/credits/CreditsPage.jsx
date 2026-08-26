import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listProducts } from '/src/api/credits.js'
import { useAuth } from '/src/features/auth/useAuth.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import { Card, ErrorState, LoadingState } from '/src/components/ui/index.js'
import { DemoNotice } from './DemoNotice.jsx'
import './credits.css'

export function CreditsPage() {
  const { user } = useAuth()

  const products = useQuery({ queryKey: ['products'], queryFn: listProducts })

  return (
    <PageShell>
      <PageHeader
        title="Buy credits"
        description="Credits pay tournament entry fees, fund the prize banks you host, and buy the host upgrade."
        actions={
          user && (
            <p className="credits__balance">
              You have <strong>{user.credits}</strong> credits
            </p>
          )
        }
      />

      <DemoNotice />

      {products.isPending ? (
        <LoadingState label="Loading packages" rows={2} />
      ) : products.isError ? (
        <ErrorState error={products.error} onRetry={() => products.refetch()} />
      ) : (
        <ul className="credits__grid">
          {products.data.products.map((product) => (
            <li key={product.id}>
              <Card className="credits__card">
                <h2 className="credits__name">{product.name}</h2>
                <p className="credits__amount">{product.credits}</p>
                <p className="credits__unit">credits</p>
                <p className="credits__price">${product.price}</p>
                <Link className="btn btn--primary btn--md" to={`/purchase/${product.id}`}>
                  Choose
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
