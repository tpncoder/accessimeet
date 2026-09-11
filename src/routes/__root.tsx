import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { Navbar } from '#/components/Navbar'
import { supabase } from '#/utils/supabase'
import { useAuth } from '#/hooks/useAuth'

import '../styles.css'

interface RouterContext {
  isAuthenticated: boolean
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      isAuthenticated: !!session,
    }
  },
  component: RootComponent,
})

function RootComponent() {
  const { isAuthenticated: initialAuth } = Route.useRouteContext()
  const isLoggedIn = useAuth(initialAuth)

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} />
      <Outlet />
    </>
  )
}