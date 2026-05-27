import LoggedInView from '@/app/LoggedInView'
import LoggedOutView from '@/app/LoggedOutView'
import {getUser} from '@/lib/auth'

export default async function Home() {
  const user = await getUser()
  return user ? <LoggedInView user={user} /> : <LoggedOutView />
}
