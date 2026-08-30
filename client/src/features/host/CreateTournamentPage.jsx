import { useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { createTournament, listCategories, tournamentKeys } from '/src/api/tournaments.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import { Button, Card, Field, Input, Select, Textarea } from '/src/components/ui/index.js'
import { RichTextField } from '/src/components/ui/RichTextField.jsx'
import { formatCredits } from '/src/lib/format.js'
import { richTextLimit } from '/src/lib/richText.js'
import {
  BRACKET_SIZES,
  projectedIncome,
  toCreatePayload,
  totalPrize,
  visibleSteps,
} from './wizardSteps.js'
import styles from './CreateTournamentPage.module.css'

/** Tomorrow, and the day after, as the datetime-local inputs want them. */
function defaultSchedule() {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const end = new Date(Date.now() + 48 * 60 * 60 * 1000)
  const iso = (date) =>
    new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
  return { startDate: iso(start), endDate: iso(end) }
}

export function CreateTournamentPage() {
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)

  const form = useForm({
    mode: 'onTouched',
    defaultValues: {
      type: 'brackets',
      teamSize: 1,
      title: '',
      category: '',
      description: '',
      rules: '',
      prize: 100,
      prizes: [{ prize: 100 }],
      accessibility: 'open',
      maxCapacity: 8,
      entryFee: 10,
      applicationForm: [{ label: '' }],
      contactEmail: '',
      contactPhone: '',
      discord: '',
      instagram: '',
      twitter: '',
      facebook: '',
      ...defaultSchedule(),
    },
  })

  const values = form.watch()
  const steps = visibleSteps(values)
  const step = steps[Math.min(stepIndex, steps.length - 1)]
  const isLastStep = stepIndex === steps.length - 1

  const categories = useQuery({
    queryKey: tournamentKeys.categories,
    queryFn: listCategories,
    staleTime: Infinity,
  })

  const create = useMutation({
    mutationFn: () => createTournament(toCreatePayload(form.getValues())),
    onSuccess: ({ tournament }) => {
      toast.success('Tournament created')
      navigate(`/tournament/${tournament.id}/manage`)
    },
    onError: (error) => {
      // Field-level messages from the server are attached to their inputs; the
      // wizard then jumps to the first step that owns one, so the reader is
      // looking at the problem rather than hunting for it.
      const fieldErrors = error.fieldErrors ?? {}
      for (const [path, message] of Object.entries(fieldErrors)) {
        form.setError(path, { message })
      }

      const offending = steps.findIndex((candidate) =>
        candidate.fields.some((field) => field in fieldErrors)
      )
      if (offending >= 0) setStepIndex(offending)

      toast.error(error.message)
    },
  })

  async function goNext() {
    // Only this step's fields are validated, so a half-filled later step does
    // not block progress through an earlier one.
    const valid = await form.trigger(step.fields)
    if (!valid) return
    setStepIndex((index) => Math.min(index + 1, steps.length - 1))
  }

  return (
    <PageShell width="narrow">
      <PageHeader eyebrow="Hosting" title="Create a tournament" description={step.summary} />

      <ol className={styles.progress}>
        {steps.map((candidate, index) => (
          <li
            key={candidate.id}
            className={[
              styles.step,
              index === stepIndex && styles.current,
              index < stepIndex && styles.done,
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={index === stepIndex ? 'step' : undefined}
          >
            <span className={styles.stepNumber}>{index + 1}</span>
            <span>{candidate.title}</span>
          </li>
        ))}
      </ol>

      <Card>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (isLastStep) create.mutate()
            else goNext()
          }}
        >
          <fieldset className={styles.fields} disabled={create.isPending}>
            <legend className="visually-hidden">{step.title}</legend>
            <StepFields step={step} form={form} categories={categories} values={values} />
          </fieldset>

          <footer className={styles.actions}>
            <Button
              variant="ghost"
              onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
              disabled={stepIndex === 0 || create.isPending}
            >
              Back
            </Button>
            <span className={styles.position}>
              Step {stepIndex + 1} of {steps.length}
            </span>
            <Button type="submit" variant="primary" loading={create.isPending}>
              {isLastStep ? 'Create tournament' : 'Continue'}
            </Button>
          </footer>
        </form>
      </Card>
    </PageShell>
  )
}

function StepFields({ step, form, categories, values }) {
  const { register, formState, control, setValue } = form
  const errors = formState.errors

  switch (step.id) {
    case 'format':
      return (
        <>
          <fieldset className={styles.choices}>
            <legend>Format</legend>
            <Choice
              value="brackets"
              checked={values.type === 'brackets'}
              title="Brackets"
              description="Single elimination. One winner takes the prize."
              onSelect={() => {
                setValue('type', 'brackets')
                // Bracket capacities are powers of two; carry over the nearest.
                setValue('maxCapacity', 8)
              }}
            />
            <Choice
              value="battle royale"
              checked={values.type === 'battle royale'}
              title="Battle royale"
              description="Ranked by score. Prizes go down a table of places."
              onSelect={() => {
                setValue('type', 'battle royale')
                setValue('maxCapacity', 20)
              }}
            />
          </fieldset>

          <Field
            label="Team size"
            required
            hint="1 for a solo tournament. Anything higher and entrants enter as a team of exactly that many."
            error={errors.teamSize?.message}
          >
            {(field) => (
              <Input
                {...field}
                type="number"
                min="1"
                max="16"
                {...register('teamSize', {
                  required: 'Set a team size',
                  min: { value: 1, message: 'At least 1' },
                  max: { value: 16, message: 'At most 16' },
                })}
              />
            )}
          </Field>
        </>
      )

    case 'details':
      return (
        <>
          <Field label="Title" required error={errors.title?.message}>
            {(field) => (
              <Input
                {...field}
                autoFocus
                {...register('title', {
                  required: 'Give it a name',
                  minLength: { value: 3, message: 'At least 3 characters' },
                  maxLength: { value: 80, message: 'At most 80 characters' },
                })}
              />
            )}
          </Field>

          <Field label="Category" required error={errors.category?.message}>
            {(field) => (
              <Select {...field} {...register('category', { required: 'Pick a category' })}>
                <option value="">Choose one</option>
                {(categories.data?.categories ?? []).map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            label="Description"
            hint="Up to 200 characters. Shown on the tournament card and page."
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
        </>
      )

    case 'prizes':
      return values.type === 'brackets' ? (
        <Field
          label="Winner takes"
          required
          hint="Paid from the prize bank when the tournament ends."
          error={errors.prize?.message}
        >
          {(field) => (
            <Input
              {...field}
              type="number"
              min="0"
              {...register('prize', {
                required: 'Set a prize',
                min: { value: 0, message: 'Cannot be negative' },
              })}
            />
          )}
        </Field>
      ) : (
        <PrizeTable control={control} register={register} errors={errors} />
      )

    case 'entry':
      return (
        <>
          <fieldset className={styles.choices}>
            <legend>Who can enter</legend>
            <Choice
              value="open"
              checked={values.accessibility === 'open'}
              title="Anyone"
              description="Entrants join directly and pay the fee."
              onSelect={() => setValue('accessibility', 'open')}
            />
            <Choice
              value="application required"
              checked={values.accessibility === 'application required'}
              title="By application"
              description="You review applications and choose who gets a slot."
              onSelect={() => setValue('accessibility', 'application required')}
            />
          </fieldset>

          <Field
            label={values.teamSize > 1 ? 'Number of teams' : 'Number of players'}
            required
            error={errors.maxCapacity?.message}
            hint={
              values.type === 'brackets'
                ? 'A single-elimination draw needs a power of two.'
                : undefined
            }
          >
            {(field) =>
              values.type === 'brackets' ? (
                <Select {...field} {...register('maxCapacity', { required: true })}>
                  {BRACKET_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  {...field}
                  type="number"
                  min="2"
                  max="1000"
                  {...register('maxCapacity', {
                    required: 'Set a capacity',
                    min: { value: 2, message: 'At least 2' },
                    max: { value: 1000, message: 'At most 1000' },
                  })}
                />
              )
            }
          </Field>

          <Field
            label="Entry fee, per player"
            required
            hint={
              values.teamSize > 1
                ? `A team leader pays this for each of the ${values.teamSize} players.`
                : 'Charged when someone joins. Set 0 to make it free.'
            }
            error={errors.entryFee?.message}
          >
            {(field) => (
              <Input
                {...field}
                type="number"
                min="0"
                {...register('entryFee', {
                  required: 'Set a fee, or 0',
                  min: { value: 0, message: 'Cannot be negative' },
                })}
              />
            )}
          </Field>

          <BankForecast values={values} />

          <div className={styles.dates}>
            <Field label="Starts" required error={errors.startDate?.message}>
              {(field) => (
                <Input
                  {...field}
                  type="datetime-local"
                  {...register('startDate', { required: 'Choose a start' })}
                />
              )}
            </Field>
            <Field label="Ends" required error={errors.endDate?.message}>
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
        </>
      )

    case 'application':
      return <ApplicationBuilder control={control} register={register} errors={errors} />

    case 'contact':
      return (
        <>
          <Field label="Email" error={errors.contactEmail?.message}>
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
          <Field label="Discord">{(field) => <Input {...field} {...register('discord')} />}</Field>
          <Field label="Instagram">
            {(field) => <Input {...field} {...register('instagram')} />}
          </Field>
          <Field label="Twitter">{(field) => <Input {...field} {...register('twitter')} />}</Field>
          <Field label="Facebook">
            {(field) => <Input {...field} {...register('facebook')} />}
          </Field>
        </>
      )

    case 'review':
      return <Review values={values} categories={categories} />

    default:
      return null
  }
}

/** A large, clickable radio card. */
function Choice({ value, checked, title, description, onSelect }) {
  return (
    <label className={`${styles.choice} ${checked ? styles.choiceOn : ''}`}>
      <input type="radio" checked={checked} onChange={onSelect} value={value} />
      <span>
        <span className={styles.choiceTitle}>{title}</span>
        <span className={styles.choiceDescription}>{description}</span>
      </span>
    </label>
  )
}

function PrizeTable({ control, register, errors }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'prizes' })

  return (
    <div className={styles.repeater}>
      <p className={styles.repeaterIntro}>
        Prizes are paid down the leaderboard: first place takes the top row.
      </p>

      {fields.map((field, index) => (
        <div className={styles.repeaterRow} key={field.id}>
          <Field label={`Place ${index + 1}`} error={errors.prizes?.[index]?.prize?.message}>
            {(inner) => (
              <Input
                {...inner}
                type="number"
                min="0"
                {...register(`prizes.${index}.prize`, {
                  required: 'Set an amount',
                  min: { value: 0, message: 'Cannot be negative' },
                })}
              />
            )}
          </Field>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => remove(index)}
            disabled={fields.length === 1}
            aria-label={`Remove the prize for place ${index + 1}`}
          >
            Remove
          </Button>
        </div>
      ))}

      <Button size="sm" onClick={() => append({ prize: 0 })}>
        Add a place
      </Button>
    </div>
  )
}

function ApplicationBuilder({ control, register, errors }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'applicationForm' })

  return (
    <div className={styles.repeater}>
      <p className={styles.repeaterIntro}>
        Applicants answer these when they apply, and you see the answers on the manage page.
      </p>

      {fields.map((field, index) => (
        <div className={styles.repeaterRow} key={field.id}>
          <Field
            label={`Question ${index + 1}`}
            error={errors.applicationForm?.[index]?.label?.message}
          >
            {(inner) => (
              <Input
                {...inner}
                placeholder="In-game name"
                {...register(`applicationForm.${index}.label`, {
                  required: 'Write the question, or remove it',
                  maxLength: { value: 80, message: 'At most 80 characters' },
                })}
              />
            )}
          </Field>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => remove(index)}
            disabled={fields.length === 1}
            aria-label={`Remove question ${index + 1}`}
          >
            Remove
          </Button>
        </div>
      ))}

      <Button size="sm" onClick={() => append({ label: '' })} disabled={fields.length >= 10}>
        Add a question
      </Button>
    </div>
  )
}

/**
 * What the entry fees raise against what the prizes cost.
 *
 * The gap is exactly what the host has to deposit before the tournament can
 * start, so it is better learned here than at the start button.
 */
function BankForecast({ values }) {
  const prizes = totalPrize(values)
  const income = projectedIncome(values)
  const shortfall = Math.max(0, prizes - income)

  return (
    <div className={styles.forecast}>
      <div>
        <dt>Prize pool</dt>
        <dd>{formatCredits(prizes)}</dd>
      </div>
      <div>
        <dt>Entry fees, if it fills</dt>
        <dd>{formatCredits(income)}</dd>
      </div>
      <div className={shortfall > 0 ? styles.forecastWarn : ''}>
        <dt>You would top up</dt>
        <dd>{formatCredits(shortfall)}</dd>
      </div>
    </div>
  )
}

function Review({ values, categories }) {
  const category = (categories.data?.categories ?? []).find(
    (entry) => entry.slug === values.category
  )

  const rows = [
    ['Title', values.title || '—'],
    ['Format', values.type === 'brackets' ? 'Brackets' : 'Battle royale'],
    ['Category', category?.name ?? '—'],
    ['Team size', values.teamSize > 1 ? `Teams of ${values.teamSize}` : 'Solo'],
    ['Capacity', `${values.maxCapacity} ${values.teamSize > 1 ? 'teams' : 'players'}`],
    ['Entry fee', formatCredits(Number(values.entryFee) || 0)],
    ['Prize pool', formatCredits(totalPrize(values))],
    ['Entry', values.accessibility === 'open' ? 'Anyone can join' : 'By application'],
    ['Starts', values.startDate?.replace('T', ' ') ?? '—'],
    ['Ends', values.endDate?.replace('T', ' ') ?? '—'],
  ]

  return (
    <>
      <dl className={styles.review}>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.reviewNote}>
        You can edit the details, dates and rules until the tournament starts. The format, capacity
        and prizes are fixed once it exists, because people enter on the strength of them.
      </p>
    </>
  )
}
