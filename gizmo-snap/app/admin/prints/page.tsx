"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Truck, CheckCircle, Clock, Package, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AdminPrints() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [trackingInput, setTrackingInput] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    
    if (profile?.role === 'admin') {
      setIsAdmin(true);
      fetchOrders();
    }
    setLoading(false);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('print_requests').select('*').order('created_at', { ascending: false });
    if (!error && data) setOrders(data);
  };

  const updateStatus = async (id: string, newStatus: string, trackingCode?: string) => {
    const updateData: any = { status: newStatus };
    if (trackingCode) updateData.tracking_code = trackingCode;

    const { error } = await supabase.from('print_requests').update(updateData).eq('id', id);
    if (error) {
      alert("Lỗi cập nhật: " + error.message);
    } else {
      alert("Cập nhật thành công!");
      fetchOrders(); // Refresh data
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold">Đang kiểm tra quyền...</div>;
  
  if (!isAdmin) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-6">
      <AlertCircle size={64} className="text-red-500 mb-4" />
      <h1 className="text-2xl font-black text-slate-800 mb-2">Truy cập bị từ chối</h1>
      <p className="text-gray-500 mb-6">Bạn không có quyền quản trị viên để xem trang này.</p>
      <Link href="/" className="bg-pink-500 text-white px-6 py-2 rounded-xl font-bold">Quay lại Trang chủ</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Package className="text-amber-500" size={32}/> Quản lý Đơn In Ảnh (Exclusive)
          </h1>
          <Link href="/" className="text-sm font-bold text-gray-500 hover:text-pink-500">Quay lại Web</Link>
        </div>

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
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <a href={order.image_url} target="_blank" rel="noreferrer">
                      <img src={order.image_url} className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm hover:scale-105 transition-transform" alt="print" />
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
                      {order.status === 'completed' && <span className="inline-flex items-center gap-1 w-fit text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold"><CheckCircle size={12}/> Đã hoàn thành</span>}
                      
                      {order.status !== 'completed' && (
                        <input 
                          type="text" 
                          placeholder="Nhập mã vận đơn (GHTK, SPX...)" 
                          className="text-xs p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 w-48"
                          value={trackingInput[order.id] !== undefined ? trackingInput[order.id] : (order.tracking_code || '')}
                          onChange={(e) => setTrackingInput({...trackingInput, [order.id]: e.target.value})}
                        />
                      )}
                      {order.status === 'completed' && order.tracking_code && (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{order.tracking_code}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'shipping', trackingInput[order.id])}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded shadow-sm"
                      >
                        Gửi hàng
                      </button>
                    )}
                    {order.status === 'shipping' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'completed', trackingInput[order.id])}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded shadow-sm"
                      >
                        Hoàn thành
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-500">Chưa có đơn yêu cầu in ảnh nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}