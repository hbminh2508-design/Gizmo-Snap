"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { Check, Camera, Crown, ArrowLeft, Star, Zap, Truck, QrCode, Loader2, Infinity } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // State cho Modal Thanh toán
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'limitless' | 'exclusive' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- 🏦 CẤU HÌNH NGÂN HÀNG 🏦 ---
  const BANK_ID = "MB"; 
  const ACCOUNT_NO = "0336062007"; 
  const ACCOUNT_NAME = "HOANG BINH MINH"; 
  // ---------------------------------

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

  // --- 🔄 LẮNG NGHE THANH TOÁN THẬT TỪ SEPAY WEBHOOK 🔄 ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Chỉ chạy bộ đếm khi Modal đang mở, có user và đã chọn gói
    if (isModalOpen && user && selectedPlan) {
      interval = setInterval(async () => {
        // Chọc vào Database để kiểm tra gói cước hiện tại của user
        const { data } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
        
        // Nếu Webhook từ SePay đã cập nhật thành công gói cước vào DB
        if (data && data.plan === selectedPlan) {
          setIsProcessing(true); 
          // Tạo độ trễ 1s cho mượt hiệu ứng rồi thông báo
          setTimeout(() => {
            alert(`🎉 TING TING! Thanh toán thành công. Chào mừng bạn đến với gói ${selectedPlan?.toUpperCase()}!`);
            setIsModalOpen(false); setIsProcessing(false);
            setProfile((prev: any) => ({ ...prev, plan: selectedPlan })); // Cập nhật ngay trên UI
            router.push('/'); // Quay về màn chụp ảnh
          }, 1000);
        }
      }, 3000); // Cứ 3 giây hỏi Database 1 lần
    }

    // Dọn dẹp bộ đếm khi đóng modal
    return () => clearInterval(interval);
  }, [isModalOpen, user, selectedPlan, router]);

  const handlePaymentClick = () => {
    // Nút này giờ chỉ làm cảnh để xoay xoay tạo cảm giác hệ thống đang check
    setIsProcessing(true);
  };

  // Tính toán Tên ngắn (6 ký tự) để làm mã đơn hàng
  const userShortCode = user?.id ? user.id.substring(0, 6).toUpperCase() : "GUEST";
  
  // Tính toán số tiền và nội dung chuyển khoản cho 3 gói
  const amount = selectedPlan === 'pro' ? 49000 : selectedPlan === 'limitless' ? 199000 : 499000;
  const transferContent = `GIZMO ${selectedPlan?.toUpperCase()} ${userShortCode}`;
  
  // URL tạo ảnh VietQR tự động
  const vietQrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 sm:p-6 font-sans flex flex-col items-center">
      
      <div className="w-full max-w-[1400px] flex items-center mb-8 mt-4">
        <Link href="/" className="flex items-center gap-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition">
          <ArrowLeft size={20} /> Quay lại
        </Link>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-violet-400">Chọn Gói Gizmo Snap</h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">Mở khóa sức mạnh sáng tạo với các khung ảnh và chủ đề độc quyền.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full max-w-[1400px] items-stretch">
        
        {/* FREE */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col h-full hover:border-white/20 transition-colors">
          <div className="flex items-center gap-3 mb-4"><div className="p-3 bg-gray-800 rounded-xl"><Camera className="text-gray-300" size={24} /></div><h2 className="text-2xl font-bold">Cơ Bản</h2></div>
          <div className="text-4xl font-black mb-6 mt-4">0đ <span className="text-base text-gray-500 font-normal">/ mãi mãi</span></div>
          <ul className="space-y-3 mb-8 flex-1 text-sm">
            <li className="flex gap-3 text-gray-300"><Check className="text-emerald-400 shrink-0" size={18}/> 10 lượt chụp mỗi ngày</li>
            <li className="flex gap-3 text-gray-300"><Check className="text-emerald-400 shrink-0" size={18}/> Tặng kèm 2 khung mới</li>
            <li className="flex gap-3 text-gray-500 opacity-50"><Check size={18}/> Theme Spider-Man, 30/4</li>
          </ul>
          <button className="w-full py-4 rounded-xl font-bold bg-white/10 text-gray-300 cursor-not-allowed mt-auto">
            {profile?.plan === 'free' || !profile?.plan ? 'Đang sử dụng' : 'Gói mặc định'}
          </button>
        </div>

        {/* PRO */}
        <div className="bg-slate-800 border-2 border-violet-500 rounded-3xl p-6 flex flex-col h-full relative shadow-2xl">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-violet-500 text-white px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest">PHỔ BIẾN</div>
          <div className="flex items-center gap-3 mb-4"><div className="p-3 bg-violet-500/20 rounded-xl"><Zap className="text-violet-400" size={24} /></div><h2 className="text-2xl font-bold text-white">Pro</h2></div>
          <div className="text-4xl font-black mb-6 mt-4 text-violet-400">49k <span className="text-base text-gray-400 font-normal">/ tháng</span></div>
          <ul className="space-y-3 mb-8 flex-1 text-sm">
            <li className="flex gap-3 text-white font-medium"><Check className="text-violet-400 shrink-0" size={18}/> 20 lượt chụp mỗi ngày</li>
            <li className="flex gap-3 text-gray-200"><Check className="text-violet-400 shrink-0" size={18}/> Toàn bộ Theme Độc Quyền</li>
            <li className="flex gap-3 text-gray-200"><Check className="text-violet-400 shrink-0" size={18}/> Truy cập lưới 6 ảnh</li>
          </ul>
          {profile?.plan === 'pro' ? <button className="w-full py-4 rounded-xl font-bold bg-white/10 text-violet-300 mt-auto cursor-not-allowed border border-violet-500/30">Đang sử dụng</button> : <button onClick={() => handleUpgradeClick('pro')} className="w-full py-4 rounded-xl font-bold bg-violet-500 hover:bg-violet-600 text-white transition-all mt-auto shadow-lg">Nâng cấp Pro</button>}
        </div>

        {/* LIMITLESS */}
        <div className="bg-gradient-to-b from-blue-900 to-indigo-900 border-2 border-blue-400 rounded-3xl p-6 flex flex-col h-full relative shadow-[0_0_20px_rgba(59,130,246,0.3)] transform xl:-translate-y-4">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest flex items-center gap-1"><Infinity size={12}/> VÔ HẠN</div>
          <div className="flex items-center gap-3 mb-4"><div className="p-3 bg-blue-500/20 rounded-xl"><Infinity className="text-blue-400" size={24} /></div><h2 className="text-2xl font-bold text-white">Limitless</h2></div>
          <div className="text-4xl font-black mb-6 mt-4 text-blue-400">199k <span className="text-base text-gray-400 font-normal">/ tháng</span></div>
          <ul className="space-y-3 mb-8 flex-1 text-sm">
            <li className="flex gap-3 text-white font-medium"><Check className="text-blue-400 shrink-0" size={18}/> Tự do chụp KHÔNG GIỚI HẠN</li>
            <li className="flex gap-3 text-blue-200 font-bold bg-blue-500/20 p-2 rounded-lg border border-blue-500/30"><Truck className="shrink-0" size={20}/> Tặng 1 lần IN ẢNH VẬT LÝ gửi tận nhà miễn phí</li>
            <li className="flex gap-3 text-gray-200"><Check className="text-blue-400 shrink-0" size={18}/> Mọi đặc quyền của Pro</li>
          </ul>
          {profile?.plan === 'limitless' ? <button className="w-full py-4 rounded-xl font-bold bg-white/10 text-blue-300 mt-auto cursor-not-allowed border border-blue-500/30">Đã đăng ký</button> : <button onClick={() => handleUpgradeClick('limitless')} className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white transition-all mt-auto shadow-lg">Chọn Limitless</button>}
        </div>

        {/* EXCLUSIVE */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 border-2 border-pink-500 rounded-3xl p-6 flex flex-col h-full relative shadow-[0_0_30px_rgba(236,72,153,0.3)]">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest flex items-center gap-1"><Star size={12} fill="currentColor"/> ĐẲNG CẤP</div>
          <div className="flex items-center gap-3 mb-4"><div className="p-3 bg-pink-500/20 rounded-xl"><Crown className="text-pink-400" size={24} /></div><h2 className="text-2xl font-bold text-white">Exclusive</h2></div>
          <div className="text-4xl font-black mb-6 mt-4 text-pink-400">499k <span className="text-base text-gray-400 font-normal">/ tháng</span></div>
          <ul className="space-y-3 mb-8 flex-1 text-sm">
            <li className="flex gap-3 text-white font-medium"><Check className="text-pink-500 shrink-0" size={18}/> Vô hạn lượt chụp</li>
            <li className="flex gap-3 text-pink-300 font-bold bg-pink-500/10 p-2 rounded-lg border border-pink-500/20"><Truck className="shrink-0" size={20}/> Tặng 5 lần IN ẢNH VẬT LÝ gửi tận nhà miễn phí</li>
            <li className="flex gap-3 text-gray-200"><Check className="text-pink-500 shrink-0" size={18}/> Logo & Tên riêng trên khung</li>
          </ul>
          {profile?.plan === 'exclusive' ? <button className="w-full py-4 rounded-xl font-bold bg-white/10 text-pink-300 mt-auto cursor-not-allowed border border-pink-500/30">VIP Đang kích hoạt</button> : <button onClick={() => handleUpgradeClick('exclusive')} className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white transition-all mt-auto shadow-lg">Trở thành VIP</button>}
        </div>
      </div>

      {/* MODAL THANH TOÁN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl scale-in-center">
            <div className={`p-6 text-white text-center relative ${selectedPlan === 'limitless' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-pink-600 to-rose-600'}`}>
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">✕</button>
              <QrCode size={40} className="mx-auto mb-2 opacity-80" />
              <h3 className="text-2xl font-bold">Thanh Toán Tự Động</h3>
              <p className="text-white/80 text-sm mt-1">Quét mã bằng App Ngân hàng bất kỳ</p>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="p-2 border-2 border-dashed border-gray-300 rounded-2xl mb-4 relative">
                <img src={vietQrUrl} alt="VietQR" className="w-64 h-64 rounded-xl" />
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
                    <Loader2 size={40} className={`animate-spin mb-2 ${selectedPlan === 'limitless' ? 'text-blue-600' : 'text-pink-600'}`} />
                    <p className={`font-bold animate-pulse text-center ${selectedPlan === 'limitless' ? 'text-blue-600' : 'text-pink-600'}`}>Đang chờ thanh toán...<br/><span className="text-sm text-gray-500 font-normal">Hệ thống sẽ tự xác nhận</span></p>
                  </div>
                )}
              </div>
              <div className="w-full bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                <div className="flex justify-between mb-2"><span className="text-gray-500 text-sm">Gói nâng cấp:</span><span className={`font-bold uppercase ${selectedPlan === 'limitless' ? 'text-blue-600' : 'text-pink-600'}`}>{selectedPlan}</span></div>
                <div className="flex justify-between mb-2"><span className="text-gray-500 text-sm">Số tiền:</span><span className="font-black text-lg text-rose-500">{amount.toLocaleString('vi-VN')} VNĐ</span></div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2"><span className="text-gray-500 text-sm">Nội dung (Bắt buộc):</span><span className="font-mono font-bold bg-slate-200 text-slate-800 px-2 py-1 rounded text-sm select-all">{transferContent}</span></div>
              </div>
              <button onClick={handlePaymentClick} disabled={isProcessing} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${selectedPlan === 'limitless' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-pink-600 hover:bg-pink-700'}`}>
                {isProcessing ? "Đang chờ ngân hàng báo cáo..." : "Tôi đã chuyển khoản xong"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}