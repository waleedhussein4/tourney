import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { ACCESSIBILITY, CATEGORY_SLUGS, LIMITS, TOURNAMENT_TYPES } from '../config/constants.js'
import { PUBLISH_STATES, UNPUBLISHED } from '../config/publishStates.js'

const { Schema } = mongoose

/** One competitor's standing, shared by solo players and by team members. */
const standingFields = {
  _id: false,
  score: { type: Number, default: 0 },
  eliminated: { type: Boolean, default: false },
}

const memberSchema = new Schema({ ...standingFields, userId: { type: String, ref: 'User' } })

const enrolledUserSchema = new Schema({
  ...standingFields,
  userId: { type: String, ref: 'User', required: true },
})

const enrolledTeamSchema = new Schema({
  ...standingFields,
  teamId: { type: String, ref: 'Team', required: true },
  // Denormalised so a bracket still reads correctly after a team is renamed or
  // deleted — the tournament records who competed, not who exists today.
  teamName: { type: String, required: true },
  members: { type: [memberSchema], default: [] },
})

const applicationSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    /** The user id, or the team id when applying as a team. */
    applicantId: { type: String, required: true },
    isTeam: { type: Boolean, default: false },
    displayName: { type: String, required: true },
    fields: {
      type: [{ _id: false, label: String, input: String }],
      default: [],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

const tournamentSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },

    host: { type: String, ref: 'User', required: true, index: true },

    title: { type: String, required: true, trim: true, maxlength: LIMITS.title },
    type: { type: String, enum: TOURNAMENT_TYPES, required: true },
    category: { type: String, enum: CATEGORY_SLUGS, required: true },
    accessibility: { type: String, enum: ACCESSIBILITY, required: true },

    /** 1 means a solo tournament; anything higher means teams of exactly this size. */
    teamSize: { type: Number, required: true, min: 1 },

    /**
     * The number of **participant slots**: players in a solo tournament, teams in
     * a team tournament. One meaning, used by joining, applications, capacity
     * checks, and bracket-slot arithmetic alike.
     */
    maxCapacity: { type: Number, required: true, min: 2 },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    hasStarted: { type: Boolean, default: false },
    hasEnded: { type: Boolean, default: false },

    /** Set by the seed script and nothing else. The demo reset deletes only these. */
    isDemo: { type: Boolean, default: false, index: true },

    /**
     * Whether anyone but the host can see this. A tournament is born a `draft`;
     * only a published one is listed, joinable, or startable. What it takes to
     * publish is in the subscriptions module — see docs/MONETISATION.md.
     */
    /**
     * No schema default on purpose. Mongoose applies a default when it hydrates
     * a document that lacks the field, so `default: 'draft'` would turn every
     * tournament written before this feature into a draft the moment it was
     * read — invisible, with nothing in the database to show why. New
     * tournaments are given the state explicitly when they are created.
     */
    publishState: { type: String, enum: PUBLISH_STATES, index: true },

    description: { type: String, default: '' },
    rules: { type: String, default: '' },

    contactInfo: {
      _id: false,
      email: String,
      phone: String,
      socialMedia: {
        _id: false,
        discord: String,
        instagram: String,
        twitter: String,
        facebook: String,
      },
    },

    /** The labels the host asks applicants to fill in. Empty for open tournaments. */
    applicationForm: { type: [String], default: [] },
    applications: { type: [applicationSchema], default: [] },
    acceptedUsers: { type: [String], default: [] },
    acceptedTeams: { type: [String], default: [] },

    enrolledUsers: { type: [enrolledUserSchema], default: [] },
    enrolledTeams: { type: [enrolledTeamSchema], default: [] },

    /**
     * Participant ids in bracket-slot order, `null` for an empty slot.
     *
     * Kept separate from the enrolment arrays so shuffling never has to write a
     * placeholder into them — the original code pushed `null` members into
     * `enrolledUsers` to pad the bracket, which then had to be filtered out of
     * every count and standings query downstream.
     */
    bracketOrder: { type: [String], default: [] },
    bracketsShuffled: { type: Boolean, default: false },

    /**
     * Winners by match index, `null` where undecided. Round 1 occupies the first
     * `maxCapacity / 2` entries, then each subsequent round halves, so the array
     * is always `maxCapacity - 1` long and the last entry is the champion.
     */
    matches: { type: [String], default: [] },

    updates: {
      type: [{ _id: false, date: { type: Date, default: Date.now }, content: String }],
      default: [],
    },
  },
  { timestamps: true }
)

// Search is a text index rather than a scan-and-score in application code.
tournamentSchema.index({ title: 'text', description: 'text' })
tournamentSchema.index({ category: 1, type: 1, accessibility: 1 })
tournamentSchema.index({ 'enrolledUsers.userId': 1 })
tournamentSchema.index({ 'enrolledTeams.members.userId': 1 })

/** True for a tournament played by teams rather than individuals. */
tournamentSchema.virtual('isTeamBased').get(function isTeamBased() {
  return this.teamSize > 1
})

/** The enrolment array in play for this tournament's shape. */
tournamentSchema.methods.participants = function participants() {
  return this.isTeamBased ? this.enrolledTeams : this.enrolledUsers
}

/** How many slots are taken. */
tournamentSchema.methods.participantCount = function participantCount() {
  return this.participants().length
}

/** The id of a participant row — a user id for solo, a team id for teams. */
tournamentSchema.methods.participantId = function participantId(participant) {
  return this.isTeamBased ? String(participant.teamId) : String(participant.userId)
}

/** Every participant id currently enrolled. */
tournamentSchema.methods.participantIds = function participantIds() {
  return this.participants().map((participant) => this.participantId(participant))
}

/** True when this user is competing, whether directly or through a team. */
tournamentSchema.methods.hasParticipant = function hasParticipant(userId) {
  const id = String(userId)
  return (
    this.enrolledUsers.some((entry) => String(entry.userId) === id) ||
    this.enrolledTeams.some((team) => team.members.some((member) => String(member.userId) === id))
  )
}

/**
 * Public unless it is explicitly waiting to be published.
 *
 * Stated as a negative on purpose: a tournament written before `publishState`
 * existed has no such field, and it was public when it was written. Asking
 * "is it published?" would hide every one of them the moment this code
 * deployed, before any migration had a chance to run.
 */
tournamentSchema.virtual('isPublished').get(function isPublished() {
  return !UNPUBLISHED.includes(this.publishState)
})

tournamentSchema.methods.isHostedBy = function isHostedBy(userId) {
  return String(this.host) === String(userId)
}

export default mongoose.model('Tournament', tournamentSchema)
