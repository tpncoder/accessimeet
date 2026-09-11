import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button, Card, Input, TextField, Label } from '@heroui/react'
import { useState } from 'react'

import { supabase } from '#/utils/supabase'

export const Route = createFileRoute('/onboarding')({
  component: Onboarding,
})

function Onboarding() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState<string>('')
  const [preferredMode, setPreferredMode] = useState<'deaf' | 'hearing'>('deaf')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const completeOnboarding = async () => {
    if (!fullName.trim()) return

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('User session not found. Please sign in again.')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName.trim(),
        preferred_mode: preferredMode,
        updated_at: new Date().toISOString(),
      })

    setLoading(false)

    if (profileError) {
      setError(profileError.message)
    } else {
      navigate({ to: '/' })
    }
  }

  return (
    <div className="p-4 flex justify-center items-center min-h-full w-screen">
      <Card className="max-w-md w-full brutal-card">
        <Card.Header className="font-bold text-xl uppercase">Complete Your Profile</Card.Header>
        <Card.Content className="flex flex-col gap-6">
          {error && (
            <div className="p-2 border-2 border-black bg-red-100 font-bold text-xs">
              {error}
            </div>
          )}

          <TextField isRequired onChange={setFullName} value={fullName}>
            <Label className="font-bold">Full Name</Label>
            <Input placeholder="Enter your name" />
          </TextField>

          <div className="flex flex-col gap-2">
            <Label className="font-bold">Primary Communication Mode</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPreferredMode('deaf')}
                className={preferredMode === 'deaf' ? 'brutal-btn-primary p-3' : 'brutal-btn p-3 bg-white'}
              >
                ASL / Deaf Mode
              </button>
              <button
                type="button"
                onClick={() => setPreferredMode('hearing')}
                className={preferredMode === 'hearing' ? 'brutal-btn-danger p-3' : 'brutal-btn p-3 bg-white'}
              >
                Speech / Hearing Mode
              </button>
            </div>
          </div>
        </Card.Content>
        <Card.Footer>
          <Button
            onPress={completeOnboarding}
            isDisabled={!fullName.trim() || loading}
            className="w-full brutal-btn-primary"
          >
            {loading ? 'Saving...' : 'Get Started'}
          </Button>
        </Card.Footer>
      </Card>
    </div>
  )
}