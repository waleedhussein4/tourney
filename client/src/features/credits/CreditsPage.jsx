import { useQuery } from '@tanstack/react-query'
import { listProducts } from '/src/api/credits.js'
import { useAuth } from '/src/features/auth/useAuth.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import { ButtonLink, Card, ErrorState, LoadingState } from '/src/components/ui/index.js'
import { DemoNotice } from './DemoNotice.jsx'
import styles from './credits.module.css'

export function CreditsPage() {
  const { user } = useAuth()

  const products = useQuery({ queryKey: ['products'], queryFn: listProducts })

  return (
    <PageShell>
      <PageHeader
        eyebrow="Wallet"
        title="Buy credits"
        description="Credits pay tournament entry fees, fund the prize banks you host, and buy the host upgrade."
        actions={
          user && (
            <p className={styles.balance}>
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
        <ul className={styles.grid}>
          {products.data.products.map((product) => (
            <li key={product.id}>
              <Card className={styles.card}>
                <h2 className={styles.name}>{product.name}</h2>
                <p className={styles.amount}>{product.credits}</p>
                <p className={styles.unit}>credits</p>
                <p className={styles.price}>${product.price}</p>
                <ButtonLink variant="primary" to={`/purchase/${product.id}`}>
                  Choose
                </ButtonLink>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
