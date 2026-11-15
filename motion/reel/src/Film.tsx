import React from 'react';
import {
  AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring, Easing, random,
} from 'remotion';
import fpos from '../public/shots/flow/pos.json';

/* =====================================================================================
   PedeAi · Filme de lançamento (Reels 1080×1920, 30 fps, 24,5 s)
   Sistema visual único: palco preto, luz volumétrica vermelha vinda do alto, grão de filme,
   poeira em 3 profundidades, tipografia Montserrat 900 em caixa alta alinhada à esquerda
   com marcador (kicker) em DM Sans espaçada. Telas: capturas reais da plataforma (3×).
   ===================================================================================== */

const RED = '#e51b2b', HOT = '#ff2b3d', WINE = '#7d1019', INK = '#0a0203', GREEN = '#3ddc84';
const SW = 1170, SH = 2532;               // capturas: 390×844 css @3×
const PW = 560;                           // largura da tela do celular no quadro
const K = PW / SW, CSS = 3 * K, PH = SH * K;
const BEZ = 20;
const PCX = 540, PCY = 1175;              // centro do celular no quadro (camera neutra)
const cl = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const OUT = Easing.bezier(0.16, 1, 0.3, 1);       // chegada suave
const IO = Easing.bezier(0.76, 0, 0.24, 1);       // movimento de câmera
const IN = Easing.bezier(0.7, 0, 0.84, 0);        // saída acelerada
const shot = (n: string) => staticFile('shots/' + n);
const img = (n: string) => staticFile('img/' + n);
const lerp = (f: number, a: number[], b: number[], e: any = OUT) => interpolate(f, a, b, {...cl, easing: e});

export const fontFaces = `
@font-face{font-family:'Montserrat';font-weight:600 900;src:url(${staticFile('fonts/montserrat-latin.woff2')}) format('woff2')}
@font-face{font-family:'DM Sans';font-weight:400 700;src:url(${staticFile('fonts/dm-sans-latin.woff2')}) format('woff2')}`;

/* ---------------- Som ---------------- */
const Sfx: React.FC<{at: number; s: string; v?: number}> = ({at, s, v = 1}) => (
  <Sequence from={at} layout="none"><Audio src={staticFile('sfx/' + s + '.wav')} volume={v} /></Sequence>
);

/* ---------------- Atmosfera: a assinatura visual do filme ---------------- */
const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity: 0.22}}>
      <Img src={staticFile('grain/g' + (f % 8) + '.png')} style={{width: 1080, height: 1920, imageRendering: 'pixelated'}} />
    </AbsoluteFill>
  );
};

const Dust: React.FC<{camX?: number; camY?: number; tint?: string; amount?: number}> = ({camX = 0, camY = 0, tint = '255,120,110', amount = 1}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {new Array(46).fill(0).map((_, i) => {
        const depth = 0.3 + random('d' + i) * 1.2;
        const x = (random('x' + i) * 1180 - 50 + f * 0.25 * depth - camX * depth * 0.4) % 1180;
        const y = ((random('y' + i) * 2100 - f * 0.9 * depth - camY * depth * 0.4) % 2100 + 2100) % 2100 - 90;
        const s = 2 + depth * 5;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(f / (14 + i) + i));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: `rgba(${tint},${0.5 * tw * amount})`, filter: `blur(${depth > 1.1 ? 3 : depth < 0.5 ? 2 : 0.6}px)`}} />;
      })}
    </AbsoluteFill>
  );
};

/* Palco: preto com feixes volumétricos vermelhos vindos do alto e brilho no chão. */
const Stage: React.FC<{beam?: number; hue?: string; floor?: number; sway?: number}> = ({beam = 1, hue = RED, floor = 1, sway = 0}) => {
  const f = useCurrentFrame();
  const b = (x: number, w: number, o: number, sk: number) => (
    <div style={{position: 'absolute', left: x + Math.sin(f / 60 + x) * 20 + sway, top: -200, width: w, height: 1700, transform: `skewX(${sk}deg)`, filter: 'blur(46px)', opacity: o * beam,
      background: `linear-gradient(180deg, ${hue} 0%, ${hue}99 35%, transparent 85%)`, mixBlendMode: 'screen'}} />
  );
  return (
    <AbsoluteFill style={{background: INK, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(90% 55% at 50% 0%, ${WINE} 0%, #2a050b 45%, transparent 75%)`}} />
      {b(250, 150, 0.28, -14)}{b(520, 220, 0.34, 6)}{b(760, 120, 0.22, 16)}
      <div style={{position: 'absolute', left: 140, right: 140, bottom: 120, height: 380, borderRadius: '50%', background: `radial-gradient(closest-side, ${hue}66, transparent)`, filter: 'blur(30px)', opacity: floor}} />
      <AbsoluteFill style={{boxShadow: 'inset 0 0 420px 80px rgba(0,0,0,.92)'}} />
    </AbsoluteFill>
  );
};

/* ---------------- Tipografia da campanha ---------------- */
type Line = {t: string; c?: string};
const Headline: React.FC<{kicker?: string; lines: Line[]; at: number; out?: number; y?: number; size?: number}> = ({kicker, lines, at, out = 99999, y = 250, size = 98}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const exit = lerp(f, [out, out + 10], [0, 1], IN);
  const bar = lerp(f, [at, at + 14], [0, 1]);
  return (
    <div style={{position: 'absolute', left: 84, right: 60, top: y, opacity: 1 - exit, transform: `translateY(${-exit * 60}px)`, filter: `blur(${exit * 8}px)`}}>
      {kicker && bar > 0.01 && (
        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22, font: '700 25px DM Sans', letterSpacing: '0.34em', color: '#ff8f97', textTransform: 'uppercase'}}>
          <span style={{width: 64 * bar, height: 4, background: HOT, borderRadius: 2, boxShadow: `0 0 18px ${HOT}`}} />
          <span style={{opacity: bar, transform: `translateX(${(1 - bar) * -20}px)`}}>{kicker}</span>
        </div>
      )}
      {lines.map((l, i) => {
        const s = spring({frame: f - at - 3 - i * 4, fps, config: {damping: 200, mass: 0.7}, durationInFrames: 18});
        return (
          <div key={i} style={{overflow: 'hidden', paddingBottom: 6}}>
            <div style={{font: `900 ${size}px/0.94 Montserrat`, letterSpacing: '-0.045em', color: l.c || '#fff', textTransform: 'uppercase',
              transform: `translateY(${(1 - s) * 135}%) skewY(${(1 - s) * 6}deg)`, opacity: s < 0.02 ? 0 : 1, textShadow: l.c ? `0 0 50px ${l.c}66` : '0 10px 40px rgba(0,0,0,.6)'}}>
              {l.t}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------------- Celular com luz de produto ---------------- */
const Phone: React.FC<{children: React.ReactNode; rx?: number; ry?: number; rz?: number; s?: number; x?: number; y?: number; glare?: number; dim?: number; blur?: number; rim?: string}> =
  ({children, rx = 0, ry = 0, rz = 0, s = 1, x = 0, y = 0, glare = -1, dim = 0, blur = 0, rim = RED}) => (
  <div style={{position: 'absolute', left: PCX - (PW + BEZ * 2) / 2, top: PCY - (PH + BEZ * 2) / 2, perspective: 2600, filter: blur ? `blur(${blur}px)` : undefined}}>
    <div style={{transform: `translate(${x}px, ${y}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`, transformOrigin: '50% 50%'}}>
      <div style={{position: 'relative', width: PW + BEZ * 2, height: PH + BEZ * 2, borderRadius: 104, padding: BEZ,
        background: 'linear-gradient(150deg,#4a4a50 0%,#111114 30%,#050506 60%,#2d2d32 100%)',
        boxShadow: `0 0 0 2px #5c5c64, inset 0 0 0 2px #000, 0 90px 160px -50px rgba(0,0,0,.95), 0 0 140px -20px ${rim}88, ${-ry * 1.2}px 0 60px -30px ${rim}`}}>
        <div style={{position: 'relative', width: PW, height: PH, borderRadius: 86, overflow: 'hidden', background: '#fff'}}>
          {children}
          <div style={{position: 'absolute', inset: 0, background: `rgba(10,2,3,${dim})`}} />
          <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(118deg, transparent ${glare * 100 - 26}%, rgba(255,255,255,.26) ${glare * 100 - 10}%, rgba(255,255,255,.04) ${glare * 100}%, transparent ${glare * 100 + 8}%)`}} />
          <div style={{position: 'absolute', inset: 0, boxShadow: 'inset 0 0 30px rgba(0,0,0,.25)', borderRadius: 86}} />
          <div style={{position: 'absolute', top: 16, left: '50%', width: 176, height: 48, marginLeft: -88, borderRadius: 26, background: '#000'}} />
        </div>
      </div>
    </div>
  </div>
);

const Screen: React.FC<{src: string; o?: number; y?: number; x?: number}> = ({src, o = 1, y = 0, x = 0}) => (
  <Img src={src} style={{position: 'absolute', left: x, top: y, width: PW, opacity: o}} />
);

/* Câmera: move o "mundo" (celular e o que estiver preso a ele) para enquadrar uma região da tela. */
const Cam: React.FC<{children: React.ReactNode; s: number; fx: number; fy: number}> = ({children, s, fx, fy}) => (
  // fx/fy: ponto da tela (css da página) que fica no centro óptico (540, 1000)
  <AbsoluteFill style={{transform: `translate(${540 - (PCX + (fx - 195) * CSS) * s + (s - 1) * 0}px, ${PCY - (PCY + (fy - 422) * CSS) * s}px) scale(${s})`, transformOrigin: '0 0'}}>
    {children}
  </AbsoluteFill>
);

/* Toque na tela (coordenadas css da página) */
const Tap: React.FC<{x: number; y: number; at: number}> = ({x, y, at}) => {
  const f = useCurrentFrame();
  if (f < at - 5 || f > at + 16) return null;
  const press = lerp(f, [at - 5, at], [0, 1]);
  const ring = lerp(f, [at, at + 16], [0, 1]);
  return (
    <>
      <div style={{position: 'absolute', left: x * CSS - 30, top: y * CSS - 30, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.6)', border: '2px solid #fff', transform: `scale(${1.2 - press * 0.25 + ring * 0.1})`, opacity: (1 - ring) * press, boxShadow: '0 8px 24px rgba(0,0,0,.3)'}} />
      <div style={{position: 'absolute', left: x * CSS - 30, top: y * CSS - 30, width: 60, height: 60, borderRadius: '50%', border: `3px solid ${HOT}`, transform: `scale(${1 + ring * 1.8})`, opacity: 1 - ring}} />
    </>
  );
};

/* Fotografia de comida emergindo do escuro (bordas dissolvidas no preto) */
const Dish: React.FC<{src: string; w: number; h?: number; x: number; y: number; s?: number; r?: number; blur?: number; o?: number; sweep?: number; steam?: number}> =
  ({src, w, h, x, y, s = 1, r = 0, blur = 0, o = 1, sweep = -1, steam = 0}) => {
  const f = useCurrentFrame();
  const hh = h || w;
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - hh / 2, width: w, height: hh, transform: `scale(${s}) rotate(${r}deg)`, opacity: o, filter: `blur(${blur}px)`}}>
      <div style={{position: 'absolute', inset: 0, WebkitMaskImage: 'radial-gradient(closest-side, #000 62%, transparent 100%)', maskImage: 'radial-gradient(closest-side, #000 62%, transparent 100%)'}}>
        <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.12) saturate(1.18) brightness(.95)'}} />
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(112deg, transparent ${sweep * 100 - 22}%, rgba(255,214,170,.55) ${sweep * 100 - 4}%, transparent ${sweep * 100 + 14}%)`, mixBlendMode: 'screen'}} />
        <div style={{position: 'absolute', inset: 0, background: `radial-gradient(70% 60% at 50% 20%, rgba(255,90,60,.25), transparent 70%)`, mixBlendMode: 'screen'}} />
      </div>
      {steam > 0 && new Array(5).fill(0).map((_, i) => {
        const p = ((f * 0.9 + i * 22) % 110) / 110;
        return <div key={i} style={{position: 'absolute', left: w * (0.32 + i * 0.09) + Math.sin(f / 9 + i) * 14, top: hh * 0.18 - p * hh * 0.45, width: 70, height: 150, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,240,230,.5), transparent)', filter: 'blur(14px)', opacity: steam * Math.sin(p * Math.PI) * 0.55}} />;
      })}
    </div>
  );
};

/* Rastro de luz anamórfico: só nos dois impactos do filme (abertura e marca) */
const Streak: React.FC<{y: number; o: number}> = ({y, o}) => o <= 0 ? null : (
  <>
    <div style={{position: 'absolute', left: -200, right: -200, top: y - 3, height: 6, background: `linear-gradient(90deg, transparent, ${HOT} 30%, #fff 50%, ${HOT} 70%, transparent)`, opacity: o, filter: 'blur(1.5px)', transform: `scaleX(${0.3 + o * 0.9})`, mixBlendMode: 'screen'}} />
    <div style={{position: 'absolute', left: -200, right: -200, top: y - 60, height: 120, background: `radial-gradient(50% 50% at 50% 50%, ${HOT}aa, transparent)`, opacity: o * 0.8, filter: 'blur(16px)', mixBlendMode: 'screen'}} />
  </>
);

/* ================================== CENAS ================================== */

/* 01 · Abertura gastronômica com as fotos autorizadas (public/ref).
   Montagem macro na batida → queijo esticando (as metades se afastam) → bacon caindo →
   a câmera desce acompanhando o fio de molho → revelação do lanche na luz vermelha, com a manchete. */
const ref = (n: string) => staticFile('ref/' + n + '.jpg');
// Foto em tela cheia com movimento de câmera próprio (push, deriva, foco) e saída em "zoom-through".
const Shot: React.FC<{src: string; from: number; dur: number; s0?: number; s1?: number; x0?: number; x1?: number; y0?: number; y1?: number; focus?: number; pos?: string; sweep?: boolean; children?: React.ReactNode}> =
  ({src, from, dur, s0 = 1.0, s1 = 1.1, x0 = 0, x1 = 0, y0 = 0, y1 = 0, focus = 8, pos = '50% 50%', sweep = false, children}) => {
  const f = useCurrentFrame();
  if (f < from || f >= from + dur) return null;
  const l = f - from;
  const k = lerp(l, [0, dur], [0, 1], Easing.bezier(0.25, 0.1, 0.25, 1));
  const out = lerp(l, [dur - 3, dur], [0, 1], IN); // zoom-through para o próximo corte
  const sc = s0 + (s1 - s0) * k + out * 0.12;
  const blur = lerp(l, [0, 5], [focus, 0], OUT) + out * 10;
  const sw = lerp(l, [2, dur - 2], [-0.3, 1.3], IO);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${x0 + (x1 - x0) * k}px, ${y0 + (y1 - y0) * k}px) scale(${sc})`, filter: `blur(${blur}px)`}}>
        {children || <Img src={ref(src)} style={{width: 1080, height: 1920, objectFit: 'cover', objectPosition: pos, filter: 'contrast(1.08) saturate(1.08)'}} />}
        {sweep && <AbsoluteFill style={{background: `linear-gradient(115deg, transparent ${sw * 100 - 18}%, rgba(255,220,180,.22) ${sw * 100}%, transparent ${sw * 100 + 18}%)`, mixBlendMode: 'screen'}} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
// Queijo esticando: as metades se afastam e a faixa central (os fios) estica junto.
const Pull: React.FC<{d: number}> = ({d}) => {
  const W = 1080, a = 0.38, b = 0.62; // faixa dos fios de queijo
  const mid = (b - a) * W, k = (mid + 2 * d) / mid, cx = ((a + b) / 2) * 100;
  const img = <Img src={ref('queijo-esticando')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover'}} />;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: `inset(0 ${(1 - b) * 100 - 0.2}% 0 ${a * 100 - 0.2}%)`, transform: `scaleX(${k})`, transformOrigin: `${cx}% 50%`}}>{img}</AbsoluteFill>
      <AbsoluteFill style={{clipPath: `inset(0 ${(1 - a) * 100}% 0 0)`, transform: `translateX(${-d}px)`}}>{img}</AbsoluteFill>
      <AbsoluteFill style={{clipPath: `inset(0 0 0 ${b * 100}%)`, transform: `translateX(${d}px)`}}>{img}</AbsoluteFill>
    </AbsoluteFill>
  );
};
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const H = 150; // revelação do lanche
  const whip = lerp(f, [198, 210], [0, 1], IN);
  const reveal = lerp(f, [H, H + 14], [0, 1], OUT);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `translateY(${-whip * 1500}px)`, filter: `blur(${whip * 18}px)`}}>
        {/* montagem macro: cada corte numa batida, cada foto com direção de movimento própria */}
        <Shot src="macro-bacon" from={0} dur={15} s0={1.18} s1={1.06} focus={14} sweep />
        <Shot src="macro-molho-laranja" from={15} dur={15} s0={1.0} s1={1.08} x0={30} x1={-20} />
        <Shot src="macro-bacon-molho" from={30} dur={15} s0={1.05} s1={1.14} y0={20} y1={-30} />
        <Shot src="triplo" from={45} dur={15} s0={1.12} s1={1.02} x0={-30} x1={10} pos="35% 50%" sweep />
        {/* queijo esticando: as duas metades se afastam devagar e os fios acompanham */}
        <Shot src="queijo-esticando" from={60} dur={30} s0={1.12} s1={1.18} focus={4}>
          <Pull d={lerp(f, [60, 90], [0, 46], Easing.bezier(0.3, 0, 0.2, 1))} />
        </Shot>
        <Shot src="bacon-caindo" from={90} dur={15} s0={1.0} s1={1.08} y0={-40} y1={10} focus={6} />
        {/* molho: a câmera desce acompanhando o fio até o lanche */}
        <Shot src="molho-caindo" from={105} dur={30} s0={1.32} s1={1.04} y0={300} y1={-30} focus={4} sweep />
        <Shot src="fundo-vermelho" from={135} dur={15} s0={1.16} s1={1.05} focus={10} />
        {/* revelação: luz vermelha da própria foto encontra a luz da marca */}
        <Shot src="heroi-luva" from={H} dur={60} s0={1.14} s1={1.02} y0={60} y1={0} focus={12} />
        {f >= H && <AbsoluteFill style={{background: `radial-gradient(60% 40% at 30% 62%, ${RED}55, transparent 70%)`, mixBlendMode: 'screen', opacity: reveal * (0.7 + 0.3 * Math.sin(f / 7))}} />}
        {/* faixa escura para a manchete */}
        {f >= H && <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,.5) 22%, transparent 36%)', opacity: reveal}} />}
      </AbsoluteFill>
      <AbsoluteFill style={{boxShadow: 'inset 0 0 360px 50px rgba(0,0,0,.85)', pointerEvents: 'none'}} />
      <Dust amount={reveal} />
      <AbsoluteFill style={{background: '#000', opacity: lerp(f, [0, 4], [1, 0])}} />
      <AbsoluteFill style={{background: HOT, opacity: lerp(f, [H, H + 2, H + 10], [0, 0.3, 0], Easing.linear), mixBlendMode: 'screen'}} />
      <Streak y={1100} o={lerp(f, [H, H + 3, H + 22], [0, 1, 0], Easing.linear)} />
      <Headline kicker="PedeAi Delivery" lines={[{t: 'Bateu a'}, {t: 'fome?', c: HOT}]} at={H + 8} out={195} y={230} size={132} />
    </AbsoluteFill>
  );
};

/* 02 · Descoberta, com a navegação real da plataforma (capturas em public/shots/flow):
   o celular chega → toque na cidade → a folha de cidades sobe → a lista rola até Barra do Garças →
   a página rola até "O que bateu vontade?" → toque em Hambúrguer → rolagem até a Dantes → toque e mergulho na loja. */
const flow = (n: string) => staticFile('shots/flow/' + n);
// Página rolando: conteúdo alto deslocado + cabeçalho e barra inferior fixos por cima (como no celular).
const ScrollPage: React.FC<{tall: string; y: number; y0?: number; v?: number; header?: string}> = ({tall, y, y0 = 0, v = 0, header = 'home_barra.png'}) => {
  const top = -(y - y0) * CSS;
  return (
    <AbsoluteFill style={{background: '#f7f1ea'}}>
      <Img src={flow(tall)} style={{position: 'absolute', left: 0, top, width: PW}} />
      {v > 6 && [1, 2, 3].map((i) => <Img key={i} src={flow(tall)} style={{position: 'absolute', left: 0, top: top + i * v * 0.3, width: PW, opacity: 0.14}} />)}
      <div style={{position: 'absolute', left: 0, top: 0, width: PW, height: fpos.header.h * CSS, overflow: 'hidden'}}>
        <Img src={flow(header)} style={{position: 'absolute', left: 0, top: 0, width: PW}} />
      </div>
      <div style={{position: 'absolute', left: fpos.nav.x * CSS, top: fpos.nav.y * CSS, width: fpos.nav.w * CSS, height: fpos.nav.h * CSS, overflow: 'hidden', borderRadius: 22 * CSS}}>
        <Img src={flow(header)} style={{position: 'absolute', left: -fpos.nav.x * CSS, top: -fpos.nav.y * CSS, width: PW}} />
      </div>
    </AbsoluteFill>
  );
};
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame: f - 2, fps, config: {damping: 18, stiffness: 60, mass: 1.1}});
  // linha do tempo da navegação (quadros locais)
  const T = {pill: 44, open: 48, list0: 70, list1: 96, barra: 104, close: 110, home: 124, sc0: 132, sc1: 160, hamb: 170, au0: 176, au1: 200, dantes: 208, dive: 212};
  const sheet = f < T.close ? lerp(f, [T.open, T.open + 14], [0, 1], OUT) : lerp(f, [T.close, T.close + 12], [1, 0], IN);
  const listV = lerp(f, [T.list0, T.list1], [0, fpos.listParts[2]], IO);
  const listVel = Math.abs(lerp(f + 1, [T.list0, T.list1], [0, fpos.listParts[2]], IO) - listV) * CSS;
  const sc = f < T.hamb ? lerp(f, [T.sc0, T.sc1], [0, fpos.scrollCats], IO) : lerp(f, [T.au0, T.au1], [fpos.scrollCats, fpos.scrollHamb], IO);
  const scN = f < T.hamb ? lerp(f + 1, [T.sc0, T.sc1], [0, fpos.scrollCats], IO) : lerp(f + 1, [T.au0, T.au1], [fpos.scrollCats, fpos.scrollHamb], IO);
  const vel = Math.abs(scN - sc) * CSS;
  // câmera: aproxima onde o dedo está agindo, sempre com a mesma curva
  const keys = [0, 56, 70, 100, 116, 140, 158, 172, 196, 206, T.dive, 225];
  const cs = interpolate(f, keys, [1, 1, 1.24, 1.24, 1, 1, 1.22, 1.22, 1.16, 1.16, 1.16, 2.9], {...cl, easing: IO});
  const cfy = interpolate(f, keys, [422, 422, 600, 640, 422, 422, 380, 380, 380, 380, 380, 356], {...cl, easing: IO});
  const cfx = interpolate(f, keys, [195, 195, 195, 195, 195, 195, 195, 195, 195, 195, 195, 102], {...cl, easing: IO});
  const dive = lerp(f, [T.dive, 225], [0, 1], IN);
  // posição do toque em Barra do Garças (lista rolada até o fim)
  const barraY = fpos.list.y + fpos.barraInList.y + fpos.barraInList.h / 2 - fpos.listParts[2];
  const dY = fpos.dantes.y + fpos.dantes.h / 2 + (fpos.scrollDantes - fpos.scrollHamb);
  const press = lerp(f, [T.dantes - 3, T.dantes, T.dantes + 6], [1, 0.965, 1], Easing.linear);
  return (
    <AbsoluteFill>
      <Stage sway={lerp(f, [0, 225], [-40, 20], Easing.linear)} />
      <Dust camY={enter * 200} />
      <Cam s={cs} fx={cfx} fy={cfy}>
        <Phone rx={interpolate(enter, [0, 1], [24, 0])} ry={interpolate(enter, [0, 1], [-34, 0])} rz={interpolate(enter, [0, 1], [-8, 0])}
          y={interpolate(enter, [0, 1], [1300, 0])} glare={lerp(f, [14, 56], [-0.3, 1.4], IO)} blur={dive * 8}>
          {/* 1 · início em Nova Xavantina, até a folha cobrir a tela */}
          {f < T.barra && <Screen src={flow('home_nx.png')} />}
          {/* 2 · depois da escolha: página de Barra do Garças rolando (antes e depois do toque em Hambúrguer) */}
          {f >= T.barra && f < T.hamb + 2 && <ScrollPage tall="home_tall.jpg" y={sc} v={vel} />}
          {f >= T.hamb && <AbsoluteFill style={{opacity: lerp(f, [T.hamb, T.hamb + 3], [0, 1], Easing.linear)}}><ScrollPage tall="hamb_tall.jpg" y={sc} y0={fpos.hambTall.y0} v={vel} header="hamb.png" /></AbsoluteFill>}
          {/* cartão da Dantes afundando no toque */}
          {f >= T.dantes - 3 && (
            <div style={{position: 'absolute', left: fpos.dantes.x * CSS, top: (dY - fpos.dantes.h / 2) * CSS, width: fpos.dantes.w * CSS, height: fpos.dantes.h * CSS, overflow: 'hidden', borderRadius: 18 * CSS, transform: `scale(${press})`, boxShadow: press < 1 ? '0 0 0 3px rgba(229,27,43,.35)' : 'none'}}>
              <Img src={flow('hamb_tall.jpg')} style={{position: 'absolute', width: PW, left: -fpos.dantes.x * CSS, top: -(dY - fpos.dantes.h / 2 + fpos.scrollHamb - fpos.hambTall.y0) * CSS}} />
            </div>
          )}
          {/* toast real de confirmação da cidade */}
          {f >= T.home - 2 && f < T.home + 28 && (
            <div style={{position: 'absolute', left: fpos.toast.x * CSS, top: fpos.toast.y * CSS, width: fpos.toast.w * CSS, height: fpos.toast.h * CSS, overflow: 'hidden', borderRadius: 12 * CSS,
              opacity: lerp(f, [T.home - 2, T.home + 2, T.home + 22, T.home + 28], [0, 1, 1, 0], Easing.linear), transform: `translateY(${lerp(f, [T.home - 2, T.home + 4], [10, 0])}px)`}}>
              <Img src={flow('home_barra_toast.png')} style={{position: 'absolute', width: PW, left: -fpos.toast.x * CSS, top: -fpos.toast.y * CSS}} />
            </div>
          )}
          {/* folha de cidades: fundo escurecido real + folha subindo; a lista rola dentro dela */}
          {sheet > 0 && (
            <>
              <div style={{position: 'absolute', left: 0, top: 0, width: PW, height: fpos.menu.y * CSS, overflow: 'hidden', opacity: sheet}}>
                <Img src={flow('menu.png')} style={{position: 'absolute', left: 0, top: 0, width: PW}} />
              </div>
              <AbsoluteFill style={{background: 'rgba(30,8,10,.35)', opacity: sheet, clipPath: `inset(${fpos.menu.y * CSS}px 0 0 0)`}} />
              <div style={{position: 'absolute', left: 0, top: (fpos.menu.y - 6) * CSS + (1 - sheet) * (PH * 0.9), width: PW, height: PH, overflow: 'hidden'}}>
                <Img src={flow('menu.png')} style={{position: 'absolute', left: 0, top: -(fpos.menu.y - 6) * CSS, width: PW}} />
                <div style={{position: 'absolute', left: fpos.list.x * CSS, top: (fpos.list.y - fpos.menu.y + 6) * CSS, width: fpos.list.w * CSS, height: fpos.list.h * CSS, overflow: 'hidden', background: '#fff'}}>
                  <Img src={flow('list_tall.png')} style={{position: 'absolute', left: 0, top: -listV * CSS, width: fpos.list.w * CSS}} />
                  {listVel > 6 && [1, 2].map((i) => <Img key={i} src={flow('list_tall.png')} style={{position: 'absolute', left: 0, top: -listV * CSS + i * listVel * 0.3, width: fpos.list.w * CSS, opacity: 0.15}} />)}
                </div>
              </div>
            </>
          )}
          <Tap x={fpos.locationBtn.x + fpos.locationBtn.w / 2} y={fpos.locationBtn.y + fpos.locationBtn.h / 2} at={T.pill} />
          <Tap x={fpos.barra.x + fpos.barra.w / 2} y={barraY} at={T.barra} />
          <Tap x={fpos.hamb.x + fpos.hamb.w / 2} y={fpos.hamb.y + fpos.hamb.h / 2 - 12} at={T.hamb} />
          <Tap x={fpos.dantes.x + fpos.dantes.w / 2} y={dY} at={T.dantes} />
          <AbsoluteFill style={{background: '#7a0f18', opacity: lerp(f, [218, 225], [0, 1], Easing.linear)}} />
        </Phone>
      </Cam>
      {/* faixa de leitura para as legendas quando a câmera aproxima */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,2,3,.96) 0%, rgba(10,2,3,.88) 22%, transparent 31%)', opacity: lerp(f, [56, 70], [0, 1])}} />
      <Headline kicker="Chegou ao Vale do Araguaia" lines={[{t: 'Todo o delivery'}, {t: 'da sua cidade.', c: HOT}]} at={10} out={54} y={230} size={92} />
      <Headline kicker="01 · Cidade" lines={[{t: 'Escolha'}, {t: 'sua cidade.', c: HOT}]} at={66} out={118} y={230} size={92} />
      <Headline kicker="02 · Categoria" lines={[{t: 'O que bateu'}, {t: 'vontade?', c: HOT}]} at={126} out={174} y={230} size={92} />
      <Headline kicker="03 · Restaurante" lines={[{t: 'Escolha onde'}, {t: 'pedir.', c: HOT}]} at={180} out={214} y={230} size={92} />
    </AbsoluteFill>
  );
};

/* 03 · Descoberta: a loja abre, o cardápio rola e os pratos saltam da tela */
const S3: React.FC<{pos: any}> = ({pos}) => {
  const f = useCurrentFrame();
  const pull = lerp(f, [0, 18], [2.25, 1], OUT);
  const scroll = lerp(f, [22, 60], [0, 3928], IO);
  const v = Math.abs(lerp(f + 1, [22, 60], [0, 3928], IO) - scroll);
  const lift = lerp(f, [66, 92], [0, 1], OUT);
  const ids = ['maromba', 'tropical', 'old-school'];
  const fan = [{dx: -30, dy: -170, r: -6}, {dx: 50, dy: 10, r: 4}, {dx: -20, dy: 190, r: -3}];
  return (
    <AbsoluteFill>
      <Stage />
      <Dust />
      <Phone s={pull} y={60 * (pull - 1)} glare={lerp(f, [8, 40], [-0.3, 1.4], IO)} dim={lift * 0.55} blur={lift * 5 + Math.max(0, pull - 1) * 6} ry={-4 * (1 - lift)} rx={3 * (1 - lift)}>
        <div style={{position: 'absolute', inset: 0}}>
          {f < 62 && <Img src={shot('store_tall.jpg')} style={{position: 'absolute', left: 0, top: -scroll * CSS, width: PW}} />}
          {f < 62 && v > 8 && [1, 2, 3].map(i => <Img key={i} src={shot('store_tall.jpg')} style={{position: 'absolute', left: 0, top: -scroll * CSS + i * v * 0.35, width: PW, opacity: 0.16}} />)}
          {f >= 58 && <Screen src={shot('store_menu.png')} o={lerp(f, [58, 62], [0, 1])} />}
        </div>
        <AbsoluteFill style={{background: '#7a0f18', opacity: lerp(f, [0, 8], [1, 0])}} />
      </Phone>
      {/* cartões reais do cardápio saindo da tela em profundidade */}
      {lift > 0 && ids.map((id, i) => {
        const c = pos['card_' + id];
        const cx = PCX + (c.x + c.w / 2 - 195) * CSS, cy = PCY + 60 * 0 + (c.y + c.h / 2 - 422) * CSS;
        const l = lerp(f, [66 + i * 4, 92 + i * 4], [0, 1], OUT);
        const sc = 1 + l * 0.32;
        return (
          <div key={id} style={{position: 'absolute', left: cx - c.w * CSS / 2, top: cy - c.h * CSS / 2, width: c.w * CSS, height: c.h * CSS, borderRadius: 26, overflow: 'hidden',
            transform: `translate(${fan[i].dx * l}px, ${fan[i].dy * l}px) rotate(${fan[i].r * l}deg) scale(${sc})`,
            boxShadow: `0 ${30 + l * 50}px ${60 + l * 60}px -20px rgba(0,0,0,.85), 0 0 ${l * 60}px -10px ${RED}`}}>
            <Img src={shot('store_menu.png')} style={{position: 'absolute', width: PW, left: -c.x * CSS, top: -c.y * CSS}} />
          </div>
        );
      })}
      <Headline kicker="04 · Cardápio" lines={[{t: 'Cardápios que'}, {t: 'dão vontade.', c: HOT}]} at={64} y={230} size={96} />
    </AbsoluteFill>
  );
};

/* 04 · Compra: os pratos voltam ao lugar e três toques montam o pedido */
const S4: React.FC<{pos: any}> = ({pos}) => {
  const f = useCurrentFrame();
  const ids = ['maromba', 'tropical', 'old-school'];
  const fan = [{dx: -30, dy: -170, r: -6}, {dx: 50, dy: 10, r: 4}, {dx: -20, dy: 190, r: -3}];
  const back = lerp(f, [0, 16], [1, 0], IO);
  const taps = [{id: 'maromba', at: 24}, {id: 'tropical', at: 40}, {id: 'old-school', at: 56}];
  let src = 'store_menu.png';
  taps.forEach(t => { if (f >= t.at + 1) src = 'store_menu_' + t.id + '.png'; });
  const s = lerp(f, [14, 86], [1, 1.07], Easing.linear);
  return (
    <AbsoluteFill>
      <Stage />
      <Dust />
      <Cam s={s} fx={195} fy={470}>
        <Phone glare={-1} dim={back * 0.55} blur={back * 5}>
          <Screen src={shot(src)} />
          {taps.map(t => <Tap key={t.id} x={pos['add_' + t.id].x} y={pos['add_' + t.id].y} at={t.at} />)}
          {taps.map(t => f >= t.at && f < t.at + 22 ? (
            <div key={'p' + t.id} style={{position: 'absolute', left: pos['add_' + t.id].x * CSS - 120, top: pos['add_' + t.id].y * CSS - 40 - lerp(f, [t.at, t.at + 22], [0, 70]), padding: '8px 16px', borderRadius: 99, background: HOT, color: '#fff', font: '800 26px Montserrat', opacity: lerp(f, [t.at, t.at + 4, t.at + 16, t.at + 22], [0, 1, 1, 0]), boxShadow: `0 8px 24px ${RED}88`}}>
              + adicionado
            </div>
          ) : null)}
          <Tap x={pos.cartBar.x} y={pos.cartBar.y} at={80} />
        </Phone>
        {back > 0 && ids.map((id, i) => {
          const c = pos['card_' + id];
          const cx = PCX + (c.x + c.w / 2 - 195) * CSS, cy = PCY + (c.y + c.h / 2 - 422) * CSS;
          return (
            <div key={id} style={{position: 'absolute', left: cx - c.w * CSS / 2, top: cy - c.h * CSS / 2, width: c.w * CSS, height: c.h * CSS, borderRadius: 26, overflow: 'hidden',
              transform: `translate(${fan[i].dx * back}px, ${fan[i].dy * back}px) rotate(${fan[i].r * back}deg) scale(${1 + back * 0.32})`, opacity: back > 0.02 ? 1 : 0,
              boxShadow: `0 ${30 + back * 50}px ${60 + back * 60}px -20px rgba(0,0,0,.85)`}}>
              <Img src={shot('store_menu.png')} style={{position: 'absolute', width: PW, left: -c.x * CSS, top: -c.y * CSS}} />
            </div>
          );
        })}
      </Cam>
      <Headline kicker="05 · Pedido" lines={[{t: 'Um toque.'}, {t: 'Já está no pedido.', c: HOT}]} at={-30} out={78} y={230} size={84} />
    </AbsoluteFill>
  );
};

/* 05 · Finalização: a câmera acompanha cada etapa; legenda vira um indicador tipográfico */
const S5: React.FC<{pos: any}> = ({pos}) => {
  const f = useCurrentFrame();
  const T = {s1: 0, go1: 26, s2: 32, fill: [44, 54, 64, 74], go2: 88, s3: 94, pix: 106, end: 118};
  let src = 'step1.png';
  if (f >= T.s2) src = 'step2_empty.png';
  if (f >= T.s3) src = 'step3_empty.png';
  if (f >= T.pix + 1) src = 'step3_pix.png';
  // enquadramentos (centro óptico em css da página) e escala da câmera
  const keys = [0, 14, 24, 32, 42, 82, 92, 100, 114, 135];
  const fy = interpolate(f, keys, [520, 380, 760, 720, 520, 520, 760, 400, 640, 640], {...cl, easing: IO});
  const sc = interpolate(f, keys, [1.0, 1.18, 1.12, 1.12, 1.3, 1.3, 1.12, 1.28, 1.12, 1.1], {...cl, easing: IO});
  const slide = (at: number) => lerp(f, [at, at + 9], [PW, 0], OUT);
  const offX = f >= T.s3 ? slide(T.s3) : f >= T.s2 ? slide(T.s2) : slide(T.s1 - 9);
  const fields = ['cartName', 'cartStreet', 'cartDistrict', 'cartRef'];
  const steps = ['Pedido', 'Entrega', 'Pagamento'];
  const cur = f >= T.s3 ? 2 : f >= T.s2 ? 1 : 0;
  return (
    <AbsoluteFill>
      <Stage />
      <Dust />
      <Cam s={sc} fx={195} fy={fy}>
        <Phone glare={lerp(f, [T.s2, T.s2 + 30], [-0.3, 1.4], IO)}>
          <div style={{position: 'absolute', inset: 0, transform: `translateX(${offX}px)`}}>
            <Screen src={shot(src)} />
            {f >= T.s2 && f < T.s3 && fields.map((k, i) => {
              const b = pos[k], m = lerp(f, [T.fill[i], T.fill[i] + 9], [0, 1], Easing.linear);
              return (
                <div key={k} style={{position: 'absolute', left: (b.x - b.w / 2) * CSS, top: (b.y - b.h / 2) * CSS, width: b.w * CSS * m, height: b.h * CSS, overflow: 'hidden'}}>
                  <Img src={shot('step2_filled.png')} style={{position: 'absolute', width: PW, left: -(b.x - b.w / 2) * CSS, top: -(b.y - b.h / 2) * CSS}} />
                </div>
              );
            })}
          </div>
          <Tap x={pos.send.x} y={pos.send.y} at={T.go1} />
          <Tap x={pos.send.x} y={pos.send.y} at={T.go2} />
          <Tap x={pos.pix.x} y={pos.pix.y} at={T.pix} />
        </Phone>
      </Cam>
      {/* faixa escura para a legenda ficar legível sobre o celular aproximado */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,2,3,.97) 0%, rgba(10,2,3,.93) 29%, transparent 37%)'}} />
      <div style={{position: 'absolute', left: 84, top: 236, font: '700 25px DM Sans', letterSpacing: '0.34em', color: '#ff8f97', display: 'flex', alignItems: 'center', gap: 18}}>
        <span style={{width: 64, height: 4, background: HOT, borderRadius: 2, boxShadow: `0 0 18px ${HOT}`}} />06 · FINALIZE
      </div>
      <div style={{position: 'absolute', left: 84, top: 290, display: 'flex', flexDirection: 'column', gap: 4}}>
        {steps.map((s, i) => {
          const done = i < cur, on = i === cur;
          const o = lerp(f, [i * 8, i * 8 + 10], [0, 1]);
          return (
            <div key={s} style={{font: '900 84px/0.98 Montserrat', letterSpacing: '-0.045em', textTransform: 'uppercase', opacity: o * (done || on ? 1 : 0.22),
              color: done ? HOT : '#fff', transform: `translateX(${(1 - o) * -30}px)`, display: 'flex', alignItems: 'center', gap: 18}}>
              {s}.{done && <span style={{font: '900 54px Montserrat', color: HOT}}>✓</span>}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* 06 · Confirmação: o botão vira a mensagem pronta na conversa da loja */
const LINES = [
  'Olá, Dantes! Gostaria de fazer um pedido pelo PedeAi Delivery:', '',
  '*Pedido*', '1x Maromba — R$ 29,90', '1x Tropical — R$ 29,90', '1x Old School — R$ 29,90', '',
  'Subtotal: R$ 89,70', 'Taxa de entrega: R$ 7,00', '*Total: R$ 96,70*', '',
  '*Entrega*', 'Nome: Maria', 'Endereço: Rua das Flores, 120, Bairro Centro', 'Referência: Casa azul', '',
  '*Pagamento:* Pix',
];
const fmt = (t: string) => t.split('*').map((p, i) => i % 2 ? <b key={i}>{p}</b> : <span key={i}>{p}</span>);
const Chat: React.FC<{start?: number; full?: boolean}> = ({start = 0, full}) => {
  const f = useCurrentFrame();
  const n = full ? LINES.length : Math.floor(lerp(f, [start + 4, start + 44], [0, LINES.length], Easing.linear));
  const pop = full ? 1 : spring({frame: f - start, fps: 30, config: {damping: 14, stiffness: 140}});
  return (
    <AbsoluteFill style={{background: '#ece5dc'}}>
      <div style={{height: 150, background: '#1d2b24', display: 'flex', alignItems: 'flex-end', padding: '0 26px 20px', gap: 16}}>
        <Img src={img('dantes-logo.webp')} style={{width: 70, height: 70, borderRadius: '50%'}} />
        <div style={{color: '#fff', font: '700 32px DM Sans', lineHeight: 1.1}}>Dantes<div style={{font: '400 21px DM Sans', opacity: 0.75}}>online</div></div>
      </div>
      {f >= start && (
        <div style={{position: 'absolute', right: 20, top: 186, width: PW - 80, background: '#dcf5e3', borderRadius: '28px 28px 8px 28px', padding: '20px 24px 30px', font: '400 23px/1.36 DM Sans', color: '#16241b',
          transform: `scale(${0.6 + pop * 0.4})`, opacity: Math.min(1, pop * 1.5), transformOrigin: '100% 100%', boxShadow: '0 6px 16px rgba(0,0,0,.1)'}}>
          {LINES.slice(0, Math.max(1, n)).map((l, i) => <div key={i} style={{minHeight: l ? 0 : 12}}>{fmt(l)}</div>)}
          <div style={{position: 'absolute', right: 16, bottom: 8, font: '400 17px DM Sans', color: '#5d7a66'}}>19:42 ✓✓</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
const S6: React.FC<{pos: any}> = ({pos}) => {
  const f = useCurrentFrame();
  const whip = lerp(f, [8, 20], [0, 1], IO);
  const trail = Math.sin(whip * Math.PI);
  const bloom = lerp(f, [14, 18, 34], [0, 0.32, 0], Easing.linear);
  const push = lerp(f, [30, 100], [1.0, 1.16], IO);
  const fy = lerp(f, [0, 22, 60], [700, 420, 360], IO);
  return (
    <AbsoluteFill>
      <Stage hue={f > 16 ? '#1f9e57' : RED} />
      <Dust tint={f > 16 ? '140,255,190' : '255,120,110'} />
      <Cam s={push} fx={195} fy={fy}>
        <Phone ry={lerp(f, [8, 20, 105], [0, 10, 4], IO)} rim={f > 16 ? GREEN : RED} glare={lerp(f, [22, 56], [-0.3, 1.4], IO)}>
          {f < 20 && [0, 1, 2, 3].map(i => (
            <div key={i} style={{position: 'absolute', inset: 0, transform: `translateX(${-whip * PW * 1.1 + i * trail * 50}px)`, opacity: i ? 0.2 : 1}}>
              <Screen src={shot('step3_pix.png')} />
              {i === 0 && <div style={{position: 'absolute', left: (pos.send.x - pos.send.w / 2) * CSS, top: (pos.send.y - pos.send.h / 2) * CSS, width: pos.send.w * CSS, height: pos.send.h * CSS, borderRadius: 18, background: '#fff', opacity: lerp(f, [2, 6, 12], [0, 0.45, 0], Easing.linear)}} />}
            </div>
          ))}
          {f >= 8 && [0, 1, 2, 3].map(i => (
            <div key={'c' + i} style={{position: 'absolute', inset: 0, transform: `translateX(${(1 - whip) * PW * 1.1 - i * trail * 50}px)`, opacity: i ? 0.2 : 1}}>
              <Chat start={18} />
            </div>
          ))}
          <Tap x={pos.send.x} y={pos.send.y} at={4} />
        </Phone>
      </Cam>
      <AbsoluteFill style={{background: '#7dffb0', opacity: bloom, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,2,3,.95) 0%, rgba(10,2,3,.85) 20%, transparent 28%)'}} />
      <Headline kicker="07 · WhatsApp" lines={[{t: 'Chega pronto'}, {t: 'no WhatsApp.', c: GREEN}]} at={20} y={230} size={92} />
    </AbsoluteFill>
  );
};

/* 07 · Assinatura: a marca nasce da luz */
const Logo: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const tile = spring({frame: f, fps, config: {damping: 13, stiffness: 90}});
  const wipe = lerp(f, [4, 22], [0, 100], IO);
  const sweep = lerp(f, [10, 34], [-0.3, 1.4], IO);
  const word = lerp(f, [12, 28], [0, 1], OUT);
  const tag = lerp(f, [22, 40], [0, 1], OUT);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
      <div style={{position: 'relative', width: 210, height: 210, borderRadius: 66, background: RED, transform: `scale(${tile})`, overflow: 'hidden',
        boxShadow: `0 40px 90px -20px ${RED}, 0 0 ${120 * tile}px -10px ${HOT}`}}>
        <Img src={img('pedeai-mark.png')} style={{position: 'absolute', left: 31, top: 31, width: 148, clipPath: `inset(0 ${100 - wipe}% 0 0)`}} />
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent ${sweep * 100 - 20}%, rgba(255,255,255,.55) ${sweep * 100}%, transparent ${sweep * 100 + 18}%)`}} />
      </div>
      <div style={{display: 'flex', flexDirection: 'column', lineHeight: 1}}>
        <div style={{overflow: 'hidden'}}>
          <div style={{font: '800 168px Montserrat', letterSpacing: '-0.04em', color: '#fff', transform: `translateY(${(1 - word) * 105}%)`}}>PedeAi</div>
        </div>
        <div style={{font: '700 30px DM Sans', textTransform: 'uppercase', letterSpacing: `${0.9 - tag * 0.5}em`, color: '#ffb3b9', opacity: tag, marginTop: 12, paddingLeft: 6}}>Delivery</div>
      </div>
    </div>
  );
};
const S7: React.FC<{variant: 'cliente' | 'loja'}> = ({variant}) => {
  const f = useCurrentFrame();
  const away = lerp(f, [0, 24], [0, 1], IN);
  const L = 15; // instante da marca (batida 41 da trilha)
  const beams = lerp(f, [L - 12, L + 6], [0.4, 1.6], OUT);
  const converge = lerp(f, [0, L], [0, 1], IN);
  const lines = variant === 'cliente'
    ? [{t: 'Peça sem baixar aplicativo.', s: 56, c: '#fff'}, {t: 'Estreia 25/11 no Vale do Araguaia.', s: 40, c: '#ff9aa2'}]
    : [{t: 'Seu cardápio online.', s: 56, c: '#fff'}, {t: 'Pedido pronto no seu WhatsApp.', s: 44, c: '#fff'}, {t: 'Sem comissão.', s: 44, c: '#ff9aa2'}];
  return (
    <AbsoluteFill>
      <Stage beam={beams} floor={1.3} sway={(1 - converge) * -60} />
      <Dust amount={1.4} />
      <AbsoluteFill style={{opacity: 1 - lerp(f, [12, 22], [0, 1], Easing.linear)}}>
        <Phone s={1 - away * 0.45} y={away * 520} rx={away * 38} ry={4 - away * 10} rim={GREEN} blur={away * 8}>
          <Chat full />
        </Phone>
      </AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(40% 25% at 50% 42%, ${HOT}55, transparent 70%)`, opacity: lerp(f, [L - 2, L + 4, L + 40], [0, 1, 0.45]), mixBlendMode: 'screen'}} />
      {f >= L && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 620, display: 'flex', justifyContent: 'center'}}>
          <Logo f={f - L} />
        </div>
      )}
      <Streak y={725} o={lerp(f, [L - 1, L + 2, L + 26], [0, 1, 0], Easing.linear)} />
      {lines.map((l, i) => {
        const at = L + 40 + i * 7, o = lerp(f, [at, at + 12], [0, 1]);
        return <div key={i} style={{position: 'absolute', left: 60, right: 60, top: 930 + i * 78, textAlign: 'center', font: `900 ${l.s}px/1.1 Montserrat`, letterSpacing: '-0.03em', textTransform: 'uppercase', color: l.c, opacity: o, transform: `translateY(${(1 - o) * 24}px)`, filter: `blur(${(1 - o) * 6}px)`}}>{l.t}</div>;
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: 930 + lines.length * 78 + 34, display: 'flex', justifyContent: 'center', opacity: lerp(f, [L + 62, L + 74], [0, 1])}}>
        <div style={{padding: '14px 34px', borderRadius: 99, border: '2px solid rgba(255,255,255,.35)', font: '700 38px DM Sans', color: '#fff', letterSpacing: '0.01em'}}>pedeaionline.com.br</div>
      </div>
    </AbsoluteFill>
  );
};

/* ================================== MONTAGEM ================================== */
export const SCENES = [210, 225, 105, 90, 135, 105, 135]; // cada corte cai numa batida da trilha (15 quadros)
export const TOTAL = SCENES.reduce((a, b) => a + b, 0);
const AT = (i: number) => SCENES.slice(0, i).reduce((a, b) => a + b, 0);

export const Film: React.FC<{variant: 'cliente' | 'loja'; pos: any}> = ({variant, pos}) => {
  const scenes = [<S1 />, <S2 />, <S3 pos={pos} />, <S4 pos={pos} />, <S5 pos={pos} />, <S6 pos={pos} />, <S7 variant={variant} />];
  const s = AT;
  return (
    <AbsoluteFill style={{background: INK}}>
      <style>{fontFaces}</style>
      {scenes.map((el, i) => <Sequence key={i} from={AT(i)} durationInFrames={SCENES[i]} premountFor={15}>{el}</Sequence>)}
      <Grain />
      {/* desenho de som */}
      <Sfx at={0} s="impacto" v={0.7} />
      <Sfx at={0} s="chiado" v={0.35} />
      <Sfx at={30} s="chiado" v={0.3} />
      <Sfx at={60} s="whoosh-grave" v={0.4} />
      <Sfx at={90} s="chiado" v={0.3} />
      <Sfx at={105} s="whoosh" v={0.35} />
      <Sfx at={150} s="impacto" v={0.55} />
      <Sfx at={198} s="whoosh" v={0.55} />
      <Sfx at={s(1) + 2} s="whoosh-grave" v={0.45} />
      {[44, 104, 170, 208].map((t) => <Sfx key={'t' + t} at={s(1) + t} s="toque" v={0.6} />)}
      <Sfx at={s(1) + 48} s="whoosh" v={0.3} />
      <Sfx at={s(1) + 70} s="whoosh" v={0.18} />
      <Sfx at={s(1) + 110} s="whoosh" v={0.25} />
      <Sfx at={s(1) + 132} s="whoosh" v={0.2} />
      <Sfx at={s(1) + 176} s="whoosh" v={0.2} />
      <Sfx at={s(1) + 210} s="whoosh-grave" v={0.55} />
      <Sfx at={s(2) + 22} s="whoosh" v={0.4} />
      <Sfx at={s(2) + 66} s="whoosh" v={0.35} />
      <Sfx at={s(3) + 24} s="adicionado" v={0.6} />
      <Sfx at={s(3) + 40} s="adicionado" v={0.6} />
      <Sfx at={s(3) + 56} s="adicionado" v={0.6} />
      <Sfx at={s(3) + 80} s="toque" v={0.6} />
      <Sfx at={s(4) + 26} s="toque" v={0.6} />
      {[44, 54, 64, 74].map(t => <Sfx key={t} at={s(4) + t} s="toque" v={0.25} />)}
      <Sfx at={s(4) + 88} s="toque" v={0.6} />
      <Sfx at={s(4) + 106} s="toque" v={0.6} />
      <Sfx at={s(5) + 4} s="toque" v={0.7} />
      <Sfx at={s(5) + 8} s="whoosh" v={0.6} />
      <Sfx at={s(5) + 18} s="mensagem" v={0.7} />
      <Sfx at={s(6) - 45} s="subida" v={0.4} />
      <Sfx at={s(6) + 15} s="impacto" v={0.6} />
      <Sfx at={s(6) + 16} s="assinatura" v={0.4} />
      <Audio src={staticFile('sfx/trilha.wav')} volume={0.55} />
    </AbsoluteFill>
  );
};
