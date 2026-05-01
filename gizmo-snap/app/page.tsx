"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { QRCodeCanvas } from "qrcode.react";
import Link from "next/link";
import { Camera, RefreshCcw, Play, Square, Sparkles, Loader2, LogIn, LogOut, Crown, Bug, ShieldAlert, LayoutGrid, Smartphone, Palette, ArrowRight, Lock } from "lucide-react";
// NHÚNG BỘ VẼ VECTOR VÀO GIAO DIỆN CHÍNH
import FrameComposer from "@/components/FrameComposer";

type FrameLayout = '2x2' | 'strip3' | 'strip4' | 'polaroid' | 'film' | 'grid6';
type FrameTheme = 'dark' | 'pink' | 'cyberpunk' | 'spiderman' | '30_4' | 'vietnam' | 'hello_kitty';

export default function Photobooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [step, setStep] = useState<number>(1);
  const [layout, setLayout] = useState<FrameLayout>('2x2');
  const [theme, setTheme] = useState<FrameTheme>('dark');
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [hasDecremented, setHasDecremented] = useState<boolean>(false);

  const [isAutoMode, setIsAutoMode] = useState<boolean>(false);
  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerInterval, setTimerInterval] = useState<number>(5);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [qrLink, setQrLink] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // STATE KÍCH HOẠT BỘ VẼ VECTOR
  const [isLoadingComposer, setIsLoadingComposer] = useState<boolean>(false);

  // Kiểm tra quyền Premium
  const isPremium = profile?.plan === 'pro' || profile?.plan === 'limitless' || profile?.plan === 'exclusive';

  const maxPhotosMap: Record<FrameLayout, number> = { '2x2': 4, 'strip3': 3, 'strip4': 4, 'polaroid': 1, 'film': 3, 'grid6': 6 };
  const maxPhotos = maxPhotosMap[layout];

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.rpc('check_and_reset_shoots', { user_id: userId });
    if (data) setProfile(data);
    else {
      const { data: fallback } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (fallback) setProfile(fallback);
    }
  };

  const loginWithGoogle = async () => { await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } }); };
  const logout = async () => { await supabase.auth.signOut(); setUser(null); setProfile(null); };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { alert("Không thể truy cập camera. Vui lòng cấp quyền!"); }
  };

  useEffect(() => { if (step === 2) startCamera(); }, [step]);

  useEffect(() => {
    const autoDecrement = async () => {
      if (photos.length === maxPhotos && !hasDecremented && user && profile?.plan !== 'exclusive' && profile?.plan !== 'limitless') {
        setHasDecremented(true);
        setProfile((prev: any) => ({ ...prev, daily_shoots: prev.daily_shoots - 1 }));
        await supabase.rpc('decrement_daily_shoots', { user_id: user.id });
      }
    };
    autoDecrement();
  }, [photos.length, hasDecremented, user, profile, maxPhotos]);

  const captureWithFlash = useCallback(async () => {
    setIsFlashing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setPhotos((prev) => [...prev, canvas.toDataURL("image/png")]);
      }
    }
    setTimeout(() => setIsFlashing(false), 200);
  }, []);

  const handleDebugMode = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const fakePhotos: string[] = [];
    for(let i=0; i<maxPhotos; i++) {
      ctx.fillStyle = '#' + Math.floor(Math.random()*16777215).toString(16);
      ctx.fillRect(0, 0, 640, 360);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center';
      ctx.fillText(`MOCK ${i+1}`, 320, 180);
      fakePhotos.push(canvas.toDataURL("image/png"));
    }
    setPhotos(fakePhotos); setHasDecremented(true); 
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isShooting && countdown !== null && countdown > 0) timer = setTimeout(() => setCountdown((prev) => prev! - 1), 1000);
    else if (isShooting && countdown === 0) { setCountdown(null); captureWithFlash(); }
    return () => clearTimeout(timer);
  }, [isShooting, countdown, captureWithFlash]);

  const prevPhotosLength = useRef(photos.length);
  useEffect(() => {
    if (isShooting && photos.length > prevPhotosLength.current && photos.length < maxPhotos) setCountdown(timerInterval);
    else if (photos.length >= maxPhotos) { setIsShooting(false); setCountdown(null); }
    prevPhotosLength.current = photos.length;
  }, [photos.length, isShooting, timerInterval, maxPhotos]);

  const startAutoShoot = () => {
    if (user && !isPremium && profile?.daily_shoots <= 0) { alert("Hết lượt chụp!"); return; }
    if (photos.length >= maxPhotos) return;
    setIsShooting(true); setCountdown(timerInterval);
  };
  const stopAutoShoot = () => { setIsShooting(false); setCountdown(null); };
  const resetBooth = () => { setPhotos([]); setHasDecremented(false); setIsShooting(false); setCountdown(null); setQrLink(null); };

  const uploadToDrive = async (finalImageUrl: string) => {
    setIsUploading(true);
    try {
      const fetchResponse = await fetch(finalImageUrl);
      const blob = await fetchResponse.blob();
      const formData = new FormData(); formData.append('file', blob, 'gizmo-snap.jpg');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) setQrLink(data.link); else alert("Lỗi API: " + data.error);
    } catch (err: any) { alert("Lỗi kết nối: " + err.message); } finally { setIsUploading(false); setIsLoadingComposer(false); }
  };

  // KHI BẤM NÚT SẼ BẬT CÔNG TẮC CHO FRAME_COMPOSER CHẠY
  const handleGenerateClick = () => {
    if (!user) { alert("Vui lòng đăng nhập!"); return; }
    setIsLoadingComposer(true);
  };

  // NHẬN ẢNH VECTOR ĐÃ VẼ XONG TỪ COMPOSER VÀ UPLOAD
  const handleComposerSuccess = (base64Image: string) => {
    uploadToDrive(base64Image);
  };

  const handleComposerError = (err: any) => {
    setIsLoadingComposer(false);
    alert("Lỗi khi vẽ khung Vector: " + err.message);
  };

  // UI Dữ liệu
  const layouts = [
    { id: '2x2', name: 'Lưới 2x2', desc: '4 ảnh vuông', prem: false },
    { id: 'strip3', name: 'Dải 3 ảnh', desc: 'Dọc cổ điển', prem: false },
    { id: 'strip4', name: 'Dải 4 ảnh', desc: 'Dọc tiêu chuẩn', prem: false },
    { id: 'polaroid', name: 'Polaroid', desc: '1 ảnh lớn', prem: false },
    { id: 'film', name: 'Cuộn Phim', desc: '3 ngang', prem: false },
    { id: 'grid6', name: 'Lưới 3x2', desc: '6 ảnh (PRO+)', prem: true },
  ];
  
  const themes = [
    { id: 'dark', name: 'Dark Classic', prem: false, color: 'bg-slate-900 border-gray-600' },
    { id: 'pink', name: 'Pinky Cute', prem: false, color: 'bg-pink-100 border-pink-400 text-pink-900' },
    { id: 'hello_kitty', name: 'Hello Kitty', prem: false, color: 'bg-pink-200 border-pink-500 text-pink-800 shadow-[0_0_10px_#f472b6]' },
    { id: 'cyberpunk', name: 'Cyberpunk', prem: true, color: 'bg-black border-green-500 text-green-400 shadow-[0_0_10px_#22c55e]' },
    { id: 'spiderman', name: 'Spider-Verse', prem: true, color: 'bg-red-700 border-blue-600 text-yellow-300 shadow-[0_0_15px_#dc2626]' },
    { id: '30_4', name: 'Đại Thắng 30/4', prem: true, color: 'bg-red-800 border-yellow-400 text-yellow-200' },
    { id: 'vietnam', name: 'Tự Hào VN', prem: true, color: 'bg-red-900 border-yellow-500 text-yellow-400' },
  ];

  const handleSelect = (type: 'layout'|'theme', id: string, prem: boolean) => {
    if (prem && !isPremium) { alert("Gói FREE không thể dùng tính năng này. Hãy nâng cấp VIP nhé!"); return; }
    if (type === 'layout') setLayout(id as FrameLayout); else setTheme(id as FrameTheme);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6 font-sans">
      {isFlashing && <div className="fixed inset-0 bg-white z-[9999] opacity-100 transition-opacity duration-300 mix-blend-screen pointer-events-none" />}

      {/* NAVBAR */}
      <div className="w-full max-w-7xl flex justify-between items-center mb-8 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl">
        <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 tracking-tight flex items-center gap-2 cursor-pointer" onClick={() => setStep(1)}>
          <Camera size={32} className="text-pink-500" /> Gizmo Snap
        </h1>
        {user ? (
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="hidden sm:flex items-center gap-2 text-sm font-semibold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition">
              <Crown size={16} className="text-yellow-400" /> Bảng giá
            </Link>
            {profile?.role === 'admin' && step === 2 && (
              <button onClick={handleDebugMode} className="hidden lg:flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/40 px-3 py-1.5 rounded-lg text-sm font-bold transition">
                <Bug size={16} /> Debug Mock
              </button>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-200">{user.email}</p>
              <div className="flex items-center justify-end gap-2 mt-1">
                <span className="text-[10px] bg-gradient-to-r from-pink-500 to-violet-500 text-white px-2 py-0.5 rounded-full uppercase font-bold tracking-wider shadow-lg">{profile?.plan || "free"}</span>
                {!isPremium && <span className="text-[10px] bg-white/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-bold">Còn: {profile?.daily_shoots || 0} lượt</span>}
              </div>
            </div>
            <img src={user.user_metadata?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} className="w-11 h-11 rounded-full border-2 border-pink-500 shadow-lg object-cover" alt="avatar" />
            <button onClick={logout} className="text-gray-400 hover:text-red-400 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"><LogOut size={20} /></button>
          </div>
        ) : (
          <button onClick={loginWithGoogle} className="flex items-center gap-2 bg-white text-slate-900 font-bold py-2 px-6 rounded-xl hover:bg-gray-100 transition-all shadow-lg transform hover:scale-105"><LogIn size={18} /> Đăng nhập</button>
        )}
      </div>

      {/* --- MÀN HÌNH BƯỚC 1: SETUP KHUNG ẢNH --- */}
      {step === 1 && (
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl items-stretch animate-in fade-in zoom-in duration-500">
          
          {/* Bảng chọn bên trái */}
          <div className="flex-1 bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl">
            <h2 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-violet-400">Tùy Chỉnh Khung & Theme</h2>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-200"><LayoutGrid size={20} className="text-pink-400"/> Chọn Kích Thước</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {layouts.map((item) => (
                  <button key={item.id} onClick={() => handleSelect('layout', item.id, item.prem)} className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-start relative ${layout === item.id ? 'border-pink-500 bg-pink-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                    {item.prem && <Lock size={14} className="absolute top-2 right-2 text-yellow-500" />}
                    <div className="font-bold text-sm">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-200"><Palette size={20} className="text-violet-400"/> Chọn Phong Cách Độc Quyền</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {themes.map((item) => (
                  <button key={item.id} onClick={() => handleSelect('theme', item.id, item.prem)} className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between font-bold text-sm ${item.color} ${theme === item.id ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900 scale-105 z-10' : 'opacity-80 hover:opacity-100'}`}>
                    {item.name} {item.prem && <Lock size={14} className="opacity-80" />}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => { if(!user) { alert("Đăng nhập để chụp!"); return; } setStep(2); resetBooth(); }} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold py-4 rounded-2xl shadow-xl transform transition hover:scale-[1.02] text-lg">
              Vào bốt chụp <ArrowRight size={24} />
            </button>
          </div>

          {/* Màn hình Nháp CSS bên phải */}
          <div className="w-full lg:w-[400px] bg-slate-800/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center">
             <h3 className="text-lg font-semibold mb-6 text-gray-300">Xem trước CSS (Bản nháp)</h3>
             <div className={`transition-all duration-500 rounded-xl p-4 flex flex-col items-center shadow-2xl ${themes.find(t => t.id === theme)?.color} w-[260px] max-h-[400px]`}>
                <h4 className="font-black text-xl mb-4 text-center tracking-wider">{theme.toUpperCase()}</h4>
                
                <div className={`grid gap-2 w-full ${layout === '2x2' || layout === 'grid6' ? 'grid-cols-2' : layout === 'film' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                   {[...Array(maxPhotosMap[layout])].map((_, i) => (
                     <div key={i} className="bg-black/50 w-full aspect-video rounded border border-white/30 flex items-center justify-center">
                        <Camera size={16} className="opacity-50" />
                     </div>
                   ))}
                </div>
             </div>
             <p className="text-xs text-gray-400 mt-8 text-center px-4">Bản vẽ Vector nghệ thuật siêu chi tiết sẽ được tự động vẽ ra sau khi bạn bấm chụp ở Bước 2.</p>
          </div>
        </div>
      )}

      {/* --- MÀN HÌNH BƯỚC 2: CHỤP ẢNH --- */}
      {step === 2 && (
        <div className="flex flex-col xl:flex-row gap-8 w-full max-w-7xl justify-center items-start animate-in slide-in-from-right-10 fade-in duration-500">
          
          {/* CỘT TRÁI: CAMERA */}
          <div className="flex flex-col items-center bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl flex-1">
            <div className="flex justify-between w-full mb-4">
               <button onClick={() => { setStep(1); stopAutoShoot(); }} className="text-sm text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 px-3 py-1 rounded-lg transition"><ArrowRight className="rotate-180" size={16}/> Đổi khung</button>
               <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5">
                <button onClick={() => { setIsAutoMode(false); stopAutoShoot(); }} className={`px-6 py-1.5 rounded-lg transition-all text-sm font-semibold ${!isAutoMode ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white' : 'text-gray-400'}`}>Thủ công</button>
                <button onClick={() => setIsAutoMode(true)} className={`px-6 py-1.5 rounded-lg transition-all text-sm font-semibold ${isAutoMode ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white' : 'text-gray-400'}`}>Tự động</button>
              </div>
            </div>

            <div className="relative border border-white/20 rounded-2xl overflow-hidden mb-6 bg-black w-[640px] h-[360px] shadow-2xl">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
              {countdown !== null && countdown > 0 && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm z-10"><span className="text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(236,72,153,0.8)] animate-pulse">{countdown}</span></div>}
            </div>

            <div className="flex gap-4 w-full justify-center">
              {!isAutoMode ? (
                <button onClick={() => { if (user && !isPremium && profile?.daily_shoots <= 0) { alert("Hết lượt chụp!"); return; } captureWithFlash(); }} disabled={photos.length >= maxPhotos} className={`flex items-center gap-2 font-bold py-3.5 px-8 rounded-2xl shadow-xl transition-all active:scale-95 ${photos.length >= maxPhotos ? "bg-gray-600 text-gray-400" : "bg-gradient-to-r from-pink-500 to-violet-500 text-white"}`}>
                  <Camera size={20} /> Chụp ({photos.length}/{maxPhotos})
                </button>
              ) : (
                !isShooting ? (
                  <button onClick={startAutoShoot} disabled={photos.length >= maxPhotos} className={`flex items-center gap-2 font-bold py-3.5 px-8 rounded-2xl shadow-xl transition-all active:scale-95 ${photos.length >= maxPhotos ? "bg-gray-600 text-gray-400" : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"}`}>
                    <Play size={20} /> Bắt đầu ({photos.length}/{maxPhotos})
                  </button>
                ) : (
                  <button onClick={stopAutoShoot} className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold py-3.5 px-8 rounded-2xl shadow-xl active:scale-95"><Square size={20} fill="currentColor" /> Dừng lại</button>
                )
              )}
              <button onClick={resetBooth} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 px-6 rounded-2xl transition-all"><RefreshCcw size={20} /> Xóa</button>
            </div>
          </div>

          {/* CỘT PHẢI: PREVIEW ẢNH ĐÃ CHỤP & RENDER VECTOR */}
          <div className="flex flex-col items-center bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl shrink-0 min-w-[360px]">
            <h2 className="text-xl font-bold mb-4 text-gray-200 flex items-center gap-2">Nháp Khung {layout.toUpperCase()}</h2>
            
            <div className={`p-2 bg-slate-900/50 border border-white/10 shadow-inner rounded-xl grid gap-2 ${layout === '2x2' || layout === 'grid6' ? 'grid-cols-2 w-[340px]' : layout === 'film' ? 'grid-cols-3 w-[340px]' : layout === 'polaroid' ? 'grid-cols-1 w-[300px]' : 'grid-cols-1 w-[200px]'}`}>
              {[...Array(maxPhotos)].map((_, index) => (
                <div key={index} className="bg-slate-800/50 w-full aspect-video flex items-center justify-center overflow-hidden rounded-md border border-white/5 relative">
                  {photos[index] ? <img src={photos[index]} className="w-full h-full object-cover" /> : <Camera size={16} className="text-slate-600" />}
                </div>
              ))}
            </div>

            {/* NÚT KÍCH HOẠT VẼ VECTOR (Chỉ hiện khi đã chụp đủ ảnh) */}
            {photos.length === maxPhotos && !qrLink && (
              <button onClick={handleGenerateClick} disabled={isLoadingComposer || isUploading} className={`flex items-center justify-center w-full mt-6 text-white font-bold py-4 rounded-2xl transition-all ${isLoadingComposer || isUploading ? 'bg-white/10 cursor-wait' : 'bg-gradient-to-r from-pink-500 to-violet-500 hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transform hover:-translate-y-1'}`}>
                {isLoadingComposer || isUploading ? <><Loader2 size={20} className="animate-spin mr-2" /> Hệ thống đang vẽ & tải ảnh...</> : <><Sparkles size={20} className="mr-2" /> Tạo ảnh Vector & Nhận QR</>}
              </button>
            )}

            {/* HIỆN MÃ QR KHI HOÀN THÀNH */}
            {qrLink && (
              <div className="mt-6 flex flex-col items-center bg-white p-4 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-500">
                <div className="p-2 border-4 border-pink-100 rounded-xl mb-2"><QRCodeCanvas value={qrLink} size={140} level={"H"} includeMargin={false} /></div>
                <p className="text-slate-800 font-bold text-xs text-center">Quét QR lưu ảnh gốc</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPONENT VẼ VECTOR ẨN */}
      <FrameComposer
        photos={photos}
        layout={layout}
        theme={theme}
        isPremium={isPremium}
        isLoading={isLoadingComposer}
        onGenerateSuccess={handleComposerSuccess}
        onGenerateError={handleComposerError}
        userEmail={user?.email}
      />

    </div>
  );
}