import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase'; // Đảm bảo import đúng đường dẫn supabase
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Lấy thông tin từ SePay bắn về
    const amount = Number(body.transferAmount || 0);
    const content = (body.content || "").toUpperCase();

    // Nếu không phải giao dịch của web Gizmo thì bỏ qua
    if (!content.includes('GIZMO')) {
      return NextResponse.json({ message: 'Bỏ qua, không phải giao dịch Gizmo' }, { status: 200 });
    }

    // 2. Xác định khách mua gói nào và số tiền có đúng không
    let plan = '';
    let dailyShoots = 10;
    
    if (content.includes('PRO') && amount >= 49000) { 
        plan = 'pro'; dailyShoots = 20; 
    } else if (content.includes('LIMITLESS') && amount >= 199000) { 
        plan = 'limitless'; dailyShoots = 9999; 
    } else if (content.includes('EXCLUSIVE') && amount >= 499000) { 
        plan = 'exclusive'; dailyShoots = 9999; 
    } else {
        return NextResponse.json({ message: 'Sai số tiền hoặc sai tên gói' }, { status: 200 });
    }

    // 3. Trích xuất mã ID rút gọn của khách hàng (6 ký tự)
    // Ví dụ: GIZMO PRO AF5C1C -> Lấy ra "AF5C1C"
    const match = content.match(/GIZMO\s+(PRO|LIMITLESS|EXCLUSIVE)\s+([A-Z0-9]{6})/);
    if (!match) {
      return NextResponse.json({ message: 'Không tìm thấy mã ID khách hàng' }, { status: 200 });
    }
    const shortCode = match[2].toLowerCase();

    // 4. Khởi tạo Supabase bằng Quyền Admin (Để xuyên qua lớp bảo mật sửa Database)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Bắt buộc phải có Key này trên Vercel
    );

    // 5. Tìm khách hàng trong Database dựa vào 6 ký tự đầu của ID
    const { data: users, error: searchError } = await supabaseAdmin
      .from('profiles')
      .select('id');

    if (searchError || !users) {
      return NextResponse.json({ message: 'Lỗi truy xuất Database' }, { status: 500 });
    }

    // Tìm chính xác user có ID bắt đầu bằng 6 ký tự đó
    const matchedUser = users.find(u => u.id.toLowerCase().startsWith(shortCode));

    if (!matchedUser) {
      return NextResponse.json({ message: 'Không tìm thấy User này trong hệ thống' }, { status: 200 });
    }

    // 6. Nâng cấp VIP cho User
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ plan: plan, daily_shoots: dailyShoots })
      .eq('id', matchedUser.id);

    if (updateError) {
      return NextResponse.json({ message: 'Lỗi cập nhật VIP' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Kích hoạt VIP ${plan} thành công!` }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: 'Lỗi Server nội bộ', error: error.message }, { status: 500 });
  }
}