"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Truck, CheckCircle, Clock, Package, AlertCircle, Users, Image as ImageIcon, Trash2, ShieldCheck, Crown, Loader2 } from "lucide-react";
import Link from "next/link";
import { getDirectDriveLink } from "../page";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminId, setAdminId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'gallery'>('orders');

  // State cho Tab Đơn hàng
  const [orders, setOrders] = useState<any[]>([]);
  const [trackingInput, setTrackingInput] = useState<{ [key: string]: string }>({});

  // State cho Tab User (Cấp/Xóa VIP)
  const [targetEmail, setTargetEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // State cho Tab Kho ảnh
  const [gallery, setGallery] = useState<any[]>([]);

  useEffect(() => { checkAdminAndFetch(); }, []);

  const checkAdminAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (profile?.role === 'admin') {
      setIsAdmin(true); setAdminId(session.user.id);
      fetchOrders(); fetchGallery();
    }
    setLoading(false);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('print_requests').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const fetchGallery = async () => {
    const { data } = await supabase.from('photos').select('*').order('created_at', { ascending: false });
    if (data) setGallery(data);
  };

  // --- HÀM TRAO/XÓA GÓI VIP ---
  const handleUpdateUserPlan = async (e: React.FormEvent) => {
    e.preventDefault(); setIsUpdatingUser(true);
    // Gọi hàm RPC đã tạo ở Bước 1
    const { data, error } = await supabase.rpc('admin_update_user_plan', {
      target_email: targetEmail, new_plan: selectedPlan, admin_id: adminId
    });
    setIsUpdatingUser(false);
    if (error || !data.success) alert("Lỗi: " + (error?.message || data.error));
    else { alert(`🎉 Đã cấp thành công gói [${selectedPlan.toUpperCase()}] cho email ${targetEmail}!`); setTargetEmail(''); }
  };

  // --- HÀM XÓA ẢNH PHẢN CẢM ---
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ảnh này khỏi hệ thống?")) return;
    const { error } = await supabase.from('photos').delete().eq('id', photoId);
    if (error) alert("Lỗi khi xóa: " + error.message); else fetchGallery();
  };

  // --- HÀM CẬP NHẬT ĐƠN VẬN CHUYỂN ---
  const updateOrderStatus = async (id: string, newStatus: string, trackingCode?: string) => {
    const updateData: any = { status: newStatus }; if (trackingCode) updateData.tracking_code = trackingCode;
    const { error } = await supabase.from('print_requests').update(updateData).eq('id', id);
    if (error) alert("Lỗi cập nhật: " + error.message); else fetchOrders();
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold">Đang kiểm tra quyền...</div>;
  if (!isAdmin) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-6">
      <AlertCircle size={64} className="text-red-500 mb-4" />
      <h1 className="text-2xl font-black text-slate-800 mb-2">Bạn không phải Admin!</h1>
      <Link href="/" className="bg-pink-500 text-white px-6 py-2 rounded-xl font-bold">Quay lại Trang chủ</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3"><ShieldCheck className="text-emerald-500" size={36}/> Bảng Quản Trị Hệ Thống</h1>
          <Link href="/" className="text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2 rounded-xl transition">Thoát Admin</Link>
        </div>

        {/* TABS MENU */}
        <div className="flex gap-4 mb-6">
          <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 font-bold px-6 py-3 rounded-2xl transition ${activeTab === 'orders' ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}><Package size={20}/> Đơn In Ảnh</button>
          <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 font-bold px-6 py-3 rounded-2xl transition ${activeTab === 'users' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}><Users size={20}/> Trao Quyền VIP</button>
          <button onClick={() => setActiveTab('gallery')} className={`flex items-center gap-2 font-bold px-6 py-3 rounded-2xl transition ${activeTab === 'gallery' ? 'bg-pink-500 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}><ImageIcon size={20}/> Kho Ảnh Chung</button>
        </div>

        {/* TAB 1: ĐƠN HÀNG */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Ảnh in</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Khách hàng</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Giao hàng</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Trạng thái & Mã Vận Đơn</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <a href={order.image_url} target="_blank" rel="noreferrer">
                        <img src={getDirectDriveLink(order.image_url)} className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm" alt="print" />
                      </a>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-sm text-slate-800">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">{order.user_email}</p>
                      <p className="text-xs font-mono text-gray-400 mt-1">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
                    </td>
                    <td className="p-4 max-w-[200px]">
                      <p className="text-sm font-bold text-slate-700">{order.phone}</p>
                      <p className="text-xs text-gray-500 truncate whitespace-normal line-clamp-2">{order.address}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        {order.status === 'pending' && <span className="inline-flex items-center gap-1 w-fit text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-bold"><Clock size={12}/> Chờ xử lý</span>}
                        {order.status === 'shipping' && <span className="inline-flex items-center gap-1 w-fit text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold"><Truck size={12}/> Đang giao</span>}
                        {order.status === 'completed' && <span className="inline-flex items-center gap-1 w-fit text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold"><CheckCircle size={12}/> Hoàn thành</span>}
                        
                        {order.status !== 'completed' && (
                          <input type="text" placeholder="Nhập mã (GHTK, SPX...)" className="text-xs p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 w-48"
                            value={trackingInput[order.id] !== undefined ? trackingInput[order.id] : (order.tracking_code || '')}
                            onChange={(e) => setTrackingInput({...trackingInput, [order.id]: e.target.value})} />
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {order.status === 'pending' && <button onClick={() => updateOrderStatus(order.id, 'shipping', trackingInput[order.id])} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded shadow-sm">Gửi hàng</button>}
                      {order.status === 'shipping' && <button onClick={() => updateOrderStatus(order.id, 'completed', trackingInput[order.id])} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded shadow-sm">Hoàn thành</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ USER */}
        {activeTab === 'users' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 max-w-2xl mx-auto mt-10">
            <div className="text-center mb-6">
              <Crown size={48} className="text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-slate-800">Trao / Tước Quyền VIP</h2>
              <p className="text-sm text-gray-500">Nhập chính xác Email của người dùng đã đăng nhập vào hệ thống để thay đổi gói cước của họ.</p>
            </div>
            
            <form onSubmit={handleUpdateUserPlan} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Email khách hàng:</label>
                <input required type="email" value={targetEmail} onChange={e => setTargetEmail(e.target.value)} className="w-full mt-2 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="VD: nguyenvan_a@gmail.com" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Chọn gói cước mới:</label>
                <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} className="w-full mt-2 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-bold text-slate-700">
                  <option value="free">FREE (Hủy VIP, về 10 lượt/ngày)</option>
                  <option value="pro">PRO (20 lượt/ngày)</option>
                  <option value="limitless">LIMITLESS (Không giới hạn)</option>
                  <option value="exclusive">EXCLUSIVE (Không giới hạn + In ảnh)</option>
                  <option value="vnu">VNU (50 lượt/ngày)</option>
                </select>
              </div>
              <button disabled={isUpdatingUser} type="submit" className={`w-full py-4 mt-4 rounded-xl text-white font-bold flex justify-center items-center gap-2 ${isUpdatingUser ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isUpdatingUser ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>} Xác nhận Thay đổi
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: KHO ẢNH CHUNG */}
        {activeTab === 'gallery' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {gallery.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 py-10 font-bold">Chưa có ảnh nào trong kho.</p>
            ) : (
              gallery.map(photo => (
                <div key={photo.id} className="relative group bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
                  <a href={photo.image_url} target="_blank" rel="noreferrer">
                    <img src={getDirectDriveLink(photo.image_url)} alt="gallery" className="w-full aspect-square object-cover rounded-xl" />
                  </a>
                  <div className="mt-3 px-2 pb-2">
                    <p className="text-xs font-bold text-slate-700 truncate" title={photo.user_email}>{photo.user_email}</p>
                    <p className="text-[10px] text-gray-400">{new Date(photo.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                  {/* Nút Xóa hiện lên khi Hover */}
                  <button onClick={() => handleDeletePhoto(photo.id)} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}