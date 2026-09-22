import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { resetPassword } from '/src/api/auth.js'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import { BracketTree, Logo } from '/src/components/brand/index.js'
import { Button, Card, ErrorState, Field, Input } from '/src/components/ui/index.js'
import { useDocumentTitle } from '/src/lib/useDocumentTitle.js'
import styles from './auth.module.css'

export function ResetPasswordPage() {
  useDocumentTitle('Reset your password')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { password: '' } })

  const reset = useMutation({
    mutationFn: (values) => resetPassword({ token, password: values.password }),
    onSuccess: () => {
      toast.success('Password reset. Sign in with your new password.')
      navigate('/signin', { replace: true })
    },
    onError: (error) => setError('root', { message: error.message }),
  })

  if (!token) {
    return (
      <PageShell width="narrow">
        <ErrorState
          title="This link is missing its token"
          error={new Error('Request a new password-reset link and follow it from your email.')}
          action={
            <Link to="/forgot-password">
              <Button variant="primary">Request a new link</Button>
            </Link>
          }
        />
      </PageShell>
    )
  }

  return (
    <PageShell width="narrow">
      <div className={styles.shell}>
        <BracketTree className={styles.tree} entrants={8} />
        <Logo size="lg" />

        <Card className={styles.card}>
          <h1 className={styles.title}>Reset your password</h1>
          <p className={styles.subtitle}>Choose a new password for your account.</p>

          <form
            className={styles.form}
            onSubmit={handleSubmit((values) => reset.mutate(values))}
            noValidate
          >
            <Field label="New password" required error={errors.password?.message}>
              {(field) => (
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                  autoFocus
                  {...register('password', { required: 'Enter a new password' })}
                />
              )}
            </Field>

            {errors.root && (
              <p className={styles.error} role="alert">
                {errors.root.message}
              </p>
            )}

            <Button type="submit" variant="primary" loading={isSubmitting}>
              Reset password
            </Button>
          </form>

          <p className={styles.alt}>
            <Link to="/signin">Back to sign in</Link>
          </p>
        </Card>
      </div>
    </PageShell>
  )
}
