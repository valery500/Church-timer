import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import {
  Play,
  Pause,
  SkipForward,
  Plus,
  Tv,
  Wifi,
  Smartphone,
  FolderCode,
  Github,
  Download,
  Copy,
  Check,
  Trash2,
  ArrowUp,
  ArrowDown,
  Volume2,
  Maximize2,
  Minimize2,
  Radio,
  Server,
  Layers,
  Sparkles,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { ANDROID_FILES, ProjectFile } from './data/projectFiles';

interface ServiceActivity {
  id: string;
  name: string;
  durationSeconds: number;
}

const DEFAULT_ACTIVITIES: ServiceActivity[] = [
  { id: '1', name: 'Praise', durationSeconds: 10 * 60 },
  { id: '2', name: 'Word', durationSeconds: 40 * 60 },
  { id: '3', name: 'Offering', durationSeconds: 10 * 60 }
];

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'controller' | 'tv' | 'split' | 'files' | 'github'>('controller');

  // Timer State
  const [activities, setActivities] = useState<ServiceActivity[]>(() => {
    try {
      const saved = localStorage.getItem('church_timer_activities');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_ACTIVITIES;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(activities[0]?.durationSeconds ?? 600);
  const [isRunning, setIsRunning] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [timeUpCounter, setTimeUpCounter] = useState(5);

  // Server state
  const [isServerRunning, setIsServerRunning] = useState(true);
  const [hotspotIp, setHotspotIp] = useState('192.168.43.1');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Add Activity Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityMinutes, setNewActivityMinutes] = useState('15');
  const [newActivitySeconds, setNewActivitySeconds] = useState('00');

  // File browser state
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(ANDROID_FILES[0]);
  const [fileFilter, setFileFilter] = useState<string>('all');
  const [fileSearch, setFileSearch] = useState<string>('');
  const [copiedFile, setCopiedFile] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipSuccess, setZipSuccess] = useState(false);

  // Fullscreen TV state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tvContainerRef = useRef<HTMLDivElement>(null);

  // Web Audio Context for offline beep sound
  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentActivity = activities[currentIndex] || null;
  const nextActivity = activities[currentIndex + 1] || null;

  // Persist activities
  useEffect(() => {
    localStorage.setItem('church_timer_activities', JSON.stringify(activities));
  }, [activities]);

  // Generate QR Code for TV Connection
  useEffect(() => {
    const url = `http://${hotspotIp}:8080/display`;
    QRCode.toDataURL(url, {
      margin: 1,
      width: 250,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }).then(setQrDataUrl).catch(console.error);
  }, [hotspotIp]);

  // Audio synthesizer function (100% offline)
  const playAlertTone = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch (err) {
      console.warn('Audio tone error:', err);
    }
  };

  // Timer Tick Interval
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      if (isTimeUp) {
        setTimeUpCounter((prev) => {
          if (prev <= 1) {
            // Auto advance after 5 seconds of time up
            setIsTimeUp(false);
            if (currentIndex + 1 < activities.length) {
              const nextIdx = currentIndex + 1;
              setCurrentIndex(nextIdx);
              setRemainingSeconds(activities[nextIdx].durationSeconds);
            } else {
              setIsRunning(false);
              setRemainingSeconds(0);
            }
            return 5;
          }
          return prev - 1;
        });
      } else {
        setRemainingSeconds((prev) => {
          if (prev > 1) {
            return prev - 1;
          } else {
            // Time reached zero!
            setIsTimeUp(true);
            setTimeUpCounter(5);
            playAlertTone();
            return 0;
          }
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isTimeUp, currentIndex, activities]);

  // Progress percentage calculation
  const totalDuration = currentActivity?.durationSeconds || 1;
  const elapsed = Math.max(0, totalDuration - remainingSeconds);
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Controller Actions
  const handleTogglePlay = () => {
    if (remainingSeconds <= 0 && !isTimeUp) {
      if (currentActivity) {
        setRemainingSeconds(currentActivity.durationSeconds);
      }
    }
    setIsRunning(!isRunning);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleSkipNext = () => {
    setIsTimeUp(false);
    if (currentIndex + 1 < activities.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setRemainingSeconds(activities[nextIdx].durationSeconds);
    } else {
      setIsRunning(false);
      setRemainingSeconds(0);
    }
  };

  const handleAddOneMin = () => {
    setRemainingSeconds((prev) => prev + 60);
    if (isTimeUp) setIsTimeUp(false);
  };

  const handleSelectActivity = (index: number) => {
    setCurrentIndex(index);
    setRemainingSeconds(activities[index].durationSeconds);
    setIsTimeUp(false);
  };

  const handleMoveActivity = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activities.length) return;

    const newArr = [...activities];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;

    // Adjust current index if selected item moved
    if (currentIndex === index) {
      setCurrentIndex(targetIndex);
    } else if (currentIndex === targetIndex) {
      setCurrentIndex(index);
    }

    setActivities(newArr);
  };

  const handleDeleteActivity = (index: number) => {
    if (activities.length <= 1) {
      alert('At least one activity is required in the schedule!');
      return;
    }
    const newArr = activities.filter((_, i) => i !== index);
    setActivities(newArr);
    if (currentIndex >= newArr.length) {
      setCurrentIndex(0);
      setRemainingSeconds(newArr[0].durationSeconds);
    } else if (currentIndex === index) {
      setRemainingSeconds(newArr[currentIndex].durationSeconds);
    }
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newActivityName.trim();
    if (!name) return;

    const mins = parseInt(newActivityMinutes, 10) || 0;
    const secs = parseInt(newActivitySeconds, 10) || 0;
    const totalSecs = mins * 60 + secs;

    if (totalSecs <= 0) {
      alert('Duration must be greater than 0');
      return;
    }

    const newAct: ServiceActivity = {
      id: Date.now().toString(),
      name,
      durationSeconds: totalSecs
    };

    setActivities([...activities, newAct]);
    setNewActivityName('');
    setShowAddModal(false);
  };

  // Copy selected file
  const handleCopyFile = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  // Download entire Android Project as ZIP
  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Add all project files into zip
      ANDROID_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });

      // Add executable gradlew permissions note and instructions
      zip.file(
        'README.md',
        `# ChurchTimerOffline Android Application

100% Offline Church Service Timer System with Android TV NanoHTTPD Web Broadcast.

## Built for GitHub Actions (No Android Studio required)
1. Initialize Git and push to GitHub:
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit for ChurchTimerOffline"
   git remote add origin https://github.com/YOUR_USER/church-timer-offline.git
   git push -u origin main
   \`\`\`

2. Go to the **Actions** tab on your GitHub repository.
3. The workflow defined in \`.github/workflows/build.yml\` will automatically run with JDK 17 and Android SDK 34.
4. Download the compiled **app-debug.apk** from the build artifacts!

## Manual Command Line Build
If you have JDK 17 installed locally:
\`\`\`bash
chmod +x gradlew
./gradlew assembleDebug
\`\`\`
`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ChurchTimerOffline-Android-Source.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setZipSuccess(true);
      setTimeout(() => setZipSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to create zip:', err);
      alert('Failed to generate ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  // Fullscreen TV toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      tvContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Filter project files
  const filteredFiles = ANDROID_FILES.filter((f) => {
    const matchesCategory = fileFilter === 'all' || f.category === fileFilter;
    const matchesSearch =
      f.path.toLowerCase().includes(fileSearch.toLowerCase()) ||
      f.description.toLowerCase().includes(fileSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-[#4f7cff] selection:text-white">
      {/* Top Main Navigation Bar */}
      <header className="border-b border-[#262626] bg-[#121212] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4f7cff] to-[#3a67ea] flex items-center justify-center shadow-lg shadow-[#4f7cff]/20">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight">ChurchTimerOffline</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#22c55e]/15 border border-[#22c55e]/40 text-[#4ade80]">
                  100% OFFLINE
                </span>
              </div>
              <p className="text-xs text-[#a3a3a3]">Android TV & Controller • NanoHTTPD • GitHub Actions CI</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="hidden md:flex items-center bg-[#1c1c1e] p-1 rounded-xl border border-[#2c2c2e]">
            <button
              onClick={() => setActiveTab('controller')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'controller'
                  ? 'bg-[#4f7cff] text-white shadow'
                  : 'text-[#a3a3a3] hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Phone Controller
            </button>
            <button
              onClick={() => setActiveTab('tv')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'tv'
                  ? 'bg-[#4f7cff] text-white shadow'
                  : 'text-[#a3a3a3] hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              TV Display (/display)
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'split'
                  ? 'bg-[#4f7cff] text-white shadow'
                  : 'text-[#a3a3a3] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Split Live Sync
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'files'
                  ? 'bg-[#4f7cff] text-white shadow'
                  : 'text-[#a3a3a3] hover:text-white'
              }`}
            >
              <FolderCode className="w-3.5 h-3.5" />
              Project Files ({ANDROID_FILES.length})
            </button>
            <button
              onClick={() => setActiveTab('github')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'github'
                  ? 'bg-[#4f7cff] text-white shadow'
                  : 'text-[#a3a3a3] hover:text-white'
              }`}
            >
              <Github className="w-3.5 h-3.5" />
              GitHub CI Ready
            </button>
          </nav>

          {/* Action Button: Download ZIP */}
          <div className="flex items-center gap-2">
            <button
              onClick={playAlertTone}
              title="Test Sound Tone"
              className="p-2 rounded-lg bg-[#1c1c1e] hover:bg-[#2c2c2e] text-[#a3a3a3] hover:text-white border border-[#2c2c2e] transition"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#4f7cff] hover:bg-[#3a67ea] text-white font-bold text-xs transition shadow-md shadow-[#4f7cff]/20 disabled:opacity-50"
            >
              {zipSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isZipping ? 'Archiving...' : 'Download Project (.ZIP)'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto px-4 py-2 bg-[#171717] gap-2 border-t border-[#262626]">
          <button
            onClick={() => setActiveTab('controller')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'controller' ? 'bg-[#4f7cff] text-white' : 'text-[#a3a3a3]'
            }`}
          >
            Controller
          </button>
          <button
            onClick={() => setActiveTab('tv')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'tv' ? 'bg-[#4f7cff] text-white' : 'text-[#a3a3a3]'
            }`}
          >
            TV Display
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'split' ? 'bg-[#4f7cff] text-white' : 'text-[#a3a3a3]'
            }`}
          >
            Split Sync
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'files' ? 'bg-[#4f7cff] text-white' : 'text-[#a3a3a3]'
            }`}
          >
            Android Files
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'github' ? 'bg-[#4f7cff] text-white' : 'text-[#a3a3a3]'
            }`}
          >
            GitHub CI
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* TAB 1: PHONE CONTROLLER */}
        {activeTab === 'controller' && (
          <div className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-6 flex flex-col justify-center">
            {/* Phone Shell Preview */}
            <div className="bg-[#121212] rounded-[32px] p-5 sm:p-6 border border-[#2c2c2e] shadow-2xl relative overflow-hidden">
              {/* Phone Speaker Notch */}
              <div className="w-24 h-1.5 bg-[#262626] rounded-full mx-auto mb-4" />

              {/* MainActivity Header */}
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-extrabold text-white tracking-tight">Church Timer Controller</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#22c55e]/15 border border-[#22c55e] text-[#22c55e]">
                  OFFLINE MODE
                </span>
              </div>

              {/* Main Timer Display Card */}
              <div className="bg-[#1c1c1e] rounded-2xl p-5 border border-[#2c2c2e] mb-5 shadow-inner">
                {/* Current Activity Label */}
                <div className="text-center">
                  <span className="text-[#eab54d] font-bold text-sm tracking-wide uppercase">
                    Current: {currentActivity?.name || 'None'} {currentActivity?.durationSeconds ? formatTime(currentActivity.durationSeconds) : ''}
                  </span>
                </div>

                {/* Big Timer TextView */}
                <div className="my-2 text-center">
                  <span
                    className={`font-mono font-black text-6xl tracking-tight transition-colors ${
                      isTimeUp ? 'text-[#ef4444] animate-pulse' : 'text-white'
                    }`}
                  >
                    {isTimeUp ? "TIME'S UP" : formatTime(remainingSeconds)}
                  </span>
                </div>

                {/* Next Activity Label */}
                <div className="text-center mb-3">
                  <span className="text-[#a3a3a3] text-xs">
                    Next: {nextActivity ? `${nextActivity.name} (${formatTime(nextActivity.durationSeconds)})` : 'End of Service'}
                  </span>
                </div>

                {/* Yellow Progress Bar */}
                <div className="w-full h-2 bg-[#262626] rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full transition-all duration-300 ${isTimeUp ? 'bg-[#ef4444]' : 'bg-[#eab54d]'}`}
                    style={{ width: `${isTimeUp ? 100 : progressPercent}%` }}
                  />
                </div>

                {/* Big Blue START / PAUSE Button */}
                <button
                  onClick={handleTogglePlay}
                  className={`w-full py-3.5 rounded-xl font-bold text-base transition flex items-center justify-center gap-2 shadow-lg ${
                    isRunning
                      ? 'bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white border border-[#3a3a3c]'
                      : 'bg-[#4f7cff] hover:bg-[#3a67ea] text-white shadow-[#4f7cff]/30'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-5 h-5 fill-current" />
                      <span>PAUSE</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>START</span>
                    </>
                  )}
                </button>

                {/* 3 Secondary Buttons: PAUSE, SKIP NEXT, +1 MIN */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <button
                    onClick={handlePause}
                    className="py-2.5 rounded-xl bg-[#262626] hover:bg-[#333333] border border-[#333333] text-white font-bold text-xs transition"
                  >
                    PAUSE
                  </button>
                  <button
                    onClick={handleSkipNext}
                    className="py-2.5 rounded-xl bg-[#262626] hover:bg-[#333333] border border-[#333333] text-white font-bold text-xs transition flex items-center justify-center gap-1"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    SKIP NEXT
                  </button>
                  <button
                    onClick={handleAddOneMin}
                    className="py-2.5 rounded-xl bg-[#262626] hover:bg-[#333333] border border-[#333333] text-[#eab54d] font-bold text-xs transition"
                  >
                    +1 MIN
                  </button>
                </div>
              </div>

              {/* Service Activities List Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Service Activities</h2>
                  <p className="text-[11px] text-[#737373]">Reorder or tap to select</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#4f7cff] hover:bg-[#3a67ea] text-white font-bold text-xs flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  ADD
                </button>
              </div>

              {/* Activities RecyclerView Simulator */}
              <div className="space-y-2 mb-5">
                {activities.map((act, index) => {
                  const isSelected = index === currentIndex;
                  return (
                    <div
                      key={act.id}
                      onClick={() => handleSelectActivity(index)}
                      className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#1c1c1e] border-[#eab54d] ring-1 ring-[#eab54d]/50'
                          : 'bg-[#171717] hover:bg-[#1c1c1e] border-[#2c2c2e]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveActivity(index, 'up');
                            }}
                            disabled={index === 0}
                            className="text-[#737373] hover:text-white disabled:opacity-20 p-0.5"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveActivity(index, 'down');
                            }}
                            disabled={index === activities.length - 1}
                            className="text-[#737373] hover:text-white disabled:opacity-20 p-0.5"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${isSelected ? 'text-[#eab54d]' : 'text-white'}`}>
                            {act.name}
                          </p>
                          <p className="text-[10px] text-[#737373]">Position #{index + 1}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-[#eab54d] bg-[#0a0a0a] px-2 py-1 rounded-md border border-[#262626]">
                          {formatTime(act.durationSeconds)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteActivity(index);
                          }}
                          className="text-[#ef4444] hover:text-[#f87171] p-1 rounded transition"
                          title="Delete activity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TV CONNECTION Card */}
              <div className="bg-[#1c1c1e] rounded-2xl p-4 border border-[#2c2c2e]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-[#eab54d]" />
                    <span className="font-bold text-xs text-[#eab54d] tracking-wider uppercase">TV CONNECTION</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isServerRunning
                        ? 'bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30'
                        : 'bg-[#ef4444]/15 text-[#f87171] border border-[#ef4444]/30'
                    }`}
                  >
                    {isServerRunning ? 'SERVER RUNNING' : 'SERVER STOPPED'}
                  </span>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl mx-auto w-44 h-44 shadow-md">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="TV Display QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-black text-xs">Generating QR...</div>
                  )}
                </div>

                <div className="text-center mt-3">
                  <p className="font-mono font-bold text-xs text-white">
                    {hotspotIp}:8080/display - Scan on TV Browser - Offline
                  </p>
                  <p className="text-[11px] text-[#737373] mt-1">
                    Connect Smart TV to phone Wi-Fi hotspot & open browser URL
                  </p>
                </div>

                {/* Hotspot IP Switcher for simulation */}
                <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-[#262626]">
                  <span className="text-[10px] text-[#737373]">Simulated IP:</span>
                  <select
                    value={hotspotIp}
                    onChange={(e) => setHotspotIp(e.target.value)}
                    className="bg-[#121212] border border-[#2c2c2e] text-xs text-[#a3a3a3] rounded px-2 py-0.5 outline-none"
                  >
                    <option value="192.168.43.1">192.168.43.1 (Default Hotspot)</option>
                    <option value="192.168.1.105">192.168.1.105 (Local Wi-Fi Router)</option>
                    <option value="10.0.0.2">10.0.0.2 (Private Subnet)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => setIsServerRunning(!isServerRunning)}
                    className={`py-2.5 rounded-xl font-bold text-xs transition ${
                      isServerRunning
                        ? 'bg-[#262626] hover:bg-[#333333] text-white border border-[#333333]'
                        : 'bg-[#4f7cff] hover:bg-[#3a67ea] text-white'
                    }`}
                  >
                    {isServerRunning ? 'STOP SERVER' : 'START OFFLINE SERVER'}
                  </button>
                  <button
                    onClick={() => setActiveTab('tv')}
                    className="py-2.5 rounded-xl bg-[#262626] hover:bg-[#333333] border border-[#333333] text-[#a3a3a3] hover:text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    Open TV View
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TV DISPLAY (Live 20vw display simulator) */}
        {activeTab === 'tv' && (
          <div
            ref={tvContainerRef}
            className={`flex-1 flex flex-col justify-between p-6 sm:p-12 transition-colors duration-300 relative ${
              isTimeUp ? 'bg-[#7f1d1d] animate-pulse' : 'bg-[#0a0a0a]'
            }`}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <span className="text-[#eab54d] font-black text-2xl sm:text-4xl tracking-wider uppercase">NOW:</span>
                <span className="text-white font-extrabold text-2xl sm:text-4xl tracking-wide uppercase">
                  {currentActivity?.name || 'SERVICE COMPLETE'}
                </span>
                {currentActivity && (
                  <span className="text-[#a3a3a3] font-bold text-xl sm:text-2xl hidden sm:inline">
                    ({formatTime(currentActivity.durationSeconds)})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-widest ${
                    isTimeUp
                      ? 'bg-[#ef4444] text-white'
                      : isRunning
                      ? 'bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]'
                      : 'bg-[#eab54d]/20 text-[#facc15] border border-[#eab54d]'
                  }`}
                >
                  {isTimeUp ? "TIME'S UP" : isRunning ? 'OFFLINE LIVE' : 'PAUSED'}
                </span>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                  title="Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Giant Center Timer: 20vw size */}
            <div className="flex-1 flex flex-col items-center justify-center text-center my-4">
              <div
                className="font-mono font-black text-white leading-none select-none tracking-tighter"
                style={{ fontSize: 'clamp(80px, 20vw, 240px)' }}
              >
                {formatTime(remainingSeconds)}
              </div>

              {isTimeUp && (
                <div className="text-3xl sm:text-6xl font-black text-white tracking-widest mt-4 animate-bounce">
                  TIME'S UP! (AUTO ADVANCE IN {timeUpCounter}S)
                </div>
              )}
            </div>

            {/* Progress Bar Container */}
            <div className="w-full my-4">
              <div className="w-full h-4 sm:h-5 bg-[#1a1a1a] rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-300 ${isTimeUp ? 'bg-[#ef4444]' : 'bg-[#eab54d]'}`}
                  style={{ width: `${isTimeUp ? 100 : progressPercent}%` }}
                />
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex items-center justify-between z-10 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-[#737373] font-bold text-xl sm:text-2xl uppercase tracking-wider">NEXT:</span>
                <span className="text-[#a3a3a3] font-extrabold text-xl sm:text-2xl uppercase tracking-wide">
                  {nextActivity ? `${nextActivity.name} (${formatTime(nextActivity.durationSeconds)})` : 'END OF SERVICE'}
                </span>
              </div>
              <div className="text-[#525252] font-mono text-xs sm:text-sm font-bold">
                NANOHTTPD PORT 8080 • NO INTERNET
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SPLIT VIEW (Side-by-side phone controller and TV display) */}
        {activeTab === 'split' && (
          <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Phone Controller (5 cols) */}
            <div className="lg:col-span-5 bg-[#121212] rounded-3xl p-5 border border-[#2c2c2e] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#4f7cff]" />
                  <span className="font-extrabold text-sm text-white">Phone Controller</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30">
                  CONTROLLING
                </span>
              </div>

              <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-[#2c2c2e] text-center mb-4">
                <span className="text-xs text-[#eab54d] font-bold uppercase">
                  NOW: {currentActivity?.name || 'None'}
                </span>
                <div className="font-mono font-black text-5xl my-2 text-white">{formatTime(remainingSeconds)}</div>
                <div className="text-[11px] text-[#737373] mb-3">
                  Next: {nextActivity?.name || 'End of Service'}
                </div>

                <div className="w-full h-2 bg-[#262626] rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full ${isTimeUp ? 'bg-[#ef4444]' : 'bg-[#eab54d]'}`}
                    style={{ width: `${isTimeUp ? 100 : progressPercent}%` }}
                  />
                </div>

                <button
                  onClick={handleTogglePlay}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                    isRunning
                      ? 'bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white border border-[#3a3a3c]'
                      : 'bg-[#4f7cff] hover:bg-[#3a67ea] text-white'
                  }`}
                >
                  {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  {isRunning ? 'PAUSE' : 'START'}
                </button>

                <div className="grid grid-cols-3 gap-2 mt-2">
                  <button
                    onClick={handlePause}
                    className="py-2 rounded-lg bg-[#262626] text-white text-xs font-bold"
                  >
                    PAUSE
                  </button>
                  <button
                    onClick={handleSkipNext}
                    className="py-2 rounded-lg bg-[#262626] text-white text-xs font-bold"
                  >
                    SKIP
                  </button>
                  <button
                    onClick={handleAddOneMin}
                    className="py-2 rounded-lg bg-[#262626] text-[#eab54d] text-xs font-bold"
                  >
                    +1 MIN
                  </button>
                </div>
              </div>

              {/* Schedule summary */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">Service Items</span>
                {activities.map((act, i) => (
                  <div
                    key={act.id}
                    onClick={() => handleSelectActivity(i)}
                    className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer ${
                      i === currentIndex
                        ? 'bg-[#1c1c1e] text-[#eab54d] font-bold border border-[#eab54d]/40'
                        : 'bg-[#171717] text-[#a3a3a3]'
                    }`}
                  >
                    <span>{act.name}</span>
                    <span className="font-mono">{formatTime(act.durationSeconds)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: TV Display Screen (7 cols) */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-[#eab54d]" />
                  <span className="font-extrabold text-sm text-white">Smart TV View (http://{hotspotIp}:8080/display)</span>
                </div>
                <span className="text-xs text-[#737373]">Live Browser Output</span>
              </div>

              <div
                className={`w-full aspect-video rounded-3xl p-6 flex flex-col justify-between border border-[#2c2c2e] shadow-2xl transition-colors duration-300 ${
                  isTimeUp ? 'bg-[#7f1d1d]' : 'bg-[#0a0a0a]'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[#eab54d] font-bold text-lg">NOW:</span>
                    <span className="text-white font-extrabold text-lg uppercase">{currentActivity?.name}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      isTimeUp ? 'bg-[#ef4444] text-white' : 'bg-[#22c55e]/20 text-[#4ade80]'
                    }`}
                  >
                    {isTimeUp ? "TIME'S UP" : 'LIVE'}
                  </span>
                </div>

                <div className="text-center my-auto">
                  <div className="font-mono font-black text-6xl sm:text-7xl text-white">
                    {formatTime(remainingSeconds)}
                  </div>
                  {isTimeUp && (
                    <div className="text-lg font-black text-white mt-1 animate-pulse">TIME'S UP!</div>
                  )}
                </div>

                <div>
                  <div className="w-full h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full ${isTimeUp ? 'bg-[#ef4444]' : 'bg-[#eab54d]'}`}
                      style={{ width: `${isTimeUp ? 100 : progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[#a3a3a3]">
                    <span>NEXT: {nextActivity?.name || 'END OF SERVICE'}</span>
                    <span className="font-mono text-[10px]">TV BROWSER SYNC</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-[#121212] border border-[#2c2c2e] text-xs text-[#a3a3a3] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#4f7cff]" />
                  <span>NanoHTTPD responds to <code>/time</code> every 500ms</span>
                </div>
                <span className="text-[#4ade80] font-mono font-bold">200 OK</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROJECT CODE EXPLORER & COPY */}
        {activeTab === 'files' && (
          <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">Android Source Code Explorer</h2>
                <p className="text-xs text-[#a3a3a3]">
                  All files generated for <code>com.church.timer.offline</code> • TargetSdk 34 • ViewBinding • NanoHTTPD
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyFile}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[#2c2c2e] text-xs font-bold transition"
                >
                  {copiedFile ? (
                    <>
                      <Check className="w-4 h-4 text-[#4ade80]" />
                      <span className="text-[#4ade80]">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Current File</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadZip}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4f7cff] hover:bg-[#3a67ea] text-white text-xs font-bold transition shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Download All (.ZIP)</span>
                </button>
              </div>
            </div>

            {/* Filter buttons & Search */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex flex-wrap gap-1.5 bg-[#121212] p-1 rounded-xl border border-[#262626]">
                {(['all', 'kotlin', 'layout', 'gradle', 'workflow', 'res', 'asset'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFileFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                      fileFilter === cat ? 'bg-[#4f7cff] text-white' : 'text-[#a3a3a3] hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Search file path or description..."
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                className="flex-1 bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-xs text-white placeholder-[#737373] outline-none focus:border-[#4f7cff]"
              />
            </div>

            {/* Split Explorer: Left File List, Right Code Viewer */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 bg-[#121212] rounded-2xl border border-[#262626] overflow-hidden min-h-[500px]">
              {/* File list (4 cols) */}
              <div className="md:col-span-4 border-r border-[#262626] flex flex-col max-h-[700px] overflow-y-auto">
                <div className="p-3 bg-[#171717] border-b border-[#262626] text-xs font-bold text-[#737373] uppercase tracking-wider">
                  Files ({filteredFiles.length})
                </div>
                <div className="divide-y divide-[#1e1e1e]">
                  {filteredFiles.map((file) => {
                    const isSelected = selectedFile.path === file.path;
                    return (
                      <button
                        key={file.path}
                        onClick={() => setSelectedFile(file)}
                        className={`w-full text-left p-3 transition flex flex-col gap-1 ${
                          isSelected ? 'bg-[#1c1c1e] border-l-4 border-l-[#4f7cff]' : 'hover:bg-[#171717]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-mono text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-[#a3a3a3]'}`}>
                            {file.path.split('/').pop()}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold bg-[#262626] text-[#a3a3a3]">
                            {file.category}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#737373] truncate">{file.path}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Code Viewer (8 cols) */}
              <div className="md:col-span-8 flex flex-col max-h-[700px] overflow-hidden bg-[#0d0d0d]">
                <div className="p-3 bg-[#171717] border-b border-[#262626] flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-white">{selectedFile.path}</span>
                    <p className="text-[11px] text-[#737373] mt-0.5">{selectedFile.description}</p>
                  </div>
                  <button
                    onClick={handleCopyFile}
                    className="p-1.5 rounded-lg bg-[#262626] hover:bg-[#333333] text-white transition text-xs flex items-center gap-1 font-semibold"
                  >
                    {copiedFile ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFile ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-[#e5e5e5] bg-[#0a0a0a]">
                  <pre className="whitespace-pre">
                    {selectedFile.content.split('\n').map((line, idx) => (
                      <div key={idx} className="flex">
                        <span className="w-10 select-none text-[#525252] text-right pr-4 shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-[#d4d4d4]">{line}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GITHUB ACTIONS CI AUTO-BUILD GUIDE */}
        {activeTab === 'github' && (
          <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6">
            <div className="bg-[#121212] rounded-3xl p-6 sm:p-8 border border-[#2c2c2e]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#22c55e]/20 border border-[#22c55e]/40 flex items-center justify-center">
                  <Check className="w-6 h-6 text-[#4ade80]" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">GitHub Actions CI: 100% Ready</h2>
                  <p className="text-xs text-[#a3a3a3]">
                    No Android Studio, emulator, or local SDK installation required.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#1c1c1e] border border-[#2c2c2e] mb-6">
                <h3 className="font-bold text-sm text-[#eab54d] mb-1">How It Works</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  The repository includes <code>.github/workflows/build.yml</code>, the official Gradle wrapper (v8.4),
                  and targetSdk 34 dependencies from MavenCentral. When pushed to GitHub, an Ubuntu runner automatically
                  sets up JDK 17, executes <code>./gradlew assembleDebug</code>, and uploads the compiled APK to GitHub Artifacts.
                </p>
              </div>

              {/* 4 Step Push Guide */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Quick Push Instructions</h3>

                <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#262626]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#4f7cff]">Step 1: Download & Extract Project ZIP</span>
                    <button
                      onClick={handleDownloadZip}
                      className="text-xs font-bold text-[#4f7cff] hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Download ZIP
                    </button>
                  </div>
                  <p className="text-xs text-[#737373]">
                    Download the project zip using the button above and extract it into a local folder.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#262626]">
                  <span className="text-xs font-bold text-[#4f7cff] block mb-2">
                    Step 2: Push to Your GitHub Repository
                  </span>
                  <div className="bg-[#171717] p-3 rounded-lg font-mono text-xs text-[#a3a3a3] space-y-1 overflow-x-auto">
                    <p>git init</p>
                    <p>git add .</p>
                    <p>git commit -m "feat: ChurchTimerOffline complete Android project"</p>
                    <p>git branch -M main</p>
                    <p>git remote add origin https://github.com/YOUR_USERNAME/church-timer-offline.git</p>
                    <p>git push -u origin main</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#262626]">
                  <span className="text-xs font-bold text-[#4f7cff] block mb-2">
                    Step 3: Watch the Green Checkmark in Actions
                  </span>
                  <p className="text-xs text-[#737373]">
                    Navigate to your GitHub repository's <strong>Actions</strong> tab. You will see the job:
                    <br />
                    <code className="text-[#4ade80]">Build ChurchTimerOffline Android APK &gt; Build & Assemble Debug APK</code>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#262626]">
                  <span className="text-xs font-bold text-[#4f7cff] block mb-2">
                    Step 4: Download Your APK Artifact
                  </span>
                  <p className="text-xs text-[#737373]">
                    Under the completed run, scroll to <strong>Artifacts</strong> and click{' '}
                    <strong className="text-white">ChurchTimerOffline-v1.0-debug</strong> to download the ready-to-install APK on your phone or Android TV box!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Activity Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-extrabold text-lg text-white mb-4">Add Service Activity</h3>

            <form onSubmit={handleAddActivity} className="space-y-4">
              <div>
                <label className="text-xs text-[#a3a3a3] font-bold block mb-1">Activity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sermon, Worship, Announcements"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-[#121212] border border-[#2c2c2e] rounded-xl px-3 py-2 text-sm text-white placeholder-[#737373] outline-none focus:border-[#4f7cff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#a3a3a3] font-bold block mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={newActivityMinutes}
                    onChange={(e) => setNewActivityMinutes(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2c2c2e] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#4f7cff]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#a3a3a3] font-bold block mb-1">Seconds</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={newActivitySeconds}
                    onChange={(e) => setNewActivitySeconds(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2c2c2e] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#4f7cff]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#262626] text-[#a3a3a3] hover:text-white font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#4f7cff] hover:bg-[#3a67ea] text-white font-bold text-xs transition shadow"
                >
                  Add Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
