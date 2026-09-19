import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  confirmPublishRequest,
  listPublishRequests,
  publishRequestKeys,
  rejectPublishRequest,
} from '/src/api/admin.js'
import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
} from '/src/components/ui/index.js'
import { formatDateTime, formatLbp } from '/src/lib/format.js'
import styles from './admin.module.css'

/**
 * The payment queue.
 *
 * Every paid tournament waiting on a Whish transfer, oldest complaint first —
 * newest request first, rather — with the two answers a human can give it. This
 * is the manual half of paid publishing: there is no payment processor, so
 * somebody checks the transfer arrived and says so here.
 */
export function PublishRequestsPage() {
  const [resolving, setResolving] = useState(null)

  const query = useQuery({
    queryKey: publishRequestKeys.pending,
    queryFn: listPublishRequests,
    select: (data) => data.requests,
  })

  return (
    <PageShell>
      <PageHeader
        eyebrow="Administration"
        title="Publishing payments"
        description="Tournaments waiting on a Whish transfer. Confirm one and it goes live; reject it and the host can try again."
      />

      {query.isPending && <LoadingState label="Loading the queue" rows={3} />}

      {query.isError && (
        <ErrorState
          title="Could not load the queue"
          error={query.error}
          onRetry={() => query.refetch()}
        />
      )}

      {query.data?.length === 0 && (
        <EmptyState
          title="Nothing waiting"
          body="Every publishing payment has been dealt with. New ones appear here as hosts send them."
        />
      )}

      {query.data?.length > 0 && (
        <ul className={styles.queue}>
          {query.data.map((request) => (
            <li key={request.id}>
              <Card as="article" className={styles.request}>
                <div className={styles.requestMain}>
                  <h2 className={styles.requestTitle}>
                    <Link to={`/tournament/${request.tournamentId}`}>
                      {request.tournamentTitle}
                    </Link>
                  </h2>
                  <p className={styles.requestMeta}>
                    {request.host.name ?? request.host.id}
                    {request.host.email && ` · ${request.host.email}`} · asked{' '}
                    {formatDateTime(request.requestedAt)}
                  </p>
                  <p className={styles.requestReference}>{request.tournamentId}</p>
                </div>

                <p className={styles.requestAmount}>
                  {formatLbp(request.amountLbp)}
                  <span className={styles.requestTier}>{request.tier}</span>
                </p>

                <div className={styles.requestActions}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setResolving({ request, action: 'confirm' })}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setResolving({ request, action: 'reject' })}
                  >
                    Reject
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ResolveDialog resolving={resolving} onClose={() => setResolving(null)} />
    </PageShell>
  )
}

/**
 * Confirming or rejecting, with the one optional note each answer takes.
 *
 * Both are asked for in a dialog rather than inline: the note is the only
 * record of why a payment was accepted or turned down, and it is worth a beat
 * of the admin's attention before a tournament goes live or a host is told no.
 */
function ResolveDialog({ resolving, onClose }) {
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')
  const confirming = resolving?.action === 'confirm'

  const resolve = useMutation({
    mutationFn: ({ request, action }) => {
      const trimmed = note.trim() || undefined
      return action === 'confirm'
        ? confirmPublishRequest(request.id, trimmed)
        : rejectPublishRequest(request.id, trimmed)
    },
    onSuccess: (_data, { action }) => {
      queryClient.invalidateQueries({ queryKey: publishRequestKeys.pending })
      toast.success(action === 'confirm' ? 'Tournament published' : 'Request rejected')
      close()
    },
    onError: (error) => toast.error(error.message),
  })

  function close() {
    setNote('')
    onClose()
  }

  return (
    <Modal
      open={Boolean(resolving)}
      onClose={close}
      title={confirming ? 'Confirm this payment?' : 'Reject this payment?'}
      description={
        resolving &&
        (confirming
          ? `${resolving.request.tournamentTitle} goes live as soon as you confirm. ${formatLbp(resolving.request.amountLbp)} from ${resolving.request.host.name ?? 'the host'}.`
          : `${resolving.request.tournamentTitle} goes back to a draft. The host can send the payment again.`)
      }
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={resolve.isPending}>
            Cancel
          </Button>
          <Button
            variant={confirming ? 'primary' : 'danger'}
            onClick={() => resolve.mutate(resolving)}
            loading={resolve.isPending}
          >
            {confirming ? 'Confirm and publish' : 'Reject'}
          </Button>
        </>
      }
    >
      <Field
        label={confirming ? 'Whish reference' : 'Reason'}
        hint={
          confirming
            ? 'Optional. Whatever identifies the transfer, so this can be traced later.'
            : 'Optional, and not shown to the host — it is for the record.'
        }
      >
        {(field) => (
          <Input
            {...field}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={confirming ? 64 : 280}
            placeholder={confirming ? 'WH-12345' : 'No transfer received'}
          />
        )}
      </Field>
    </Modal>
  )
}
