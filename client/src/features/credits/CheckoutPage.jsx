import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { checkout, getProduct } from '/src/api/credits.js'
import { currentUserKey } from '/src/features/auth/queries.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import { Button, Card, ErrorState, Field, Input, LoadingState } from '/src/components/ui/index.js'
import { DemoNotice } from './DemoNotice.jsx'
import './credits.css'

/** Groups a card number in fours, which is all the old `cleave-zen` was for. */
const formatCardNumber = (value) =>
  value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()

/**
 * The demo checkout.
 *
 * The card fields are a mock-up: they are validated for realism, and **nothing
 * from them is read, sent, or stored**. The purchase request carries no body at
 * all — the package is in the URL and the account is in the cookie. The original
 * posted the card number and CCV to the server.
 */
export function CheckoutPage() {
  const { product: productId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const product = useQuery({
    queryKey: ['products', productId],
    queryFn: () => getProduct(productId),
    enabled: Boolean(productId),
    retry: false,
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: { name: '', cardNumber: '', expiry: '', ccv: '' },
  })

  const buy = useMutation({
    // No arguments. Whatever the form holds stays in the browser.
    mutationFn: () => checkout(productId),
    onSuccess: ({ granted }) => {
      queryClient.invalidateQueries({ queryKey: currentUserKey })
      toast.success(`${granted} credits added`)
      navigate('/credits')
    },
    onError: (error) => toast.error(error.message),
  })

  if (product.isPending) {
    return (
      <PageShell width="narrow">
        <LoadingState label="Loading package" rows={1} />
      </PageShell>
    )
  }

  if (product.isError) {
    return (
      <PageShell width="narrow">
        <ErrorState
          title="No such package"
          error={product.error}
          action={
            <Button variant="primary" onClick={() => navigate('/credits')}>
              Back to credits
            </Button>
          }
        />
      </PageShell>
    )
  }

  const item = product.data.product

  return (
    <PageShell width="narrow">
      <PageHeader title="Checkout" />

      <DemoNotice />

      <Card className="checkout__summary">
        <div>
          <h2>{item.name}</h2>
          <p className="checkout__credits">{item.credits} credits</p>
        </div>
        <p className="checkout__price">${item.price}</p>
      </Card>

      <Card>
        <h2 className="checkout__heading">Payment</h2>
        <p className="checkout__mock-note">
          These fields are a mock-up so the flow feels real. They are never sent anywhere — the
          request below carries only which package you picked.
        </p>

        <form className="checkout__form" onSubmit={handleSubmit(() => buy.mutate())}>
          <Field label="Name on card" required error={errors.name?.message}>
            {(field) => (
              <Input
                {...field}
                autoComplete="off"
                {...register('name', { required: 'Enter a name' })}
              />
            )}
          </Field>

          <Field label="Card number" required error={errors.cardNumber?.message}>
            {(field) => (
              <Input
                {...field}
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                autoComplete="off"
                value={watch('cardNumber')}
                {...register('cardNumber', {
                  required: 'Enter a card number',
                  validate: (value) =>
                    value.replace(/\D/g, '').length === 16 || 'A card number has 16 digits',
                })}
                onChange={(event) => setValue('cardNumber', formatCardNumber(event.target.value))}
              />
            )}
          </Field>

          <div className="checkout__row">
            <Field label="Expiry" required error={errors.expiry?.message}>
              {(field) => (
                <Input
                  {...field}
                  placeholder="MM/YY"
                  autoComplete="off"
                  {...register('expiry', {
                    required: 'Enter an expiry',
                    pattern: { value: /^\d{2}\/\d{2}$/, message: 'Use MM/YY' },
                  })}
                />
              )}
            </Field>

            <Field label="CCV" required error={errors.ccv?.message}>
              {(field) => (
                <Input
                  {...field}
                  inputMode="numeric"
                  maxLength={3}
                  autoComplete="off"
                  {...register('ccv', {
                    required: 'Enter the CCV',
                    pattern: { value: /^\d{3}$/, message: 'Three digits' },
                  })}
                />
              )}
            </Field>
          </div>

          <Button type="submit" variant="primary" loading={buy.isPending}>
            Get {item.credits} credits
          </Button>
        </form>
      </Card>
    </PageShell>
  )
}
