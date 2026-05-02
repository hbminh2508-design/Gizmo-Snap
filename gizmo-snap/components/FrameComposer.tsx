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
  // HÀM VẼ ẢNH VỚI FILTER TRỰC TIẾP
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

    let filterString = [];
    if (filterCss && filterCss !== 'none') filterString.push(filterCss);
    if (smoothness > 0) {
      filterString.push(`brightness(${1 + smoothness/300}) saturate(1.05) contrast(1.02)`);
    }

    // Áp dụng filter trực tiếp lên Context trước khi vẽ
    if (filterString.length > 0) ctx.filter = filterString.join(' ');

    ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
    
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
        { id: 'sepia', css: 'sepia(0.8)' }, 
        { id: 'grayscale', css: 'grayscale(1)' },
        { id: 'vintage', css: 'sepia(0.5) contrast(1.1) brightness(0.9)' },
        { id: 'brighten', css: 'brightness(1.2) contrast(1.1)' }, 
        { id: 'cool', css: 'hue-rotate(10deg) saturate(1.2)' } 
      ];
      const filterCss = filtersData.find(f => f.id === selectedFilter)?.css || '';

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

      onGenerateSuccess(canvas.toDataURL('image/jpeg', 0.9));
    } catch (error) { console.error(error); onGenerateError(error); }
  };

  const drawConfigTheme = ( ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, filterCss: string, smoothness: number, config: any, layout: string ) => {
    if (config.bgGradientHolo) { const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height); g.addColorStop(0, '#f9a8d4'); g.addColorStop(0.3, '#fbcfe8'); g.addColorStop(0.6, '#bae6fd'); g.addColorStop(1, '#a7f3d0'); ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height); } else if (config.bgGradient) { const g = ctx.createLinearGradient(0, 0, 0, canvas.height); g.addColorStop(0, config.bgGradient[0]); g.addColorStop(1, config.bgGradient[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height); } else { ctx.fillStyle = config.bg; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    let fontSize = layout === 'film' ? 70 : (layout.startsWith('strip') ? 45 : 60); const fontString = config.font.replace(/\d+px/, `${fontSize}px`); ctx.fillStyle = config.titleColor; ctx.font = fontString; ctx.textAlign = 'center';
    if (layout === 'polaroid') { ctx.fillText(config.title, canvas.width / 2, canvas.height - 70); } else { ctx.fillText(config.title, canvas.width / 2, 80); }
    const m = layout.startsWith('strip') ? 8 : 15;
    for (let i = 0; i < images.length; i++) {
      const cx = coords[i].x, cy = coords[i].y;
      ctx.fillStyle = config.border; if (config.shadow) { ctx.shadowColor = config.shadow; ctx.shadowBlur = 15; }
      const isSoft = ['pastel', 'pink', 'kawaii'].includes(theme);
      if (isSoft) { ctx.beginPath(); ctx.roundRect(cx - m, cy - m, imgW + m*2, imgH + m*2, 10); ctx.fill(); } else { ctx.fillRect(cx - m, cy - m, imgW + m*2, imgH + m*2); }
      ctx.shadowColor = 'transparent';
      drawImageCover(ctx, images[i], cx, cy, imgW, imgH, isSoft ? 8 : 0, filterCss, smoothness);
    }
  };

  const drawArtFloral = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, f: string, s: number, layout: string) => { ctx.fillStyle = '#f8f9fa'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.strokeStyle = '#c4a77d'; ctx.lineWidth = 4; ctx.strokeRect(20, 20, canvas.width-40, canvas.height-40); for (let i = 0; i < images.length; i++) { drawImageCover(ctx, images[i], coords[i].x, coords[i].y, imgW, imgH, 0, f, s); drawFlowerCharm(ctx, coords[i].x + 10, coords[i].y + 10, 25, '#d4af37'); } };
  const drawArtFilm = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, f: string, s: number, layout: string) => { ctx.fillStyle = '#1c1917'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#eab308'; for(let i=0; i<canvas.width; i+=40) { ctx.fillRect(i, 10, 20, 20); ctx.fillRect(i, canvas.height-30, 20, 20); } for (let i = 0; i < images.length; i++) { drawImageCover(ctx, images[i], coords[i].x, coords[i].y, imgW, imgH, 0, f, s); } };
  const drawArtGold = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, f: string, s: number, layout: string) => { ctx.fillStyle = '#111'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.shadowColor = '#d4af37'; ctx.shadowBlur = 15; ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 4; ctx.strokeRect(30, 30, canvas.width-60, canvas.height-60); ctx.shadowColor = 'transparent'; for (let i = 0; i < images.length; i++) { drawImageCover(ctx, images[i], coords[i].x, coords[i].y, imgW, imgH, 0, f, s); } };

  const drawVietnamTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, f: string, s: number, layout: string, currentTheme: string) => { const RED = '#991b1b'; ctx.fillStyle = RED; ctx.fillRect(0, 0, canvas.width, canvas.height); const m = 15; for (let i = 0; i < images.length; i++) { const cx = coords[i].x, cy = coords[i].y; ctx.fillStyle = '#fff'; ctx.fillRect(cx-m, cy-m, imgW+m*2, imgH+m*2); drawImageCover(ctx, images[i], cx, cy, imgW, imgH, 0, f, s); if (i % 2 === 0) drawConicalHatCharm(ctx, cx + imgW - 20, cy - 10, 45); else drawOnePillarCharm(ctx, cx - 15, cy + imgH - 30, 45); } };
  const drawSpiderVerseTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, f: string, s: number, layout: string) => { ctx.fillStyle = '#0a001a'; ctx.fillRect(0, 0, canvas.width, canvas.height); for (let i = 0; i < images.length; i++) { drawImageCover(ctx, images[i], coords[i].x, coords[i].y, imgW, imgH, 2, f, s); drawMilesGlitchLogo(ctx, coords[i].x + imgW - 10, coords[i].y + imgH - 10, 35); } };
  const drawHelloKittyTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, f: string, s: number, layout: string) => { ctx.fillStyle = '#fce7f3'; ctx.fillRect(0, 0, canvas.width, canvas.height); for (let i = 0; i < images.length; i++) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(coords[i].x-10, coords[i].y-10, imgW+20, imgH+20, 20); ctx.fill(); drawImageCover(ctx, images[i], coords[i].x, coords[i].y, imgW, imgH, 10, f, s); } };
  const drawWeddingTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, f: string, s: number, layout: string) => { ctx.fillStyle = '#fffcf8'; ctx.fillRect(0, 0, canvas.width, canvas.height); for (let i = 0; i < images.length; i++) { ctx.fillStyle = '#fff'; ctx.fillRect(coords[i].x-10, coords[i].y-10, imgW+20, imgH+20); drawImageCover(ctx, images[i], coords[i].x, coords[i].y, imgW, imgH, 0, f, s); } };
  const drawNeonTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, f: string, s: number, layout: string) => { ctx.fillStyle = '#050509'; ctx.fillRect(0, 0, canvas.width, canvas.height); for (let i = 0; i < images.length; i++) { ctx.shadowColor = i%2===0?'#22d3ee':'#e879f9'; ctx.shadowBlur = 25; ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.strokeRect(coords[i].x, coords[i].y, imgW, imgH); ctx.shadowBlur = 0; drawImageCover(ctx, images[i], coords[i].x, coords[i].y, imgW, imgH, 0, f, s); } };
  const drawRetroTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, f: string, s: number, layout: string) => { ctx.fillStyle = '#d4c5b0'; ctx.fillRect(0, 0, canvas.width, canvas.height); for (let i = 0; i < images.length; i++) { ctx.fillStyle = '#1c1917'; ctx.fillRect(coords[i].x-15, coords[i].y-15, imgW+30, imgH+30); drawImageCover(ctx, images[i], coords[i].x, coords[i].y, imgW, imgH, 0, f, s); } };
  const drawCyberpunkTheme = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, f: string, s: number, layout: string) => { ctx.fillStyle = '#0a001a'; ctx.fillRect(0, 0, canvas.width, canvas.height); for (let i = 0; i < images.length; i++) { ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 4; ctx.strokeRect(coords[i].x, coords[i].y, imgW, imgH); drawImageCover(ctx, images[i], coords[i].x, coords[i].y, imgW, imgH, 0, f, s); } };
  const drawVNUTheme = async (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, images: HTMLImageElement[], coords: any[], imgW: number, imgH: number, f: string, s: number, layout: string) => { ctx.fillStyle = '#0f5132'; ctx.fillRect(0, 0, canvas.width, canvas.height); for (let i = 0; i < images.length; i++) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(coords[i].x-10, coords[i].y-10, imgW+20, imgH+20, 8); ctx.fill(); drawImageCover(ctx, images[i], coords[i].x, coords[i].y, imgW, imgH, 4, f, s); } };

  return <canvas ref={canvasRef} className="hidden" />;
}