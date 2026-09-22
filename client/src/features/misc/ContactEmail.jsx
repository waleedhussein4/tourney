import { useQuery } from '@tanstack/react-query'
import { billingKeys, getPlan } from '/src/api/billing.js'

/**
 * The contact address for the policy pages, read from the same public plan
 * endpoint the billing and hosts pages use — so there is exactly one place
 * in the app that knows the address, and a regression gate can prove it.
 */
export function ContactEmail() {
  const plan = useQuery({ queryKey: billingKeys.plan, queryFn: getPlan })
  const email = plan.data?.contactEmail
  if (!email) return null
  return <a href={`mailto:${email}`}>{email}</a>
}
