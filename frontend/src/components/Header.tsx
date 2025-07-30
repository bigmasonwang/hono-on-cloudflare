import { Link } from '@tanstack/react-router'
import { useSession, signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export default function Header() {
  const { data: session, isPending } = useSession()

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <header className="p-2 flex gap-2 bg-white text-black justify-between">
      <nav className="flex flex-row">
        <div className="px-2 font-bold space-x-2">
          <Link to="/">Home</Link>
          {!isPending && (
            <>
              {session?.user ? (
                <>
                  <span className="text-gray-600">
                    Welcome, {session.user.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="ml-2"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">Login</Link>
                  <Link to="/register">Register</Link>
                </>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
