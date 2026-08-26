import { Controller, useForm } from 'react-hook-form'
import { updateTournament } from '/src/api/tournaments.js'
import {
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  RichTextField,
  Textarea,
} from '/src/components/ui/index.js'
import { richTextLimit, toPlainText } from '/src/lib/richText.js'
import { useManageMutation } from '../useManageMutation.js'
import styles from '../ManagePage.module.css'

/** `2030-01-05T18:00:00.000Z` as a `datetime-local` value in the reader's zone. */
function toLocalInput(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

/**
 * The editable half of a tournament.
 *
 * Only the fields a host may still change are here — the format, capacity and
 * prizes are fixed once people can see them, because entrants decide on the
 * strength of those. The server enforces the same list with a strict schema.
 */
export function DetailsSection({ tournament }) {
  const locked = tournament.hasStarted

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    values: {
      title: tournament.title,
      // Stored as HTML, edited as the sentence the host actually wrote — a
      // one-line blurb capped at 200 characters gains nothing from markup, and
      // showing them their own <p> tags to edit around is worse than useless.
      description: toPlainText(tournament.description),
      rules: tournament.rules ?? '',
      startDate: toLocalInput(tournament.startDate),
      endDate: toLocalInput(tournament.endDate),
      contactEmail: tournament.contactInfo?.email ?? '',
      contactPhone: tournament.contactInfo?.phone ?? '',
      discord: tournament.contactInfo?.socialMedia?.discord ?? '',
      instagram: tournament.contactInfo?.socialMedia?.instagram ?? '',
      twitter: tournament.contactInfo?.socialMedia?.twitter ?? '',
      facebook: tournament.contactInfo?.socialMedia?.facebook ?? '',
    },
  })

  const save = useManageMutation({
    tournamentId: tournament.id,
    mutationFn: (values) =>
      updateTournament(tournament.id, {
        title: values.title,
        description: values.description,
        rules: values.rules,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        contactInfo: {
          email: values.contactEmail || undefined,
          phone: values.contactPhone || undefined,
          socialMedia: {
            discord: values.discord || undefined,
            instagram: values.instagram || undefined,
            twitter: values.twitter || undefined,
            facebook: values.facebook || undefined,
          },
        },
      }),
    success: 'Details saved',
    onDone: () => reset(undefined, { keepValues: true }),
  })

  return (
    <Card>
      <CardHeader
        title="Details"
        subtitle={
          locked
            ? 'The tournament has started, so the details are fixed.'
            : 'Editable until the tournament starts.'
        }
      />

      <form className={styles.form} onSubmit={handleSubmit((values) => save.mutate(values))}>
        <fieldset className={styles.fieldset} disabled={locked || save.isPending}>
          <legend className="visually-hidden">Tournament details</legend>

          <Field label="Title" required error={errors.title?.message}>
            {(field) => (
              <Input
                {...field}
                {...register('title', {
                  required: 'Give it a name',
                  minLength: { value: 3, message: 'At least 3 characters' },
                })}
              />
            )}
          </Field>

          <Field
            label="Description"
            hint="Up to 200 characters."
            error={errors.description?.message}
          >
            {(field) => (
              <Textarea
                {...field}
                rows={3}
                {...register('description', {
                  maxLength: { value: 200, message: 'At most 200 characters' },
                })}
              />
            )}
          </Field>

          <Controller
            control={control}
            name="rules"
            rules={{ validate: richTextLimit(800, 'Rules') }}
            render={({ field }) => (
              <RichTextField
                label="Rules"
                value={field.value}
                onChange={field.onChange}
                limit={800}
                error={errors.rules?.message}
              />
            )}
          />

          <div className={styles.grid}>
            <Field label="Starts" error={errors.startDate?.message}>
              {(field) => (
                <Input
                  {...field}
                  type="datetime-local"
                  {...register('startDate', { required: 'Choose a start' })}
                />
              )}
            </Field>
            <Field label="Ends" error={errors.endDate?.message}>
              {(field) => (
                <Input
                  {...field}
                  type="datetime-local"
                  {...register('endDate', {
                    required: 'Choose an end',
                    validate: (value, all) =>
                      new Date(value) > new Date(all.startDate) || 'Must be after the start',
                  })}
                />
              )}
            </Field>
          </div>

          <div className={styles.grid}>
            <Field label="Contact email" error={errors.contactEmail?.message}>
              {(field) => (
                <Input
                  {...field}
                  type="email"
                  {...register('contactEmail', {
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
                  })}
                />
              )}
            </Field>
            <Field label="Phone">
              {(field) => <Input {...field} {...register('contactPhone')} />}
            </Field>
            <Field label="Discord">
              {(field) => <Input {...field} {...register('discord')} />}
            </Field>
            <Field label="Instagram">
              {(field) => <Input {...field} {...register('instagram')} />}
            </Field>
            <Field label="Twitter">
              {(field) => <Input {...field} {...register('twitter')} />}
            </Field>
            <Field label="Facebook">
              {(field) => <Input {...field} {...register('facebook')} />}
            </Field>
          </div>
        </fieldset>

        {!locked && (
          <Button type="submit" variant="primary" loading={save.isPending} disabled={!isDirty}>
            Save details
          </Button>
        )}
      </form>
    </Card>
  )
}
