import React from 'react'

export interface TranscriptEntry {
  timestamp: number
  speaker: 'local' | 'remote'
  type: 'asl' | 'speech'
  text: string
  formattedTime: string
}

interface TranscriptPanelProps {
  transcript: TranscriptEntry[]
  showPanel: boolean
  onToggle: () => void
  onExport: () => void
}

export function TranscriptPanel({ transcript, showPanel, onToggle, onExport }: TranscriptPanelProps) {
  return (
    <>
      {/* Controls */}
      <div className="mt-4 flex gap-3 flex-wrap justify-center">
        <button
          onClick={onToggle}
          className="
            bg-[#FFE66D] border-4 border-black px-4 py-2 font-bold 
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
            hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5
            active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5
            transition-all flex items-center gap-2
          "
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {showPanel ? 'Hide Transcript' : 'Show Transcript'} ({transcript.length})
        </button>

        <button
          onClick={onExport}
          disabled={transcript.length === 0}
          className="
            bg-[#4ECDC4] border-4 border-black px-4 py-2 font-bold 
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
            hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5
            active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5
            transition-all flex items-center gap-2
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export TXT
        </button>
      </div>

      {/* Panel */}
      {showPanel && (
        <div className="mt-4 w-full max-w-2xl bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-sm overflow-hidden">
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
                  className={`p-2 border-2 border-black rounded-sm ${
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
      )}
    </>
  )
}