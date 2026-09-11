import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button, Card, Input, TextField, FieldError, Label, Description } from '@heroui/react'
import { useState } from 'react'

import { supabase } from '#/utils/supabase'

export const Route = createFileRoute('/auth')({
  component: Auth,
})

function Auth() {
  const navigate = useNavigate()

  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const isUserNameInvalid = !(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
  const isPasswordInvalid = !(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{8,}$/.test(password))
  const [authError, setAuthError] = useState<string | null>(null)

  const authUser = async (email: string, password: string) => {
    setAuthError(null)

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!signInError && signInData.session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', signInData.session.user.id)
        .single()

      if (!profile || !profile.full_name) {
        navigate({ to: '/onboarding' })
      } else {
        navigate({ to: '/' })
      }
      return
    }

    if (signInError && signInError.message.includes('Invalid login credentials')) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setAuthError(signUpError.message)
      } else if (signUpData.session) {
        navigate({ to: '/onboarding' })
      } else if (signUpData.user) {
        setAuthError('Check your email for the confirmation link!')
      }
    } else if (signInError) {
      setAuthError(signInError.message)
    }
  }

  return (
    <div className="p-4 flex justify-center items-center min-h-full w-screen">
      <Card className="max-w-sm w-full brutal-card">
        <Card.Header className="font-bold text-xl uppercase">Sign In / Sign Up</Card.Header>
        <Card.Content className="flex flex-col gap-4">
          {authError && (
            <div className="p-2 border-2 border-black bg-red-100 font-bold text-xs">
              {authError}
            </div>
          )}
          <TextField isRequired onChange={setEmail} value={email} isInvalid={email.length > 0 && isUserNameInvalid}>
            <Label className="font-bold">Email</Label>
            <Input placeholder="Enter your email" />
            {email.length > 0 && isUserNameInvalid ? (
              <FieldError>Enter a valid email address</FieldError>
            ) : (
              <Description>Enter your email address</Description>
            )}
          </TextField>
          <TextField isRequired onChange={setPassword} value={password} isInvalid={password.length > 0 && isPasswordInvalid}>
            <Label className="font-bold">Password</Label>
            <Input placeholder="Enter your password" type="password" />
            {password.length > 0 && isPasswordInvalid ? (
              <FieldError>Password must have at least 8 chars, 1 uppercase, 1 lowercase, 1 digit, & 1 special char</FieldError>
            ) : (
              <Description>Choose a strong password.</Description>
            )}
          </TextField>
        </Card.Content>
        <Card.Footer>
          <Button 
            onPress={() => authUser(email, password)}
            isDisabled={isUserNameInvalid || isPasswordInvalid}
            className="w-full brutal-btn-primary"
          >
            Continue
          </Button>
        </Card.Footer>
      </Card>
    </div>
  )
}