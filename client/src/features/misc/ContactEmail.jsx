import { useQuery } from '@tanstack/react-query'
import { billingKeys, getPlan } from '/src/api/billing.js'

/**
 * The contact address, read from the same public plan endpoint the billing
 * and hosts pages use — so there is exactly one place in the app that knows
 * the address, and a regression gate can prove it.
 *
 * `label` renders fixed link text instead of the address itself, for places
 * like the footer where "Contact" reads better than a raw mailto target.
 */
export function ContactEmail({ label }) {
  const plan = useQuery({ queryKey: billingKeys.plan, queryFn: getPlan })
  const email = plan.data?.contactEmail
  if (!email) return null
  return (
    <a href={`mailto:${email}`} title={label ? email : undefined}>
      {label ?? email}
    </a>
  )
}
