import { useForm } from 'react-hook-form'
import { postUpdate } from '/src/api/tournaments.js'
import { Button, Card, CardHeader, Field, Textarea } from '/src/components/ui/index.js'
import { formatDateTime } from '/src/lib/format.js'
import { useManageMutation } from '../useManageMutation.js'
import styles from '../ManagePage.module.css'

/** Announcements, shown on the public tournament page. */
export function UpdatesSection({ tournament }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { content: '' } })

  const post = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: ({ content }) => postUpdate(tournament.id, content),
    success: 'Update posted',
    onDone: () => reset({ content: '' }),
  })

  return (
    <Card>
      <CardHeader title="Updates" subtitle="Everyone watching this tournament sees these." />

      <form className={styles.form} onSubmit={handleSubmit((values) => post.mutate(values))}>
        <Field label="New update" error={errors.content?.message}>
          {(field) => (
            <Textarea
              {...field}
              rows={3}
              placeholder="Round one starts in ten minutes."
              {...register('content', {
                required: 'Write something first',
                maxLength: { value: 500, message: 'At most 500 characters' },
              })}
            />
          )}
        </Field>
        <Button type="submit" variant="primary" loading={post.isPending}>
          Post update
        </Button>
      </form>

      {tournament.updates.length > 0 && (
        <ol className={styles.updates}>
          {[...tournament.updates].reverse().map((update, index) => (
            <li key={`${update.date}-${index}`}>
              <time dateTime={update.date}>{formatDateTime(update.date)}</time>
              <p>{update.content}</p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
