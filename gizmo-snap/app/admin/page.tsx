"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import Link from "next/link";
import { getDirectDriveLink } from "../page";
import { Loader2 } from "lucide-react"; 

export default function AdminBios() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminId, setAdminId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'SYSTEM' | 'ORDERS' | 'USERS' | 'GALLERY'>('SYSTEM');

  // Dữ liệu chung
  const [orders, setOrders] = useState<any[]>([]);
  const [trackingInput, setTrackingInput] = useState<{ [key: string]: string }>({});
  const [gallery, setGallery] = useState<any[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isTogglingMode, setIsTogglingMode] = useState(false);

  // --- DỮ LIỆU TAB USERS MỚI ---
  const [userList, setUserList] = useState<any[]>([]);
  const [targetEmail, setTargetEmail] = useState('');
  
  // States cho Form Tặng Gói có thời hạn
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [giftHours, setGiftHours] = useState('24');
  const [isGiftingPlan, setIsGiftingPlan] = useState(false);

  // States cho Form Tặng Lượt chụp
  const [giftShoots, setGiftShoots] = useState('10');
  const [isGiftingShoots, setIsGiftingShoots] = useState(false);

  // States cho Quản lý Admin
  const [isSettingRole, setIsSettingRole] = useState(false);

  useEffect(() => { checkAdminAndFetch(); }, []);

  const checkAdminAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (profile?.role === 'admin') {
      setIsAdmin(true); setAdminId(session.user.id);
      fetchSystemData(); fetchOrders(); fetchGallery(); fetchUserList(session.user.id);
    }
    setLoading(false);
  };

  const fetchSystemData = async () => {
    const { data: setting } = await supabase.from('site_settings').select('value').eq('id', 'maintenance').single();
    if (setting) setIsMaintenance(setting.value === 'true');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { count } = await supabase.from('photos').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString());
    setTodayCount(count || 0);
  };

  const fetchOrders = async () => { const { data } = await supabase.from('print_requests').select('*').order('created_at', { ascending: false }); if (data) setOrders(data); };
  const fetchGallery = async () => { const { data } = await supabase.from('photos').select('*').order('created_at', { ascending: false }); if (data) setGallery(data); };
  
  // Lấy toàn bộ User từ hàm RPC
  const fetchUserList = async (id: string) => {
    const { data, error } = await supabase.rpc('get_all_users_for_admin', { admin_uuid: id });
    if (!error && data) setUserList(data);
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("WARNING: PERMANENTLY DELETE PHOTO?")) return;
    await supabase.from('photos').delete().eq('id', photoId);
    fetchGallery(); fetchSystemData();
  };

  const updateOrderStatus = async (id: string, newStatus: string, trackingCode?: string) => {
    const updateData: any = { status: newStatus }; if (trackingCode) updateData.tracking_code = trackingCode;
    await supabase.from('print_requests').update(updateData).eq('id', id); fetchOrders();
  };

  const toggleMaintenance = async () => {
    if (!confirm(isMaintenance ? "TURN SYSTEM ONLINE?" : "SUSPEND SYSTEM FOR UPGRADE?")) return;
    setIsTogglingMode(true); const newVal = isMaintenance ? 'false' : 'true';
    await supabase.from('site_settings').update({ value: newVal }).eq('id', 'maintenance');
    setIsMaintenance(newVal === 'true'); setIsTogglingMode(false);
  };

  // --- CÁC HÀM XỬ LÝ USER COMMANDS ---
  const handleGiftTempPlan = async (e: React.FormEvent) => {
    e.preventDefault(); setIsGiftingPlan(true);
    const { data, error } = await supabase.rpc('admin_gift_plan_temp', { target_email: targetEmail, new_plan: selectedPlan, duration_hours: parseInt(giftHours), admin_id: adminId });
    setIsGiftingPlan(false);
    if (error || !data.success) alert("ERROR: " + (error?.message || data.error));
    else { alert(`SUCCESS: GRANTED [${selectedPlan.toUpperCase()}] FOR ${giftHours}h TO ${targetEmail}`); fetchUserList(adminId); }
  };

  const handleGiftShoots = async (e: React.FormEvent) => {
    e.preventDefault(); setIsGiftingShoots(true);
    const { data, error } = await supabase.rpc('admin_gift_shoots', { target_email: targetEmail, shoot_amount: parseInt(giftShoots), admin_id: adminId });
    setIsGiftingShoots(false);
    if (error || !data.success) alert("ERROR: " + (error?.message || data.error));
    else { alert(`SUCCESS: ADDED ${giftShoots} SHOOTS TO ${targetEmail}`); fetchUserList(adminId); }
  };

  const handleSetRole = async (role: string) => {
    if(!targetEmail) return alert("Vui lòng nhập Email trước!");
    if(!confirm(`Xác nhận đổi quyền của ${targetEmail} thành ${role.toUpperCase()}?`)) return;
    setIsSettingRole(true);
    const { data, error } = await supabase.rpc('admin_set_role', { target_email: targetEmail, new_role: role, admin_id: adminId });
    setIsSettingRole(false);
    if (error || !data.success) alert("ERROR: " + (error?.message || data.error));
    else { alert(`SUCCESS: ROLE UPDATED TO ${role.toUpperCase()}`); fetchUserList(adminId); }
  };

  if (loading) return <div className="min-h-screen bg-black text-[#0f0] flex items-center justify-center font-mono">INITIALIZING...</div>;
  if (!isAdmin) return (
    <div className="min-h-screen bg-black text-[#0f0] flex flex-col items-center justify-center text-center p-6 font-mono">
      <h1 className="text-4xl mb-2 animate-pulse">ACCESS DENIED</h1>
      <p className="mb-6">UNAUTHORIZED PERSONNEL. PLEASE LEAVE.</p>
      <Link href="/" className="border border-[#0f0] px-6 py-2 hover:bg-[#0f0] hover:text-black transition">RETURN TO PORTAL</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-[#0f0] font-mono p-2 sm:p-6 uppercase selection:bg-[#0f0] selection:text-black text-xs sm:text-sm">
      <div className="border-4 border-double border-[#0f0] p-1 shadow-[0_0_20px_rgba(0,255,0,0.3)] min-h-[90vh]">
        <div className="border border-[#0f0] p-4 sm:p-6 h-full flex flex-col">
          
          {/* HEADER */}
          <div className="border-b-2 border-dashed border-[#0f0] pb-4 mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-widest text-[#0f0] drop-shadow-[0_0_5px_#0f0]">* GIZMO OS v2.0.0 *</h1>
              <p className="opacity-80 mt-1">ROOT ACCESS DETECTED // ID: {adminId.split('-')[0]}</p>
            </div>
            <Link href="/" className="border border-[#0f0] px-4 py-1 hover:bg-[#0f0] hover:text-black font-bold">LOGOUT_</Link>
          </div>

          {/* MENUS */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['SYSTEM', 'ORDERS', 'USERS', 'GALLERY'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 border border-[#0f0] transition-colors ${activeTab === tab ? 'bg-[#0f0] text-black font-bold shadow-[0_0_10px_#0f0]' : 'hover:bg-[#0f0]/20'}`}>
                [{tab}]
              </button>
            ))}
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 bg-black p-4 border border-[#0f0]/50 overflow-y-auto custom-scrollbar relative">
            
            {/* TAB SYSTEM */}
            {activeTab === 'SYSTEM' && (
              <div className="space-y-6">
                <p className="animate-pulse mb-4">_SYSTEM_OVERVIEW</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-[#0f0] p-4">
                    <h3 className="mb-2 border-b border-[#0f0] pb-2">DATA_METRICS</h3>
                    <p>TOTAL REG. USERS: {userList.length}</p>
                    <p>TOTAL PHOTOS IN DB: {gallery.length}</p>
                    <p className="text-white bg-[#0f0]/30 p-2 my-2 inline-block shadow-[0_0_10px_#0f0]">PHOTOS TAKEN TODAY: {todayCount}</p>
                    <p>PENDING PRINT ORDERS: {orders.filter(o => o.status === 'pending').length}</p>
                  </div>
                  
                  <div className="border border-[#0f0] p-4">
                    <h3 className="mb-2 border-b border-[#0f0] pb-2">CORE_COMMANDS</h3>
                    <div className="mb-2">CURRENT STATUS: {isMaintenance ? <span className="text-red-500 font-bold blink">SUSPENDED</span> : <span className="text-green-500 font-bold">ONLINE</span>}</div>
                    <button disabled={isTogglingMode} onClick={toggleMaintenance} className={`border border-[#0f0] px-4 py-2 w-full font-bold transition-colors ${isMaintenance ? 'hover:bg-[#0f0] hover:text-black' : 'hover:bg-red-500 hover:border-red-500 hover:text-black'}`}>
                      {isTogglingMode ? 'EXECUTING...' : (isMaintenance ? '> REBOOT SYSTEM ONLINE' : '> INITIATE MAINTENANCE MODE')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB USERS (NÂNG CẤP TOÀN DIỆN) */}
            {activeTab === 'USERS' && (
              <div className="flex flex-col gap-6 h-full">
                {/* NỬA TRÊN: BẢNG DANH SÁCH USER */}
                <div className="border border-[#0f0] flex flex-col max-h-[50vh]">
                  <h3 className="bg-[#0f0]/20 p-2 font-bold flex justify-between">
                    <span>> REGISTERED_USER_DATABASE</span>
                    <span>TOTAL: {userList.length}</span>
                  </h3>
                  <div className="overflow-y-auto overflow-x-auto custom-scrollbar p-2">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#0f0]/50 opacity-70">
                          <th className="p-2 whitespace-nowrap">EMAIL</th>
                          <th className="p-2">ROLE</th>
                          <th className="p-2">PLAN</th>
                          <th className="p-2">SHOOTS</th>
                          <th className="p-2 whitespace-nowrap">EXPIRY_DATE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userList.map(u => (
                          <tr key={u.user_id} className="border-b border-[#0f0]/20 hover:bg-[#0f0]/10 cursor-pointer" onClick={() => setTargetEmail(u.user_email)}>
                            <td className="p-2 truncate max-w-[150px]" title={u.user_email}>{u.user_email}</td>
                            <td className="p-2">{u.user_role === 'admin' ? <span className="bg-red-500/20 text-red-400 font-bold px-1">[ADMIN]</span> : 'USER'}</td>
                            <td className="p-2">{u.user_plan}</td>
                            <td className="p-2 text-center">{u.shoots}</td>
                            <td className="p-2 text-[10px] opacity-80">
                              {u.expires_at ? new Date(u.expires_at).toLocaleString('vi-VN') : 'PERMANENT'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* NỬA DƯỚI: TERMINAL ĐIỀU KHIỂN */}
                <div className="border border-[#0f0] p-4 bg-[#0f0]/5">
                  <h3 className="mb-4 text-center font-bold">> TERMINAL COMMAND: OVERRIDE PRIVILEGES</h3>
                  
                  {/* Ô nhập Email chung cho mọi lệnh */}
                  <div className="mb-6 bg-black p-3 border border-[#0f0] flex flex-col md:flex-row items-center gap-4">
                    <label className="whitespace-nowrap font-bold text-yellow-400">TARGET_EMAIL:</label>
                    <input type="email" value={targetEmail} onChange={e => setTargetEmail(e.target.value)} className="w-full bg-transparent border-b border-[#0f0]/50 focus:outline-none focus:border-[#0f0] text-white" placeholder="Select from list or type..." />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Lệnh 1: Tặng gói thời gian */}
                    <form onSubmit={handleGiftTempPlan} className="border border-[#0f0]/50 p-4">
                      <p className="mb-3 text-pink-400 font-bold"># CMD 1: GRANT_VIP_PLAN</p>
                      <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} className="w-full bg-black border border-[#0f0] p-2 mb-3 outline-none">
                        <option value="free">L0: FREE (Revoke)</option><option value="pro">L1: PRO</option><option value="vnu">SP: VNU</option>
                        <option value="limitless">L2: LIMITLESS</option><option value="exclusive">L3: EXCLUSIVE</option>
                      </select>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="opacity-70">HOURS:</span>
                        <input type="number" min="1" value={giftHours} onChange={e => setGiftHours(e.target.value)} className="w-full bg-black border border-[#0f0] p-1 text-center outline-none" />
                      </div>
                      <button disabled={isGiftingPlan || !targetEmail} type="submit" className="w-full border border-[#0f0] hover:bg-[#0f0] hover:text-black py-1">EXECUTE</button>
                    </form>

                    {/* Lệnh 2: Tặng lượt chụp */}
                    <form onSubmit={handleGiftShoots} className="border border-[#0f0]/50 p-4">
                      <p className="mb-3 text-cyan-400 font-bold"># CMD 2: ADD_SHOOTS</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="opacity-70">AMOUNT:</span>
                        <input type="number" min="1" value={giftShoots} onChange={e => setGiftShoots(e.target.value)} className="w-full bg-black border border-[#0f0] p-1 text-center outline-none" />
                      </div>
                      <button disabled={isGiftingShoots || !targetEmail} type="submit" className="w-full mt-[42px] border border-[#0f0] hover:bg-[#0f0] hover:text-black py-1">EXECUTE</button>
                    </form>

                    {/* Lệnh 3: Quản lý Admin */}
                    <div className="border border-[#0f0]/50 p-4 flex flex-col justify-between">
                      <p className="mb-3 text-red-400 font-bold"># CMD 3: MANAGE_ADMIN</p>
                      <div className="flex gap-2 mt-[42px]">
                        <button disabled={isSettingRole || !targetEmail} onClick={() => handleSetRole('admin')} className="w-full border border-red-500 text-red-500 hover:bg-red-500 hover:text-black py-1">PROMOTE</button>
                        <button disabled={isSettingRole || !targetEmail} onClick={() => handleSetRole('user')} className="w-full border border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-black py-1">DEMOTE</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB ORDERS (Không thay đổi) */}
            {activeTab === 'ORDERS' && (
              <div>
                 <p className="mb-4">_PRINT_REQUESTS_LOG</p>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse border border-[#0f0]">
                     <thead>
                       <tr className="border-b border-[#0f0] bg-[#0f0]/10">
                         <th className="p-2 border-r border-[#0f0]">IMG</th><th className="p-2 border-r border-[#0f0]">TARGET</th><th className="p-2 border-r border-[#0f0]">DESTINATION</th><th className="p-2 border-r border-[#0f0]">TRACKING</th><th className="p-2">CMD</th>
                       </tr>
                     </thead>
                     <tbody>
                       {orders.map(order => (
                         <tr key={order.id} className="border-b border-[#0f0]/30 hover:bg-[#0f0]/5">
                           <td className="p-2 border-r border-[#0f0]"><a href={order.image_url} target="_blank" rel="noreferrer"><img src={getDirectDriveLink(order.image_url)} className="w-16 h-16 object-cover border border-[#0f0]" alt="img"/></a></td>
                           <td className="p-2 border-r border-[#0f0]"><div className="font-bold">{order.customer_name}</div><div className="opacity-70 text-[10px]">{order.user_email}</div></td>
                           <td className="p-2 border-r border-[#0f0]"><div className="text-[10px]">{order.phone}</div><div className="text-[10px] line-clamp-2">{order.address}</div></td>
                           <td className="p-2 border-r border-[#0f0]">
                             {order.status === 'pending' && <span className="bg-yellow-600/30 text-yellow-500 p-1">PENDING</span>} {order.status === 'shipping' && <span className="bg-blue-600/30 text-blue-500 p-1">SHIPPED</span>} {order.status === 'completed' && <span className="bg-green-600/30 text-green-500 p-1">DONE</span>}
                             {order.status !== 'completed' && ( <input type="text" placeholder="TRACKING#" className="w-full bg-black border border-[#0f0] mt-2 p-1 focus:outline-none focus:bg-[#0f0]/10" value={trackingInput[order.id] !== undefined ? trackingInput[order.id] : (order.tracking_code || '')} onChange={e => setTrackingInput({...trackingInput, [order.id]: e.target.value})} /> )}
                           </td>
                           <td className="p-2 text-right">
                             {order.status === 'pending' && <button onClick={() => updateOrderStatus(order.id, 'shipping', trackingInput[order.id])} className="border border-[#0f0] px-2 py-1 hover:bg-[#0f0] hover:text-black">DISPATCH</button>}
                             {order.status === 'shipping' && <button onClick={() => updateOrderStatus(order.id, 'completed', trackingInput[order.id])} className="border border-[#0f0] px-2 py-1 hover:bg-[#0f0] hover:text-black">FINISH</button>}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              </div>
            )}

            {/* TAB GALLERY (Không thay đổi) */}
            {activeTab === 'GALLERY' && (
               <div>
                 <p className="mb-4">_GLOBAL_IMAGE_REPOSITORY</p>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                   {gallery.map(photo => (
                     <div key={photo.id} className="border border-[#0f0] p-1 relative group bg-black hover:bg-[#0f0]/10 transition-colors">
                       <a href={photo.image_url} target="_blank" rel="noreferrer"><img src={getDirectDriveLink(photo.image_url)} alt="db" className="w-full aspect-square object-cover grayscale group-hover:grayscale-0 transition-all"/></a>
                       <div className="text-[10px] mt-1 truncate px-1">{photo.user_email}</div>
                       <button onClick={() => handleDeletePhoto(photo.id)} className="absolute top-2 right-2 bg-black border border-[#0f0] text-red-500 px-2 py-1 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-black">DEL</button>
                     </div>
                   ))}
                 </div>
               </div>
            )}

          </div>
          {/* FOOTER */}
          <div className="mt-4 pt-2 border-t-2 border-dashed border-[#0f0] flex justify-between text-[10px] opacity-70">
             <span>SYS_TIME: {new Date().toISOString()}</span>
             <span>GIZMO_DB_CONNECTED</span>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .blink { animation: blinker 1s linear infinite; }
        @keyframes blinker { 50% { opacity: 0; } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: black; border-left: 1px solid rgba(0,255,0,0.3); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #0f0; }
      `}} />
    </div>
  );
}