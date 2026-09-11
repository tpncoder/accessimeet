import { useEffect, useState, useRef, useCallback } from "react";
import Peer, { type MediaConnection, type DataConnection } from "peerjs";

export function usePeer(peerId?: string) {
  const [localId, setLocalId] = useState<string>('');
  const [peer, setPeer] = useState<Peer | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const dataConnRef = useRef<DataConnection | null>(null);
  const peerRef = useRef<Peer | null>(null);
  
  const [incomingCaption, setIncomingCaption] = useState<{
    text: string;
    type: 'asl' | 'speech';
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    const peerInstance = peerId ? new Peer(peerId) : new Peer();
    peerRef.current = peerInstance;
    
    peerInstance.on('open', (id: string) => {
      console.log('[PeerJS] Peer opened with ID:', id);
      setLocalId(id);
    });

    peerInstance.on('error', (err) => {
      console.error('[PeerJS] Error:', err);
    });

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);

        // Handle incoming calls
        peerInstance.on('call', (call: MediaConnection) => {
          console.log('[PeerJS] Incoming call, answering...');
          call.answer(stream);
          call.on('stream', (incomingStream) => {
            console.log('[PeerJS] Received remote stream');
            setRemoteStream(incomingStream);
            setIsConnected(true);
          });
        });

        // Handle incoming data connections
        peerInstance.on('connection', (conn: DataConnection) => {
          console.log('[PeerJS] Incoming data connection');
          setupDataConnection(conn);
        });
      } catch (error) {
        console.error("Failed to acquire user media:", error);
      }
    };

    const setupDataConnection = (conn: DataConnection) => {
      dataConnRef.current = conn;
      
      conn.on('open', () => {
        console.log('[PeerJS] Data connection opened');
      });
      
      conn.on('data', (data: any) => {
        console.log('[PeerJS] Received caption data:', data);
        setIncomingCaption({
          text: data.text,
          type: data.type || 'speech',
          timestamp: Date.now()
        });
      });
      
      conn.on('error', (err) => {
        console.error('[PeerJS] Data connection error:', err);
      });
    };

    initMedia();
    setPeer(peerInstance);

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      dataConnRef.current?.close();
      peerInstance.destroy();
    };
  }, [peerId]);

  const call = useCallback((remoteId: string) => {
    if (!peerRef.current || !localStreamRef.current) {
      console.error('[PeerJS] Cannot call: peer or stream not ready');
      return;
    }
    
    console.log('[PeerJS] Calling remote peer:', remoteId);
    
    // Initiate media call
    const outgoingCall = peerRef.current.call(remoteId, localStreamRef.current);
    outgoingCall.on('stream', (incomingStream) => {
      console.log('[PeerJS] Received remote stream from outgoing call');
      setRemoteStream(incomingStream);
      setIsConnected(true);
    });
    outgoingCall.on('error', (err) => {
      console.error('[PeerJS] Call error:', err);
    });

    // Initiate data connection AFTER media is established
    setTimeout(() => {
      if (!peerRef.current) return;
      
      console.log('[PeerJS] Initiating data connection to:', remoteId);
      const conn = peerRef.current.connect(remoteId, {
        reliable: true,
        serialization: 'json'
      });
      
      conn.on('open', () => {
        console.log('[PeerJS] Data connection established successfully');
        dataConnRef.current = conn;
      });
      
      conn.on('data', (data: any) => {
        console.log('[PeerJS] Received caption data:', data);
        setIncomingCaption({
          text: data.text,
          type: data.type || 'speech',
          timestamp: Date.now()
        });
      });
      
      conn.on('error', (err) => {
        console.error('[PeerJS] Data connection error:', err);
      });
    }, 2000);
  }, []);

  const sendCaptionData = useCallback((text: string, type: 'asl' | 'speech') => {
    if (dataConnRef.current?.open) {
      console.log('[PeerJS] Sending caption:', { text, type });
      dataConnRef.current.send({ text, type, timestamp: Date.now() });
    } else {
      console.warn('[PeerJS] Cannot send - data channel not open');
    }
  }, []);

  return { 
    localId, 
    peer, 
    call, 
    localStream, 
    remoteStream,
    isConnected,
    sendCaptionData, 
    incomingCaption 
  };
}