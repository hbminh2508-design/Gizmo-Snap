import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Dùng service_role để Backend có quyền Admin can thiệp vào Database
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    // Nhận dữ liệu từ SePay gửi về
    const body = await req.json();
    
    const amountIn = body.amountIn; // Số tiền nhận được
    const content = body.content;   // Nội dung chuyển khoản (VD: GIZMO PRO 1A2B3C)

    if (!amountIn || !content) {
      return NextResponse.json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }

    const text = content.toUpperCase();
    let planToUpgrade = null;

    // --- KIỂM TRA SỐ TIỀN VÀ CÚ PHÁP CHO CẢ 3 GÓI ---
    if (text.includes('GIZMO PRO') && amountIn >= 49000) {
      planToUpgrade = 'pro';
    } else if (text.includes('GIZMO LIMITLESS') && amountIn >= 199000) {
      planToUpgrade = 'limitless';
    } else if (text.includes('GIZMO EXCLUSIVE') && amountIn >= 499000) {
      planToUpgrade = 'exclusive';
    }

    if (planToUpgrade) {
      // Tách lấy mã Code (6 ký tự) của người dùng từ nội dung chuyển khoản
      const parts = text.split(' ');
      const userCode = parts[parts.length - 1]; 

      // Tìm user có ID bắt đầu bằng mã code này
      const { data: users, error: searchError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('id', `${userCode}%`) // Tìm ID bắt đầu bằng 6 ký tự
        .limit(1);

      if (users && users.length > 0) {
        const targetUserId = users[0].id;

        // Tiến hành nâng cấp Gói cước và Reset lại lượt ngay lập tức
        // Pro = 20 lượt, Limitless và Exclusive = 9999 (Vô hạn)
        const dailyShoots = planToUpgrade === 'pro' ? 20 : 9999;
        
        await supabaseAdmin
          .from('profiles')
          .update({ 
            plan: planToUpgrade,
            daily_shoots: dailyShoots
          })
          .eq('id', targetUserId);
          
        console.log(`[Thành công] Đã nâng cấp ${planToUpgrade} cho user ${targetUserId}`);
      }
    }

    return NextResponse.json({ success: true, message: 'Đã xử lý giao dịch' });

  } catch (error: any) {
    console.error("Lỗi Webhook:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}