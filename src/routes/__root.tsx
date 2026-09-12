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

// __root.tsx
function RootComponent() {
  const { isAuthenticated: initialAuth } = Route.useRouteContext()
  const isLoggedIn = useAuth(initialAuth)
  
  return (
    <>
      {/* Changed overflow-y-auto to overflow-hidden */}
      <div className="w-[125%] h-[125vh] scale-80 transform origin-top-left overflow-hidden">
        <Navbar isLoggedIn={isLoggedIn} />
        <Outlet />
      </div>
    </>
  )
}