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
  for (const user of users) {
    try {
      const created = await registerUser(user)
      console.log(`User created: ${created.username}`)
    } catch (error) {
      console.error(`Error creating user ${user.username}: ${error.message}`)
    }
  }
}

async function deleteUsers() {
  const result = await User.deleteMany({ role: { $ne: 'admin' } })
  console.log(`${result.deletedCount} users deleted successfully.`)
}

export { createUsers, deleteUsers }
