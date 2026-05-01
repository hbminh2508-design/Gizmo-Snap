"use client";

import { useEffect, useRef } from 'react';

interface FrameComposerProps {
  photos: string[];
  layout: '2x2' | 'strip3' | 'strip4' | 'polaroid' | 'film' | 'grid6';
  theme: 'dark' | 'pink' | 'cyberpunk' | 'spiderman' | '30_4' | 'vietnam' | 'hello_kitty';
  isPremium: boolean;
  onGenerateSuccess: (base64: string) => void;
  onGenerateError: (error: any) => void;
  isLoading: boolean;
  userEmail?: string;
}

const maxPhotosMap = {
  '2x2': 4, 'strip3': 3, 'strip4': 4, 'polaroid': 1, 'film': 3, 'grid6': 6
};

// Hàm nạp ảnh
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Lỗi nạp ảnh: ${url}`));
    img.src = url;
  });
};

export default function FrameComposer({
  photos, layout, theme, isPremium,
  onGenerateSuccess, onGenerateError,
  isLoading
}: FrameComposerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isLoading && photos.length === maxPhotosMap[layout]) {
      generateFrame();
    }
  }, [isLoading, photos, layout, theme]);

  // ==========================================
  // HÀM VẼ ẢNH CHỐNG MÉO (OBJECT-FIT: COVER)
  // ==========================================
  const drawImageCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, radius: number = 0) => {
    const imgRatio = img.width / img.height;
    const targetRatio = w / h;
    let sx, sy, sWidth, sHeight;

    // Toán học để crop ảnh luôn nằm chính giữa, không bao giờ bị méo
    if (imgRatio > targetRatio) {
      sHeight = img.height;
      sWidth = img.height * targetRatio;
      sx = (img.width - sWidth) / 2;
      sy = 0;
    } else {
      sWidth = img.width;
      sHeight = img.width / targetRatio;
      sx = 0;
      sy = (img.height - sHeight) / 2;
    }

    ctx.save();
    // Bo góc ảnh nếu cần
    if (radius > 0) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.clip();
    }
    // Vẽ phần ảnh đã crop lên Canvas
    ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
    ctx.restore();
  };

  const generateFrame = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      // 1. Setup Kích thước Canvas
      let imgW = 640, imgH = 360; 
      let coords: {x: number, y: number}[] = [];
      
      if (layout === '2x2') {
        canvas.width = 1400; canvas.height = 1000;
        coords = [ { x: 40, y: 140 }, { x: 720, y: 140 }, { x: 40, y: 540 }, { x: 720, y: 540 } ];
      } else if (layout === 'strip3') {
        canvas.width = 720; canvas.height = 1350;
        coords = [ { x: 40, y: 140 }, { x: 40, y: 520 }, { x: 40, y: 900 } ];
      } else if (layout === 'strip4') {
        canvas.width = 720; canvas.height = 1750;
        coords = [ { x: 40, y: 140 }, { x: 40, y: 520 }, { x: 40, y: 900 }, { x: 40, y: 1280 } ];
      } else if (layout === 'polaroid') {
        canvas.width = 800; canvas.height = 1000;
        imgW = 720; imgH = 720; 
        coords = [ { x: 40, y: 120 } ];
      } else if (layout === 'film') {
        canvas.width = 2060; canvas.height = 600;
        coords = [ { x: 40, y: 140 }, { x: 720, y: 140 }, { x: 1400, y: 140 } ];
      } else if (layout === 'grid6') {
        canvas.width = 1400; canvas.height = 1400;
        coords = [ { x: 40, y: 140 }, { x: 720, y: 140 }, { x: 40, y: 540 }, { x: 720, y: 540 }, { x: 40, y: 940 }, { x: 720, y: 940 } ];
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Tải tất cả ảnh trước khi vẽ
      const loadedImages = await Promise.all(photos.map(src => loadImage(src)));

      // 2. Chạy thuật toán vẽ theo Theme
      if (theme === '30_4') {
        draw30_4Theme(ctx, canvas, loadedImages, coords, imgW, imgH);
      } else if (theme === 'hello_kitty') {
        drawHelloKittyTheme(ctx, canvas, loadedImages, coords, imgW, imgH);
      } else {
        drawBasicTheme(ctx, canvas, loadedImages, coords, imgW, imgH);
      }

      // Xong thì xuất Base64
      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      onGenerateSuccess(base64);

    } catch (error) {
      console.error(error);
      onGenerateError(error);
    }
  };

  // ==========================================
  // THUẬT TOÁN VẼ VECTOR PHỤ KIỆN
  // ==========================================
  const drawPaperclip = (ctx: CanvasRenderingContext2D, x: number, y: number, angleDeg: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angleDeg * Math.PI) / 180);
    ctx.scale(1.5, 1.5); // Phóng to kẹp giấy

    // Đổ bóng kẹp giấy
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const path = new Path2D("M28 29.3C28 35.8 22.8 41 16.3 41 C9.8 41 4.5 35.8 4.5 29.3L4.5 10C4.5 5.9 7.9 2.5 12 2.5 C16.1 2.5 19.5 5.9 19.5 10L19.5 27.5C19.5 29.4 17.9 31 16 31 C14.1 31 12.5 29.4 12.5 27.5L12.5 11L10 11L10 27.5C10 30.8 12.7 33.5 16 33.5 C19.3 33.5 22 30.8 22 27.5L22 10C22 4.5 17.5 0 12 0 C6.5 0 2 4.5 2 10L2 29.3C2 37.1 8.4 43.5 16.3 43.5 C24.1 43.5 30.5 37.1 30.5 29.3L30.5 11L28 11L28 29.3Z");
    ctx.fillStyle = '#cbd5e1'; // Màu bạc kim loại
    ctx.fill(path);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.stroke(path);
    ctx.restore();
  };

  const drawKittyBow = (ctx: CanvasRenderingContext2D, x: number, y: number, angleDeg: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angleDeg * Math.PI) / 180);
    ctx.scale(1.5, 1.5);

    ctx.shadowColor = 'rgba(244,114,182,0.6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const path = new Path2D("M 20 15 C 10 0, 0 10, 10 25 C 0 40, 10 50, 20 35 C 25 35, 35 35, 40 35 C 50 50, 60 40, 50 25 C 60 10, 50 0, 40 15 C 35 15, 25 15, 20 15 Z M 30 25 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0");
    ctx.fillStyle = '#f472b6';
    ctx.fill(path);
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 2;
    ctx.stroke(path);
    ctx.restore();
  };

  // Vẽ tem thư với lỗ đục
  const drawStamp = (ctx: CanvasRenderingContext2D, x: number, y: number, angleDeg: number, bgThemeColor: string) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angleDeg * Math.PI) / 180);
    
    const w = 140, h = 180;
    
    // Nền trắng tem có bóng
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, w, h);
    ctx.shadowColor = 'transparent'; // Tắt shadow để vẽ chi tiết trong

    // Đục lỗ viền (Vẽ đè hình tròn màu nền lên rìa tem)
    ctx.fillStyle = bgThemeColor;
    const r = 6, step = 20;
    for(let i=step; i<w; i+=step) {
      ctx.beginPath(); ctx.arc(i, 0, r, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(i, h, r, 0, Math.PI*2); ctx.fill();
    }
    for(let i=step; i<h; i+=step) {
      ctx.beginPath(); ctx.arc(0, i, r, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(w, i, r, 0, Math.PI*2); ctx.fill();
    }

    // Viền trong đỏ
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1;
    ctx.strokeRect(15, 15, w-30, h-30);

    // Con dấu mờ
    ctx.beginPath();
    ctx.arc(w/2 - 30, h/2 - 30, 30, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hình ngôi sao
    ctx.save();
    ctx.translate(w/2, 50);
    ctx.scale(0.4, 0.4);
    const star = new Path2D("M 50 5 L 61 39 L 97 39 L 68 59 L 79 93 L 50 72 L 21 93 L 32 59 L 3 39 L 39 39 Z");
    ctx.fillStyle = '#facc15';
    ctx.fill(star);
    ctx.restore();

    // Chữ Bưu Chính
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('BƯU CHÍNH', w/2, 25);
    ctx.fillStyle = '#b91c1c';
    ctx.fillText('VIỆT NAM', w/2, h - 25);

    ctx.restore();
  };


  // ==========================================
  // THEME 30/4 (SIÊU CHI TIẾT - CHUẨN MẪU)
  // ==========================================
  const draw30_4Theme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number) => {
    const RED_BG = '#991b1b';
    
    // Nền
    ctx.fillStyle = RED_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tiêu đề
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 55px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('KHUNG HÌNH KỶ NIỆM 30/4', canvas.width / 2, 80);
    ctx.shadowColor = 'transparent'; // Tắt bóng

    // Sao vàng góc phải
    ctx.fillStyle = '#facc15';
    ctx.font = '70px Arial';
    ctx.fillText('★', canvas.width - 80, 80);

    for (let i = 0; i < images.length; i++) {
      const cx = coords[i].x, cy = coords[i].y;
      const polW = imgW + 60, polH = imgH + 150;
      const polX = cx - 30, polY = cy - 30;

      // Vẽ nền trắng Polaroid
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(polX, polY, polW, polH, 4);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // Khung viền đen
      ctx.fillStyle = '#000';
      ctx.fillRect(cx - 5, cy - 5, imgW + 10, imgH + 10);

      // VẼ ẢNH NGƯỜI DÙNG VÀO CHÍNH GIỮA (Chống méo)
      drawImageCover(ctx, images[i], cx, cy, imgW, imgH);

      // Chữ dập nổi dưới khung Polaroid
      ctx.textAlign = 'center';
      const textX = cx + imgW/2, textY = cy + imgH + 50;

      if (i === 0) {
        ctx.fillStyle = '#b91c1c'; ctx.font = 'bold 26px Courier New';
        ctx.fillText('TỰ HÀO LÀ NGƯỜI VIỆT NAM', textX, textY + 10);
      } else if (i === 1) {
        ctx.fillStyle = '#111827'; ctx.font = 'bold 36px Courier New';
        ctx.fillText('KỶ NIỆM 50 NĂM', textX, textY + 15);
      } else {
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(textX - 200, textY - 30, 400, 60);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px Courier New';
        ctx.fillText('GIẢI PHÓNG MIỀN NAM 1975', textX, textY);
      }

      // Phụ kiện vector: Kẹp giấy & Tem
      if (i === 0) drawStamp(ctx, cx - 60, cy + 20, -10, RED_BG);
      if (i === 1) {
        drawStamp(ctx, cx + imgW - 60, cy + imgH, 15, RED_BG);
        drawPaperclip(ctx, cx + imgW - 20, cy - 40, 15);
      }
      if (i === 2) drawPaperclip(ctx, cx - 10, cy + 50, -45);
      if (i === 3) drawStamp(ctx, cx + imgW - 40, cy - 40, 5, RED_BG);
    }
  };


  // ==========================================
  // THEME HELLO KITTY (NƠ BO GÓC CHUẨN XÁC)
  // ==========================================
  const drawHelloKittyTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number) => {
    // Nền hồng nhạt
    ctx.fillStyle = '#fce7f3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Kẻ caro
    ctx.strokeStyle = '#fbcfe8';
    ctx.lineWidth = 2;
    for(let i=0; i<canvas.width; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for(let i=0; i<canvas.height; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

    // Tiêu đề
    ctx.shadowColor = '#f9a8d4'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#be185d';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('HELLO KITTY ADVENTURE', canvas.width / 2, 80);
    ctx.shadowColor = 'transparent';

    for (let i = 0; i < images.length; i++) {
      const cx = coords[i].x, cy = coords[i].y;
      
      // Viền trắng dày bo tròn
      ctx.shadowColor = 'rgba(0,0,0,0.1)'; ctx.shadowBlur = 15;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.roundRect(cx - 15, cy - 15, imgW + 30, imgH + 30, 20); ctx.fill();
      ctx.shadowColor = 'transparent';

      // Viền hồng đè lên
      ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.roundRect(cx - 15, cy - 15, imgW + 30, imgH + 30, 20); ctx.stroke();

      // Vẽ ảnh người dùng bo góc 10px (CHỐNG MÉO BẰNG OBJECT COVER)
      drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 10);

      // Chữ Hello Kitty dễ thương
      ctx.fillStyle = '#db2777'; ctx.font = 'bold 18px Courier New';
      ctx.fillText('Hello Kitty Signature', cx + imgW/2, cy + imgH + 30);

      // Gắn Nơ Vector
      if (i % 2 === 0) drawKittyBow(ctx, cx - 25, cy - 25, -15);
      else drawKittyBow(ctx, cx + imgW - 40, cy - 25, 15);
    }
  };


  // ==========================================
  // THEME CƠ BẢN & VIỆT NAM & SPIDERMAN
  // ==========================================
  const drawBasicTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number) => {
    let bgColor = "#0f172a", borderColor = "#ec4899", titleColor = "#ec4899", titleText = "GIZMO SNAP";
    
    if (theme === 'pink') { bgColor = "#fdf2f8"; borderColor = "#db2777"; titleColor = "#db2777"; }
    else if (theme === 'cyberpunk') { bgColor = "#000000"; borderColor = "#22c55e"; titleColor = "#eab308"; titleText = "CYBER-SNAP"; }
    else if (theme === 'spiderman') { bgColor = "#b91c1c"; borderColor = "#1d4ed8"; titleColor = "#facc15"; titleText = "SPIDER-VERSE"; }
    else if (theme === 'vietnam') { bgColor = "#7f1d1d"; borderColor = "#fde047"; titleColor = "#fde047"; titleText = "★ TỰ HÀO VIỆT NAM ★"; }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = titleColor;
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, canvas.width / 2, 80);

    for (let i = 0; i < images.length; i++) {
      // Viền ảnh
      ctx.lineWidth = 10;
      ctx.strokeStyle = borderColor;
      ctx.strokeRect(coords[i].x, coords[i].y, imgW, imgH);
      
      // Vẽ ảnh chuẩn chống méo
      drawImageCover(ctx, images[i], coords[i].x, coords[i].y, imgW, imgH);
    }
  };

  return <canvas ref={canvasRef} className="hidden" />;
}