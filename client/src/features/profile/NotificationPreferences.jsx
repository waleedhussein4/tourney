import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getEmailPreferences, updateEmailPreferences } from '/src/api/notifications.js'
import { Card, CardHeader, Checkbox, ErrorState, LoadingState } from '/src/components/ui/index.js'
import styles from './profile.module.css'

const CATEGORIES = [
  { key: 'matchScheduled', label: 'A match of yours is scheduled' },
  { key: 'matchStartingSoon', label: 'A match of yours starts within the hour' },
  { key: 'resultDisputed', label: 'A result you reported is disputed' },
  { key: 'applicationDecided', label: 'An application of yours is accepted or declined' },
]

const preferencesKey = ['notifications', 'preferences']

/**
 * Per-category email toggles. Turning one off never affects the in-app
 * notification — only whether that event also gets emailed.
 */
export function NotificationPreferences() {
  const queryClient = useQueryClient()
  const preferences = useQuery({ queryKey: preferencesKey, queryFn: getEmailPreferences })

  const save = useMutation({
    mutationFn: updateEmailPreferences,
    onSuccess: (data) => queryClient.setQueryData(preferencesKey, data),
  })

  return (
    <Card className={styles.section}>
      <CardHeader
        title="Email notifications"
        subtitle="Turn off any of these and you'll still see them in-app — just not by email."
      />
      {preferences.isPending ? (
        <LoadingState label="Loading your preferences" rows={4} />
      ) : preferences.isError ? (
        <ErrorState error={preferences.error} onRetry={() => preferences.refetch()} />
      ) : (
        <div className={styles.preferences}>
          {CATEGORIES.map(({ key, label }) => (
            <Checkbox
              key={key}
              label={label}
              checked={preferences.data.preferences[key]}
              disabled={save.isPending}
              onChange={(event) => save.mutate({ [key]: event.target.checked })}
            />
          ))}
        </div>
      )}
      {save.isError && (
        <p role="alert" className={styles.preferencesError}>
          {save.error.message}
        </p>
      )}
    </Card>
  )
}
