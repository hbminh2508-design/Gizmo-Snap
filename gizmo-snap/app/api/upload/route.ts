import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream'; 

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "Không tìm thấy file ảnh!" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // --- SỬ DỤNG TÀI KHOẢN CÁ NHÂN CỦA BẠN (OAUTH 2.0) ---
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    // Tự động làm mới quyền truy cập bằng Refresh Token
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const fileMetadata = {
      name: `Gizmo_Snap_${Date.now()}.jpg`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
    };

    const media = {
      mimeType: 'image/jpeg',
      body: Readable.from(buffer), 
    };

    // Bắn thẳng file lên Drive của bạn
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    // Mở quyền public để mã QR quét được
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    return NextResponse.json({ success: true, link: response.data.webViewLink });

  } catch (error: any) {
    console.error("Lỗi Upload Drive:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}