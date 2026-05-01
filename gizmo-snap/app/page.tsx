"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { QRCodeCanvas } from "qrcode.react";
import Link from "next/link";
import { Camera, RefreshCcw, Play, Square, Sparkles, Loader2, LogIn, LogOut, Crown, Bug, LayoutGrid, Palette, ArrowRight, Lock, Wand2, GraduationCap, Printer, Truck, X, Package, ShieldCheck } from "lucide-react";
import FrameComposer from "@/components/FrameComposer";

type FrameLayout = '2x2' | 'strip3' | 'strip4' | 'polaroid' | 'film' | 'grid6';
type FrameTheme = 'dark' | 'pink' | 'hello_kitty' | 'minimal' | 'ocean' | 'sunset' | 'pastel' | 'nature' | 'y2k' | 'wedding' | 'neon' | 'retro' | 'spiderman' | '30_4' | 'vietnam' | 'golden' | 'cyberpunk' | 'newspaper' | 'kawaii' | 'gothic' | 'holo' | 'vnu_theme';
type ImageFilter = 'none' | 'sepia' | 'grayscale' | 'vintage' | 'brighten' | 'cool';

export const getDirectDriveLink = (url: string) => {
  if (!url) return '';
  const match = url.match(/\/d\/(.+?)\//);
  if (match && match[1]) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  return url;
};

export default function Photobooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [step, setStep] = useState<number>(1);
  const [layout, setLayout] = useState<FrameLayout>('2x2');
  const [theme, setTheme] = useState<FrameTheme>('minimal');
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
  const [isLoadingComposer, setIsLoadingComposer] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<ImageFilter>('none');
  const [skinSmoothness, setSkinSmoothness] = useState<number>(50);

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printForm, setPrintForm] = useState({ name: '', phone: '', address: '' });
  const [isSubmittingPrint, setIsSubmittingPrint] = useState(false);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);

  const isPremium = ['pro', 'limitless', 'exclusive', 'vnu'].includes(profile?.plan);
  const maxPhotosMap: Record<FrameLayout, number> = { '2x2': 4, 'strip3': 3, 'strip4': 4, 'polaroid': 1, 'film': 3, 'grid6': 6 };
  const maxPhotos = maxPhotosMap[layout];

  useEffect(() => {
    const getSession = async () => {
      const { data: setting } = await supabase.from('site_settings').select('value').eq('id', 'maintenance').single();
      if (setting?.value === 'true') setIsMaintenance(true);

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
    }; getSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null); if (session?.user) fetchProfile(session.user); else setProfile(null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userData: any) => {
    // 1. Lấy dữ liệu từ hàm RPC
    let { data } = await supabase.rpc('check_and_reset_shoots', { user_id: userData.id });
    
    // 2. SỬA LỖI: Mở chiếc hộp Array ra để lấy Object thật
    let currentProfile = null;
    if (Array.isArray(data) && data.length > 0) currentProfile = data[0];
    else if (data && !Array.isArray(data)) currentProfile = data;

    // 3. Fallback lấy thường
    if (!currentProfile) { 
      const { data: fallback } = await supabase.from("profiles").select("*").eq("id", userData.id).single(); 
      currentProfile = fallback; 
    }

    // 4. SỬA LỖI KHÁCH HÀNG MỚI TINH: Tự động khởi tạo Free 10 lượt
    if (!currentProfile) {
      const newProfile = { id: userData.id, role: 'user', plan: 'free', daily_shoots: 10 };
      await supabase.from('profiles').insert([newProfile]);
      currentProfile = newProfile;
    }

    // 5. Kiểm tra VNU
    if (userData.email?.endsWith('@vnu.edu.vn') && currentProfile?.plan !== 'vnu' && currentProfile?.plan !== 'limitless' && currentProfile?.plan !== 'exclusive') {
      await supabase.from('profiles').update({ plan: 'vnu', daily_shoots: 50 }).eq('id', userData.id);
      currentProfile.plan = 'vnu'; currentProfile.daily_shoots = 50;
      alert("🎉 TING TING! Hệ thống nhận diện Email VNU. Tặng bạn gói Đặc quyền!");
    }
    
    setProfile(currentProfile);
  };

  const fetchMyOrders = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('print_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!error && data) setMyOrders(data);
    setShowOrdersModal(true);
  };

  const submitPrintRequest = async (e: React.FormEvent) => {
    e.preventDefault(); if (!qrLink || !user) return; setIsSubmittingPrint(true);
    const { error } = await supabase.from('print_requests').insert([{ user_id: user.id, user_email: user.email, image_url: qrLink, customer_name: printForm.name, phone: printForm.phone, address: printForm.address }]);
    setIsSubmittingPrint(false);
    if (error) alert("Lỗi khi gửi yêu cầu: " + error.message);
    else { alert("🎉 Đã gửi yêu cầu in ảnh!"); setShowPrintModal(false); }
  };

  const loginWithGoogle = async () => { await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } }); };
  const logout = async () => { await supabase.auth.signOut(); setUser(null); setProfile(null); };

  const startCamera = async () => {
    try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { alert("Không thể truy cập camera."); }
  };
  useEffect(() => { if (step === 2) startCamera(); }, [step]);

  useEffect(() => {
    const autoDecrement = async () => {
      if (photos.length === maxPhotos && !hasDecremented && user && !['limitless', 'exclusive'].includes(profile?.plan)) {
        setHasDecremented(true); setProfile((prev: any) => ({ ...prev, daily_shoots: prev.daily_shoots - 1 }));
        await supabase.rpc('decrement_daily_shoots', { user_id: user.id });
      }
    }; autoDecrement();
  }, [photos.length, hasDecremented, user, profile, maxPhotos]);

  const captureWithFlash = useCallback(async () => {
    setIsFlashing(true); await new Promise((resolve) => setTimeout(resolve, 500));
    if (videoRef.current) {
      const video = videoRef.current; const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth; canvas.height = video.videoHeight; const ctx = canvas.getContext("2d");
      if (ctx) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0, canvas.width, canvas.height); setPhotos((prev) => [...prev, canvas.toDataURL("image/png")]); }
    } setTimeout(() => setIsFlashing(false), 200);
  }, []);

  const handleDebugMode = () => {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 360; const ctx = canvas.getContext('2d'); if (!ctx) return;
    const fakePhotos: string[] = [];
    for(let i=0; i<maxPhotos; i++) {
      ctx.fillStyle = '#' + Math.floor(Math.random()*16777215).toString(16); ctx.fillRect(0, 0, 640, 360);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.fillText(`MOCK ${i+1}`, 320, 180); fakePhotos.push(canvas.toDataURL("image/png"));
    } setPhotos(fakePhotos); setHasDecremented(true); 
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
    if (user && profile?.plan !== 'limitless' && profile?.plan !== 'exclusive' && profile?.daily_shoots <= 0) { alert("Hết lượt chụp!"); return; }
    if (photos.length >= maxPhotos) return; setIsShooting(true); setCountdown(timerInterval);
  };
  const stopAutoShoot = () => { setIsShooting(false); setCountdown(null); };
  const resetBooth = () => { setPhotos([]); setHasDecremented(false); setIsShooting(false); setCountdown(null); setQrLink(null); };

  const uploadToDrive = async (finalImageUrl: string) => {
    setIsUploading(true);
    try {
      const fetchResponse = await fetch(finalImageUrl); const blob = await fetchResponse.blob();
      const formData = new FormData(); formData.append('file', blob, 'gizmo-snap.jpg');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setQrLink(data.link);
        if (user) await supabase.from('photos').insert([{ user_id: user.id, user_email: user.email, image_url: data.link }]);
      } else alert("Lỗi API: " + data.error);
    } catch (err: any) { alert("Lỗi kết nối: " + err.message); } finally { setIsUploading(false); setIsLoadingComposer(false); }
  };

  const handleGenerateClick = () => { if (!user) { alert("Vui lòng đăng nhập!"); return; } setIsLoadingComposer(true); };
  const handleComposerSuccess = (base64Image: string) => uploadToDrive(base64Image);
  const handleComposerError = (err: any) => { setIsLoadingComposer(false); alert("Lỗi vẽ: " + err.message); };

  const layouts = [
    { id: '2x2', name: 'Lưới 2x2', desc: '4 ảnh vuông', prem: false }, { id: 'strip3', name: 'Dải 3 ảnh', desc: 'Dọc cổ điển', prem: false },
    { id: 'strip4', name: 'Dải 4 ảnh', desc: 'Dọc tiêu chuẩn', prem: false }, { id: 'polaroid', name: 'Polaroid', desc: '1 ảnh lớn', prem: false },
    { id: 'film', name: 'Cuộn Phim', desc: '3 ngang', prem: false }, { id: 'grid6', name: 'Lưới 3x2', desc: '6 ảnh (PRO+)', prem: true },
  ];
  
  const themes = [
    { id: 'minimal', name: 'Minimal White', prem: false, color: 'bg-white border-gray-300 text-gray-800 shadow-md' }, { id: 'dark', name: 'Dark Classic', prem: false, color: 'bg-slate-900 border-slate-700 text-slate-300' }, { id: 'pink', name: 'Pinky Cute', prem: false, color: 'bg-pink-50 border-pink-300 text-pink-600' }, { id: 'ocean', name: 'Ocean Breeze', prem: false, color: 'bg-sky-100 border-sky-400 text-sky-800' }, { id: 'sunset', name: 'Sunset Glow', prem: false, color: 'bg-orange-100 border-orange-400 text-orange-800' }, { id: 'pastel', name: 'Pastel Dream', prem: false, color: 'bg-purple-100 border-purple-300 text-purple-700' }, { id: 'nature', name: 'Botanical', prem: false, color: 'bg-green-100 border-green-400 text-green-800' }, { id: 'y2k', name: 'Y2K Cyber', prem: false, color: 'bg-zinc-200 border-zinc-400 text-zinc-900' }, { id: 'hello_kitty', name: 'Hello Kitty', prem: false, color: 'bg-pink-200 border-pink-500 text-pink-800 shadow-[0_0_10px_#f472b6]' }, { id: 'vnu_theme', name: '#ToiLaSinhVienVNU', prem: true, color: 'bg-[#0f5132] border-[#22c55e] text-white shadow-[0_0_15px_#22c55e]' }, { id: 'golden', name: 'Golden Hour', prem: true, color: 'bg-yellow-900 border-yellow-400 text-yellow-200 shadow-[0_0_15px_#facc15]' }, { id: 'wedding', name: 'Royal Wedding', prem: true, color: 'bg-slate-50 border-amber-300 text-amber-700 shadow-[0_0_15px_#fcd34d]' }, { id: 'holo', name: 'Holographic', prem: true, color: 'bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300 border-white text-white' }, { id: 'neon', name: 'Neon Party', prem: true, color: 'bg-black border-cyan-400 text-fuchsia-400 shadow-[0_0_20px_#22d3ee]' }, { id: 'cyberpunk', name: 'Cyberpunk City', prem: true, color: 'bg-fuchsia-950 border-cyan-400 text-cyan-200' }, { id: 'retro', name: 'Vintage Film', prem: true, color: 'bg-[#d4c5b0] border-[#3e2723] text-[#4e342e]' }, { id: 'newspaper', name: 'Daily News', prem: true, color: 'bg-gray-200 border-black text-black font-serif' }, { id: 'kawaii', name: 'Kawaii Magic', prem: true, color: 'bg-pink-300 border-yellow-400 text-white shadow-[0_0_15px_#f472b6]' }, { id: 'gothic', name: 'Dark Gothic', prem: true, color: 'bg-red-950 border-red-600 text-red-200' }, { id: 'spiderman', name: 'Spider-Verse', prem: true, color: 'bg-red-700 border-blue-600 text-yellow-300' }, { id: '30_4', name: 'Đại Thắng 30/4', prem: true, color: 'bg-red-800 border-yellow-400 text-yellow-200' }, { id: 'vietnam', name: 'Tự Hào VN', prem: true, color: 'bg-red-900 border-yellow-500 text-yellow-400' },
  ];

  const filters: { id: ImageFilter; name: string; css: string }[] = [ { id: 'none', name: 'Gốc', css: '' }, { id: 'sepia', name: 'Sepia', css: 'sepia(0.8)' }, { id: 'grayscale', name: 'B&W', css: 'grayscale(1)' }, { id: 'vintage', name: 'Hoài cổ', css: 'sepia(0.5) contrast(1.1) brightness(0.9)' }, { id: 'brighten', name: 'Sáng', css: 'brightness(1.2) contrast(1.1)' }, { id: 'cool', name: 'Lạnh', css: 'hue-rotate(10deg) saturate(1.2)' }, ];

  const handleSelect = (type: 'layout'|'theme', id: string, prem: boolean) => {
    if (prem && !isPremium) { alert("Gói FREE không thể dùng tính năng này. Hãy nâng cấp VIP nhé!"); return; }
    if (type === 'layout') setLayout(id as FrameLayout); else setTheme(id as FrameTheme);
  };

  if (isMaintenance && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center text-center p-6 selection:bg-pink-500">
        <Sparkles size={64} className="text-pink-500 mb-6 animate-pulse" />
        <h1 className="text-4xl font-black mb-4">Bảo Trì Hệ Thống</h1>
        <p className="text-gray-400 max-w-lg mb-8 text-lg">Gizmo Snap đang được nâng cấp để mang lại trải nghiệm mượt mà hơn. Vui lòng quay lại sau ít phút nhé!</p>
        {user ? <button onClick={logout} className="text-sm bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20">Đăng xuất</button> : <button onClick={loginWithGoogle} className="text-sm bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20">Đăng nhập Admin</button>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6 font-sans selection:bg-pink-500 selection:text-white">
      {isFlashing && <div className="fixed inset-0 bg-white z-[9999] opacity-100 transition-opacity duration-300 mix-blend-screen pointer-events-none" />}

      <div className="w-full max-w-7xl flex justify-between items-center mb-8 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl">
        <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 tracking-tight flex items-center gap-2 cursor-pointer" onClick={() => setStep(1)}>
          <Camera size={32} className="text-pink-500" /> Gizmo Snap
        </h1>
        {user ? (
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/pricing" className="hidden lg:flex items-center gap-2 text-sm font-semibold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition">
              <Crown size={16} className="text-yellow-400" /> Bảng giá
            </Link>
            
            <button onClick={fetchMyOrders} className="hidden sm:flex items-center gap-2 text-sm font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/50 hover:bg-pink-500/40 px-4 py-2 rounded-xl transition">
              <Package size={16} /> Đơn in ảnh
            </button>

            {profile?.role === 'admin' && (
              <Link href="/admin" className="flex items-center gap-2 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:scale-105 transition-transform">
                <ShieldCheck size={18} /> Quản Trị Hệ Thống
              </Link>
            )}

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-200">{user.email}</p>
              <div className="flex items-center justify-end gap-2 mt-1">
                {profile?.plan === 'vnu' ? (
                  <span className="flex items-center gap-1 text-[10px] bg-gradient-to-r from-green-600 to-emerald-500 text-white px-2 py-0.5 rounded-full uppercase font-bold tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.5)]"><GraduationCap size={12}/> VNU VIP</span>
                ) : (
                  <span className="text-[10px] bg-gradient-to-r from-pink-500 to-violet-500 text-white px-2 py-0.5 rounded-full uppercase font-bold tracking-wider shadow-lg">{profile?.plan || "free"}</span>
                )}
                {profile?.plan !== 'limitless' && profile?.plan !== 'exclusive' && (
                  <span className="text-[10px] bg-white/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-bold ml-2">Còn: {profile?.daily_shoots || 0} lượt</span>
                )}
              </div>
            </div>
            <img src={user.user_metadata?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} className="w-11 h-11 rounded-full border-2 border-pink-500 shadow-lg object-cover" alt="avatar" />
            <button onClick={logout} className="text-gray-400 hover:text-red-400 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"><LogOut size={20} /></button>
          </div>
        ) : (
          <button onClick={loginWithGoogle} className="flex items-center gap-2 bg-white text-slate-900 font-bold py-2 px-6 rounded-xl hover:bg-gray-100 transition-all shadow-lg transform hover:scale-105"><LogIn size={18} /> Đăng nhập</button>
        )}
      </div>

      {step === 1 && (
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl items-stretch animate-in fade-in zoom-in duration-500">
          <div className="flex-1 bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl">
            <h2 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-violet-400">Tùy Chỉnh Khung & Theme</h2>
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-200"><LayoutGrid size={20} className="text-pink-400"/> Chọn Kích Thước</h3>
              <div className="flex overflow-x-auto pb-4 gap-3 snap-x hide-scrollbar">
                {layouts.map((item) => (
                  <button key={item.id} onClick={() => handleSelect('layout', item.id, item.prem)} className={`shrink-0 w-36 p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center font-bold text-sm snap-center ${layout === item.id ? 'border-pink-500 bg-pink-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                    {item.prem && <Lock size={14} className="mb-1 text-yellow-500" />}
                    <div className="font-bold text-sm">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-200"><Palette size={20} className="text-violet-400"/> Chọn Phong Cách Độc Quyền</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {themes.map((item) => (
                  <button key={item.id} onClick={() => handleSelect('theme', item.id, item.prem)} className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between font-bold text-sm ${item.color} ${theme === item.id ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900 scale-105 z-10' : 'opacity-80 hover:opacity-100'}`}>
                    {item.name} {item.prem && <Lock size={14} className="opacity-80" />}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { if(!user) { alert("Đăng nhập để chụp!"); return; } setStep(2); resetBooth(); }} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold py-4 rounded-2xl shadow-xl transform transition hover:scale-[1.02] text-lg mt-4">
              Vào bốt chụp <ArrowRight size={24} />
            </button>
          </div>

          <div className="w-full lg:w-[400px] bg-slate-800/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center relative">
             <h3 className="text-lg font-semibold mb-6 text-gray-300">Xem trước CSS (Bản nháp)</h3>
             <div className={`transition-all duration-500 rounded-xl p-4 flex flex-col items-center shadow-2xl ${themes.find(t => t.id === theme)?.color} w-[260px] h-[340px] max-h-[400px]`}>
                <h4 className="font-black text-xl mb-4 text-center tracking-wider">{themes.find(t => t.id === theme)?.name.toUpperCase()}</h4>
                <div className={`grid gap-2 w-full ${layout === '2x2' || layout === 'grid6' ? 'grid-cols-2' : layout === 'film' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                   {[...Array(maxPhotosMap[layout])].map((_, i) => (
                     <div key={i} className="bg-black/50 w-full aspect-video rounded border border-white/30 flex items-center justify-center"><Camera size={16} className="opacity-50" /></div>
                   ))}
                </div>
             </div>
             <div className="text-xs text-gray-400 mt-6 text-center px-4 w-full">Vector nghệ thuật siêu chi tiết sẽ được tự động vẽ ra sau khi bạn chụp ở Bước 2.</div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col xl:flex-row gap-8 w-full max-w-7xl justify-center items-start animate-in slide-in-from-right-10 fade-in duration-500">
          <div className="flex flex-col items-center bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl flex-1 w-full">
            <div className="flex justify-between w-full mb-4">
               <button onClick={() => { setStep(1); stopAutoShoot(); }} className="text-sm text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 px-3 py-1 rounded-lg transition"><ArrowRight className="rotate-180" size={16}/> Đổi khung</button>
               <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5">
                <button onClick={() => { setIsAutoMode(false); stopAutoShoot(); }} className={`px-4 md:px-6 py-1.5 rounded-lg transition-all text-sm font-semibold ${!isAutoMode ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white' : 'text-gray-400'}`}>Thủ công</button>
                <button onClick={() => setIsAutoMode(true)} className={`px-4 md:px-6 py-1.5 rounded-lg transition-all text-sm font-semibold ${isAutoMode ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white' : 'text-gray-400'}`}>Tự động</button>
              </div>
            </div>

            <div className="relative border border-white/10 rounded-[2rem] overflow-hidden mb-6 bg-black w-full max-w-[640px] aspect-video shadow-2xl">
              <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover transform scale-x-[-1] transition-all`} style={{ filter: filters.find(f => f.id === selectedFilter)?.css }} />
              {countdown !== null && countdown > 0 && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm z-10"><span className="text-7xl md:text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(236,72,153,0.8)] animate-pulse">{countdown}</span></div>}
            </div>

            <div className="flex flex-col gap-4 w-full max-w-[640px] bg-slate-800/80 backdrop-blur-sm p-5 rounded-[2rem] border border-white/10 shadow-2xl mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-pink-400"><Wand2 size={20}/> Bộ lọc & Cà da</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {filters.map((f) => (
                  <button key={f.id} onClick={() => setSelectedFilter(f.id)} className={`py-2 rounded-xl text-sm font-bold border transition-all ${selectedFilter === f.id ? 'bg-pink-500 text-white border-pink-600' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}>{f.name}</button>
                ))}
              </div>
              <div className="w-full flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                <label className="text-xs font-semibold text-gray-300 whitespace-nowrap">Cà da</label>
                <input type="range" min="0" max="100" value={skinSmoothness} onChange={(e) => setSkinSmoothness(Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-pink-500" />
                <span className="text-xs font-mono text-gray-400 min-w-[40px] text-right">{skinSmoothness}%</span>
              </div>
            </div>

            <div className="flex gap-2 md:gap-4 w-full justify-center">
              {!isAutoMode ? (
                <button onClick={() => { if (user && !isPremium && profile?.daily_shoots <= 0) { alert("Hết lượt chụp!"); return; } captureWithFlash(); }} disabled={photos.length >= maxPhotos} className={`flex flex-1 md:flex-none items-center justify-center gap-2 font-bold py-3.5 px-4 md:px-8 rounded-2xl shadow-xl transition-all active:scale-95 ${photos.length >= maxPhotos ? "bg-gray-600 text-gray-400" : "bg-gradient-to-r from-pink-500 to-violet-500 text-white"}`}>
                  <Camera size={20} /> <span className="hidden sm:inline">Chụp</span> ({photos.length}/{maxPhotos})
                </button>
              ) : (
                !isShooting ? (
                  <button onClick={startAutoShoot} disabled={photos.length >= maxPhotos} className={`flex flex-1 md:flex-none items-center justify-center gap-2 font-bold py-3.5 px-4 md:px-8 rounded-2xl shadow-xl transition-all active:scale-95 ${photos.length >= maxPhotos ? "bg-gray-600 text-gray-400" : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"}`}>
                    <Play size={20} /> <span className="hidden sm:inline">Bắt đầu</span> ({photos.length}/{maxPhotos})
                  </button>
                ) : (
                  <button onClick={stopAutoShoot} className="flex flex-1 md:flex-none items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold py-3.5 px-4 md:px-8 rounded-2xl shadow-xl active:scale-95"><Square size={20} fill="currentColor" /> <span className="hidden sm:inline">Dừng</span></button>
                )
              )}
              <button onClick={resetBooth} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 px-4 md:px-6 rounded-2xl transition-all"><RefreshCcw size={20} /> <span className="hidden sm:inline">Xóa</span></button>
            </div>
          </div>

          <div className="flex flex-col items-center bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl shrink-0 w-full xl:min-w-[360px] xl:w-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-200 flex items-center gap-2">Nháp Khung {layout.toUpperCase()}</h2>
            
            <div className={`p-2 bg-slate-900/50 border border-white/10 shadow-inner rounded-xl grid gap-2 ${layout === '2x2' || layout === 'grid6' ? 'grid-cols-2 w-[300px] sm:w-[340px]' : layout === 'film' ? 'grid-cols-3 w-[300px] sm:w-[340px]' : layout === 'polaroid' ? 'grid-cols-1 w-[260px] sm:w-[300px]' : 'grid-cols-1 w-[200px]'}`}>
              {[...Array(maxPhotos)].map((_, index) => (
                <div key={index} className="bg-slate-800/50 w-full aspect-video flex items-center justify-center overflow-hidden rounded-md border border-white/5 relative">
                  {photos[index] ? <img src={photos[index]} className="w-full h-full object-cover" /> : <Camera size={16} className="text-slate-600" />}
                </div>
              ))}
            </div>

            {photos.length === maxPhotos && !qrLink && (
              <button onClick={handleGenerateClick} disabled={isLoadingComposer || isUploading} className={`flex items-center justify-center w-full mt-6 text-white font-bold py-4 rounded-2xl transition-all ${isLoadingComposer || isUploading ? 'bg-white/10 cursor-wait' : 'bg-gradient-to-r from-pink-500 to-violet-500 hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transform hover:-translate-y-1'}`}>
                {isLoadingComposer || isUploading ? <><Loader2 size={20} className="animate-spin mr-2" /> Hệ thống đang vẽ...</> : <><Sparkles size={20} className="mr-2" /> Tạo ảnh Vector & Nhận QR</>}
              </button>
            )}

            {qrLink && (
              <div className="mt-6 flex flex-col items-center bg-white p-6 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-500 w-full">
                <div className="p-2 border-4 border-pink-100 rounded-xl mb-4"><QRCodeCanvas value={qrLink} size={140} level={"H"} includeMargin={false} /></div>
                <p className="text-slate-800 font-bold text-sm text-center mb-4">Quét QR để tải ảnh gốc</p>
                
                {profile?.plan === 'exclusive' && (
                  <button onClick={() => setShowPrintModal(true)} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition-transform">
                    <Printer size={18} /> Yêu cầu in ảnh cứng
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button onClick={() => setShowPrintModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X size={24}/></button>
            <h3 className="text-2xl font-black mb-2 flex items-center gap-2 text-amber-600"><Printer /> Giao ảnh tận nhà</h3>
            <p className="text-sm text-gray-500 mb-6">Đặc quyền gói Exclusive: Chúng tôi sẽ in ảnh chất lượng cao và gửi đến tận cửa nhà bạn!</p>
            <form onSubmit={submitPrintRequest} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700">Họ và tên người nhận</label>
                <input required value={printForm.name} onChange={e => setPrintForm({...printForm, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="VD: Nguyễn Văn A" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Số điện thoại</label>
                <input required type="tel" value={printForm.phone} onChange={e => setPrintForm({...printForm, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="VD: 0987654321" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Địa chỉ giao hàng chi tiết</label>
                <textarea required value={printForm.address} onChange={e => setPrintForm({...printForm, address: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[80px]" placeholder="Số nhà, Đường, Phường, v.v..." />
              </div>
              <button disabled={isSubmittingPrint} type="submit" className={`w-full font-bold py-4 rounded-xl text-white transition-all flex justify-center items-center gap-2 ${isSubmittingPrint ? 'bg-gray-400' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:-translate-y-1'}`}>
                {isSubmittingPrint ? <Loader2 className="animate-spin" size={20}/> : <Truck size={20}/>} Xác nhận Gửi ảnh
              </button>
            </form>
          </div>
        </div>
      )}

      {showOrdersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
            <button onClick={() => setShowOrdersModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X size={24}/></button>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-2 text-pink-600"><Package /> Đơn in ảnh của bạn</h3>
            <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
              {myOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Bạn chưa có yêu cầu in ảnh nào.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {myOrders.map(order => (
                    <div key={order.id} className="border border-gray-100 bg-gray-50 p-4 rounded-2xl flex gap-4 items-start">
                      <a href={order.image_url} target="_blank" rel="noreferrer">
                        <img src={getDirectDriveLink(order.image_url)} alt="preview" className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-sm" />
                      </a>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-sm text-gray-800">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${order.status === 'pending' ? 'bg-amber-100 text-amber-700' : order.status === 'shipping' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {order.status === 'pending' ? 'Chờ duyệt' : order.status === 'shipping' ? 'Đang giao' : 'Đã giao'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1"><strong>Nhận:</strong> {order.customer_name} - {order.phone}</p>
                        <p className="text-xs text-gray-500 mb-2"><strong>Đ/c:</strong> {order.address}</p>
                        {order.tracking_code ? (
                          <div className="bg-white border border-dashed border-blue-300 p-2 rounded-lg inline-block">
                            <p className="text-xs text-blue-600 font-bold flex items-center gap-1"><Truck size={14}/> Mã Vận Đơn: <span className="font-mono text-sm bg-blue-50 px-1 rounded">{order.tracking_code}</span></p>
                          </div>
                        ) : (
                          <p className="text-xs text-amber-600 italic">Đang chờ Admin cung cấp mã vận đơn...</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <FrameComposer photos={photos} layout={layout} theme={theme} isPremium={isPremium} isLoading={isLoadingComposer} onGenerateSuccess={handleComposerSuccess} onGenerateError={handleComposerError} userEmail={user?.email} selectedFilter={selectedFilter} skinSmoothness={skinSmoothness} />
    </div>
  );
}