import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { forgotPassword } from '/src/api/auth.js'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import { BracketTree, Logo } from '/src/components/brand/index.js'
import { Button, Card, Field, Input } from '/src/components/ui/index.js'
import { useDocumentTitle } from '/src/lib/useDocumentTitle.js'
import styles from './auth.module.css'

export function ForgotPasswordPage() {
  useDocumentTitle('Forgot your password?')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '' } })

  const request = useMutation({ mutationFn: forgotPassword })

  return (
    <PageShell width="narrow">
      <div className={styles.shell}>
        <BracketTree className={styles.tree} entrants={8} />
        <Logo size="lg" />

        <Card className={styles.card}>
          <h1 className={styles.title}>Forgot your password?</h1>
          <p className={styles.subtitle}>
            Enter your email and we will send you a link to reset it.
          </p>

          {request.isSuccess ? (
            <p role="status">
              If that email is registered, a reset link is on its way. It expires in 30 minutes.
            </p>
          ) : (
            <form
              className={styles.form}
              onSubmit={handleSubmit((values) => request.mutate(values))}
              noValidate
            >
              <Field label="Email" required error={errors.email?.message}>
                {(field) => (
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    autoFocus
                    {...register('email', { required: 'Enter your email address' })}
                  />
                )}
              </Field>

              {request.isError && (
                <p className={styles.error} role="alert">
                  {request.error.message}
                </p>
              )}

              <Button type="submit" variant="primary" loading={request.isPending}>
                Send reset link
              </Button>
            </form>
          )}

          <p className={styles.alt}>
            <Link to="/signin">Back to sign in</Link>
          </p>
        </Card>
      </div>
    </PageShell>
  )
}
