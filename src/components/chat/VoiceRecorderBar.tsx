import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Pause, Play, Trash2, Send } from 'lucide-react';
import { saveMediaBlob } from '../../utils/idb';
import { useApp } from '../../context/AppContext';

interface VoiceRecorderBarProps {
  onSendVoice: (mediaId: string, durationSec: number) => void;
  onCancel: () => void;
}

export const VoiceRecorderBar: React.FC<VoiceRecorderBarProps> = ({
  onSendVoice,
  onCancel,
}) => {
  const { showToast } = useApp();
  const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'preview'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(Array(16).fill(20));

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (status !== 'recording') return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== 'recording') return;
    let raf = 0;
    const tick = () => {
      if (analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const sampled = Array.from({ length: 16 }, (_, i) => {
          const v = data[Math.min(data.length - 1, i * 2)] || 20;
          return Math.max(18, Math.min(100, Math.round((v / 255) * 100)));
        });
        setLevels(sampled);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  const cleanupStreams = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  };

  useEffect(() => {
    return () => {
      cleanupStreams();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      showToast('Microphone recording unsupported in this browser.', 'error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        src.connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      } catch {
        // Optional audio visualizer
      }

      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setStatus('preview');
        cleanupStreams();
      };
      rec.start(150);
      recorderRef.current = rec;
      setSeconds(0);
      setStatus('recording');
    } catch {
      showToast('Microphone access denied.', 'error');
    }
  };

  const pauseRecording = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause();
      setStatus('paused');
    }
  };

  const resumeRecording = () => {
    if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume();
      setStatus('recording');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  const handleSend = async () => {
    if (!recordedBlob) return;
    const id = `voice_${Date.now()}`;
    await saveMediaBlob(id, recordedBlob);
    onSendVoice(id, Math.max(1, seconds));
  };

  return (
    <div className="p-3 bg-[#181818] border border-[#292929] rounded-2xl flex items-center justify-between gap-3">
      {status === 'idle' && (
        <>
          <div className="flex items-center gap-2.5">
            <button
              onClick={startRecording}
              className="h-10 px-4 rounded-xl bg-[#FFFC00] text-black text-xs font-bold flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Start Recording
            </button>
            <span className="text-xs text-[#A1A1A1]">Tap to enable microphone</span>
          </div>
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-[#A1A1A1] hover:text-white px-2"
          >
            Cancel
          </button>
        </>
      )}

      {(status === 'recording' || status === 'paused') && (
        <>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-[#FFFC00]'
              }`}
            />
            <span className="text-xs font-mono font-bold tabular-nums text-white w-10">
              0:{String(seconds).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-1 flex-1 h-7">
              {levels.map((lv, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full bg-[#FFFC00] transition-all"
                  style={{ height: `${lv}%` }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {status === 'recording' ? (
              <button
                onClick={pauseRecording}
                className="w-9 h-9 rounded-full bg-[#101010] border border-[#292929] flex items-center justify-center text-white"
                aria-label="Pause recording"
              >
                <Pause className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={resumeRecording}
                className="w-9 h-9 rounded-full bg-[#101010] border border-[#292929] flex items-center justify-center text-[#FFFC00]"
                aria-label="Resume recording"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={stopRecording}
              className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center"
              aria-label="Stop recording"
            >
              <Square className="w-4 h-4 fill-white" />
            </button>
          </div>
        </>
      )}

      {status === 'preview' && previewUrl && (
        <>
          <audio src={previewUrl} controls className="h-9 flex-1 max-w-[230px]" />
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setRecordedBlob(null);
                setPreviewUrl(null);
                setStatus('idle');
                onCancel();
              }}
              className="w-9 h-9 rounded-full bg-[#101010] border border-[#292929] flex items-center justify-center text-red-400"
              aria-label="Delete recording"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSend}
              className="h-9 px-3.5 rounded-full bg-[#FFFC00] text-black text-xs font-bold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
};
