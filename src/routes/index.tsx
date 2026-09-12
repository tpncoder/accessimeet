import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button, Card, Typography, TextField, Input, Label } from '@heroui/react'
import { useState } from 'react'

import { Route as RootRoute } from '#/routes/__root'
import { useAuth } from '#/hooks/useAuth'

export const Route = createFileRoute('/')({
    component: Index,
})

function Index() {
    const { isAuthenticated: initialAuth } = RootRoute.useRouteContext()
    const isLoggedIn = useAuth(initialAuth)

    return isLoggedIn ? <Dashboard /> : <Landing />
}

function Dashboard() {
    const navigate = useNavigate()
    const [roomCode, setRoomCode] = useState<string>('')

    const createRoom = () => {
        // generate a unique 7-character room code
        const newRoomId = Math.random().toString(36).substring(2, 9)

        navigate({
            to: `/room/${newRoomId}`,
            search: { isHost: true },
        })
    }

    const joinRoom = () => {
        if (!roomCode.trim()) return

        navigate({
            to: `/room/${roomCode.trim()}`,
            search: { isHost: false },
        })
    }

    return (
        // Changed: min-h-full w-screen -> min-h-screen w-full justify-center
        <div className='p-4 flex flex-col items-center justify-center min-h-screen w-full gap-6'>
            <Typography type='h2' className='font-thin'>What are we doing today?</Typography>

            <div className='flex flex-col md:flex-row gap-4 w-full max-w-3xl'>
                <Card className='flex-1'>
                    <Card.Header>
                        <Typography type='h4'>Start a Room</Typography>
                    </Card.Header>
                    <Card.Content>
                        <Typography type='body' className='font-thin'>
                            Create a new session and share the code with the other participant.
                        </Typography>
                    </Card.Content>
                    <Card.Footer>
                        <Button onPress={createRoom}>Create Room</Button>
                    </Card.Footer>
                </Card>

                <Card className='flex-1'>
                    <Card.Header>
                        <Typography type='h4'>Join a Room</Typography>
                    </Card.Header>
                    <Card.Content>
                        <TextField onChange={setRoomCode} value={roomCode}>
                            <Label>Room Code</Label>
                            <Input placeholder='Enter room code' />
                        </TextField>
                    </Card.Content>
                    <Card.Footer>
                        <Button onPress={joinRoom} isDisabled={!roomCode.trim()}>Join Room</Button>
                    </Card.Footer>
                </Card>
            </div>
        </div>
    )
}

function Landing() {
    const navigate = useNavigate()

    return (
        // Changed: min-h-full w-screen -> min-h-screen w-full justify-center
        <div className='p-4 flex flex-col items-center justify-center min-h-screen w-full gap-8 text-center'>
            <div className='flex flex-col gap-2 max-w-2xl'>
                <Typography type='h1'>ACCESSIMEET</Typography>
                <Typography type='h4' className='font-thin'>
                    Real-time conversation between ASL and spoken language, right in the browser.
                </Typography>
            </div>

            <div className='flex flex-col md:flex-row gap-4 w-full max-w-3xl'>
                <Card className='flex-1'>
                    <Card.Header>
                        <Typography type='h4'>Sign → Text</Typography>
                    </Card.Header>
                    <Card.Content>
                        <Typography type='body' className='font-thin'>
                            Deaf and hard-of-hearing users sign into their camera; it's converted to text live.
                        </Typography>
                    </Card.Content>
                </Card>

                <Card className='flex-1'>
                    <Card.Header>
                        <Typography type='h4'>Speech → Sign</Typography>
                    </Card.Header>
                    <Card.Content>
                        <Typography type='body' className='font-thin'>
                            Hearing users speak normally; it's converted to speech-to-text for the other side, no interpreter needed.
                        </Typography>
                    </Card.Content>
                </Card>
            </div>

            <Button onPress={() => navigate({ to: '/auth' })}>Get Started</Button>
        </div>
    )
}