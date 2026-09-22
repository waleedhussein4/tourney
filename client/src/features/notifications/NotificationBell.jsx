import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '/src/api/notifications.js'
import { Button, EmptyState, ErrorState, LoadingState, Modal } from '/src/components/ui/index.js'
import { notificationKeys } from './queries.js'
import styles from './NotificationBell.module.css'

/** Relative-enough timestamp without pulling in a date library for one line of text. */
function timeAgo(iso) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/**
 * The bell in the nav: an unread count, and the list behind it.
 *
 * Polls the count every couple of minutes so a badge someone left open does
 * not go stale for a whole session — cheap for how little this endpoint does.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const notifications = useQuery({
    queryKey: notificationKeys.list,
    queryFn: listNotifications,
    refetchInterval: 2 * 60 * 1000,
  })

  const unreadCount = notifications.data?.unreadCount ?? 0

  async function handleOpenNotification(notification) {
    setOpen(false)
    if (!notification.read) {
      try {
        await markNotificationRead(notification._id)
        queryClient.invalidateQueries({ queryKey: notificationKeys.list })
      } catch {
        // The list still opened; a missed read-receipt is not worth a toast.
      }
    }
    if (notification.tournamentId) navigate(`/tournament/${notification.tournamentId}`)
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead()
      queryClient.invalidateQueries({ queryKey: notificationKeys.list })
    } catch {
      // Leave the list as it was — nothing changed, nothing to explain.
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.bell}
        onClick={() => setOpen(true)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Notifications"
        footer={
          unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          )
        }
      >
        {notifications.isPending ? (
          <LoadingState label="Loading notifications" rows={3} />
        ) : notifications.isError ? (
          <ErrorState error={notifications.error} onRetry={() => notifications.refetch()} />
        ) : notifications.data.notifications.length === 0 ? (
          <EmptyState
            title="You're all caught up"
            body="Application decisions, match schedules, and results will show up here."
          />
        ) : (
          <ul className={styles.list}>
            {notifications.data.notifications.map((notification) => (
              <li key={notification._id}>
                <button
                  type="button"
                  className={`${styles.item} ${notification.read ? '' : styles.unread}`}
                  onClick={() => handleOpenNotification(notification)}
                >
                  <span className={styles.itemTitle}>{notification.title}</span>
                  <span className={styles.itemBody}>{notification.body}</span>
                  <span className={styles.itemTime}>{timeAgo(notification.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 22a2.4 2.4 0 0 0 2.4-2.4h-4.8A2.4 2.4 0 0 0 12 22Zm7.2-6v-5.4c0-3.4-1.8-6.24-5.1-7V3a2.1 2.1 0 0 0-4.2 0v.6c-3.3.76-5.1 3.6-5.1 7V16l-2.1 2.1v1.1h18.6v-1.1L19.2 16Z"
      />
    </svg>
  )
}
