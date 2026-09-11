import { useState } from 'react'
import { Button } from '@heroui/react'

interface RoomHeaderProps {
  roomId: string
  isHost?: boolean
  userMode: 'deaf' | 'hearing'
  setUserMode: React.Dispatch<React.SetStateAction<'deaf' | 'hearing'>>
  isConnected: boolean
}

export function RoomHeader({ roomId, isHost, userMode, setUserMode, isConnected }: RoomHeaderProps) {
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full brutal-card p-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl uppercase tracking-wider">Room:</span>
            <span className="brutal-badge">{roomId}</span>
          </div>
          <p className="text-xs font-bold uppercase mt-1 text-gray-700">
            Role: <span className="underline">{isHost ? 'Host' : 'Invitee'}</span> | Mode:{' '}
            <span className="bg-yellow-200 px-1 border border-black uppercase font-extrabold">
              {userMode}
            </span>{' '}
            | Status:{' '}
            <span className={isConnected ? 'text-green-600 font-extrabold' : 'text-amber-600 font-extrabold'}>
              {isConnected ? 'CONNECTED' : isHost ? 'WAITING FOR PEER...' : 'CONNECTING...'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onPress={() => setUserMode(userMode === 'deaf' ? 'hearing' : 'deaf')}
            className="brutal-btn-primary"
          >
            Mode: {userMode === 'deaf' ? 'ASL (Deaf)' : 'Speech (Hearing)'}
          </Button>

          <Button
            onPress={() => setIsShareOpen(!isShareOpen)}
            className="brutal-btn-danger"
          >
            {isShareOpen ? '▲ Hide Share' : '▼ Invite Options'}
          </Button>
        </div>
      </div>

      {isShareOpen && (
        <div className="mt-4 pt-4 border-t-2 flex flex-col sm:flex-row items-center justify-between gap-4 bg-yellow-100 p-3 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold text-black">
            Share code with your peer: <code className="bg-white border border-black px-1.5 py-0.5 font-mono">{roomId}</code>
          </p>
          <Button onPress={handleCopy} className="brutal-btn-primary">
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>
        </div>
      )}
    </div>
  )
}