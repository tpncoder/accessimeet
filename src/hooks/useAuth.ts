import { useEffect, useState } from 'react'
import { supabase } from '#/utils/supabase'

export const useAuth = (initial = false) => {
    const [isLoggedIn, setIsLoggedIn] = useState(initial)

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session)
        })

        return () => subscription.unsubscribe()
    }, [])

    return isLoggedIn
}