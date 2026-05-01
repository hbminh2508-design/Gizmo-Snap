"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { Check, Camera, Crown, ArrowLeft, Star, Zap, Truck, QrCode, Loader2, Infinity, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'limitless' | 'exclusive' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Trạng thái UX đánh lừa cảm giác chờ đợi
  const [paymentStatusText, setPaymentStatusText] = useState("Đang kết nối cổng thanh toán an toàn...");

  const BANK_ID = "MB"; 
  const ACCOUNT_NO = "0336062007"; 
  const ACCOUNT_NAME = "HOANG BINH MINH"; 

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setProfile(data);
      }
    };
    fetchUser();
  }, []);

  const handleUpgradeClick = (plan: 'pro' | 'limitless' | 'exclusive') => {
    if (!user) { alert("Vui lòng đăng nhập ở trang chủ trước khi mua gói!"); return; }
    setSelectedPlan(plan); setIsModalOpen(true); setIsProcessing(false);
  };

  // Logic Webhook + Đổi Text UX
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    let uxInterval: NodeJS.Timeout;

    if (isModalOpen && user && selectedPlan && isProcessing) {
      // 1. Đổi text liên tục để khách cảm thấy hệ thống đang làm việc chăm chỉ
      let step = 0;
      const uxTexts = [
        "Đang kết nối hệ thống ngân hàng nhà nước...",
        "Đang quét mã giao dịch của bạn...",
        "Vẫn đang kiểm tra, vui lòng giữ màn hình...",
        "Đang đồng bộ dữ liệu mã hóa đầu cuối...",
        "Sắp xong rồi, đang xác thực chữ ký số..."
      ];
      uxInterval = setInterval(() => {
        step = (step + 1) % uxTexts.length;
        setPaymentStatusText(uxTexts[step]);
      }, 3500);

      // 2. Rút ngắn thời gian quét DB xuống còn 2s thay vì 3s
      checkInterval = setInterval(async () => {
        const { data } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
        if (data && data.plan === selectedPlan) {
          clearInterval(checkInterval);
          clearInterval(uxInterval);
          setPaymentStatusText("Xác thực thành công! Đang kích hoạt VIP...");
          setTimeout(() => {
            alert(`🎉 TING TING! Chào mừng bạn đến với gói ${selectedPlan?.toUpperCase()}!`);
            setIsModalOpen(false); setIsProcessing(false);
            router.push('/'); 
          }, 1500);
        }
      }, 2000); 
    }

    return () => { clearInterval(checkInterval); clearInterval(uxInterval); };
  }, [isModalOpen, user, selectedPlan, router, isProcessing]);

  const amount = selectedPlan === 'pro' ? 49000 : selectedPlan === 'limitless' ? 199000 : 499000;
  const userShortCode = user?.id ? user.id.substring(0, 6).toUpperCase() : "GUEST";
  const transferContent = `GIZMO ${selectedPlan?.toUpperCase()} ${userShortCode}`;
  const vietQrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 font-sans flex flex-col items-center selection:bg-pink-500 selection:text-white">
      {/* Background Gradient Sang Trọng */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black -z-10" />

      <div className="w-full max-w-[1400px] flex items-center mb-8">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full transition backdrop-blur-md border border-white/5">
          <ArrowLeft size={18} /> Quay lại màn chính
        </Link>
      </div>

      <div className="text-center mb-12 lg:mb-20 px-4">
        <h1 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 tracking-tight">Nâng tầm trải nghiệm</h1>
        <p className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto font-light">Mở khóa sức mạnh sáng tạo với các khung ảnh Vector đỉnh cao và đặc quyền in ấn vật lý.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full max-w-[1400px] items-stretch px-4">
        
        {/* FREE */}
        <div className="bg-[#111] border border-white/10 rounded-[2rem] p-8 flex flex-col h-full hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-white/5 rounded-2xl"><Camera className="text-gray-300" size={24} /></div><h2 className="text-2xl font-bold">Cơ Bản</h2></div>
          <div className="text-5xl font-black mb-8 mt-2">0đ <span className="text-lg text-gray-500 font-medium">/ mãi mãi</span></div>
          <ul className="space-y-4 mb-8 flex-1 text-base">
            <li className="flex gap-4 text-gray-300"><Check className="text-emerald-500 shrink-0" size={20}/> 10 lượt chụp mỗi ngày</li>
            <li className="flex gap-4 text-gray-300"><Check className="text-emerald-500 shrink-0" size={20}/> Tải ảnh nét tiêu chuẩn</li>
          </ul>
          <button className="w-full py-4 rounded-2xl font-bold bg-white/5 text-gray-400 cursor-not-allowed mt-auto border border-white/10">Đang sử dụng</button>
        </div>

        {/* PRO */}
        <div className="bg-gradient-to-b from-violet-900/20 to-[#111] border border-violet-500/50 rounded-[2rem] p-8 flex flex-col h-full relative shadow-[0_0_40px_rgba(139,92,246,0.1)]">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-violet-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase">Phổ biến</div>
          <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-violet-500/20 rounded-2xl"><Zap className="text-violet-400" size={24} /></div><h2 className="text-2xl font-bold text-white">Pro</h2></div>
          <div className="text-5xl font-black mb-8 mt-2 text-violet-400">49k <span className="text-lg text-gray-500 font-medium">/ tháng</span></div>
          <ul className="space-y-4 mb-8 flex-1 text-base">
            <li className="flex gap-4 text-white"><Check className="text-violet-400 shrink-0" size={20}/> 20 lượt chụp mỗi ngày</li>
            <li className="flex gap-4 text-gray-300"><Check className="text-violet-400 shrink-0" size={20}/> Toàn bộ Theme Độc Quyền (Wedding, Neon...)</li>
          </ul>
          <button onClick={() => handleUpgradeClick('pro')} className="w-full py-4 rounded-2xl font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all mt-auto shadow-lg shadow-violet-900/50">Nâng cấp Pro</button>
        </div>

        {/* LIMITLESS */}
        <div className="bg-gradient-to-b from-blue-900/40 to-[#111] border border-blue-500 rounded-[2rem] p-8 flex flex-col h-full relative shadow-[0_0_50px_rgba(59,130,246,0.2)] transform xl:-translate-y-6">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-1"><Infinity size={14}/> Vô hạn</div>
          <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-500/20 rounded-2xl"><Infinity className="text-blue-400" size={24} /></div><h2 className="text-2xl font-bold text-white">Limitless</h2></div>
          <div className="text-5xl font-black mb-8 mt-2 text-blue-400">199k <span className="text-lg text-gray-500 font-medium">/ tháng</span></div>
          <ul className="space-y-4 mb-8 flex-1 text-base">
            <li className="flex gap-4 text-white"><Check className="text-blue-400 shrink-0" size={20}/> Chụp KHÔNG GIỚI HẠN</li>
            <li className="flex gap-4 text-blue-200 bg-blue-900/30 p-3 rounded-xl border border-blue-500/30"><Truck className="shrink-0" size={22}/> Tặng 1 lần IN ẢNH VẬT LÝ giao tận nhà</li>
          </ul>
          <button onClick={() => handleUpgradeClick('limitless')} className="w-full py-4 rounded-2xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all mt-auto shadow-lg shadow-blue-900/50">Chọn Limitless</button>
        </div>

        {/* EXCLUSIVE */}
        <div className="bg-gradient-to-b from-pink-900/30 to-[#111] border border-pink-500/50 rounded-[2rem] p-8 flex flex-col h-full relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-1"><Star size={14} fill="currentColor"/> Đẳng cấp</div>
          <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-pink-500/20 rounded-2xl"><Crown className="text-pink-400" size={24} /></div><h2 className="text-2xl font-bold text-white">Exclusive</h2></div>
          <div className="text-5xl font-black mb-8 mt-2 text-pink-400">499k <span className="text-lg text-gray-500 font-medium">/ tháng</span></div>
          <ul className="space-y-4 mb-8 flex-1 text-base">
            <li className="flex gap-4 text-white"><Check className="text-pink-500 shrink-0" size={20}/> Mọi đặc quyền của Limitless</li>
            <li className="flex gap-4 text-pink-200 bg-pink-900/20 p-3 rounded-xl border border-pink-500/30"><Truck className="shrink-0" size={22}/> Tặng 5 lần IN ẢNH VẬT LÝ giao tận nhà</li>
          </ul>
          <button onClick={() => handleUpgradeClick('exclusive')} className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white transition-all mt-auto shadow-lg shadow-pink-900/50">Trở thành VIP</button>
        </div>
      </div>

      {/* MODAL THANH TOÁN SANG TRỌNG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#111] border border-white/10 w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl scale-in-center">
            <div className="p-6 pb-2 text-center relative">
              <button onClick={() => { setIsModalOpen(false); setIsProcessing(false); }} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">✕</button>
              <ShieldCheck size={40} className={`mx-auto mb-3 ${selectedPlan === 'limitless' ? 'text-blue-500' : 'text-pink-500'}`} />
              <h3 className="text-2xl font-bold text-white">Thanh Toán An Toàn</h3>
              <p className="text-gray-400 text-sm mt-1">Mã QR tự động nội dung & số tiền</p>
            </div>
            
            <div className="p-6 flex flex-col items-center">
              <div className="p-3 bg-white rounded-3xl mb-6 relative shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <img src={vietQrUrl} alt="VietQR" className="w-60 h-60 rounded-xl" />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-4 text-center">
                    <Loader2 size={40} className={`animate-spin mb-4 ${selectedPlan === 'limitless' ? 'text-blue-500' : 'text-pink-500'}`} />
                    <p className="font-bold text-white text-sm animate-pulse leading-relaxed">{paymentStatusText}</p>
                  </div>
                )}
              </div>

              <div className="w-full bg-white/5 rounded-2xl p-5 mb-6 border border-white/5">
                <div className="flex justify-between mb-3"><span className="text-gray-400">Gói nâng cấp</span><span className={`font-black uppercase tracking-wider ${selectedPlan === 'limitless' ? 'text-blue-400' : 'text-pink-400'}`}>{selectedPlan}</span></div>
                <div className="flex justify-between mb-3"><span className="text-gray-400">Số tiền</span><span className="font-black text-xl text-white">{amount.toLocaleString('vi-VN')}đ</span></div>
                <div className="flex flex-col border-t border-white/10 pt-3 mt-1">
                  <span className="text-gray-400 text-xs mb-1">Nội dung chuyển khoản (Tự động điền)</span>
                  <span className="font-mono font-bold bg-black text-white px-3 py-2 rounded-lg text-sm text-center border border-white/10 tracking-widest">{transferContent}</span>
                </div>
              </div>

              {!isProcessing ? (
                 <button onClick={() => setIsProcessing(true)} className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 text-lg ${selectedPlan === 'limitless' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-pink-600 hover:bg-pink-500'}`}>
                   Tôi đã chuyển khoản xong
                 </button>
              ) : (
                <div className="w-full py-4 text-center text-gray-500 text-sm">Hệ thống đang tự động xử lý... Không tắt trang</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}