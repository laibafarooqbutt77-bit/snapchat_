import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Phone,
  Volume2,
  VolumeX,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BitmojiAvatar } from '../avatar/BitmojiAvatar';

export const ActiveCallOverlay: React.FC = () => {
  const { activeCall, state, acceptCall, declineOrEndCall, showToast } = useApp();
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [hasLocalStream, setHasLocalStream] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const participant = activeCall ? state.users[activeCall.participantId] : null;

  // Timer when connected
  useEffect(() => {
    if (!activeCall || activeCall.status !== 'connected') {
      setElapsedSec(0);
      return;
    }
    const timer = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCall]);

  // Auto-answer simulation after 2.5s for outgoing demo calls
  useEffect(() => {
    if (!activeCall || activeCall.direction !== 'outgoing' || activeCall.status !== 'ringing') {
      return;
    }
    const timer = setTimeout(() => {
      acceptCall();
    }, 2200);
    return () => clearTimeout(timer);
  }, [activeCall, acceptCall]);

  // Initialize local media & WebRTC peer architecture when call is active
  useEffect(() => {
    if (!activeCall) return;
    let active = true;

    const startMedia = async () => {
      try {
        if (typeof RTCPeerConnection !== 'undefined') {
          pcRef.current = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
          });
        }
        if (navigator.mediaDevices?.getUserMedia) {
          let stream: MediaStream;
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: activeCall.mode === 'video' ? { facingMode: { ideal: facingMode } } : false,
            });
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: activeCall.mode === 'video',
            });
          }
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          setHasLocalStream(true);
          if (pcRef.current) {
            stream.getTracks().forEach((t) => pcRef.current?.addTrack(t, stream));
          }
          if (localVideoRef.current && activeCall.mode === 'video') {
            localVideoRef.current.muted = true;
            localVideoRef.current.playsInline = true;
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(() => {});
          }
        }
      } catch {
        setHasLocalStream(false);
      }
    };

    startMedia();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      pcRef.current?.close();
      pcRef.current = null;
      setHasLocalStream(false);
    };
  }, [activeCall?.id, activeCall?.mode, facingMode]);

  useEffect(() => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach((t) => (t.enabled = !muted));
  }, [muted]);

  useEffect(() => {
    if (!streamRef.current) return;
    streamRef.current.getVideoTracks().forEach((t) => (t.enabled = camEnabled));
  }, [camEnabled]);

  useEffect(() => {
    if (hasLocalStream && camEnabled && localVideoRef.current && streamRef.current) {
      localVideoRef.current.muted = true;
      localVideoRef.current.playsInline = true;
      if (localVideoRef.current.srcObject !== streamRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, [hasLocalStream, camEnabled]);

  if (!activeCall || !participant) return null;

  const formatDuration = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6 text-white">
      {/* Top Status */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[#FFFC00]">
            {activeCall.mode === 'video' ? 'Video Call' : 'Audio Call'} · Demo Signaling Mode
          </p>
          <p className="text-xs text-[#A1A1A1] mt-0.5">
            {activeCall.status === 'ringing'
              ? activeCall.direction === 'incoming'
                ? 'Incoming call...'
                : 'Ringing...'
              : `Connected · ${formatDuration(elapsedSec)}`}
          </p>
        </div>
        {activeCall.mode === 'video' && (
          <button
            onClick={() => {
              setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
              showToast('Switched camera');
            }}
            className="min-h-[44px] min-w-[44px] rounded-full bg-[#181818] border border-[#292929] flex items-center justify-center hover:border-[#FFFC00]"
            aria-label="Switch camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Stage */}
      <div className="relative flex-1 my-6 rounded-3xl bg-[#101010] border border-[#292929] overflow-hidden flex flex-col items-center justify-center p-6">
        <div className="relative">
          <div className="w-36 h-36 rounded-full border-4 border-[#FFFC00] overflow-hidden flex items-center justify-center bg-[#181818]">
            <BitmojiAvatar avatar={participant.avatar} size={140} />
          </div>
          {activeCall.status === 'ringing' && (
            <div className="absolute inset-0 rounded-full border-2 border-[#FFFC00]/50 animate-ping" />
          )}
        </div>
        <h2 className="text-2xl font-bold mt-5">{participant.displayName}</h2>
        <p className="text-sm text-[#A1A1A1] mt-1">
          @{participant.username} · {activeCall.status === 'connected' ? 'WebRTC Peer Ready (Local Preview)' : 'Waiting for connection'}
        </p>

        {/* Picture-in-Picture Local Video Preview */}
        {activeCall.mode === 'video' && (
          <div className="absolute bottom-4 right-4 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl bg-black border border-[#292929] overflow-hidden shadow-2xl flex items-center justify-center">
            {hasLocalStream && camEnabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
            ) : (
              <div className="text-center p-2">
                <VideoOff className="w-5 h-5 mx-auto text-[#A1A1A1] mb-1" />
                <span className="text-[11px] text-[#A1A1A1]">
                  {camEnabled ? 'Camera off / No device' : 'Camera paused'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 pb-4">
        {activeCall.status === 'ringing' && activeCall.direction === 'incoming' ? (
          <>
            <button
              onClick={declineOrEndCall}
              className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:brightness-110 transition"
              aria-label="Decline call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:brightness-110 transition"
              aria-label="Accept call"
            >
              <Phone className="w-7 h-7" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setMuted((m) => !m)}
              className={`w-13 h-13 rounded-full flex items-center justify-center border transition ${
                muted
                  ? 'bg-white text-black border-white'
                  : 'bg-[#181818] text-white border-[#292929]'
              }`}
              aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {activeCall.mode === 'video' && (
              <button
                onClick={() => setCamEnabled((c) => !c)}
                className={`w-13 h-13 rounded-full flex items-center justify-center border transition ${
                  !camEnabled
                    ? 'bg-white text-black border-white'
                    : 'bg-[#181818] text-white border-[#292929]'
                }`}
                aria-label={camEnabled ? 'Turn camera off' : 'Turn camera on'}
              >
                {camEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            )}

            <button
              onClick={() => setSpeaker((s) => !s)}
              className={`w-13 h-13 rounded-full flex items-center justify-center border transition ${
                speaker
                  ? 'bg-[#181818] text-[#FFFC00] border-[#292929]'
                  : 'bg-[#181818] text-[#A1A1A1] border-[#292929]'
              }`}
              aria-label="Toggle speaker"
            >
              {speaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={declineOrEndCall}
              className="w-16 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:brightness-110 transition"
              aria-label="End call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
