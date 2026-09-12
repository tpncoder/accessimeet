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
  const [showPassword, setShowPassword] = useState<boolean>(false)

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
    <div className="p-4 flex flex-col justify-center items-center min-h-screen w-full gap-6">
      <Card className="max-w-sm w-full brutal-card">
        <Card.Header className="font-bold text-xl uppercase">
          Sign In / Sign Up
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          {authError && (
            <div className="p-2 border-2 border-black bg-red-100 font-bold text-xs">
              {authError}
            </div>
          )}

          <TextField
            isRequired
            onChange={setEmail}
            value={email}
            isInvalid={email.length > 0 && isUserNameInvalid}
          >
            <Label className="font-bold">Email</Label>
            <Input placeholder="Enter your email" />
            {email.length > 0 && isUserNameInvalid ? (
              <FieldError>Enter a valid email address</FieldError>
            ) : (
              <Description>Enter your email address</Description>
            )}
          </TextField>

          <TextField
            isRequired
            onChange={setPassword}
            value={password}
            isInvalid={password.length > 0 && isPasswordInvalid}
          >
            <Label className="font-bold">Password</Label>
            <div className="relative w-full">
              <Input
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                className="pr-15"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none text-gray-500 hover:text-black transition-colors z-10"
                aria-label="toggle password visibility"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

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