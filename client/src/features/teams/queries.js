/** Cache keys for team data, so an invalidation cannot miss its query. */
export const teamKeys = {
  all: ['teams'],
  mine: ['teams', 'mine'],
  detail: (teamId) => ['teams', 'detail', teamId],
  byCode: (code) => ['teams', 'code', code],
}
