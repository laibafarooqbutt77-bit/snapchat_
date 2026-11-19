import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Grid,
  Timer,
  Image as ImageIcon,
  Sparkles,
  Star,
  Search,
  X,
  Send,
  Download,
  Type,
  PenTool,
  Smile,
  Check,
  RotateCcw,
  PlusCircle,
  Video,
  Square,
  Sliders,
  Scissors,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  FILTER_PRESETS,
  FaceBox,
  applyCanvasPostEffect,
  drawLensOverlay,
} from '../data/filters';
import { saveMediaBlob } from '../utils/idb';
import { BitmojiAvatar } from '../components/avatar/BitmojiAvatar';

type CaptureMedia = {
  type: 'photo' | 'video';
  blob: Blob;
  url: string;
  duration?: number;
};

type SnapSticker = {
  id: string;
  text: string;
  x: number;
  y: number;
};

const DRAW_COLORS = ['#FFFC00', '#FFFFFF', '#EF4444', '#38BDF8', '#22C55E', '#A855F7', '#000000'];
const QUICK_STICKERS = ['🔥', '⚡', '✨', '😍', '😂', '💀', '🌴', '🎉', '💯', '🫶', '🕶️', '🚀'];

export const CameraPage: React.FC = () => {
  const {
    state,
    currentUser,
    showToast,
    setSearchOpen,
    sendSnapToFriends,
    addStory,
    toggleFavoriteFilter,
    recordRecentFilter,
  } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Camera hardware state (never auto-starts without user gesture)
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flashOn, setFlashOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [gridOn, setGridOn] = useState(state.settings.cameraGrid);
  const [timerSec, setTimerSec] = useState<0 | 3 | 5 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [screenFlash, setScreenFlash] = useState(false);

  // Recording state
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);

  // Filters & Lenses
  const initialFilter = searchParams.get('filter') || 'natural';
  const [activeFilterId, setActiveFilterId] = useState(initialFilter);
  const [filterIntensity, setFilterIntensity] = useState(0.9);
  const [filterCat, setFilterCat] = useState<'all' | 'basic' | 'advanced' | 'lens' | 'favorites'>('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Post-capture Editor state
  const [captured, setCaptured] = useState<CaptureMedia | null>(null);
  const [editorTool, setEditorTool] = useState<'none' | 'text' | 'draw' | 'stickers'>('none');
  const [captionText, setCaptionText] = useState('');
  const [captionColor, setCaptionColor] = useState('#FFFFFF');
  const [captionY, setCaptionY] = useState(50);
  const [drawColor, setDrawColor] = useState('#FFFC00');
  const [drawWidth, setDrawWidth] = useState(6);
  const [stickers, setStickers] = useState<SnapSticker[]>([]);
  const [snapDuration, setSnapDuration] = useState(state.settings.defaultSnapTimer || 5);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isDrawingRef = useRef(false);
  const detectedFaceRef = useRef<FaceBox | null>(null);

  const activeFilter = useMemo(
    () => FILTER_PRESETS.find((f) => f.id === activeFilterId) || FILTER_PRESETS[0],
    [activeFilterId]
  );

  const filteredPresets = useMemo(() => {
    const q = filterSearch.trim().toLowerCase();
    return FILTER_PRESETS.filter((f) => {
      if (filterCat === 'favorites' && !state.favoriteFilterIds.includes(f.id)) return false;
      if (filterCat !== 'all' && filterCat !== 'favorites' && f.category !== filterCat) return false;
      if (q && !f.name.toLowerCase().includes(q) && !f.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [filterCat, filterSearch, state.favoriteFilterIds]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera API unavailable in this browser. Use Studio Mode or Gallery Upload.');
      return;
    }
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: captureMode === 'video',
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setCameraError('Camera permission denied or no webcam found. Studio Preview & Upload remain active.');
      setCameraActive(false);
    }
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Optional FaceDetector API polling when camera is active + lens chosen
  useEffect(() => {
    if (!cameraActive || !activeFilter.lensType) {
      detectedFaceRef.current = null;
      return;
    }
    const WinWithFace = window as unknown as {
      FaceDetector?: new (opts?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
        detect: (source: CanvasImageSource) => Promise<{ boundingBox: DOMRectReadOnly }[]>;
      };
    };
    if (!WinWithFace.FaceDetector) return;
    const detector = new WinWithFace.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
    let alive = true;
    const timer = setInterval(async () => {
      if (!alive || !videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const faces = await detector.detect(videoRef.current);
        if (faces[0] && previewCanvasRef.current && videoRef.current.videoWidth) {
          const sx = previewCanvasRef.current.width / videoRef.current.videoWidth;
          const sy = previewCanvasRef.current.height / videoRef.current.videoHeight;
          const b = faces[0].boundingBox;
          detectedFaceRef.current = {
            x: b.x * sx,
            y: b.y * sy,
            width: b.width * sx,
            height: b.height * sy,
          };
        }
      } catch {
        // Fallback to center face anchor
      }
    }, 180);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [cameraActive, activeFilter.lensType]);

  // Real-time Canvas Render Loop (handles live camera OR interactive Studio Preview + Filters + Lenses)
  useEffect(() => {
    if (captured) return;
    let rafId = 0;

    const render = (timeMs: number) => {
      const canvas = previewCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          ctx.save();
          if (activeFilter.cssFilter && activeFilter.cssFilter !== 'none') {
            ctx.filter = activeFilter.cssFilter;
          }

          const vid = videoRef.current;
          if (cameraActive && vid && vid.readyState >= 2) {
            const vw = vid.videoWidth || w;
            const vh = vid.videoHeight || h;
            const scale = Math.max(w / vw, h / vh) * zoom;
            const dw = vw * scale;
            const dh = vh * scale;
            const dx = (w - dw) / 2;
            const dy = (h - dh) / 2;

            ctx.save();
            if (facingMode === 'user' && state.settings.mirrorFrontCam) {
              ctx.translate(w, 0);
              ctx.scale(-1, 1);
            }
            ctx.drawImage(vid, dx, dy, dw, dh);
            ctx.restore();
          } else {
            // Interactive Studio Preview Canvas (shows live filters & lenses clearly before camera permission)
            const grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, '#141414');
            grad.addColorStop(0.5, '#1F1F23');
            grad.addColorStop(1, '#09090B');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // Ambient lighting bokeh circles
            const t = timeMs * 0.001;
            ctx.fillStyle = 'rgba(255, 252, 0, 0.08)';
            ctx.beginPath();
            ctx.arc(w * 0.25 + Math.sin(t) * 20, h * 0.28 + Math.cos(t) * 14, 90, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
            ctx.beginPath();
            ctx.arc(w * 0.75 + Math.cos(t * 0.8) * 18, h * 0.65, 110, 0, Math.PI * 2);
            ctx.fill();

            // Portrait silhouette guide so lenses align visually
            ctx.fillStyle = '#27272A';
            ctx.beginPath();
            ctx.ellipse(w / 2, h * 0.43, w * 0.21, h * 0.16, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(w / 2, h * 0.72, w * 0.34, h * 0.2, 0, Math.PI, 0);
            ctx.fill();
          }
          ctx.restore();

          // Apply Advanced Canvas Post-Effects
          applyCanvasPostEffect(ctx, w, h, activeFilter.canvasMode, timeMs, filterIntensity);

          // Apply Face Lens Overlay
          if (activeFilter.lensType) {
            const faceBox: FaceBox = detectedFaceRef.current || {
              x: w * 0.28,
              y: h * 0.27,
              width: w * 0.44,
              height: h * 0.32,
            };
            drawLensOverlay(ctx, activeFilter.lensType, faceBox, timeMs, filterIntensity);
          }
        }
      }
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [
    captured,
    cameraActive,
    facingMode,
    zoom,
    activeFilter,
    filterIntensity,
    state.settings.mirrorFrontCam,
  ]);

  // Recording timer
  useEffect(() => {
    if (!isRecording) {
      setRecordSec(0);
      return;
    }
    const timer = setInterval(() => {
      setRecordSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  const selectFilter = (id: string) => {
    setActiveFilterId(id);
    recordRecentFilter(id);
  };

  const capturePhotoNow = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    if (flashOn && facingMode === 'user') {
      setScreenFlash(true);
      setTimeout(() => setScreenFlash(false), 220);
    }
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setCaptured({ type: 'photo', blob, url });
        setCaptionText('');
        setStickers([]);
        setEditorTool('none');
      },
      'image/jpeg',
      0.92
    );
  };

  const toggleVideoRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const canvas = previewCanvasRef.current;
    if (!canvas || typeof MediaRecorder === 'undefined') {
      showToast('Video recording unsupported in this browser', 'error');
      return;
    }
    try {
      const canvasStream = canvas.captureStream(30);
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach((t) => canvasStream.addTrack(t));
      }
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(canvasStream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setCaptured({ type: 'video', blob, url, duration: Math.max(1, recordSec) });
      };
      recorder.start(200);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      showToast('Unable to start video recording', 'error');
    }
  };

  const handleShutterPress = () => {
    if (captureMode === 'video') {
      toggleVideoRecording();
      return;
    }
    if (timerSec === 0) {
      capturePhotoNow();
      return;
    }
    let rem = timerSec;
    setCountdown(rem);
    const interval = setInterval(() => {
      rem -= 1;
      if (rem <= 0) {
        clearInterval(interval);
        setCountdown(null);
        capturePhotoNow();
      } else {
        setCountdown(rem);
      }
    }, 1000);
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      showToast('Unsupported file type. Choose an image or video.', 'error');
      return;
    }
    const url = URL.createObjectURL(file);
    setCaptured({
      type: isVideo ? 'video' : 'photo',
      blob: file,
      url,
    });
    e.target.value = '';
  };

  // Freehand Drawing on Snap Editor
  const handleDrawPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (editorTool !== 'draw') return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleDrawPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || editorTool !== 'draw') return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleDrawPointerUp = () => {
    isDrawingRef.current = false;
  };

  const clearDrawing = () => {
    const canvas = drawCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Composite final photo with drawings + caption + stickers
  const buildCompositeBlob = async (): Promise<Blob> => {
    if (!captured) throw new Error('No media');
    if (captured.type === 'video') return captured.blob;

    const out = document.createElement('canvas');
    out.width = 720;
    out.height = 1280;
    const ctx = out.getContext('2d')!;

    const img = new Image();
    img.src = captured.url;
    await new Promise((res) => {
      img.onload = res;
      img.onerror = res;
    });

    ctx.save();
    if (activeFilter.cssFilter && activeFilter.cssFilter !== 'none') {
      ctx.filter = activeFilter.cssFilter;
    }
    ctx.drawImage(img, 0, 0, out.width, out.height);
    ctx.restore();

    if (drawCanvasRef.current) {
      ctx.drawImage(drawCanvasRef.current, 0, 0, out.width, out.height);
    }

    stickers.forEach((st) => {
      ctx.font = '64px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(st.text, (st.x / 100) * out.width, (st.y / 100) * out.height);
    });

    if (captionText.trim()) {
      const cy = (captionY / 100) * out.height;
      ctx.fillStyle = 'rgba(0,0,0,0.68)';
      ctx.fillRect(0, cy - 34, out.width, 68);
      ctx.fillStyle = captionColor;
      ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(captionText.trim(), out.width / 2, cy);
    }

    return new Promise((resolve) => {
      out.toBlob((b) => resolve(b || captured.blob), 'image/jpeg', 0.92);
    });
  };

  const handleSaveToDevice = async () => {
    if (!captured) return;
    const finalBlob = await buildCompositeBlob();
    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumo-snap-${Date.now()}.${captured.type === 'video' ? 'webm' : 'jpg'}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Saved to device!', 'yellow');
  };

  const handlePostToStory = async () => {
    if (!captured) return;
    const finalBlob = await buildCompositeBlob();
    const mediaId = `media_story_${Date.now()}`;
    await saveMediaBlob(mediaId, finalBlob);
    addStory({
      mediaType: captured.type,
      mediaId,
      filterId: activeFilter.id,
      caption: captionText.trim() || undefined,
      privacy: state.settings.whoCanViewStory === 'everyone' ? 'everyone' : 'friends',
    });
    setCaptured(null);
    navigate('/stories');
  };

  const handleConfirmSendSnap = async () => {
    if (!captured || selectedFriends.length === 0) return;
    const finalBlob = await buildCompositeBlob();
    const mediaId = `media_snap_${Date.now()}`;
    await saveMediaBlob(mediaId, finalBlob);
    sendSnapToFriends(selectedFriends, {
      mediaType: captured.type,
      mediaId,
      caption: captionText.trim() || undefined,
      filterName: activeFilter.name,
      duration: snapDuration,
    });
    setShowSendModal(false);
    setSelectedFriends([]);
    setCaptured(null);
    navigate('/chat');
  };

  const friendsList = Object.values(state.friends)
    .filter((f) => f.status === 'friend' && !state.blockedUserIds.includes(f.userId))
    .map((f) => state.users[f.userId])
    .filter(Boolean);

  // POST-CAPTURE SNAP EDITOR VIEW
  if (captured) {
    return (
      <div className="relative h-full w-full bg-black flex flex-col items-center justify-center overflow-hidden select-none">
        <div className="relative w-full h-full max-w-md mx-auto bg-black overflow-hidden lg:my-3 lg:rounded-3xl lg:border lg:border-[#292929]">
          {captured.type === 'photo' ? (
            <img
              src={captured.url}
              alt="Captured snap"
              className="w-full h-full object-cover"
              style={{ filter: activeFilter.cssFilter }}
            />
          ) : (
            <video
              src={captured.url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}

          {/* Freehand Drawing Overlay */}
          <canvas
            ref={drawCanvasRef}
            width={720}
            height={1280}
            onPointerDown={handleDrawPointerDown}
            onPointerMove={handleDrawPointerMove}
            onPointerUp={handleDrawPointerUp}
            onPointerLeave={handleDrawPointerUp}
            className={`absolute inset-0 w-full h-full ${
              editorTool === 'draw' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
            }`}
          />

          {/* Stickers */}
          {stickers.map((st) => (
            <button
              key={st.id}
              onClick={() => setStickers((prev) => prev.filter((s) => s.id !== st.id))}
              title="Tap to remove sticker"
              className="absolute text-4xl -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition"
              style={{ left: `${st.x}%`, top: `${st.y}%` }}
            >
              {st.text}
            </button>
          ))}

          {/* Caption Bar */}
          {captionText && (
            <div
              className="absolute left-0 right-0 px-4 py-2.5 bg-black/70 text-center font-bold text-lg -translate-y-1/2 pointer-events-none"
              style={{ top: `${captionY}%`, color: captionColor }}
            >
              {captionText}
            </div>
          )}

          {/* Top Controls */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
            <button
              onClick={() => setCaptured(null)}
              className="min-w-[44px] min-h-[44px] rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/15"
              aria-label="Retake snap"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditorTool(editorTool === 'text' ? 'none' : 'text')}
                className={`min-w-[44px] min-h-[44px] rounded-full backdrop-blur-md flex items-center justify-center border ${
                  editorTool === 'text'
                    ? 'bg-[#FFFC00] text-black border-[#FFFC00]'
                    : 'bg-black/60 text-white border-white/15'
                }`}
                aria-label="Add text"
              >
                <Type className="w-5 h-5" />
              </button>
              <button
                onClick={() => setEditorTool(editorTool === 'draw' ? 'none' : 'draw')}
                className={`min-w-[44px] min-h-[44px] rounded-full backdrop-blur-md flex items-center justify-center border ${
                  editorTool === 'draw'
                    ? 'bg-[#FFFC00] text-black border-[#FFFC00]'
                    : 'bg-black/60 text-white border-white/15'
                }`}
                aria-label="Draw"
              >
                <PenTool className="w-5 h-5" />
              </button>
              <button
                onClick={() => setEditorTool(editorTool === 'stickers' ? 'none' : 'stickers')}
                className={`min-w-[44px] min-h-[44px] rounded-full backdrop-blur-md flex items-center justify-center border ${
                  editorTool === 'stickers'
                    ? 'bg-[#FFFC00] text-black border-[#FFFC00]'
                    : 'bg-black/60 text-white border-white/15'
                }`}
                aria-label="Stickers"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Editor Tool Drawer */}
          {editorTool === 'text' && (
            <div className="absolute top-16 left-3 right-3 z-20 p-3 rounded-2xl bg-black/85 backdrop-blur-md border border-[#292929] space-y-2.5">
              <input
                type="text"
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder="Type your snap caption..."
                className="w-full h-10 px-3 rounded-xl bg-[#181818] border border-[#292929] text-sm text-white focus:outline-none focus:border-[#FFFC00]"
                autoFocus
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {DRAW_COLORS.slice(0, 6).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCaptionColor(c)}
                      className={`w-6 h-6 rounded-full border ${
                        captionColor === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input
                  type="range"
                  min={20}
                  max={80}
                  value={captionY}
                  onChange={(e) => setCaptionY(Number(e.target.value))}
                  className="w-24 accent-[#FFFC00]"
                  aria-label="Caption vertical position"
                />
              </div>
            </div>
          )}

          {editorTool === 'draw' && (
            <div className="absolute top-16 left-3 right-3 z-20 p-3 rounded-2xl bg-black/85 backdrop-blur-md border border-[#292929] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {DRAW_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setDrawColor(c)}
                    className={`w-6 h-6 rounded-full border ${
                      drawColor === c ? 'border-white scale-110' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <input
                type="range"
                min={2}
                max={16}
                value={drawWidth}
                onChange={(e) => setDrawWidth(Number(e.target.value))}
                className="w-16 accent-[#FFFC00]"
              />
              <button
                onClick={clearDrawing}
                className="px-2.5 py-1 rounded-lg bg-[#181818] text-xs font-semibold text-white"
              >
                Clear
              </button>
            </div>
          )}

          {editorTool === 'stickers' && (
            <div className="absolute top-16 left-3 right-3 z-20 p-3 rounded-2xl bg-black/85 backdrop-blur-md border border-[#292929] space-y-2">
              <div className="flex flex-wrap gap-2">
                {QUICK_STICKERS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setStickers((prev) => [
                        ...prev,
                        {
                          id: `stk_${Date.now()}_${Math.random()}`,
                          text: emoji,
                          x: 25 + Math.random() * 50,
                          y: 30 + Math.random() * 40,
                        },
                      ]);
                    }}
                    className="w-10 h-10 rounded-xl bg-[#181818] text-xl flex items-center justify-center hover:scale-110 transition"
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  onClick={() => {
                    const timeStr = new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    setCaptionText((prev) => (prev ? `${prev} · ${timeStr}` : timeStr));
                    setEditorTool('none');
                  }}
                  className="px-3 h-10 rounded-xl bg-[#181818] text-xs font-bold text-[#FFFC00] flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Timestamp
                </button>
              </div>
            </div>
          )}

          {/* Video Trimmer UI when video */}
          {captured.type === 'video' && (
            <div className="absolute bottom-20 left-3 right-3 z-20 p-3 rounded-2xl bg-black/80 backdrop-blur-md border border-[#292929]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#A1A1A1] mb-1.5">
                <span className="flex items-center gap-1 text-white">
                  <Scissors className="w-3.5 h-3.5 text-[#FFFC00]" />
                  Trim Clip
                </span>
                <span className="tabular-nums">
                  {trimStart}% – {trimEnd}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={trimEnd - 10}
                  value={trimStart}
                  onChange={(e) => setTrimStart(Number(e.target.value))}
                  className="flex-1 accent-[#FFFC00]"
                />
                <input
                  type="range"
                  min={trimStart + 10}
                  max={100}
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(Number(e.target.value))}
                  className="flex-1 accent-[#FFFC00]"
                />
              </div>
            </div>
          )}

          {/* Bottom Editor Actions */}
          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToDevice}
                className="min-h-[44px] px-3 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => setSnapDuration((d) => (d >= 10 ? 1 : d + 1))}
                className="min-h-[44px] px-3 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-xs font-bold text-[#FFFC00] tabular-nums flex items-center gap-1"
              >
                <Timer className="w-3.5 h-3.5" />
                {snapDuration}s
              </button>
              <button
                onClick={handlePostToStory}
                className="min-h-[44px] px-3 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-purple-400" />
                Story
              </button>
            </div>

            <button
              onClick={() => setShowSendModal(true)}
              className="h-11 px-5 rounded-full bg-[#FFFC00] text-black font-bold text-sm flex items-center gap-2 shadow-lg hover:brightness-95 transition"
            >
              Send To
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Send To Friends Modal */}
        {showSendModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#101010] border border-[#292929] rounded-3xl p-5 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Send Snap To...</h3>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="min-w-[36px] min-h-[36px] rounded-full bg-[#181818] flex items-center justify-center text-[#A1A1A1]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {friendsList.map((friend) => {
                  const selected = selectedFriends.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      onClick={() =>
                        setSelectedFriends((prev) =>
                          prev.includes(friend.id)
                            ? prev.filter((id) => id !== friend.id)
                            : [...prev, friend.id]
                        )
                      }
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition ${
                        selected
                          ? 'bg-[#181818] border-[#FFFC00]'
                          : 'bg-[#141414] border-[#292929]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <BitmojiAvatar avatar={friend.avatar} size={38} className="rounded-full" />
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">{friend.displayName}</p>
                          <p className="text-xs text-[#A1A1A1]">@{friend.username}</p>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                          selected
                            ? 'bg-[#FFFC00] border-[#FFFC00] text-black'
                            : 'border-[#52525B]'
                        }`}
                      >
                        {selected && <Check className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                disabled={selectedFriends.length === 0}
                onClick={handleConfirmSendSnap}
                className="w-full h-12 rounded-xl bg-[#FFFC00] text-black font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Snap ({selectedFriends.length})
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // LIVE CAMERA & FILTER STUDIO VIEW
  return (
    <div className="relative h-full w-full bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="relative w-full h-full max-w-[460px] lg:max-w-[520px] lg:h-[calc(100%-24px)] lg:rounded-3xl lg:border lg:border-[#292929] overflow-hidden bg-[#0A0A0A] shadow-2xl">
        {/* Hidden Video Element feeding Canvas */}
        <video ref={videoRef} playsInline muted className="hidden" />

        {/* Live Filtered Canvas */}
        <canvas
          ref={previewCanvasRef}
          width={540}
          height={960}
          className="w-full h-full object-cover"
        />

        {/* Grid Overlay */}
        {gridOn && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, idx) => (
              <div key={idx} className="border border-white/15" />
            ))}
          </div>
        )}

        {/* Screen Flash Burst */}
        {screenFlash && <div className="absolute inset-0 bg-white z-40 pointer-events-none" />}

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/35 pointer-events-none">
            <span className="text-8xl font-extrabold text-[#FFFC00] tabular-nums drop-shadow-lg">
              {countdown}
            </span>
          </div>
        )}

        {/* Top Floating Controls */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 overflow-hidden flex items-center justify-center"
              aria-label="Profile"
            >
              {currentUser ? (
                <BitmojiAvatar avatar={currentUser.avatar} size={40} />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            {cameraActive && (
              <div className="px-2.5 py-1 rounded-full bg-black/65 border border-[#FFFC00]/40 text-[11px] font-bold text-[#FFFC00] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {isRecording ? `REC ${recordSec}s` : 'LIVE CAM'}
              </div>
            )}
          </div>

          {/* Right Vertical Camera Toolbar */}
          <div className="flex flex-col items-center gap-2 bg-black/45 backdrop-blur-md border border-white/10 rounded-full p-1.5">
            <button
              onClick={() => {
                const next = facingMode === 'user' ? 'environment' : 'user';
                setFacingMode(next);
                if (cameraActive) startCamera(next);
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10"
              aria-label="Flip camera"
              title="Flip Camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFlashOn((f) => !f)}
              className={`w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 ${
                flashOn ? 'text-[#FFFC00]' : 'text-white'
              }`}
              aria-label="Toggle flash"
              title="Flash"
            >
              {flashOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setGridOn((g) => !g)}
              className={`w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 ${
                gridOn ? 'text-[#FFFC00]' : 'text-white'
              }`}
              aria-label="Toggle grid"
              title="Camera Grid"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setTimerSec((t) => (t === 0 ? 3 : t === 3 ? 5 : t === 5 ? 10 : 0))
              }
              className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold hover:bg-white/10 ${
                timerSec > 0 ? 'text-[#FFFC00]' : 'text-white'
              }`}
              aria-label="Countdown timer"
              title="Timer"
            >
              {timerSec > 0 ? `${timerSec}s` : <Timer className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowFilterDrawer((v) => !v)}
              className={`w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 ${
                showFilterDrawer ? 'text-[#FFFC00]' : 'text-white'
              }`}
              aria-label="Filter settings"
              title="All Filters & Intensity"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Camera Activation Prompt (Explicit User Gesture Required) */}
        {!cameraActive && (
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center pointer-events-auto">
            <div className="p-4 rounded-2xl bg-black/70 backdrop-blur-md border border-[#292929] max-w-xs space-y-3">
              <p className="text-xs font-semibold text-[#FFFC00]">Studio Preview Active</p>
              <p className="text-xs text-[#A1A1A1] leading-relaxed">
                {cameraError ||
                  'Activate your live camera to record snaps with 37 real-time filters & face lenses, or upload from gallery.'}
              </p>
              <button
                onClick={() => startCamera(facingMode)}
                className="w-full h-10 rounded-xl bg-[#FFFC00] text-black text-xs font-bold flex items-center justify-center gap-2 hover:brightness-95 transition"
              >
                <Camera className="w-4 h-4" />
                Enable Live Camera
              </button>
            </div>
          </div>
        )}

        {/* Filter Intensity & Search Drawer */}
        {showFilterDrawer && (
          <div className="absolute top-16 left-3 right-16 z-20 p-3.5 rounded-2xl bg-black/85 backdrop-blur-md border border-[#292929] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                {activeFilter.name} · {Math.round(filterIntensity * 100)}%
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFavoriteFilter(activeFilter.id)}
                  className="text-xs font-semibold flex items-center gap-1 text-[#FFFC00]"
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      state.favoriteFilterIds.includes(activeFilter.id) ? 'fill-[#FFFC00]' : ''
                    }`}
                  />
                  Fav
                </button>
                <button
                  onClick={() => setZoom((z) => (z >= 2.5 ? 1 : Number((z + 0.5).toFixed(1))))}
                  className="px-2 py-0.5 rounded bg-[#181818] text-[11px] font-mono text-white"
                >
                  {zoom.toFixed(1)}x
                </button>
              </div>
            </div>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={filterIntensity}
              onChange={(e) => setFilterIntensity(Number(e.target.value))}
              className="w-full accent-[#FFFC00]"
            />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search 37 filters & lenses..."
              className="w-full h-9 px-3 rounded-xl bg-[#181818] border border-[#292929] text-xs text-white focus:outline-none focus:border-[#FFFC00]"
            />
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(['all', 'lens', 'advanced', 'basic', 'favorites'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize whitespace-nowrap ${
                    filterCat === cat
                      ? 'bg-[#FFFC00] text-black'
                      : 'bg-[#181818] text-[#A1A1A1]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Filter Carousel & Shutter Controls */}
        <div className="absolute bottom-4 left-0 right-0 z-20 flex flex-col items-center gap-3 px-3">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
            <button
              onClick={() => setCaptureMode('photo')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                captureMode === 'photo' ? 'bg-[#FFFC00] text-black' : 'text-white'
              }`}
            >
              Photo
            </button>
            <button
              onClick={() => setCaptureMode('video')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                captureMode === 'video' ? 'bg-[#FFFC00] text-black' : 'text-white'
              }`}
            >
              Video
            </button>
          </div>

          {/* Horizontal Filter Strip */}
          <div className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar px-2 py-1">
            {filteredPresets.map((f) => {
              const selected = f.id === activeFilterId;
              return (
                <button
                  key={f.id}
                  onClick={() => selectFilter(f.id)}
                  className={`shrink-0 flex flex-col items-center gap-1 transition-transform ${
                    selected ? 'scale-105' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 bg-black/60 backdrop-blur-md ${
                      selected ? 'border-[#FFFC00]' : 'border-white/25'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: f.badgeColor }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-semibold max-w-[60px] truncate ${
                      selected ? 'text-[#FFFC00]' : 'text-white'
                    }`}
                  >
                    {f.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Shutter Row */}
          <div className="w-full flex items-center justify-center gap-8">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:border-[#FFFC00]"
              aria-label="Upload from gallery"
              title="Upload Photo or Video"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleGalleryUpload}
              className="hidden"
            />

            <button
              onClick={handleShutterPress}
              aria-label={captureMode === 'video' ? 'Record video' : 'Capture photo'}
              className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-transform active:scale-95 ${
                isRecording
                  ? 'border-red-500 bg-red-500/20'
                  : captureMode === 'video'
                    ? 'border-[#FFFC00] bg-black/20'
                    : 'border-white bg-white/15'
              }`}
            >
              {isRecording ? (
                <Square className="w-7 h-7 text-red-500 fill-red-500" />
              ) : captureMode === 'video' ? (
                <Video className="w-7 h-7 text-[#FFFC00]" />
              ) : (
                <div className="w-16 h-16 rounded-full border-2 border-white/60" />
              )}
            </button>

            <button
              onClick={() => setShowFilterDrawer((v) => !v)}
              className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#FFFC00] hover:border-[#FFFC00]"
              aria-label="Open lenses drawer"
              title="Filters & Lenses"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>

          {cameraActive && (
            <button
              onClick={stopCamera}
              className="text-[11px] font-semibold text-[#A1A1A1] hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Pause Camera
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
