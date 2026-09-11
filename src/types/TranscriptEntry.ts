export interface TranscriptEntry {
  timestamp: number
  speaker: 'local' | 'remote'
  type: 'asl' | 'speech'
  text: string
  formattedTime: string
}