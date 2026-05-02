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

// ==========================================
// CẤU HÌNH THÔNG MINH (ĐÃ THÊM CHARM DÀNH CHO PHÁI NỮ)
// ==========================================
const THEME_CONFIGS: Record<string, any> = {
  minimal: { bg: '#ffffff', border: '#ffffff', shadow: 'rgba(0,0,0,0.08)', title: 'MINIMAL', titleColor: '#404040', font: '300 60px Arial' },
  dark: { bgGradient: ['#0f172a', '#020617'], border: '#1e293b', title: 'DARK CLASSIC', titleColor: '#94a3b8', font: 'bold 60px Arial' },
  pink: { bgGradient: ['#fff1f2', '#ffe4e6'], border: '#ffffff', shadow: 'rgba(219,39,119,0.15)', title: 'PINKY', titleColor: '#db2777', font: 'bold 60px "Comic Sans MS", cursive', charmType: 'heart', charmColor: '#f472b6' },
  ocean: { bgGradient: ['#e0f2fe', '#bae6fd'], border: '#ffffff', shadow: 'rgba(2,132,199,0.15)', title: 'OCEAN BREEZE', titleColor: '#0284c7', font: 'bold 60px Arial', charmType: 'sparkle', charmColor: '#38bdf8' },
  sunset: { bgGradient: ['#fff7ed', '#ffedd5'], border: '#ffffff', shadow: 'rgba(154,52,18,0.15)', title: 'SUNSET GLOW', titleColor: '#9a3412', font: 'bold 60px Arial', charmType: 'star', charmColor: '#fb923c' },
  pastel: { bgGradient: ['#faf5ff', '#f3e8ff'], border: '#ffffff', shadow: 'rgba(192,132,252,0.15)', title: 'DREAM', titleColor: '#c084fc', font: 'bold 60px "Comic Sans MS"', charmType: 'heart', charmColor: '#d8b4fe' },
  nature: { bg: '#f0fdf4', border: '#ffffff', shadow: 'rgba(22,101,52,0.1)', title: 'BOTANICAL', titleColor: '#166534', font: 'italic 60px Georgia', charmType: 'flower', charmColor: '#4ade80' },
  y2k: { bgGradient: ['#fafafa', '#f4f4f5'], border: '#ffffff', title: 'Y2K CYBER', titleColor: '#18181b', pattern: 'stars', font: 'bold 60px "Courier New"', charmType: 'star', charmColor: '#a1a1aa' },
  golden: { bgGradient: ['#713f12', '#ca8a04'], border: '#fef08a', title: 'GOLDEN HOUR', titleColor: '#fef08a', glow: '#ca8a04', font: 'italic 60px "Times New Roman"' },
  newspaper: { bg: '#f5f5f4', border: '#1c1917', title: 'THE DAILY NEWS', titleColor: '#1c1917', pattern: 'text', font: 'bold 70px "Times New Roman"' },
  kawaii: { bgGradient: ['#fbcfe8', '#fde047'], border: '#ffffff', title: 'KAWAII MAGIC', titleColor: '#db2777', pattern: 'sparkles', font: 'bold 60px "Comic Sans MS"', charmType: 'bow', charmColor: '#f472b6' },
  gothic: { bg: '#171717', border: '#991b1b', title: 'DARK GOTHIC', titleColor: '#ef4444', font: 'italic 60px Georgia' },
  holo: { bgGradientHolo: true, border: '#ffffff', title: 'HOLOGRAPHIC', titleColor: '#ffffff', shadow: 'rgba(255,255,255,0.8)', font: 'bold 60px Arial' },
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

  // ==========================================
  // BỘ CÔNG CỤ VẼ CHARM TRANG TRÍ CHUNG
  // ==========================================
  const drawHeartCharm = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-10 * Math.PI / 180); ctx.beginPath(); ctx.moveTo(0, size * 0.3); ctx.bezierCurveTo(0, 0, -size/2, 0, -size/2, size*0.3); ctx.bezierCurveTo(-size/2, size*0.6, 0, size, 0, size); ctx.bezierCurveTo(0, size, size/2, size*0.6, size/2, size*0.3); ctx.bezierCurveTo(size/2, 0, 0, 0, 0, size*0.3); ctx.fillStyle = color; ctx.fill(); ctx.shadowColor = 'rgba(0,0,0,0.1)'; ctx.shadowBlur = 4; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill(); ctx.restore(); };
  const drawStarCharm = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => { ctx.save(); ctx.translate(x, y); ctx.rotate(15 * Math.PI / 180); ctx.beginPath(); const outerR = size, innerR = size/2; for(let i=0; i<5; i++) { ctx.lineTo(Math.cos((18+i*72)*Math.PI/180)*outerR, Math.sin((18+i*72)*Math.PI/180)*outerR); ctx.lineTo(Math.cos((54+i*72)*Math.PI/180)*innerR, Math.sin((54+i*72)*Math.PI/180)*innerR); } ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore(); };
  const drawFlowerCharm = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => { ctx.save(); ctx.translate(x, y); const petals = 5; for(let i=0; i<petals; i++) { ctx.beginPath(); ctx.rotate(360/petals * Math.PI/180); ctx.ellipse(size*0.7, 0, size*0.7, size*0.4, 0, 0, Math.PI*2); ctx.fillStyle = color; ctx.fill(); } ctx.beginPath(); ctx.arc(0, 0, size*0.4, 0, Math.PI*2); ctx.fillStyle = '#fef08a'; ctx.fill(); ctx.restore(); };
  const drawSparkleCharm = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = color; const path = new Path2D("M50,0 L61.8,38.2 L100,50 L61.8,61.8 L50,100 L38.2,61.8 L0,50 L38.2,38.2 Z"); ctx.scale(size/100, size/100); ctx.fill(path); ctx.restore(); };
  const drawBowCharm = (ctx: CanvasRenderingContext2D, x: number, y: number, angleDeg: number, scaleFactor: number, color: string) => { ctx.save(); ctx.translate(x, y); ctx.rotate((angleDeg * Math.PI) / 180); ctx.scale(1.5 * scaleFactor, 1.5 * scaleFactor); ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 4; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2; const path = new Path2D("M 20 15 C 10 0, 0 10, 10 25 C 0 40, 10 50, 20 35 C 25 35, 35 35, 40 35 C 50 50, 60 40, 50 25 C 60 10, 50 0, 40 15 C 35 15, 25 15, 20 15 Z M 30 25 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0"); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke(path); ctx.restore(); };
  const drawLotusCharm = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-10 * Math.PI / 180); const path = new Path2D("M50,0 C65,10 80,10 85,30 C90,50 80,70 65,85 C50,100 35,100 20,85 C5,70 -5,50 0,30 C5,10 20,10 35,0 Z M50,15 C60,25 70,25 72,35 C75,45 70,55 60,65 C50,75 40,75 30,65 C20,55 15,45 18,35 C20,25 30,25 40,15 Z"); ctx.fillStyle = 'rgba(250,204,21,0.25)'; ctx.scale(size/100, size/100); ctx.fill(path); ctx.restore(); };
  const drawConicalHatCharm = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => { ctx.save(); ctx.translate(x, y); ctx.rotate(15 * Math.PI / 180); ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#b45309'; ctx.lineWidth = 2; const path = new Path2D("M0,100 L50,0 L100,100 C80,95 20,95 0,100 Z"); ctx.scale(size/100, size/100); ctx.fill(path); ctx.stroke(path); ctx.restore(); };
  const drawOnePillarCharm = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#b45309'; ctx.lineWidth = 3; const path = new Path2D("M30,80 L30,60 L70,60 L70,80 Z M50,0 C30,0 20,20 20,40 L20,60 L80,60 L80,40 C80,20 70,0 50,0 Z M50,60 L50,100"); ctx.scale(size/100, size/100); ctx.fill(path); ctx.stroke(path); ctx.restore(); };
  const drawDecorWatermark = (ctx: CanvasRenderingContext2D, x: number, y: number, text: string) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-20 * Math.PI / 180); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'; ctx.fillText(text, 0, 0); ctx.restore(); };
  const drawMilesGlitchLogo = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => { ctx.save(); ctx.translate(x, y); const path = new Path2D("M50,0 L61,38 L97,38 L68,58 L79,93 L50,72 L21,93 L32,58 L3,38 L39,38 Z"); ctx.scale(size/100, size/100); ctx.fillStyle = '#ec4899'; ctx.fill(path); ctx.translate(3, 3); ctx.fillStyle = '#22d3ee'; ctx.fill(path); ctx.translate(-1.5, -1.5); ctx.fillStyle = '#ffffff'; ctx.fill(path); ctx.restore(); };

  // ==========================================
  // ĐÃ SỬA LỖI: HÀM VẼ ẢNH & XỬ LÝ FILTER CÀ DA CHUẨN HTML5 CANVAS
  // ==========================================
  const drawImageCover = (
    ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number,
    w: number, h: number, radius: number = 0, filterCss: string = '', smoothness: number = 0
  ) => {
    const imgRatio = img.width / img.height;
    const targetRatio = w / h;
    let sx, sy, sWidth, sHeight;

    if (imgRatio > targetRatio) { sHeight = img.height; sWidth = img.height * targetRatio; sx = (img.width - sWidth) / 2; sy = 0; }
    else { sWidth = img.width; sHeight = img.width / targetRatio; sx = 0; sy = (img.height - sHeight) / 2; }

    ctx.save();
    if (radius > 0) { ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.clip(); }

    if (smoothness > 0 || filterCss !== '') {
      const tempCanvas = document.createElement('canvas'); 
      tempCanvas.width = img.width; 
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        let filterString = [];
        if (filterCss) filterString.push(filterCss);
        if (smoothness > 0) {
           filterString.push(`blur(${smoothness/100}px) brightness(${1 + smoothness/200}) saturate(1.1)`);
        }
        
        // SỬA LỖI Ở ĐÂY: Bật Filter LÊN TRƯỚC khi vẽ ảnh gốc
        tempCtx.filter = filterString.join(' ');
        tempCtx.drawImage(img, 0, 0); 
        tempCtx.filter = 'none'; // Tắt filter đi để tránh lỗi hệ thống
        
        // Vẽ lại cái Canvas đã được bọc Filter lên Canvas chính
        ctx.drawImage(tempCanvas, sx, sy, sWidth, sHeight, x, y, w, h);
      }
    } else { 
      // Không có filter thì vẽ thẳng luôn
      ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h); 
    }
    ctx.restore();
  };

  const generateFrame = async () => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';

    try {
      let imgW = 640, imgH = 360; let coords: {x: number, y: number}[] = [];
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

      // TÁCH LUỒNG THEMES
      const customThemes = ['30_4', 'vietnam', 'hello_kitty', 'wedding', 'neon', 'retro', 'cyberpunk', 'spiderman', 'vnu_theme', 'art_floral', 'art_film', 'art_gold'];
      if (customThemes.includes(theme)) {
         if (theme === '30_4' || theme === 'vietnam') drawVietnamTheme(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, layout, theme);
         if (theme === 'hello_kitty') drawHelloKittyTheme(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, layout);
         if (theme === 'wedding') drawWeddingTheme(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, layout);
         if (theme === 'neon') drawNeonTheme(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, layout);
         if (theme === 'retro') drawRetroTheme(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, layout);
         if (theme === 'cyberpunk') drawCyberpunkTheme(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, layout);
         if (theme === 'spiderman') drawSpiderVerseTheme(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, layout);
         if (theme === 'vnu_theme') await drawVNUTheme(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, layout);
         if (theme === 'art_floral') drawArtFloral(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, layout);
         if (theme === 'art_film') drawArtFilm(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, layout);
         if (theme === 'art_gold') drawArtGold(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, layout);
      } else {
         const config = THEME_CONFIGS[theme] || THEME_CONFIGS['minimal'];
         drawConfigTheme(ctx, canvas, loadedImages, coords, imgW, imgH, filterCss, skinSmoothness, config, layout);
      }

      if (!isPremium) {
        const newHeight = canvas.height + 40; const tempCanvas = document.createElement('canvas'); tempCanvas.width = canvas.width; tempCanvas.height = newHeight;
        const tempCtx = tempCanvas.getContext('2d'); if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0); tempCtx.fillStyle = '#0f172a'; tempCtx.fillRect(0, canvas.height, canvas.width, 40);
          tempCtx.fillStyle = 'rgba(255,255,255,0.8)'; tempCtx.font = 'bold 20px "Courier New"'; tempCtx.textAlign = 'right';
          tempCtx.fillText('Gizmo by UET-ER', canvas.width - 40, canvas.height + 26);
          onGenerateSuccess(tempCanvas.toDataURL('image/jpeg', 0.9));
        }
      } else { onGenerateSuccess(canvas.toDataURL('image/jpeg', 0.9)); }
    } catch (error) { console.error(error); onGenerateError(error); }
  };

  const drawConfigTheme = ( ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, config: any, layout: string ) => {
    if (config.bgGradientHolo) { const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height); g.addColorStop(0, '#f9a8d4'); g.addColorStop(0.3, '#fbcfe8'); g.addColorStop(0.6, '#bae6fd'); g.addColorStop(1, '#a7f3d0'); ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height); } else if (config.bgGradient) { const g = ctx.createLinearGradient(0, 0, 0, canvas.height); g.addColorStop(0, config.bgGradient[0]); g.addColorStop(1, config.bgGradient[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height); } else { ctx.fillStyle = config.bg; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    if (config.pattern === 'stars') { ctx.fillStyle = config.charmColor || 'rgba(0,0,0,0.1)'; for(let i=0; i<30; i++) { ctx.beginPath(); ctx.arc(Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*8+2, 0, Math.PI*2); ctx.fill(); } } else if (config.pattern === 'sparkles') { for(let i=0; i<30; i++) { drawSparkleCharm(ctx, Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*15+5, '#ffffff'); } }
    let fontSize = layout === 'film' ? 70 : (layout.startsWith('strip') ? 45 : 60); const fontString = config.font.replace(/\d+px/, `${fontSize}px`); ctx.fillStyle = config.titleColor; ctx.font = fontString; ctx.textAlign = 'center';
    if (layout === 'polaroid') { ctx.fillText(config.title, canvas.width / 2, canvas.height - 70); } else { ctx.fillText(config.title, canvas.width / 2, 80); }
    const m = layout.startsWith('strip') ? 8 : 15;
    for (let i = 0; i < images.length; i++) {
      const cx = coords[i].x, cy = coords[i].y;
      ctx.fillStyle = config.border; if (config.shadow) { ctx.shadowColor = config.shadow; ctx.shadowBlur = 15; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2; } else if (config.glow) { ctx.shadowColor = config.glow; ctx.shadowBlur = 20; }
      const isSoftTheme = theme === 'pastel' || theme === 'pink' || theme === 'kawaii';
      if (isSoftTheme) { ctx.beginPath(); ctx.roundRect(cx - m, cy - m, imgW + m*2, imgH + m*2, 10); ctx.fill(); } else { ctx.fillRect(cx - m, cy - m, imgW + m*2, imgH + m*2); }
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
      drawImageCover(ctx, images[i], cx, cy, imgW, imgH, isSoftTheme ? 8 : 0, filterCss, smoothness);
      if (config.charmType && config.charmColor) {
        const charmX = cx + imgW - 10; const charmY = cy + 10;
        if (config.charmType === 'heart') drawHeartCharm(ctx, charmX, charmY, 20, config.charmColor); else if (config.charmType === 'star') drawStarCharm(ctx, charmX, charmY, 15, config.charmColor); else if (config.charmType === 'flower') drawFlowerCharm(ctx, charmX, charmY, 15, config.charmColor); else if (config.charmType === 'bow') drawBowCharm(ctx, cx + 15, cy - 10, -15, 0.7, config.charmColor); else if (config.charmType === 'sparkle') drawSparkleCharm(ctx, charmX, charmY, 20, config.charmColor);
      }
    }
  };

  const drawArtFloral = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, layout: string) => {
    ctx.fillStyle = '#f8f9fa'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#c4a77d'; ctx.lineWidth = 4; ctx.strokeRect(20, 20, canvas.width-40, canvas.height-40);
    ctx.strokeStyle = 'rgba(74, 93, 35, 0.3)'; ctx.lineWidth = 1; ctx.strokeRect(30, 30, canvas.width-60, canvas.height-60);
    ctx.fillStyle = 'rgba(74, 93, 35, 0.6)';
    ctx.beginPath(); ctx.arc(40, 40, 60, 0, Math.PI/2); ctx.fill(); ctx.beginPath(); ctx.arc(canvas.width-40, canvas.height-40, 60, Math.PI, Math.PI*1.5); ctx.fill();
    const m = 12;
    for (let i = 0; i < images.length; i++) {
      const cx = coords[i].x, cy = coords[i].y;
      ctx.shadowColor = 'rgba(0,0,0,0.1)'; ctx.shadowBlur = 20; ctx.fillStyle = '#fff'; ctx.fillRect(cx - m, cy - m, imgW + m*2, imgH + m*2); ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#c4a77d'; ctx.lineWidth = 2; ctx.strokeRect(cx - m + 4, cy - m + 4, imgW + m*2 - 8, imgH + m*2 - 8);
      drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 0, filterCss, smoothness);
      drawFlowerCharm(ctx, cx + 10, cy + 10, 25, '#d4af37');
    }
  };

  const drawArtFilm = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, layout: string) => {
    ctx.fillStyle = '#1c1917'; ctx.fillRect(0, 0, canvas.width, canvas.height); 
    ctx.fillStyle = '#eab308'; 
    for(let i=0; i<canvas.width; i+=40) { ctx.fillRect(i, 10, 20, 20); ctx.fillRect(i, canvas.height-30, 20, 20); }
    ctx.font = 'bold 30px "Courier New"'; ctx.fillStyle = '#eab308'; ctx.textAlign = 'center';
    if(layout !== 'polaroid') ctx.fillText("KODAK VISION3 500T", canvas.width/2, 60);
    const m = layout.startsWith('strip') ? 10 : 20;
    for (let i = 0; i < images.length; i++) {
      const cx = coords[i].x, cy = coords[i].y;
      ctx.fillStyle = '#000'; ctx.fillRect(cx - m, cy - m, imgW + m*2, imgH + m*2);
      ctx.fillStyle = '#1c1917'; 
      if (layout === 'film') { for(let hX = cx-10; hX < cx+imgW+20; hX+=25) { ctx.fillRect(hX, cy-m/2-6, 12, 8); ctx.fillRect(hX, cy+imgH+m/2-2, 12, 8); } }
      else { for(let hY = cy-10; hY < cy+imgH+20; hY+=25) { ctx.fillRect(cx-m/2-6, hY, 8, 12); ctx.fillRect(cx+imgW+m/2-2, hY, 8, 12); } }
      ctx.save(); ctx.filter = `sepia(0.3) contrast(1.2) hue-rotate(-10deg) ${filterCss}`;
      drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 0, '', smoothness); 
      ctx.restore();
    }
  };

  const drawArtGold = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, layout: string) => {
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 1;
    for(let i=0; i<canvas.width; i+=30) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for(let i=0; i<canvas.height; i+=30) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }
    ctx.fillStyle = 'rgba(17, 17, 17, 0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.shadowColor = '#d4af37'; ctx.shadowBlur = 15; ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, canvas.width-60, canvas.height-60); ctx.shadowColor = 'transparent';
    const m = 15;
    for (let i = 0; i < images.length; i++) {
      const cx = coords[i].x, cy = coords[i].y;
      ctx.fillStyle = '#000'; ctx.fillRect(cx - m, cy - m, imgW + m*2, imgH + m*2);
      ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2; ctx.strokeRect(cx - 8, cy - 8, imgW + 16, imgH + 16);
      drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 0, filterCss, smoothness);
      ctx.fillStyle = '#d4af37'; 
      ctx.fillRect(cx-10, cy-10, 20, 5); ctx.fillRect(cx-10, cy-10, 5, 20); 
      ctx.fillRect(cx+imgW-10, cy-10, 20, 5); ctx.fillRect(cx+imgW+5, cy-10, 5, 20); 
    }
  };

  const drawStamp = (ctx: CanvasRenderingContext2D, x: number, y: number, angleDeg: number, bgThemeColor: string) => { ctx.save(); ctx.translate(x, y); ctx.rotate((angleDeg * Math.PI) / 180); const w = 140, h = 180; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 10; ctx.fillStyle = '#fdfbf7'; ctx.fillRect(0, 0, w, h); ctx.shadowColor = 'transparent'; ctx.fillStyle = bgThemeColor; const r = 6, step = 20; for(let i=step; i<w; i+=step) { ctx.beginPath(); ctx.arc(i, 0, r, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(i, h, r, 0, Math.PI*2); ctx.fill(); } for(let i=step; i<h; i+=step) { ctx.beginPath(); ctx.arc(0, i, r, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(w, i, r, 0, Math.PI*2); ctx.fill(); } ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1; ctx.strokeRect(15, 15, w-30, h-30); ctx.beginPath(); ctx.arc(w/2 - 30, h/2 - 30, 30, 0, Math.PI*2); ctx.strokeStyle = 'rgba(220, 38, 38, 0.4)'; ctx.lineWidth = 2; ctx.stroke(); ctx.save(); ctx.translate(w/2, 50); ctx.scale(0.4, 0.4); const star = new Path2D("M 50 5 L 61 39 L 97 39 L 68 59 L 79 93 L 50 72 L 21 93 L 32 59 L 3 39 L 39 39 Z"); ctx.fillStyle = '#facc15'; ctx.fill(star); ctx.restore(); ctx.fillStyle = '#333'; ctx.font = 'bold 16px Courier New'; ctx.textAlign = 'center'; ctx.fillText('BƯU CHÍNH', w/2, 25); ctx.fillStyle = '#b91c1c'; ctx.fillText('VIỆT NAM', w/2, h - 25); ctx.restore(); };

  const drawVietnamTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, layout: string, currentTheme: string) => { const RED_BG = '#991b1b'; ctx.fillStyle = RED_BG; ctx.fillRect(0, 0, canvas.width, canvas.height); const m = layout.startsWith('strip') ? 8 : 15; ctx.textAlign = 'center'; const mainTitle = currentTheme === '30_4' ? 'ĐẠI THẮNG 30/4' : '★ VIỆT NAM ★'; if (layout === 'polaroid') { ctx.fillStyle = '#fca5a5'; ctx.font = 'bold 40px Courier New'; ctx.fillText(mainTitle, canvas.width / 2, canvas.height - 70); } else { ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 10; ctx.fillStyle = '#fca5a5'; ctx.font = `bold ${layout.startsWith('strip') ? 45 : 55}px Courier New`; ctx.fillText(mainTitle, canvas.width / 2, 80); ctx.shadowColor = 'transparent'; ctx.fillStyle = '#facc15'; ctx.font = 'bold 30px Arial'; ctx.fillText('★ TỰ HÀO QUÊ HƯƠNG ★', canvas.width / 2, canvas.height - 30); } for (let i = 0; i < images.length; i++) { const cx = coords[i].x, cy = coords[i].y; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 20; ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.roundRect(cx - m*2, cy - m*2, imgW + m*4, imgH + m*4, 4); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.fillStyle = '#000'; ctx.fillRect(cx - m, cy - m, imgW + m*2, imgH + m*2); drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 0, filterCss, smoothness); if (i % 2 === 0) { drawConicalHatCharm(ctx, cx + imgW - 20, cy - 10, 45); } else { drawOnePillarCharm(ctx, cx - 15, cy + imgH - 30, 45); } if (layout !== 'polaroid') { if (i === 0) drawDecorWatermark(ctx, canvas.width - 180, canvas.height - 100, 'Gizmo Snap Collection'); else if (i === images.length - 1) drawDecorWatermark(ctx, 150, canvas.height - 100, 'Vietnamese Pride'); } } drawStamp(ctx, 40, 40, -10, RED_BG); drawStamp(ctx, canvas.width - 150, canvas.height - 200, 15, RED_BG); drawLotusCharm(ctx, 40, canvas.height - 150, 150); };
  const drawSpiderVerseTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, layout: string) => { ctx.fillStyle = '#0a001a'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.shadowColor = '#ec4899'; ctx.shadowBlur = 10; ctx.strokeStyle = 'rgba(236,72,153,0.15)'; ctx.lineWidth = 1; for (let i=0; i<canvas.width; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); } for (let i=0; i<canvas.height; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); } ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 20; ctx.strokeStyle = 'rgba(34,211,238,0.2)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(canvas.width, canvas.height); ctx.stroke(); ctx.beginPath(); ctx.moveTo(canvas.width, 0); ctx.lineTo(0, canvas.height); ctx.stroke(); ctx.shadowColor = 'transparent'; ctx.fillStyle = '#fff'; ctx.font = `bold ${layout.startsWith('strip') ? 45 : 60}px "Courier New"`; ctx.textAlign = 'center'; ctx.shadowColor = '#ec4899'; ctx.shadowBlur = 15; if (layout === 'polaroid') ctx.fillText('SPIDER-VERSE', canvas.width / 2, canvas.height - 70); else ctx.fillText('ACROSS THE GIZMO-VERSE', canvas.width / 2, 85); ctx.shadowColor = 'transparent'; const m = 12; for (let i = 0; i < images.length; i++) { const cx = coords[i].x, cy = coords[i].y; ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.roundRect(cx - m + 4, cy - m + 4, imgW + m*2 - 8, imgH + m*2 - 8, 4); ctx.fill(); ctx.fillStyle = '#ec4899'; ctx.beginPath(); ctx.roundRect(cx - m - 4, cy - m - 4, imgW + m*2 - 8, imgH + m*2 - 8, 4); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(cx - m + 2, cy - m + 2, imgW + m*2 - 4, imgH + m*2 - 4, 4); ctx.fill(); drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 2, filterCss, smoothness); drawMilesGlitchLogo(ctx, cx + imgW - 10, cy + imgH - 10, 35); } };
  const drawHelloKittyTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, layout: string) => { ctx.fillStyle = '#fce7f3'; ctx.fillRect(0, 0, canvas.width, canvas.height); for(let i=0; i<30; i++) { drawSparkleCharm(ctx, Math.random()*canvas.width, Math.random()*canvas.height, 6, '#ffffff'); } ctx.shadowColor = '#f9a8d4'; ctx.shadowBlur = 10; ctx.fillStyle = '#be185d'; ctx.font = `bold ${layout.startsWith('strip') ? 45 : 60}px Arial`; ctx.textAlign = 'center'; if (layout === 'polaroid') ctx.fillText('HELLO KITTY', canvas.width / 2, canvas.height - 70); else ctx.fillText('HELLO KITTY ADVENTURE', canvas.width / 2, 80); ctx.shadowColor = 'transparent'; const m = layout.startsWith('strip') ? 8 : 15; for (let i = 0; i < images.length; i++) { const cx = coords[i].x, cy = coords[i].y; ctx.shadowColor = 'rgba(219,39,119,0.15)'; ctx.shadowBlur = 15; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(cx - m, cy - m, imgW + m*2, imgH + m*2, 20); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 4; ctx.stroke(); drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 10, filterCss, smoothness); drawBowCharm(ctx, cx + 15, cy - 10, -15, 0.7, '#f472b6'); drawHeartCharm(ctx, cx + imgW - 15, cy + imgH - 15, 18, '#db2777'); } };
  const drawWeddingTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, layout: string) => { const PearlBG = ctx.createLinearGradient(0, 0, canvas.width, canvas.height); PearlBG.addColorStop(0, '#fffcf8'); PearlBG.addColorStop(1, '#fdfaf5'); ctx.fillStyle = PearlBG; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.strokeStyle = '#c4a77d'; ctx.lineWidth = 2; ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40); ctx.strokeStyle = '#e2cfac'; ctx.lineWidth = 1; ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50); ctx.fillStyle = 'rgba(196,167,125,0.04)'; ctx.font = 'italic 16px Georgia'; for(let y=60; y<canvas.height-60; y+=80) { ctx.fillText("GIZMO & ELEGANCE Wedding Session gizmo & elegance".repeat(4), 40, y); } ctx.fillStyle = '#b45309'; ctx.font = `italic ${layout.startsWith('strip') ? 45 : 55}px "Times New Roman", serif`; ctx.textAlign = 'center'; if (layout === 'polaroid') ctx.fillText('Royal Wedding', canvas.width / 2, canvas.height - 70); else { ctx.fillText('Royal Wedding', canvas.width / 2, 85); ctx.font = '22px "Times New Roman", serif'; ctx.fillStyle = '#92400e'; ctx.fillText('FOREVER STARTS NOW', canvas.width / 2, canvas.height - 40); } const m = layout.startsWith('strip') ? 10 : 12; for (let i = 0; i < images.length; i++) { const cx = coords[i].x, cy = coords[i].y; ctx.shadowColor = 'rgba(0,0,0,0.06)'; ctx.shadowBlur = 10; ctx.fillStyle = '#fff'; ctx.fillRect(cx - m, cy - m, imgW + m*2, imgH + m*2); ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#c4a77d'; ctx.lineWidth = 1; ctx.strokeRect(cx - m + 2, cy - m + 2, imgW + m*2 - 4, imgH + m*2 - 4); drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 0, filterCss, smoothness); drawFlowerCharm(ctx, cx + imgW, cy + imgH, 20, '#fca5a5'); if (i % 2 === 0) drawHeartCharm(ctx, cx - 10, cy + 10, 20, '#d4a373'); } };
  const drawNeonTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, layout: string) => { ctx.fillStyle = '#050509'; ctx.fillRect(0, 0, canvas.width, canvas.height); for(let i=0; i<20; i++) { drawSparkleCharm(ctx, Math.random()*canvas.width, Math.random()*canvas.height, 6, i%2? '#22d3ee':'#e879f9'); } const neonColor = isPremium ? '#e879f9' : '#22d3ee'; ctx.shadowColor = neonColor; ctx.shadowBlur = 20; ctx.fillStyle = '#fff'; ctx.font = `bold ${layout.startsWith('strip') ? 45 : 60}px "Courier New"`; ctx.textAlign = 'center'; if (layout === 'polaroid') ctx.fillText('NEON PARTY', canvas.width / 2, canvas.height - 70); else ctx.fillText('NEON PARTY', canvas.width / 2, 85); ctx.shadowColor = 'transparent'; for (let i = 0; i < images.length; i++) { const cx = coords[i].x, cy = coords[i].y; ctx.shadowColor = i % 2 === 0 ? '#22d3ee' : '#e879f9'; ctx.shadowBlur = 25; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 7; ctx.strokeRect(cx, cy, imgW, imgH); ctx.shadowColor = 'transparent'; drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 0, filterCss, smoothness); drawSparkleCharm(ctx, cx + 15, cy - 10, 18, '#ffffff'); drawSparkleCharm(ctx, cx + imgW - 10, cy + imgH + 5, 20, i % 2 === 0 ? '#e879f9' : '#22d3ee'); } };
  const drawRetroTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, layout: string) => { ctx.fillStyle = '#d4c5b0'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'rgba(139,69,19,0.05)'; for(let i=0; i<1000; i++) { ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 1, 1); } const m = layout.startsWith('strip') ? 10 : 20; for (let i = 0; i < images.length; i++) { const cx = coords[i].x, cy = coords[i].y; ctx.fillStyle = '#1c1917'; ctx.fillRect(cx - m, cy - m, imgW + m*2, imgH + m*2); ctx.fillStyle = '#d4c5b0'; if (layout === 'film') { for(let holeX = cx - 10; holeX < cx + imgW + 20; holeX += 25) { ctx.fillRect(holeX, cy - m/2 - 6, 12, 8); ctx.fillRect(holeX, cy + imgH + m/2 - 2, 12, 8); } } else { for(let holeY = cy - 10; holeY < cy + imgH + 20; holeY += 25) { ctx.fillRect(cx - m/2 - 6, holeY, 8, 12); ctx.fillRect(cx + imgW + m/2 - 2, holeY, 8, 12); } } ctx.save(); const retroFilter = 'sepia(0.6) contrast(1.1) brightness(0.95)'; ctx.filter = retroFilter + (filterCss ? ' ' + filterCss : ''); drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 0, '', smoothness); ctx.filter = 'none'; ctx.restore(); if (i % 2 === 0) drawStarCharm(ctx, cx - 15, cy - 15, 12, '#8b4513'); } };
  const drawCyberpunkTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, layout: string) => { ctx.fillStyle = '#0a001a'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.strokeStyle = 'rgba(236,72,153,0.15)'; ctx.lineWidth = 1; for (let i=0; i<canvas.width; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); } for (let i=0; i<canvas.height; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); } ctx.shadowColor = '#eab308'; ctx.shadowBlur = 15; ctx.fillStyle = '#fff'; ctx.font = `bold ${layout.startsWith('strip') ? 45 : 60}px "Courier New"`; ctx.textAlign = 'center'; if (layout === 'polaroid') ctx.fillText('CYBER CITY', canvas.width / 2, canvas.height - 70); else ctx.fillText('GIZMO-PUNK 2077', canvas.width / 2, 85); ctx.shadowColor = 'transparent'; for (let i = 0; i < images.length; i++) { const cx = coords[i].x, cy = coords[i].y; ctx.shadowColor = i % 2 === 0 ? '#22d3ee' : '#ec4899'; ctx.shadowBlur = 25; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.strokeRect(cx, cy, imgW, imgH); ctx.shadowColor = 'transparent'; drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 0, filterCss, smoothness); drawSparkleCharm(ctx, cx + imgW - 15, cy + 10, 20, i % 2 === 0 ? '#ec4899' : '#22d3ee'); } };
  const drawVNUTheme = async (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, layout: string) => { const VNU_GREEN = '#0f5132'; ctx.fillStyle = VNU_GREEN; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; for(let i=0; i<canvas.width; i+=60) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); } for(let i=0; i<canvas.height; i+=60) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); } ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10; ctx.fillStyle = '#ffffff'; ctx.font = `bold ${layout.startsWith('strip') ? 40 : 55}px Arial`; ctx.textAlign = 'center'; if (layout === 'polaroid') ctx.fillText('#TuHaoSinhVienVNU', canvas.width / 2, canvas.height - 70); else ctx.fillText('#TuHaoSinhVienVNU', canvas.width / 2, 80); ctx.shadowColor = 'transparent'; const m = layout.startsWith('strip') ? 8 : 15; for (let i = 0; i < images.length; i++) { const cx = coords[i].x, cy = coords[i].y; ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 15; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(cx - m, cy - m, imgW + m*2, imgH + m*2, 8); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.stroke(); drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 4, filterCss, smoothness); } try { const vnuLogo = await loadImage('/vnu-logo.png'); const logoSize = layout.startsWith('strip') ? 80 : 120; const logoX = canvas.width - logoSize - 20; const logoY = canvas.height - logoSize - 20; ctx.fillStyle = '#ffffff'; ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2 + 5, 0, Math.PI*2); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.drawImage(vnuLogo, logoX, logoY, logoSize, logoSize); } catch (e) { console.log("Chưa thấy file vnu-logo.png trong thư mục public"); } };

  return <canvas ref={canvasRef} className="hidden" />;
}