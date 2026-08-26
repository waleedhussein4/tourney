import User from '../src/models/user.model.js'
import { registerUser } from '../src/modules/auth/auth.service.js'

// Demo accounts. Phase 3 of PLAN.md replaces this with a proper seed whose
// password comes from the environment rather than the repository.
const users = [
  { username: 'soumi7', email: 'soumi7@gmail.com', password: 'Soumi123!' },
  { username: 'Ahmad01', email: 'ahmad01@gmail.com', password: 'Ahmad0001@' },
  { username: 'Khalid', email: 'khalid@hotmail.com', password: 'Khalid#45' },
  { username: 'Majed', email: 'majed@yahoo.com', password: 'Majed678*' },
  { username: 'Ahmed', email: 'ahmed@gmail.com', password: 'Ahmed_90A' },
  { username: 'Sara', email: 'sara@hotmail.com', password: 'Sara123$' },
  { username: 'Ali', email: 'ali@yahoo.com', password: 'Aliii456&' },
  { username: 'Omar', email: 'omar@gmail.com', password: 'Omar789%' },
  { username: 'Nour', email: 'nour@hotmail.com', password: 'Nour321!' },
  { username: 'Lina', email: 'lina@yahoo.com', password: 'Lina654@' },
  { username: 'Mona', email: 'mona@gmail.com', password: 'Mona987#' },
  { username: 'Hassan', email: 'hassan@hotmail.com', password: 'Hassan000*' },
]

async function createUsers() {
  const created = []
  for (const user of users) {
    // An account that already exists is not a failure — the seed is re-runnable.
    await registerUser(user)
      .then((account) => created.push(account))
      .catch(() => {})
  }
  return created
}

function deleteUsers() {
  return User.deleteMany({ role: { $ne: 'admin' } })
}

export { createUsers, deleteUsers }
