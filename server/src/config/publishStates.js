// Where a tournament is on its way to being visible.
//
// Two states and a rule about a missing one.

export const PUBLISH_STATES = ['draft', 'published']

/**
 * The states that hide a tournament from everyone but its host.
 *
 * Stated as a list of what is hidden rather than what is shown, because a
 * tournament written before this field existed has no `publishState` at all and
 * was public when it was written. Asking "is it published?" would hide every one
 * of them; asking "is it hidden?" gets them right.
 */
export const UNPUBLISHED = ['draft']
