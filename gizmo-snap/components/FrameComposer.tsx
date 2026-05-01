"use client";

import { useEffect, useRef } from 'react';

type ImageFilter = 'none' | 'sepia' | 'grayscale' | 'vintage' | 'brighten' | 'cool';

interface FrameComposerProps {
  photos: string[];
  layout: '2x2' | 'strip3' | 'strip4' | 'polaroid' | 'film' | 'grid6';
  theme: string;
  isPremium: boolean;
  onGenerateSuccess: (base64: string) => void;
  onGenerateError: (error: any) => void;
  isLoading: boolean;
  userEmail?: string;
  selectedFilter: ImageFilter;
  skinSmoothness: number;
}

const maxPhotosMap = { '2x2': 4, 'strip3': 3, 'strip4': 4, 'polaroid': 1, 'film': 3, 'grid6': 6 };

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Lỗi nạp ảnh: ${url}`));
    img.src = url;
  });
};

// CẤU HÌNH THÔNG MINH CHO CÁC KHUNG VẼ
const THEME_CONFIGS: Record<string, any> = {
  minimal: { bg: '#ffffff', border: '#ffffff', shadow: 'rgba(0,0,0,0.15)', title: 'MINIMAL', titleColor: '#404040', font: '300 60px Arial' },
  dark: { bgGradient: ['#0f172a', '#1e293b'], border: '#334155', title: 'DARK CLASSIC', titleColor: '#94a3b8', font: 'bold 60px Arial' },
  pink: { bgGradient: ['#fdf2f8', '#fbcfe8'], border: '#f9a8d4', title: 'PINKY', titleColor: '#db2777', font: 'bold 60px "Comic Sans MS", cursive' },
  ocean: { bgGradient: ['#e0f2fe', '#7dd3fc'], border: '#ffffff', title: 'OCEAN BREEZE', titleColor: '#0284c7', font: 'bold 60px Arial' },
  sunset: { bgGradient: ['#fef08a', '#f97316'], border: '#ffffff', title: 'SUNSET GLOW', titleColor: '#9a3412', font: 'bold 60px Arial' },
  pastel: { bgGradient: ['#f3e8ff', '#fce7f3'], border: '#ffffff', title: 'DREAM', titleColor: '#c084fc', font: 'bold 60px "Comic Sans MS"' },
  nature: { bg: '#dcfce7', border: '#bbf7d0', title: 'BOTANICAL', titleColor: '#166534', font: 'italic 60px Georgia' },
  y2k: { bgGradient: ['#f4f4f5', '#d4d4d8'], border: '#a1a1aa', title: 'Y2K CYBER', titleColor: '#3f3f46', pattern: 'stars', font: 'bold 60px "Courier New"' },
  golden: { bgGradient: ['#713f12', '#ca8a04'], border: '#fef08a', title: 'GOLDEN HOUR', titleColor: '#fef08a', glow: '#ca8a04', font: 'italic 60px "Times New Roman"' },
  cyberpunk: { bg: '#2e1065', border: '#22d3ee', title: 'CYBER CITY', titleColor: '#f0abfc', glow: '#c026d3', pattern: 'grid', font: 'bold 60px "Courier New"' },
  newspaper: { bg: '#f5f5f4', border: '#1c1917', title: 'THE DAILY NEWS', titleColor: '#1c1917', pattern: 'text', font: 'bold 70px "Times New Roman"' },
  kawaii: { bgGradient: ['#fbcfe8', '#fde047'], border: '#ffffff', title: 'KAWAII MAGIC', titleColor: '#db2777', pattern: 'sparkles', font: 'bold 60px "Comic Sans MS"' },
  gothic: { bg: '#171717', border: '#991b1b', title: 'DARK GOTHIC', titleColor: '#ef4444', font: 'italic 60px Georgia' },
  holo: { bgGradientHolo: true, border: '#ffffff', title: 'HOLOGRAPHIC', titleColor: '#ffffff', shadow: 'rgba(255,255,255,0.8)', font: 'bold 60px Arial' },
  spiderman: { bg: '#b91c1c', border: '#1d4ed8', title: 'SPIDER-VERSE', titleColor: '#facc15', font: 'bold 70px Arial' },
  vietnam: { bg: '#7f1d1d', border: '#fde047', title: '★ TỰ HÀO VN ★', titleColor: '#fde047', font: 'bold 60px Arial' },
};

export default function FrameComposer({
  photos, layout, theme, isPremium,
  onGenerateSuccess, onGenerateError,
  isLoading, selectedFilter, skinSmoothness
}: FrameComposerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isLoading && photos.length === maxPhotosMap[layout]) {
      generateFrame();
    }
  }, [isLoading, photos, layout, theme]);

  const drawImageCover = (
    ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number,
    w: number, h: number, radius: number = 0, filterCss: string = '', smoothness: number = 0
  ) => {
    const imgRatio = img.width / img.height;
    const targetRatio = w / h;
    let sx, sy, sWidth, sHeight;

    if (imgRatio > targetRatio) {
      sHeight = img.height; sWidth = img.height * targetRatio; sx = (img.width - sWidth) / 2; sy = 0;
    } else {
      sWidth = img.width; sHeight = img.width / targetRatio; sx = 0; sy = (img.height - sHeight) / 2;
    }

    ctx.save();
    if (radius > 0) { ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.clip(); }

    if (smoothness > 0 || filterCss !== '') {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width; tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(img, 0, 0);
        if (smoothness > 0) {
          tempCtx.filter = `blur(${smoothness / 10}px) brightness(${1 + smoothness / 200})`;
          tempCtx.drawImage(tempCanvas, 0, 0); tempCtx.filter = 'none'; 
        }
        if (filterCss !== '') {
          tempCtx.filter = filterCss; tempCtx.drawImage(tempCanvas, 0, 0); tempCtx.filter = 'none';
        }
        ctx.drawImage(tempCanvas, sx, sy, sWidth, sHeight, x, y, w, h);
      }
    } else {
      ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
    }
    ctx.restore();
  };

  const generateFrame = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;

    try {
      let imgW = 640, imgH = 360; 
      let coords: {x: number, y: number}[] = [];
      
      // Khởi tạo kích thước theo Layout
      if (layout === '2x2') { canvas.width = 1400; canvas.height = 1000; coords = [ { x: 40, y: 140 }, { x: 720, y: 140 }, { x: 40, y: 540 }, { x: 720, y: 540 } ]; }
      else if (layout === 'strip3') { canvas.width = 720; canvas.height = 1350; coords = [ { x: 40, y: 140 }, { x: 40, y: 520 }, { x: 40, y: 900 } ]; }
      else if (layout === 'strip4') { canvas.width = 720; canvas.height = 1750; coords = [ { x: 40, y: 140 }, { x: 40, y: 520 }, { x: 40, y: 900 }, { x: 40, y: 1280 } ]; }
      else if (layout === 'polaroid') { canvas.width = 800; canvas.height = 1000; imgW = 720; imgH = 720; coords = [ { x: 40, y: 120 } ]; }
      else if (layout === 'film') { canvas.width = 2060; canvas.height = 600; coords = [ { x: 40, y: 140 }, { x: 720, y: 140 }, { x: 1400, y: 140 } ]; }
      else if (layout === 'grid6') { canvas.width = 1400; canvas.height = 1400; coords = [ { x: 40, y: 140 }, { x: 720, y: 140 }, { x: 40, y: 540 }, { x: 720, y: 540 }, { x: 40, y: 940 }, { x: 720, y: 940 } ]; }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const loadedImages = await Promise.all(photos.map(src => loadImage(src)));

      const filtersData = [
        { id: 'sepia', css: 'sepia(0.8)' }, { id: 'grayscale', css: 'grayscale(1)' },
        { id: 'vintage', css: 'sepia(0.5) contrast(1.1) brightness(0.9)' },
        { id: 'brighten', css: 'brightness(1.2) contrast(1.1)' }, { id: 'cool', css: 'hue-rotate(10deg) saturate(1.2)' },
      ];
      const filterCss = filtersData.find(f => f.id === selectedFilter)?.css || '';

      // TÁCH LUỒNG: THEME CUSTOM & THEME CẤU HÌNH ĐỘNG
      // Truyền thêm param `layout` để các hàm biết đường tối ưu lề và chữ
      if (['30_4', 'hello_kitty', 'wedding', 'neon', 'retro'].includes(theme)) {
         if (theme === '30_4') draw30_4Theme(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, layout);
         if (theme === 'hello_kitty') drawHelloKittyTheme(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, layout);
         if (theme === 'wedding') drawWeddingTheme(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, layout);
         if (theme === 'neon') drawNeonTheme(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, layout);
         if (theme === 'retro') drawRetroTheme(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, layout);
      } else {
         const config = THEME_CONFIGS[theme] || THEME_CONFIGS['minimal'];
         drawConfigTheme(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, config, layout);
      }

      // WATERMARK BẢO VỆ CHẤT XÁM CHO BẢN FREE
      if (!isPremium) {
        const newHeight = canvas.height + 40;
        const tempCanvas = document.createElement('canvas'); tempCanvas.width = canvas.width; tempCanvas.height = newHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0);
          tempCtx.fillStyle = '#0f172a'; tempCtx.fillRect(0, canvas.height, canvas.width, 40);
          tempCtx.fillStyle = 'rgba(255,255,255,0.8)'; tempCtx.font = 'bold 20px "Courier New"'; tempCtx.textAlign = 'right';
          tempCtx.fillText('Gizmo by UET-ER', canvas.width - 40, canvas.height + 26);
          onGenerateSuccess(tempCanvas.toDataURL('image/jpeg', 0.9));
        }
      } else {
        onGenerateSuccess(canvas.toDataURL('image/jpeg', 0.9));
      }

    } catch (error) { console.error(error); onGenerateError(error); }
  };

  // ========================================================
  // BỘ MÁY VẼ THÔNG MINH (CÓ TỐI ƯU MARGIN & FONT THEO LAYOUT)
  // ========================================================
  const drawConfigTheme = (
    ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[],
    coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, config: any, layout: string
  ) => {
    // 1. Vẽ Background
    if (config.bgGradientHolo) {
      const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      g.addColorStop(0, '#c4b5fd'); g.addColorStop(0.3, '#fbcfe8'); g.addColorStop(0.6, '#86efac'); g.addColorStop(1, '#67e8f9');
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (config.bgGradient) {
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, config.bgGradient[0]); g.addColorStop(1, config.bgGradient[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = config.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Vẽ Họa tiết đè lên Background
    if (config.pattern === 'grid') {
      ctx.strokeStyle = 'rgba(192, 38, 211, 0.3)'; ctx.lineWidth = 2;
      for (let i = 0; i < canvas.width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for (let i = 0; i < canvas.height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }
    } else if (config.pattern === 'stars' || config.pattern === 'sparkles') {
      ctx.fillStyle = config.pattern === 'stars' ? '#71717a' : '#ffffff';
      for(let i = 0; i < 30; i++) {
        ctx.beginPath(); ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 4 + 1, 0, Math.PI * 2); ctx.fill();
      }
    } else if (config.pattern === 'text') {
      ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.font = '14px serif';
      for(let y = 0; y < canvas.height; y += 20) { ctx.fillText("BREAKING NEWS DAILY EDITION ".repeat(10), 0, y); }
    }

    // 3. Tối ưu Font Size và Vị trí Tiêu đề theo Layout
    let fontSize = layout === 'film' ? 70 : (layout.startsWith('strip') ? 45 : 60);
    const fontString = config.font.replace(/\d+px/, `${fontSize}px`);
    ctx.fillStyle = config.titleColor; ctx.font = fontString;
    ctx.textAlign = 'center';
    
    // Nếu là polaroid, khoảng trống lớn nằm ở dưới -> Chữ nằm ở dưới
    if (layout === 'polaroid') {
      ctx.fillText(config.title, canvas.width / 2, canvas.height - 70);
    } else {
      ctx.fillText(config.title, canvas.width / 2, 80);
    }

    // 4. Tối ưu Margin viền ảnh để KHÔNG BỊ CHỒNG LÊN NHAU
    // Strip gap chỉ có 20px, nên border max là 8px (8+8=16 < 20). 2x2/Film gap 40px, border max 15px.
    const m = layout.startsWith('strip') ? 8 : 15;

    for (let i = 0; i < images.length; i++) {
      const cx = coords[i].x, cy = coords[i].y;
      
      if (config.shadow) {
        ctx.shadowColor = config.shadow; ctx.shadowBlur = 20; ctx.fillStyle = config.border;
        ctx.fillRect(cx - m, cy - m, imgW + m*2, imgH + m*2); ctx.shadowColor = 'transparent';
      } else if (config.glow) {
        ctx.shadowColor = config.glow; ctx.shadowBlur = 30; ctx.fillStyle = config.border;
        ctx.fillRect(cx - m, cy - m, imgW + m*2, imgH + m*2); ctx.shadowColor = 'transparent';
      } else {
        ctx.fillStyle = config.border; ctx.fillRect(cx - m, cy - m, imgW + m*2, imgH + m*2);
      }
      drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 0, filterCss, smoothness);
    }
  };

  // ==========================================
  // CÁC THEME ĐẶC BIỆT (VẼ THỦ CÔNG) - ĐÃ TỐI ƯU THEO LAYOUT
  // ==========================================
  const drawStamp = (ctx: CanvasRenderingContext2D, x: number, y: number, angleDeg: number, bgThemeColor: string) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate((angleDeg * Math.PI) / 180);
    const w = 140, h = 180;
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 10; ctx.fillStyle = '#fdfbf7'; ctx.fillRect(0, 0, w, h); ctx.shadowColor = 'transparent'; 
    ctx.fillStyle = bgThemeColor; const r = 6, step = 20;
    for(let i=step; i<w; i+=step) { ctx.beginPath(); ctx.arc(i, 0, r, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(i, h, r, 0, Math.PI*2); ctx.fill(); }
    for(let i=step; i<h; i+=step) { ctx.beginPath(); ctx.arc(0, i, r, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(w, i, r, 0, Math.PI*2); ctx.fill(); }
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1; ctx.strokeRect(15, 15, w-30, h-30);
    ctx.beginPath(); ctx.arc(w/2 - 30, h/2 - 30, 30, 0, Math.PI*2); ctx.strokeStyle = 'rgba(220, 38, 38, 0.4)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.translate(w/2, 50); ctx.scale(0.4, 0.4); const star = new Path2D("M 50 5 L 61 39 L 97 39 L 68 59 L 79 93 L 50 72 L 21 93 L 32 59 L 3 39 L 39 39 Z"); ctx.fillStyle = '#facc15'; ctx.fill(star); ctx.restore();
    ctx.fillStyle = '#333'; ctx.font = 'bold 16px Courier New'; ctx.textAlign = 'center'; ctx.fillText('BƯU CHÍNH', w/2, 25); ctx.fillStyle = '#b91c1c'; ctx.fillText('VIỆT NAM', w/2, h - 25);
    ctx.restore();
  };

  const drawKittyBow = (ctx: CanvasRenderingContext2D, x: number, y: number, angleDeg: number, scaleFactor: number = 1) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate((angleDeg * Math.PI) / 180); ctx.scale(1.5 * scaleFactor, 1.5 * scaleFactor);
    ctx.shadowColor = 'rgba(244,114,182,0.6)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
    const path = new Path2D("M 20 15 C 10 0, 0 10, 10 25 C 0 40, 10 50, 20 35 C 25 35, 35 35, 40 35 C 50 50, 60 40, 50 25 C 60 10, 50 0, 40 15 C 35 15, 25 15, 20 15 Z M 30 25 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0");
    ctx.fillStyle = '#f472b6'; ctx.fill(path); ctx.strokeStyle = '#be185d'; ctx.lineWidth = 2; ctx.stroke(path); ctx.restore();
  };

  const draw30_4Theme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, layout: string) => {
    const RED_BG = '#991b1b'; ctx.fillStyle = RED_BG; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const m = layout.startsWith('strip') ? 8 : 15; // Tối ưu viền ảnh

    // Vẽ Tiêu đề và Footer tổng thể thay vì in dưới từng ảnh (Gây lỗi đè chữ)
    ctx.textAlign = 'center';
    if (layout === 'polaroid') {
       ctx.fillStyle = '#fca5a5'; ctx.font = 'bold 40px Courier New'; ctx.fillText('KỶ NIỆM 30/4', canvas.width / 2, canvas.height - 70);
    } else {
       ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 10; ctx.fillStyle = '#fca5a5'; 
       ctx.font = `bold ${layout.startsWith('strip') ? 45 : 55}px Courier New`; 
       ctx.fillText('KHUNG HÌNH 30/4', canvas.width / 2, 80); ctx.shadowColor = 'transparent'; 
       ctx.fillStyle = '#facc15'; ctx.font = 'bold 30px Arial'; ctx.fillText('★ TỰ HÀO LÀ NGƯỜI VIỆT NAM ★', canvas.width / 2, canvas.height - 30);
    }

    for (let i = 0; i < images.length; i++) {
      const cx = coords[i].x, cy = coords[i].y;
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 20; ctx.fillStyle = '#f8fafc'; 
      ctx.fillRect(cx - m*2, cy - m*2, imgW + m*4, imgH + m*4); ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#000'; ctx.fillRect(cx - m, cy - m, imgW + m*2, imgH + m*2);
      drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 0, filterCss, smoothness);
    }
    
    // Trang trí tem thư chung cho toàn canvas (không gắn vào từng ảnh)
    drawStamp(ctx, 40, 40, -10, RED_BG);
    drawStamp(ctx, canvas.width - 150, canvas.height - 200, 15, RED_BG);
  };

  const drawHelloKittyTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, layout: string) => {
    ctx.fillStyle = '#fce7f3'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#fbcfe8'; ctx.lineWidth = 2; for(let i=0; i<canvas.width; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); } for(let i=0; i<canvas.height; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }
    
    ctx.shadowColor = '#f9a8d4'; ctx.shadowBlur = 10; ctx.fillStyle = '#be185d'; 
    ctx.font = `bold ${layout.startsWith('strip') ? 45 : 60}px Arial`; ctx.textAlign = 'center'; 
    if (layout === 'polaroid') ctx.fillText('HELLO KITTY', canvas.width / 2, canvas.height - 70);
    else ctx.fillText('HELLO KITTY', canvas.width / 2, 80);
    ctx.shadowColor = 'transparent';

    const m = layout.startsWith('strip') ? 8 : 15;
    for (let i = 0; i < images.length; i++) {
      const cx = coords[i].x, cy = coords[i].y;
      ctx.shadowColor = 'rgba(0,0,0,0.1)'; ctx.shadowBlur = 15; ctx.fillStyle = '#ffffff'; 
      ctx.beginPath(); ctx.roundRect(cx - m, cy - m, imgW + m*2, imgH + m*2, 20); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 4; ctx.stroke();
      drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 10, filterCss, smoothness);
      
      // Nơ nhỏ gọn ở góc ảnh (không bị lẹm viền)
      drawKittyBow(ctx, cx - 15, cy - 15, -15, 0.6);
    }
  };

  const drawWeddingTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, layout: string) => {
    ctx.fillStyle = '#fafaf9'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 4; ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40); ctx.strokeStyle = '#fcd34d'; ctx.lineWidth = 1; ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);
    
    ctx.fillStyle = '#b45309'; ctx.font = `italic ${layout.startsWith('strip') ? 45 : 50}px "Times New Roman", serif`; ctx.textAlign = 'center'; 
    if (layout === 'polaroid') ctx.fillText('Just Married', canvas.width / 2, canvas.height - 70);
    else { ctx.fillText('Just Married', canvas.width / 2, 80); ctx.font = '20px "Times New Roman", serif'; ctx.fillText('Save The Date - Gizmo Studio', canvas.width / 2, canvas.height - 40); }

    const m = layout.startsWith('strip') ? 8 : 10;
    for (let i = 0; i < images.length; i++) {
      const cx = coords[i].x, cy = coords[i].y;
      ctx.shadowColor = 'rgba(0,0,0,0.1)'; ctx.shadowBlur = 10; ctx.fillStyle = '#fff'; ctx.fillRect(cx - m, cy - m, imgW + m*2, imgH + m*2); ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.strokeRect(cx - m/2, cy - m/2, imgW + m, imgH + m);
      drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 0, filterCss, smoothness);
    }
  };

  const drawNeonTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, layout: string) => {
    ctx.fillStyle = '#09090b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.shadowColor = '#e879f9'; ctx.shadowBlur = 20; ctx.fillStyle = '#fdf4ff'; 
    ctx.font = `bold ${layout.startsWith('strip') ? 45 : 60}px Courier New`; ctx.textAlign = 'center'; 
    if (layout === 'polaroid') ctx.fillText('NEON VIBES', canvas.width / 2, canvas.height - 70);
    else ctx.fillText('NEON VIBES', canvas.width / 2, 80);
    ctx.shadowColor = 'transparent';

    for (let i = 0; i < images.length; i++) {
      const cx = coords[i].x, cy = coords[i].y;
      ctx.shadowColor = i % 2 === 0 ? '#22d3ee' : '#e879f9'; ctx.shadowBlur = layout.startsWith('strip') ? 10 : 25; 
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.strokeRect(cx, cy, imgW, imgH); ctx.shadowColor = 'transparent';
      drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 0, filterCss, smoothness);
    }
  };

  const drawRetroTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, layout: string) => {
    ctx.fillStyle = '#d4c5b0'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.05)'; for(let i=0; i<canvas.width; i+=4) { for(let j=0; j<canvas.height; j+=4) { if(Math.random() > 0.5) ctx.fillRect(i, j, 1, 1); } }
    
    // Tối ưu viền phim đen sao cho nó chạm sát nhau tạo thành 1 dải liên tục
    const m = layout.startsWith('strip') ? 10 : 20;
    for (let i = 0; i < images.length; i++) {
      const cx = coords[i].x, cy = coords[i].y;
      ctx.fillStyle = '#1c1917'; ctx.fillRect(cx - m, cy - m, imgW + m*2, imgH + m*2);
      ctx.fillStyle = '#d4c5b0'; 
      // Đục lỗ phim thông minh
      if (layout === 'film') { // Khung nằm ngang -> lỗ ở trên và dưới
        for(let holeX = cx - 10; holeX < cx + imgW + 20; holeX += 25) { ctx.fillRect(holeX, cy - m/2 - 6, 12, 8); ctx.fillRect(holeX, cy + imgH + m/2 - 2, 12, 8); }
      } else { // Khung nằm dọc -> lỗ ở 2 bên trái phải
        for(let holeY = cy - 10; holeY < cy + imgH + 20; holeY += 25) { ctx.fillRect(cx - m/2 - 6, holeY, 8, 12); ctx.fillRect(cx + imgW + m/2 - 2, holeY, 8, 12); }
      }
      ctx.save(); const retroFilter = 'sepia(0.6) contrast(1.2)'; ctx.filter = retroFilter + (filterCss ? ' ' + filterCss : '');
      drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 0, '', smoothness); 
      ctx.filter = 'none'; ctx.restore();
    }
  };

  return <canvas ref={canvasRef} className="hidden" />;
}