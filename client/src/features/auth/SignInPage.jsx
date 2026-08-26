import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { signIn } from '/src/api/auth.js'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import { BracketTree, Logo } from '/src/components/brand/index.js'
import { Button, Card, Checkbox, Field, Input } from '/src/components/ui/index.js'
import { useAuth } from './useAuth.js'
import styles from './auth.module.css'

export function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refresh } = useAuth()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '', rememberMe: false } })

  async function onSubmit(values) {
    try {
      await signIn(values)
      await refresh()
      toast.success('Welcome back')
      // Back to whatever the guard interrupted, or home if they came directly.
      navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch (error) {
      // The API deliberately does not say which of the two was wrong, so neither
      // field is singled out.
      setError('root', { message: error.message })
    }
  }

  return (
    <PageShell width="narrow">
      <div className={styles.shell}>
        <BracketTree className={styles.tree} entrants={8} />
        <Logo size="lg" />

        <Card className={styles.card}>
          <h1 className={styles.title}>Sign in</h1>
          <p className={styles.subtitle}>Enter a tournament, or run one of your own.</p>

          <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
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

            <Field label="Password" required error={errors.password?.message}>
              {(field) => (
                <Input
                  {...field}
                  type="password"
                  autoComplete="current-password"
                  {...register('password', { required: 'Enter your password' })}
                />
              )}
            </Field>

            {/* All this does is ask the server for a longer-lived session cookie.
              The original also wrote the password itself into localStorage so it
              could prefill the field. */}
            <Checkbox label="Keep me signed in for 30 days" {...register('rememberMe')} />

            {errors.root && (
              <p className={styles.error} role="alert">
                {errors.root.message}
              </p>
            )}

            <Button type="submit" variant="primary" loading={isSubmitting}>
              Sign in
            </Button>
          </form>

          <p className={styles.alt}>
            No account yet? <Link to="/signup">Create one</Link>
          </p>
        </Card>
      </div>
    </PageShell>
  )
}
