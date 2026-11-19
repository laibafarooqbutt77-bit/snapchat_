import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
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
  mimeType?: string;
  duration?: number;
};

type SnapSticker = {
  id: string;
  text: string;
  x: number;
  y: number;
};

type CameraDiagnostics = {
  isSecureContext: boolean;
  mediaDevicesAvailable: boolean;
  getUserMediaAvailable: boolean;
  permissionState: string;
  cameraCount: number | null;
  streamActive: boolean | null;
  trackState: string | null;
  trackLabel: string | null;
  readyState: number | null;
  videoWidth: number | null;
  videoHeight: number | null;
  errorName: string | null;
  errorMessage: string | null;
  playbackError: string | null;
};

type VideoAttachResult = {
  ok: boolean;
  streamActive: boolean;
  readyState: number;
  videoWidth: number;
  videoHeight: number;
  playbackError: string | null;
};

const DRAW_COLORS = ['#FFFC00', '#FFFFFF', '#EF4444', '#38BDF8', '#22C55E', '#A855F7', '#000000'];
const QUICK_STICKERS = ['🔥', '⚡', '✨', '😍', '😂', '💀', '🌴', '🎉', '💯', '🫶', '🕶️', '🚀'];

function getSupportedVideoMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  for (const type of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch {
      // Ignore unsupported probe
    }
  }
  return '';
}

function getCameraErrorMessage(err: unknown, playbackError?: string | null): string {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'Camera requires an HTTPS connection. Open this app via your deployed HTTPS URL.';
  }
  if (playbackError) {
    return `Camera stream opened, but live video playback could not start (${playbackError}). Tap Retry Camera.`;
  }
  const error = err as { name?: string; message?: string } | null;
  const name = error?.name || '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return 'Camera permission was denied. On iPhone Safari tap "aA" > Website Settings > Camera > Allow. On Android Chrome tap the lock/tune icon in the address bar > Permissions > Camera > Allow, then tap Retry Camera.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No camera hardware was detected on this device. Check device camera settings or upload from your gallery.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Your camera is already in use by another app, tab, or system process. Close other apps using the camera and tap Retry Camera.';
  }
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
    return 'The requested camera lens or resolution is not supported on this device. Tap Retry Camera to fall back to the default camera.';
  }
  if (name === 'AbortError') {
    return 'Camera startup was interrupted before video could begin. Tap Retry Camera.';
  }
  if (name === 'TypeError') {
    return 'Invalid camera request or unsupported browser context. Ensure you are on HTTPS and tap Retry Camera.';
  }
  return error?.message || 'Unable to start live camera preview. Check permissions and tap Retry Camera.';
}

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

  // Camera hardware state (never auto-starts without user interaction)
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraDiagnostics, setCameraDiagnostics] = useState<CameraDiagnostics | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
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
  const audioStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isDrawingRef = useRef(false);
  const isStartingRef = useRef(false);
  const mountedRef = useRef(true);
  const facingModeRef = useRef<'user' | 'environment'>('user');
  const currentDeviceIdRef = useRef<string | null>(null);
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

  const stopAllTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore track stop errors
        }
      });
      streamRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore track stop errors
        }
      });
      audioStreamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        // Ignore pause error
      }
      videoRef.current.srcObject = null;
    }
    currentDeviceIdRef.current = null;
  }, []);

  const stopCamera = useCallback(() => {
    stopAllTracks();
    setCameraActive(false);
    setCameraLoading(false);
    setFlashOn(false);
  }, [stopAllTracks]);

  const collectDiagnostics = useCallback(
    async (extra?: Partial<CameraDiagnostics>): Promise<CameraDiagnostics> => {
      const isSecure = typeof window !== 'undefined' ? window.isSecureContext : false;
      const hasMediaDevices = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices);
      const hasGetUserMedia =
        hasMediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function';

      let permissionState = 'unsupported';
      try {
        if (navigator.permissions?.query) {
          const status = await navigator.permissions.query({
            name: 'camera' as PermissionName,
          });
          permissionState = status.state;
        }
      } catch {
        permissionState = 'unavailable (Safari/WebKit)';
      }

      let cameraCount: number | null = null;
      try {
        if (hasMediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function') {
          const devices = await navigator.mediaDevices.enumerateDevices();
          cameraCount = devices.filter((d) => d.kind === 'videoinput').length;
        }
      } catch {
        cameraCount = null;
      }

      const stream = streamRef.current;
      const track = stream?.getVideoTracks?.()?.[0];
      const video = videoRef.current;

      const diag: CameraDiagnostics = {
        isSecureContext: isSecure,
        mediaDevicesAvailable: hasMediaDevices,
        getUserMediaAvailable: hasGetUserMedia,
        permissionState,
        cameraCount,
        streamActive: stream ? stream.active : null,
        trackState: track ? track.readyState : null,
        trackLabel: track ? track.label || 'video-track' : null,
        readyState: video ? video.readyState : null,
        videoWidth: video ? video.videoWidth : null,
        videoHeight: video ? video.videoHeight : null,
        errorName: null,
        errorMessage: null,
        playbackError: null,
        ...extra,
      };

      console.info('[Lumo Camera Diagnostics]', diag);
      return diag;
    },
    []
  );

  const attachStreamToVideo = useCallback(async (stream: MediaStream): Promise<VideoAttachResult> => {
    const video = videoRef.current;
    if (!video) {
      return {
        ok: false,
        streamActive: stream.active,
        readyState: 0,
        videoWidth: 0,
        videoHeight: 0,
        playbackError: 'Video element not mounted',
      };
    }

    // Critical mobile Safari & Android Chrome attributes before assigning srcObject
    video.autoplay = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    if (video.srcObject !== stream) {
      video.srcObject = null;
      video.srcObject = stream;
    }

    let lastPlaybackError: string | null = null;
    const tryPlay = async () => {
      try {
        await video.play();
        lastPlaybackError = null;
      } catch (err) {
        const errObj = err as { name?: string; message?: string } | null;
        const msg = errObj ? `${errObj.name || 'PlayError'}: ${errObj.message || ''}` : 'play() rejected';
        // Ignore transient AbortError when srcObject/metadata triggers a newer play()
        if (errObj?.name !== 'AbortError') {
          lastPlaybackError = msg;
          console.warn('[Lumo Camera] video.play() warning:', msg);
        }
      }
    };

    // Call play() immediately while still as close as possible to the user gesture
    void tryPlay();

    return await new Promise<VideoAttachResult>((resolve) => {
      let settled = false;
      let pollId: ReturnType<typeof setInterval> | null = null;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        video.removeEventListener('loadedmetadata', handleEvent);
        video.removeEventListener('loadeddata', handleEvent);
        video.removeEventListener('canplay', handleEvent);
        video.removeEventListener('playing', handleEvent);
        video.removeEventListener('resize', handleEvent);
        if (pollId) clearInterval(pollId);
        if (timeoutId) clearTimeout(timeoutId);
      };

      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve({
          ok,
          streamActive: stream.active,
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          playbackError: lastPlaybackError,
        });
      };

      const checkReady = async () => {
        if (!mountedRef.current || streamRef.current !== stream) {
          finish(false);
          return;
        }
        if (video.readyState >= 1 && video.paused) {
          await tryPlay();
        }
        if (
          stream.active &&
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          !video.paused
        ) {
          finish(true);
        }
      };

      const handleEvent = () => {
        void checkReady();
      };

      video.addEventListener('loadedmetadata', handleEvent);
      video.addEventListener('loadeddata', handleEvent);
      video.addEventListener('canplay', handleEvent);
      video.addEventListener('playing', handleEvent);
      video.addEventListener('resize', handleEvent);

      pollId = setInterval(() => {
        void checkReady();
      }, 100);

      // Final check after 4.5 seconds so UI never hangs indefinitely
      timeoutId = setTimeout(async () => {
        await checkReady();
        if (!settled) {
          const hasLiveFrames =
            stream.active && video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2;
          finish(hasLiveFrames);
        }
      }, 4500);

      void checkReady();
    });
  }, []);

  const startCamera = useCallback(
    async (preferredMode: 'user' | 'environment' = facingModeRef.current, isSwitch = false) => {
      if (isStartingRef.current) return;

      if (typeof window !== 'undefined' && !window.isSecureContext) {
        const diag = await collectDiagnostics({
          errorName: 'InsecureContext',
          errorMessage: 'Camera requires HTTPS.',
        });
        setCameraDiagnostics(diag);
        setCameraError('Camera requires an HTTPS connection (such as your deployed Vercel URL).');
        return;
      }

      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        const diag = await collectDiagnostics({
          errorName: 'UnsupportedBrowser',
          errorMessage: 'navigator.mediaDevices.getUserMedia is unavailable.',
        });
        setCameraDiagnostics(diag);
        setCameraError(
          'Your browser does not support live camera access. Please open in Safari/Chrome or upload from gallery.'
        );
        return;
      }

      isStartingRef.current = true;
      setCameraLoading(true);
      setCameraError(null);
      setShowDiagnostics(false);

      // Preserve the previous deviceId before stopping tracks (helpful if enumerateDevices fallback is needed)
      const previousDeviceId = currentDeviceIdRef.current;

      // Stop existing tracks BEFORE requesting a new camera (required on Android/iOS hardware)
      stopAllTracks();

      let acquiredStream: MediaStream | null = null;
      let lastError: unknown = null;

      const tryConstraints = async (constraints: MediaStreamConstraints): Promise<MediaStream | null> => {
        try {
          return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
          lastError = err;
          return null;
        }
      };

      const isFatalPermissionOrHardwareError = (err: unknown) => {
        const errName = (err as { name?: string } | null)?.name || '';
        return (
          errName === 'NotAllowedError' ||
          errName === 'PermissionDeniedError' ||
          errName === 'SecurityError' ||
          errName === 'NotReadableError' ||
          errName === 'TrackStartError'
        );
      };

      if (!isSwitch) {
        // 1. Primary initial request: simple gesture-safe front camera request (audio: false)
        acquiredStream = await tryConstraints({
          video: { facingMode: preferredMode },
          audio: false,
        });

        // 2. Fallback to generic video: true if facingMode constraint failed
        if (!acquiredStream && !isFatalPermissionOrHardwareError(lastError)) {
          acquiredStream = await tryConstraints({
            video: true,
            audio: false,
          });
        }
      } else {
        // Switching between front and rear cameras:
        // 1. Try exact facingMode first so dual-lens phones actually swap cameras
        acquiredStream = await tryConstraints({
          video: { facingMode: { exact: preferredMode } },
          audio: false,
        });

        // 2. Fallback via enumerateDevices() to pick a matching front/rear deviceId
        if (
          !acquiredStream &&
          !isFatalPermissionOrHardwareError(lastError) &&
          typeof navigator.mediaDevices.enumerateDevices === 'function'
        ) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter((d) => d.kind === 'videoinput');
            const targetRegex =
              preferredMode === 'environment'
                ? /back|rear|environment|world|truedepth/i
                : /front|user|facetime|selfie/i;
            const matched =
              videoInputs.find((d) => targetRegex.test(d.label) && d.deviceId !== previousDeviceId) ||
              videoInputs.find((d) => d.deviceId && d.deviceId !== previousDeviceId);

            if (matched?.deviceId) {
              acquiredStream = await tryConstraints({
                video: { deviceId: { exact: matched.deviceId } },
                audio: false,
              });
            }
          } catch {
            // Continue to simpler fallback constraints
          }
        }

        // 3. Soft facingMode fallback -> generic video: true fallback
        if (!acquiredStream && !isFatalPermissionOrHardwareError(lastError)) {
          acquiredStream = await tryConstraints({
            video: { facingMode: preferredMode },
            audio: false,
          });
        }
        if (!acquiredStream && !isFatalPermissionOrHardwareError(lastError)) {
          acquiredStream = await tryConstraints({
            video: true,
            audio: false,
          });
        }
      }

      if (!mountedRef.current) {
        acquiredStream?.getTracks().forEach((t) => t.stop());
        isStartingRef.current = false;
        return;
      }

      if (!acquiredStream) {
        const errObj = lastError as { name?: string; message?: string } | null;
        const diag = await collectDiagnostics({
          errorName: errObj?.name || 'UnknownCameraError',
          errorMessage: errObj?.message || 'getUserMedia failed',
        });
        setCameraDiagnostics(diag);
        setCameraActive(false);
        setCameraLoading(false);
        setCameraError(getCameraErrorMessage(lastError));
        isStartingRef.current = false;
        return;
      }

      try {
        streamRef.current = acquiredStream;

        const videoTrack = acquiredStream.getVideoTracks()[0];
        const settings = videoTrack?.getSettings?.();
        currentDeviceIdRef.current = settings?.deviceId || null;

        const resolvedMode =
          settings?.facingMode === 'user' || settings?.facingMode === 'environment'
            ? settings.facingMode
            : preferredMode;
        facingModeRef.current = resolvedMode;
        setFacingMode(resolvedMode);

        if (videoTrack) {
          videoTrack.onended = () => {
            if (mountedRef.current) {
              setCameraActive(false);
            }
          };
        }

        // Attach stream and verify videoWidth > 0 && videoHeight > 0 BEFORE marking active
        const attachResult = await attachStreamToVideo(acquiredStream);

        if (!mountedRef.current) {
          stopAllTracks();
          isStartingRef.current = false;
          return;
        }

        if (
          !attachResult.ok ||
          !attachResult.streamActive ||
          attachResult.videoWidth <= 0 ||
          attachResult.videoHeight <= 0
        ) {
          const diag = await collectDiagnostics({
            streamActive: attachResult.streamActive,
            readyState: attachResult.readyState,
            videoWidth: attachResult.videoWidth,
            videoHeight: attachResult.videoHeight,
            playbackError: attachResult.playbackError,
            errorName: 'VideoRenderTimeout',
            errorMessage:
              attachResult.playbackError ||
              `Video dimensions remained ${attachResult.videoWidth}x${attachResult.videoHeight} (readyState ${attachResult.readyState}).`,
          });
          stopAllTracks();
          setCameraDiagnostics(diag);
          setCameraActive(false);
          setCameraLoading(false);
          setCameraError(
            getCameraErrorMessage(
              { name: 'AbortError', message: diag.errorMessage || undefined },
              attachResult.playbackError
            )
          );
          isStartingRef.current = false;
          return;
        }

        const successDiag = await collectDiagnostics({
          streamActive: attachResult.streamActive,
          readyState: attachResult.readyState,
          videoWidth: attachResult.videoWidth,
          videoHeight: attachResult.videoHeight,
        });
        setCameraDiagnostics(successDiag);
        setCameraActive(true);
        setCameraLoading(false);
      } catch (err) {
        const errObj = err as { name?: string; message?: string } | null;
        const diag = await collectDiagnostics({
          errorName: errObj?.name || 'StreamAttachError',
          errorMessage: errObj?.message || 'Unexpected camera failure',
        });
        stopAllTracks();
        setCameraDiagnostics(diag);
        setCameraActive(false);
        setCameraLoading(false);
        setCameraError(getCameraErrorMessage(err));
      } finally {
        isStartingRef.current = false;
      }
    },
    [stopAllTracks, attachStreamToVideo, collectDiagnostics]
  );

  // Re-attach live stream to <video> whenever returning from Snap Editor (Retake)
  useEffect(() => {
    if (!captured && cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current || videoRef.current.paused) {
        void attachStreamToVideo(streamRef.current);
      }
    }
  }, [captured, cameraActive, attachStreamToVideo]);

  // Cleanup camera streams on component unmount or page hide
  useEffect(() => {
    mountedRef.current = true;
    const handlePageHide = () => stopAllTracks();
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      mountedRef.current = false;
      window.removeEventListener('pagehide', handlePageHide);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore recorder stop errors
        }
      }
      stopAllTracks();
    };
  }, [stopAllTracks]);

  // Apply real rear-camera hardware torch when flash is toggled
  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()?.[0];
    if (!track || facingMode !== 'environment') return;
    try {
      const caps = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      if (caps?.torch) {
        track.applyConstraints({
          advanced: [{ torch: flashOn } as MediaTrackConstraintSet],
        }).catch(() => {});
      }
    } catch {
      // Torch not supported on this browser/camera
    }
  }, [flashOn, facingMode, cameraActive]);

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
    }, 200);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [cameraActive, activeFilter.lensType]);

  // Overlay Canvas Render Loop (only runs when camera is active and canvas pixel effects or lenses are selected)
  const needsCanvasPixelDraw = Boolean(
    activeFilter.canvasMode && activeFilter.canvasMode !== 'none'
  );

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (captured || !cameraActive || (!needsCanvasPixelDraw && !activeFilter.lensType)) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    let rafId = 0;

    const render = (timeMs: number) => {
      const targetCanvas = previewCanvasRef.current;
      if (targetCanvas) {
        const ctx = targetCanvas.getContext('2d');
        if (ctx) {
          const w = targetCanvas.width;
          const h = targetCanvas.height;
          ctx.clearRect(0, 0, w, h);

          const vid = videoRef.current;
          if (vid && vid.readyState >= 2 && vid.videoWidth > 0) {
            if (needsCanvasPixelDraw) {
              const vw = vid.videoWidth;
              const vh = vid.videoHeight;
              const scale = Math.max(w / vw, h / vh) * zoom;
              const dw = vw * scale;
              const dh = vh * scale;
              const dx = (w - dw) / 2;
              const dy = (h - dh) / 2;

              ctx.save();
              if (activeFilter.cssFilter && activeFilter.cssFilter !== 'none') {
                ctx.filter = activeFilter.cssFilter;
              }
              if (facingMode === 'user' && state.settings.mirrorFrontCam) {
                ctx.translate(w, 0);
                ctx.scale(-1, 1);
              }
              ctx.drawImage(vid, dx, dy, dw, dh);
              ctx.restore();

              applyCanvasPostEffect(ctx, w, h, activeFilter.canvasMode, timeMs, filterIntensity);
            }
          }

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
    needsCanvasPixelDraw,
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

  // Renders the live <video> + filter + lens onto a snapshot canvas and returns a Blob
  const capturePhotoNow = () => {
    if (!cameraActive || !videoRef.current || videoRef.current.readyState < 2 || !videoRef.current.videoWidth) {
      showToast('Enable your live camera first or upload a photo.', 'error');
      return;
    }

    if (flashOn && facingMode === 'user') {
      setScreenFlash(true);
      setTimeout(() => setScreenFlash(false), 220);
    }

    const vid = videoRef.current;
    const out = document.createElement('canvas');
    out.width = 720;
    out.height = 1280;
    const ctx = out.getContext('2d');
    if (!ctx) return;

    const vw = vid.videoWidth;
    const vh = vid.videoHeight;
    const scale = Math.max(out.width / vw, out.height / vh) * zoom;
    const dw = vw * scale;
    const dh = vh * scale;
    const dx = (out.width - dw) / 2;
    const dy = (out.height - dh) / 2;

    ctx.save();
    if (activeFilter.cssFilter && activeFilter.cssFilter !== 'none') {
      ctx.filter = activeFilter.cssFilter;
    }
    if (facingMode === 'user' && state.settings.mirrorFrontCam) {
      ctx.translate(out.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(vid, dx, dy, dw, dh);
    ctx.restore();

    applyCanvasPostEffect(ctx, out.width, out.height, activeFilter.canvasMode, performance.now(), filterIntensity);

    if (activeFilter.lensType) {
      const faceBox: FaceBox = detectedFaceRef.current
        ? {
            x: (detectedFaceRef.current.x / 540) * out.width,
            y: (detectedFaceRef.current.y / 960) * out.height,
            width: (detectedFaceRef.current.width / 540) * out.width,
            height: (detectedFaceRef.current.height / 960) * out.height,
          }
        : {
            x: out.width * 0.28,
            y: out.height * 0.27,
            width: out.width * 0.44,
            height: out.height * 0.32,
          };
      drawLensOverlay(ctx, activeFilter.lensType, faceBox, performance.now(), filterIntensity);
    }

    out.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setCaptured({ type: 'photo', blob, url, mimeType: 'image/jpeg' });
        setCaptionText('');
        setStickers([]);
        setEditorTool('none');
      },
      'image/jpeg',
      0.92
    );
  };

  const toggleVideoRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    if (!cameraActive || !streamRef.current) {
      showToast('Enable your live camera first to record a video.', 'error');
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      showToast('Video recording is not supported in this browser.', 'error');
      return;
    }

    try {
      // Request optional microphone audio track for video recording (never blocks video if denied)
      let combinedStream: MediaStream;
      let audioTrack: MediaStreamTrack | null = null;
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = micStream;
        audioTrack = micStream.getAudioTracks()[0] || null;
      } catch {
        // Proceed with silent video recording if mic is unavailable/denied
      }

      const canvas = previewCanvasRef.current;
      const shouldUseCanvasStream =
        needsCanvasPixelDraw &&
        canvas &&
        typeof canvas.captureStream === 'function';

      if (shouldUseCanvasStream && canvas) {
        const cStream = canvas.captureStream(30);
        const tracks = [...cStream.getVideoTracks()];
        if (audioTrack) tracks.push(audioTrack);
        combinedStream = new MediaStream(tracks);
      } else {
        const tracks = [...streamRef.current.getVideoTracks()];
        if (audioTrack) tracks.push(audioTrack);
        combinedStream = new MediaStream(tracks);
      }

      const preferredMime = getSupportedVideoMimeType();
      const recorder = preferredMime
        ? new MediaRecorder(combinedStream, { mimeType: preferredMime })
        : new MediaRecorder(combinedStream);

      const startedAt = Date.now();
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const finalMime = recorder.mimeType || preferredMime || 'video/mp4';
        const blob = new Blob(recordedChunksRef.current, { type: finalMime });
        const url = URL.createObjectURL(blob);
        audioStreamRef.current?.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
        setCaptured({
          type: 'video',
          blob,
          url,
          mimeType: finalMime,
          duration: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        });
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      showToast('Unable to start video recording on this device.', 'error');
    }
  };

  const handleShutterPress = () => {
    if (!cameraActive) {
      void startCamera(facingModeRef.current, false);
      return;
    }
    if (captureMode === 'video') {
      void toggleVideoRecording();
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

  const handleSwitchCamera = () => {
    if (cameraLoading || isStartingRef.current) return;
    const nextMode = facingModeRef.current === 'user' ? 'environment' : 'user';
    facingModeRef.current = nextMode;
    setFacingMode(nextMode);
    setFlashOn(false);
    if (cameraActive) {
      void startCamera(nextMode, true);
    }
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
      mimeType: file.type,
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
    const ext =
      captured.type === 'video'
        ? captured.mimeType?.includes('mp4')
          ? 'mp4'
          : 'webm'
        : 'jpg';
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumo-snap-${Date.now()}.${ext}`;
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
      <div className="relative h-full w-full bg-black flex flex-col items-center justify-center overflow-hidden select-none touch-none">
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

  const videoTransformParts: string[] = [];
  if (facingMode === 'user' && state.settings.mirrorFrontCam) {
    videoTransformParts.push('scaleX(-1)');
  }
  if (zoom !== 1) {
    videoTransformParts.push(`scale(${zoom})`);
  }
  const videoTransform = videoTransformParts.join(' ');

  // LIVE CAMERA & FILTER STUDIO VIEW
  return (
    <div className="relative h-full w-full bg-black flex flex-col items-center justify-center overflow-hidden touch-none overscroll-none select-none">
      <div className="relative w-full h-full max-w-[460px] lg:max-w-[520px] lg:h-[calc(100%-24px)] lg:rounded-3xl lg:border lg:border-[#292929] overflow-hidden bg-[#0A0A0A] shadow-2xl">
        {/* Always-visible Native Video Element (never display:none or opacity:0 so iOS Safari & Android Chrome decode and display frames immediately) */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover bg-[#0A0A0A]"
          style={{
            filter: activeFilter.cssFilter !== 'none' ? activeFilter.cssFilter : undefined,
            transform: videoTransform || undefined,
          }}
        />

        {/* Transparent Overlay Canvas for Advanced Pixel Effects & Face Lenses */}
        <canvas
          ref={previewCanvasRef}
          width={540}
          height={960}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
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
              <div className="flex items-center gap-1.5">
                <div className="px-2.5 py-1 rounded-full bg-black/65 border border-[#FFFC00]/40 text-[11px] font-bold text-[#FFFC00] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {isRecording ? `REC ${recordSec}s` : facingMode === 'user' ? 'FRONT CAM' : 'REAR CAM'}
                </div>
                <button
                  onClick={stopCamera}
                  className="w-8 h-8 rounded-full bg-black/65 border border-white/15 text-white flex items-center justify-center hover:border-[#FFFC00]"
                  aria-label="Close camera"
                  title="Close Camera"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Vertical Camera Toolbar */}
          <div className="flex flex-col items-center gap-2 bg-black/45 backdrop-blur-md border border-white/10 rounded-full p-1.5">
            <button
              onClick={handleSwitchCamera}
              disabled={cameraLoading}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-50"
              aria-label="Flip camera"
              title="Switch Front / Back Camera"
            >
              <RefreshCw className={`w-4 h-4 ${cameraLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setFlashOn((f) => !f)}
              className={`w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 ${
                flashOn ? 'text-[#FFFC00]' : 'text-white'
              }`}
              aria-label="Toggle flash"
              title="Flash"
            >
              {flashOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setGridOn((g) => !g)}
              className={`w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 ${
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
              className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold hover:bg-white/10 ${
                timerSec > 0 ? 'text-[#FFFC00]' : 'text-white'
              }`}
              aria-label="Countdown timer"
              title="Timer"
            >
              {timerSec > 0 ? `${timerSec}s` : <Timer className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowFilterDrawer((v) => !v)}
              className={`w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 ${
                showFilterDrawer ? 'text-[#FFFC00]' : 'text-white'
              }`}
              aria-label="Filter settings"
              title="All Filters & Intensity"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Camera Loading State */}
        {cameraLoading && (
          <div className="absolute inset-0 z-20 bg-black/65 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 text-center pointer-events-auto">
            <Loader2 className="w-9 h-9 text-[#FFFC00] animate-spin" />
            <p className="text-sm font-bold text-white">Starting live camera...</p>
            <p className="text-xs text-[#A1A1A1] max-w-xs">
              Approve camera permission when prompted and wait for the live video feed to appear.
            </p>
          </div>
        )}

        {/* User-Initiated Camera Activation / Permission Error Card */}
        {!cameraActive && !cameraLoading && (
          <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center pointer-events-auto">
            <div className="p-5 rounded-3xl bg-[#101010]/95 backdrop-blur-md border border-[#292929] max-w-xs w-full space-y-3.5 shadow-2xl">
              {cameraError ? (
                <>
                  <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-white">Camera Not Rendering</p>
                  <p className="text-xs text-[#A1A1A1] leading-relaxed">{cameraError}</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => void startCamera(facingModeRef.current, false)}
                      className="w-full h-11 rounded-xl bg-[#FFFC00] text-black text-xs font-bold flex items-center justify-center gap-2 hover:brightness-95 transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry Camera
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-10 rounded-xl bg-[#181818] border border-[#292929] text-white text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Upload From Gallery
                    </button>
                  </div>

                  {cameraDiagnostics && (
                    <div className="pt-1 border-t border-[#292929] text-left">
                      <button
                        type="button"
                        onClick={() => setShowDiagnostics((v) => !v)}
                        className="w-full flex items-center justify-between text-[11px] font-semibold text-[#A1A1A1] hover:text-white py-1"
                      >
                        <span>Camera Diagnostics</span>
                        {showDiagnostics ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {showDiagnostics && (
                        <div className="mt-1.5 p-2.5 rounded-xl bg-black/80 border border-[#292929] text-[10px] font-mono text-[#A1A1A1] space-y-1 break-words">
                          <div>HTTPS: {cameraDiagnostics.isSecureContext ? 'Yes' : 'No'}</div>
                          <div>
                            getUserMedia: {cameraDiagnostics.getUserMediaAvailable ? 'Supported' : 'Missing'}
                          </div>
                          <div>Permission: {cameraDiagnostics.permissionState}</div>
                          <div>
                            Cameras Detected:{' '}
                            {cameraDiagnostics.cameraCount !== null ? cameraDiagnostics.cameraCount : 'Unknown'}
                          </div>
                          <div>
                            Stream Active:{' '}
                            {cameraDiagnostics.streamActive !== null
                              ? String(cameraDiagnostics.streamActive)
                              : 'null'}
                          </div>
                          <div>
                            Video: {cameraDiagnostics.videoWidth ?? 0}x{cameraDiagnostics.videoHeight ?? 0} (readyState{' '}
                            {cameraDiagnostics.readyState ?? 0})
                          </div>
                          {cameraDiagnostics.errorName && (
                            <div className="text-red-400">
                              Error: {cameraDiagnostics.errorName}
                              {cameraDiagnostics.errorMessage ? ` — ${cameraDiagnostics.errorMessage}` : ''}
                            </div>
                          )}
                          {cameraDiagnostics.playbackError && (
                            <div className="text-red-400">Playback: {cameraDiagnostics.playbackError}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-[#FFFC00] text-black flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Camera Ready</p>
                    <p className="text-xs text-[#A1A1A1] leading-relaxed mt-1">
                      Tap below to activate your live front-facing camera for photos, videos, and lenses.
                    </p>
                  </div>
                  <button
                    onClick={() => void startCamera('user', false)}
                    className="w-full h-11 rounded-xl bg-[#FFFC00] text-black text-xs font-bold flex items-center justify-center gap-2 hover:brightness-95 transition"
                  >
                    <Camera className="w-4 h-4" />
                    Enable Camera
                  </button>
                </>
              )}
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
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x">
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
          <div className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-x px-2 py-1">
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
              disabled={cameraLoading}
              aria-label={
                !cameraActive
                  ? 'Enable Camera'
                  : captureMode === 'video'
                    ? 'Record video'
                    : 'Capture photo'
              }
              className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50 ${
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
              className="text-[11px] font-semibold text-[#A1A1A1] hover:text-white flex items-center gap-1 py-1"
            >
              <RotateCcw className="w-3 h-3" />
              Close Camera
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
