import { useEffect, useState } from 'react'
import { supabase } from '#/utils/supabase'

export function useUserProfile() {
  const [userMode, setUserMode] = useState<'deaf' | 'hearing'>('deaf')

  useEffect(() => {
    async function loadUserPreference() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_mode')
        .eq('id', session.user.id)
        .single()

      if (profile?.preferred_mode) {
        setUserMode(profile.preferred_mode as 'deaf' | 'hearing')
      }
    }
    loadUserPreference()
  }, [])

  return { userMode, setUserMode }
}