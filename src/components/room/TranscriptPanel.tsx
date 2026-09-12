import { type TranscriptEntry } from '#/types/TranscriptEntry'

interface TranscriptPanelProps {
  transcript: TranscriptEntry[]
  showPanel: boolean
}

export function TranscriptPanel({ transcript, showPanel }: TranscriptPanelProps) {
  if (!showPanel) return null

  return (
    <div className="mt-4 w-full max-w-2xl bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]  overflow-hidden">
      <div className="bg-black text-white px-4 py-2 flex items-center justify-between">
        <span className="font-bold text-xs uppercase tracking-wider">Meeting Transcript</span>
        <span className="text-xs font-mono opacity-75">{transcript.length} entries</span>
      </div>
      
      <div className="p-4 max-h-96 overflow-y-auto space-y-3">
        {transcript.length === 0 ? (
          <p className="text-gray-500 text-center py-4 text-sm">No transcript entries yet</p>
        ) : (
          transcript.map((entry, idx) => (
            <div 
              key={idx} 
              className={`p-2 border-2 border-black ${
                entry.speaker === 'local' ? 'bg-[#FFE66D]' : 'bg-[#4ECDC4]'
              }`}
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-mono text-xs font-bold">[{entry.formattedTime}]</span>
                <span className="font-bold text-sm">{entry.speaker === 'local' ? 'You' : 'Remote'}</span>
                <span className="text-xs uppercase opacity-75">({entry.type})</span>
              </div>
              <p className="text-sm font-medium">{entry.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}