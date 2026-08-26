import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { signUp } from '/src/api/auth.js'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import { Button, Card, Field, Input } from '/src/components/ui/index.js'
import { useAuth } from './useAuth.js'
import './auth.css'

/** Mirrors the server's password policy, so the rule is stated before it is broken. */
const PASSWORD_RULES = {
  required: 'Choose a password',
  minLength: { value: 8, message: 'At least 8 characters' },
  validate: {
    lower: (value) => /[a-z]/.test(value) || 'Include a lowercase letter',
    upper: (value) => /[A-Z]/.test(value) || 'Include an uppercase letter',
    digit: (value) => /[0-9]/.test(value) || 'Include a number',
  },
}

export function SignUpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refresh } = useAuth()

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { username: '', email: '', password: '', confirm: '' } })

  async function onSubmit({ username, email, password }) {
    try {
      await signUp({ username, email, password })
      await refresh()
      toast.success('Account created')
      navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch (error) {
      // A duplicate comes back as a 409 with a sentence rather than a field, so
      // it is pinned to whichever input it is talking about.
      const field = /email/i.test(error.message)
        ? 'email'
        : /username/i.test(error.message)
          ? 'username'
          : 'root'
      setError(field, { message: error.message })

      for (const [path, message] of Object.entries(error.fieldErrors ?? {})) {
        setError(path, { message })
      }
    }
  }

  return (
    <PageShell width="narrow">
      <Card className="auth">
        <h1 className="auth__title">Create an account</h1>
        <p className="auth__subtitle">It takes a moment, and it is free.</p>

        <form className="auth__form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field
            label="Username"
            required
            error={errors.username?.message}
            hint="Letters, numbers, dot, dash and underscore."
          >
            {(field) => (
              <Input
                {...field}
                autoComplete="username"
                autoFocus
                {...register('username', {
                  required: 'Choose a username',
                  minLength: { value: 3, message: 'At least 3 characters' },
                  maxLength: { value: 24, message: 'At most 24 characters' },
                  pattern: {
                    value: /^[a-zA-Z0-9_.-]+$/,
                    message: 'Only letters, numbers, dot, dash and underscore',
                  },
                })}
              />
            )}
          </Field>

          <Field label="Email" required error={errors.email?.message}>
            {(field) => (
              <Input
                {...field}
                type="email"
                autoComplete="email"
                {...register('email', {
                  required: 'Enter your email address',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
                })}
              />
            )}
          </Field>

          <Field
            label="Password"
            required
            error={errors.password?.message}
            hint="At least 8 characters, with upper and lower case and a number."
          >
            {(field) => (
              <Input
                {...field}
                type="password"
                autoComplete="new-password"
                {...register('password', PASSWORD_RULES)}
              />
            )}
          </Field>

          <Field label="Confirm password" required error={errors.confirm?.message}>
            {(field) => (
              <Input
                {...field}
                type="password"
                autoComplete="new-password"
                {...register('confirm', {
                  required: 'Type the password again',
                  validate: (value) => value === watch('password') || 'The passwords do not match',
                })}
              />
            )}
          </Field>

          {errors.root && (
            <p className="auth__error" role="alert">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" variant="primary" loading={isSubmitting}>
            Create account
          </Button>
        </form>

        <p className="auth__alt">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </Card>
    </PageShell>
  )
}
