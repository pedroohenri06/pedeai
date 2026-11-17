import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Easing} from 'remotion';
import {
  RED, HOT, GREEN, CSS, PW, CREAM, WA, PCX, PCY, cl, OUT, IO, IN, shot, lerp, fontFaces,
  Sfx, Dust, Stage, Headline, Phone, Screen, Cam, Tap, Streak, Chat, SpeedLines, S7, ScrollPage, flow,
} from './Film';
import fpos from '../public/shots/flow/pos.json';
import T from './tempos-parceiros.json';

/* =====================================================================================
   PedeAi · Filme para parceiros (restaurantes e lojas) — 1080×1920, 30 qps, guiado pela narração
   A narração (ElevenLabs, voz enviada pelo dono do projeto) foi editada: pausas encurtadas para o ritmo de
   um narrador contínuo e a frase repetida do 3º trecho cortada (public/voz/narracao-parceiros.wav).
   tempos-parceiros.json traz o quadro exato de cada palavra-chave: as cenas começam e as animações
   acontecem nessas palavras. A copy da tela acompanha a fala; números e promessas vêm da página /planos.
   ===================================================================================== */

const pl = (n: string) => staticFile('shots/planos/' + n);
const brl = (v: number, dec = 0) => 'R$ ' + v.toFixed(dec).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// início de cada cena (quadros globais), a partir das marcas da narração
const HIT = T.pedeAi;                                       // a marca bate no "pede aí"
const START = [0, T.conta - 8, T.sem - 6, T.B0 - 12, T.C0 - 12, T.D0 - 12, HIT - 45, T.end];
export const P_SCENES = START.slice(1).map((v, i) => v - START[i]);
export const P_TOTAL = T.end;
const r = (mark: number, i: number) => mark - START[i];    // marca relativa à cena i

/* 01 · Gancho: a sua venda (anel completo) e a fatia de 12% que sai com a comissão dos aplicativos.
   Vale para qualquer negócio de comida: nenhum produto específico na tela. */
const P1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const D = P_SCENES[0];
  const whip = lerp(f, [D - 10, D], [0, 1], IN);
  const R = 290, SW_ = 92, CX = 540, CY = 1060, C = 2 * Math.PI * R;
  const draw = lerp(f, [8, 44], [0, 1], Easing.bezier(0.65, 0, 0.35, 1));
  const cut = spring({frame: f - 74, fps, config: {damping: 14, stiffness: 90}});   // a fatia se solta na pergunta
  const keep = 0.88;
  const mid = (keep + 1) / 2 * 2 * Math.PI - Math.PI / 2;                              // ângulo do meio da fatia (topo = -90°)
  const out = cut * 150;
  const lab = spring({frame: f - 84, fps, config: {damping: 200}, durationInFrames: 14});
  return (
    <AbsoluteFill>
      <Stage beam={lerp(f, [0, 20], [0.3, 1])} />
      <Dust />
      <AbsoluteFill style={{transform: `translateY(${-whip * 1500}px)`, filter: `blur(${whip * 18}px)`}}>
        <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="14" /></filter>
          </defs>
          {/* sua venda: 88% que deveria ficar com você */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={SW_} />
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f9f5ef" strokeWidth={SW_} strokeDasharray={`${C * keep * draw} ${C}`} transform={`rotate(-90 ${CX} ${CY})`} />
          {/* a fatia da comissão: desenha junto e depois sai */}
          <g transform={`translate(${Math.cos(mid) * out} ${Math.sin(mid) * out})`} opacity={1 - cut * 0.15}>
            <circle cx={CX} cy={CY} r={R} fill="none" stroke={HOT} strokeWidth={SW_} filter="url(#glow)" opacity={0.6 * Math.min(1, cut * 2)} strokeDasharray={`${C * (1 - keep) * (draw > 0.98 ? 1 : 0)} ${C}`} transform={`rotate(${-90 + 360 * keep} ${CX} ${CY})`} />
            <circle cx={CX} cy={CY} r={R} fill="none" stroke={HOT} strokeWidth={SW_} strokeDasharray={`${C * (1 - keep) * lerp(f, [40, 50], [0, 1])} ${C}`} transform={`rotate(${-90 + 360 * keep} ${CX} ${CY})`} />
          </g>
        </svg>
        {/* centro do anel */}
        <div style={{position: 'absolute', left: CX - 230, width: 460, top: CY - 90, textAlign: 'center', opacity: lerp(f, [20, 34], [0, 1])}}>
          <div style={{font: '700 30px DM Sans', letterSpacing: '0.3em', color: '#ffb3b9', textTransform: 'uppercase', paddingLeft: '0.3em'}}>Sua venda</div>
          <div style={{font: '900 120px/1.05 Montserrat', letterSpacing: '-0.05em', color: '#fff'}}>{Math.round(interpolate(cut, [0, 1], [100, 88]))}%</div>
          <div style={{font: '600 26px DM Sans', color: 'rgba(255,255,255,.6)', opacity: lab}}>é o que sobra para você</div>
        </div>
        {/* etiqueta da fatia */}
        <div style={{position: 'absolute', left: CX + Math.cos(mid) * (R + out + 40) - 40, top: CY + Math.sin(mid) * (R + out + 40) - 150, opacity: lab, transform: `translateY(${(1 - lab) * 20}px)`}}>
          <div style={{font: '900 72px/1 Montserrat', letterSpacing: '-0.04em', color: HOT, textShadow: `0 0 40px ${RED}`}}>−12%</div>
          <div style={{font: '700 28px DM Sans', color: '#fff'}}>comissão dos aplicativos</div>
        </div>
        <Headline kicker="Para quem vende no delivery" lines={[{t: 'Quanto do seu delivery'}, {t: 'fica com os aplicativos?', c: HOT}]} at={10} y={230} size={64} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#000', opacity: lerp(f, [0, 4], [1, 0])}} />
    </AbsoluteFill>
  );
};

/* 02 · A conta: R$ 5.000 por mês (cálculo da página: comissão de 12% + mensalidade de R$ 100) */
const Row: React.FC<{y: number; at: number; label: string; sub: string; value: number; dec?: number; color: string; strike?: number; pre?: string; unit?: string}> =
  ({y, at, label, sub, value, dec = 0, color, strike = 0, pre, unit = 'por mês'}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = spring({frame: f - at, fps, config: {damping: 200}, durationInFrames: 16});
  const n = interpolate(f, [at + 4, at + 30], [0, value], {...cl, easing: Easing.out(Easing.cubic)});
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: y, height: 160, borderRadius: 30, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
      opacity: k, transform: `translateY(${(1 - k) * 40}px)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px'}}>
      <div>
        <div style={{font: '800 40px Montserrat', color, letterSpacing: '-0.02em'}}>{label}</div>
        <div style={{font: '500 26px DM Sans', color: 'rgba(255,255,255,.62)', marginTop: 6}}>{sub}</div>
      </div>
      <div style={{position: 'relative', textAlign: 'right'}}>
        {pre && <div style={{font: '600 22px DM Sans', color: 'rgba(255,255,255,.6)'}}>{pre}</div>}
        <div style={{font: '900 62px Montserrat', color: '#fff', letterSpacing: '-0.03em'}}>{brl(n, dec)}</div>
        <div style={{font: '600 22px DM Sans', color: 'rgba(255,255,255,.6)'}}>{unit}</div>
        {strike > 0 && <div style={{position: 'absolute', left: -10, top: pre ? 62 : 36, height: 7, width: `${strike * 108}%`, background: HOT, borderRadius: 4, boxShadow: `0 0 18px ${HOT}`, transform: 'rotate(-6deg)'}} />}
      </div>
    </div>
  );
};
const P2: React.FC = () => {
  const f = useCurrentFrame();
  const i = 1;
  return (
    <AbsoluteFill>
      <Stage />
      <Dust />
      <Headline kicker="Faça a conta" lines={[{t: 'Vendendo'}, {t: 'R$ 5.000 por mês', c: HOT}]} at={r(T.conta, i)} y={230} size={92} />
      <Row y={640} at={r(T.centenas, i) - 6} label="Aplicativos comuns" sub="Comissão de 12% + mensalidade" value={700} color="#fff" strike={lerp(f, [r(T.noPedeai, i) + 8, r(T.noPedeai, i) + 18], [0, 1])} />
      <Row y={830} at={r(T.noPedeai, i)} label="PedeAi" sub="Só a mensalidade · comissão 0%" value={39.9} dec={2} pre="a partir de" color={HOT} />
      <div style={{position: 'absolute', left: 90, right: 90, top: 1030, textAlign: 'center', font: '500 22px/1.4 DM Sans', color: 'rgba(255,255,255,.5)', opacity: lerp(f, [r(T.noPedeai, i) + 20, r(T.noPedeai, i) + 32], [0, 1])}}>
        Cálculo ilustrativo: R$ 5.000 de vendas por mês, comissão de 12% (R$ 600) e mensalidade de R$ 100 nos aplicativos comuns.
      </div>
    </AbsoluteFill>
  );
};

/* 03 · 0%: sem comissão sobre suas vendas · mais dinheiro no caixa · mais controle do negócio */
const P3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const i = 2;
  const at0 = r(T.sem, i);
  const k = spring({frame: f - at0, fps, config: {damping: 13, stiffness: 120}});
  const line = (at: number) => spring({frame: f - at, fps, config: {damping: 200}, durationInFrames: 14});
  const items: [string, number, string, number][] = [
    ['de comissão sobre', 64, '#fff', at0 + 10], ['as suas vendas.', 64, '#fff', at0 + 14],
    ['Mais dinheiro no seu caixa.', 48, HOT, r(T.maisDinheiro, i)], ['Mais controle do seu negócio.', 48, 'rgba(255,255,255,.9)', r(T.maisControle, i)],
  ];
  return (
    <AbsoluteFill>
      <Stage beam={lerp(f, [at0, at0 + 10], [0.6, 1.4])} />
      <SpeedLines o={0.7} />
      <Dust />
      <div style={{position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', font: '900 500px/1 Montserrat', letterSpacing: '-0.06em', color: HOT,
        textShadow: `0 0 120px ${RED}aa`, transform: `scale(${interpolate(k, [0, 1], [1.7, 1])})`, filter: `blur(${(1 - Math.min(1, k)) * 20}px)`, opacity: Math.min(1, k * 1.5)}}>0%</div>
      <Streak y={500} o={lerp(f, [at0, at0 + 3, at0 + 24], [0, 1, 0], Easing.linear)} />
      {items.map(([t, size, color, at], j) => {
        const s = line(at);
        return (
          <div key={j} style={{position: 'absolute', left: 0, right: 0, top: 780 + j * 86 + (j >= 2 ? 50 : 0), textAlign: 'center', overflow: 'hidden', paddingBottom: 6}}>
            <div style={{font: `900 ${size}px/1.08 Montserrat`, letterSpacing: '-0.035em', textTransform: 'uppercase', color, transform: `translateY(${(1 - s) * 110}%)`}}>{t}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* 04 · Como funciona, navegando rápido pela plataforma real: categorias → toque em Hambúrguer → a página rola até a
   Dantes → o cartão da loja se expande e vira a página dela → rola até os lanches → escolhe, monta e envia →
   o pedido chega pronto no WhatsApp. */
const P4: React.FC<{pos: any}> = ({pos}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const i = 3;
  const enter = spring({frame: f - 2, fps, config: {damping: 18, stiffness: 60, mass: 1.1}});
  // navegação até a loja
  const tapH = 40, au0 = 46, au1 = 68, tapD = 82, ex0 = 88, ex1 = 104;
  const sy = f < tapH + 2 ? fpos.scrollCats : lerp(f, [au0, au1], [fpos.scrollCats, fpos.scrollHamb], IO);
  const syN = f < tapH + 2 ? fpos.scrollCats : lerp(f + 1, [au0, au1], [fpos.scrollCats, fpos.scrollHamb], IO);
  const dY = fpos.dantes.y + fpos.dantes.h / 2 + (fpos.scrollDantes - fpos.scrollHamb);
  const press = lerp(f, [tapD - 3, tapD, tapD + 6], [1, 0.965, 1], Easing.linear);
  const ex = lerp(f, [ex0, ex1], [0, 1], Easing.bezier(0.3, 0, 0.1, 1));
  // dentro da loja: rola até os lanches antes do "escolhe"
  const sc0 = Math.max(ex1 + 14, r(T.semBaixar, i) + 4), sc1 = r(T.escolhe, i) - 8;
  const scroll = lerp(f, [sc0, sc1], [0, 3928], IO);
  const v = Math.abs(lerp(f + 1, [sc0, sc1], [0, 3928], IO) - scroll);
  const taps = [{id: 'maromba', at: r(T.escolhe, i) + 4}, {id: 'tropical', at: r(T.produtos, i) + 6}, {id: 'old-school', at: r(T.monta, i) + 4}];
  const send = r(T.envia, i) + 2;
  let src = 'store_menu.png';
  taps.forEach((t) => { if (f >= t.at + 1) src = 'store_menu_' + t.id + '.png'; });
  const W0 = r(T.chega, i) - 6;
  const whip = lerp(f, [W0, W0 + 12], [0, 1], IO);
  const trail = Math.sin(whip * Math.PI);
  const push = lerp(f, [W0 + 14, P_SCENES[i]], [1.0, 1.1], IO);
  const fy = lerp(f, [W0 + 12, W0 + 36], [368, 300], IO);
  const wa = f > W0 + 6;
  const pill = spring({frame: f - r(T.semBaixar, i), fps, config: {damping: 14, stiffness: 140}});
  const store = (
    <>
      {f < sc1 + 4 ? (
        <>
          <Img src={shot('store_tall.jpg')} style={{position: 'absolute', left: 0, top: -scroll * CSS, width: PW}} />
          {v > 8 && [1, 2, 3].map((j) => <Img key={j} src={shot('store_tall.jpg')} style={{position: 'absolute', left: 0, top: -scroll * CSS + j * v * 0.35, width: PW, opacity: 0.16}} />)}
        </>
      ) : <Screen src={shot(src)} />}
    </>
  );
  // retângulo do cartão da Dantes (css da página) → tela inteira
  const cx0 = fpos.dantes.x, cy0 = dY - fpos.dantes.h / 2, cw = fpos.dantes.w, ch = fpos.dantes.h;
  const clip = `inset(${cy0 * CSS * (1 - ex)}px ${(390 - cx0 - cw) * CSS * (1 - ex)}px ${(790 - cy0 - ch) * CSS * (1 - ex)}px ${cx0 * CSS * (1 - ex)}px round ${18 * CSS * (1 - ex) + 2}px)`;
  return (
    <AbsoluteFill>
      <Stage hue={wa ? '#1f9e57' : RED} />
      <Dust tint={wa ? '140,255,190' : '255,120,110'} />
      <Cam s={push} fx={195} fy={fy}>
        <Phone y={interpolate(enter, [0, 1], [1300, 0])} rx={interpolate(enter, [0, 1], [20, 0])} ry={lerp(f, [W0, W0 + 12, P_SCENES[i]], [0, 8, 3], IO)} rim={wa ? GREEN : RED}
          glare={lerp(f, [10, 50], [-0.3, 1.4], IO)} bar={wa ? WA : CREAM} darkBar={wa}>
          {f < W0 + 12 && [0, 1, 2, 3].map((k) => (k && f < sc1 + 4 ? null : (
            <div key={k} style={{position: 'absolute', inset: 0, transform: `translateX(${-whip * PW * 1.1 + k * trail * 50}px)`, opacity: k ? 0.2 : 1}}>
              {k === 0 && f < ex1 && (
                f < tapH + 2
                  ? <ScrollPage tall="home_tall.jpg" y={sy} />
                  : <ScrollPage tall="hamb_tall.jpg" y={sy} y0={fpos.hambTall.y0} v={Math.abs(syN - sy) * CSS} header="hamb.png" />
              )}
              {k === 0 && f >= tapD - 3 && f < ex0 && (
                <div style={{position: 'absolute', left: cx0 * CSS, top: cy0 * CSS, width: cw * CSS, height: ch * CSS, overflow: 'hidden', borderRadius: 18 * CSS, transform: `scale(${press})`, boxShadow: '0 0 0 3px rgba(229,27,43,.35)'}}>
                  <Img src={flow('hamb_tall.jpg')} style={{position: 'absolute', width: PW, left: -cx0 * CSS, top: -(cy0 + fpos.scrollHamb - fpos.hambTall.y0) * CSS}} />
                </div>
              )}
              {f >= ex0 && <AbsoluteFill style={{clipPath: clip, background: '#f8f5ee'}}>{store}</AbsoluteFill>}
            </div>
          )))}
          {f >= W0 && [0, 1, 2, 3].map((k) => (
            <div key={'c' + k} style={{position: 'absolute', inset: 0, transform: `translateX(${(1 - whip) * PW * 1.1 - k * trail * 50}px)`, opacity: k ? 0.2 : 1}}>
              <Chat start={W0 + 14} />
            </div>
          ))}
          <Tap x={fpos.hamb.x + fpos.hamb.w / 2} y={fpos.hamb.y + fpos.hamb.h / 2 - 12} at={tapH} />
          <Tap x={fpos.dantes.x + fpos.dantes.w / 2} y={dY} at={tapD} />
          {taps.map((t) => <Tap key={t.id} x={pos['add_' + t.id].x} y={pos['add_' + t.id].y} at={t.at} />)}
          {taps.map((t) => f >= t.at && f < t.at + 20 ? (
            <div key={'p' + t.id} style={{position: 'absolute', left: pos['add_' + t.id].x * CSS - 120, top: pos['add_' + t.id].y * CSS - 40 - lerp(f, [t.at, t.at + 20], [0, 60]), padding: '8px 16px', borderRadius: 99, background: HOT, color: '#fff', font: '800 26px Montserrat', opacity: lerp(f, [t.at, t.at + 4, t.at + 14, t.at + 20], [0, 1, 1, 0])}}>+ adicionado</div>
          ) : null)}
          <Tap x={pos.cartBar.x} y={pos.cartBar.y} at={send} />
        </Phone>
      </Cam>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,2,3,.95) 0%, rgba(10,2,3,.82) 20%, transparent 29%)'}} />
      <Headline kicker="Como funciona" lines={[{t: 'Seu cliente acessa'}, {t: 'pelo link.', c: HOT}]} at={r(T.B0, i)} out={r(T.escolhe, i) - 14} y={230} size={84} />
      <Headline kicker="Como funciona" lines={[{t: 'Escolhe, monta'}, {t: 'e envia.', c: HOT}]} at={r(T.escolhe, i) - 2} out={W0} y={230} size={84} />
      <Headline kicker="Sem comissão no meio" lines={[{t: 'O pedido chega'}, {t: 'no seu WhatsApp.', c: GREEN}]} at={W0 + 14} y={230} size={84} />
      {f >= r(T.semBaixar, i) && f < r(T.escolhe, i) && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1700, display: 'flex', justifyContent: 'center', opacity: Math.min(1, pill * 1.5) * lerp(f, [r(T.escolhe, i) - 10, r(T.escolhe, i)], [1, 0])}}>
          <div style={{padding: '16px 34px', borderRadius: 99, background: '#fff', color: RED, font: '800 34px Montserrat', transform: `scale(${interpolate(pill, [0, 1], [0.7, 1])})`, boxShadow: `0 20px 60px -10px ${RED}`}}>Sem baixar aplicativo</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* 05 · Marketing: pode contar com a gente — tráfego pago, influenciadores regionais, +350 lojas */
const P5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const i = 4;
  const rows = [
    {t: 'Tráfego pago', d: 'Time especializado em campanhas pagas na região.', at: r(T.temos, i)},
    {t: 'Influenciadores regionais', d: 'Parcerias que levam a cidade inteira para o PedeAi.', at: r(T.influ, i) - 4},
  ];
  const mais = spring({frame: f - (r(T.consumidores, i) - 40), fps, config: {damping: 200}, durationInFrames: 16});
  const stats = [{v: 350, pre: '+', l: 'lojas na plataforma', at: r(T.lojas350, i) - 10}, {v: 10, pre: '', l: 'cidades do Vale do Araguaia', at: r(T.lojas350, i) + 12}];
  return (
    <AbsoluteFill>
      <Stage />
      <SpeedLines o={0.4 + 0.4 * mais} />
      <Dust />
      <Headline kicker="Marketing a seu favor" lines={[{t: 'Pode contar'}, {t: 'com a gente.', c: HOT}]} at={r(T.C0, i)} out={r(T.nos, i) - 10} y={230} size={104} />
      <Headline kicker="Pode contar com a gente" lines={[{t: 'Nós levamos'}, {t: 'os clientes'}, {t: 'até você.', c: HOT}]} at={r(T.nos, i) - 2} y={230} size={96} />
      {rows.map((row, j) => {
        const k = spring({frame: f - row.at, fps, config: {damping: 200}, durationInFrames: 16});
        return (
          <div key={j} style={{position: 'absolute', left: 84, right: 70, top: 640 + j * 170, opacity: k, transform: `translateX(${(1 - k) * -60}px)`, display: 'flex', gap: 26, alignItems: 'flex-start'}}>
            <div style={{width: 10, height: 120, borderRadius: 5, background: HOT, boxShadow: `0 0 20px ${HOT}`, transform: `scaleY(${k})`, transformOrigin: 'top'}} />
            <div>
              <div style={{font: '900 58px/1.05 Montserrat', letterSpacing: '-0.035em', color: '#fff', textTransform: 'uppercase'}}>{row.t}</div>
              <div style={{font: '500 30px/1.35 DM Sans', color: 'rgba(255,255,255,.72)', marginTop: 8}}>{row.d}</div>
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 84, right: 70, top: 990, font: '800 40px/1.2 Montserrat', letterSpacing: '-0.02em', color: '#ffb3b9', opacity: mais, transform: `translateY(${(1 - mais) * 20}px)`}}>
        Cada vez mais clientes na plataforma, todos os dias.
      </div>
      <div style={{position: 'absolute', left: 84, right: 70, top: 1100, display: 'flex', gap: 60}}>
        {stats.map((st, j) => {
          const k = spring({frame: f - st.at, fps, config: {damping: 200}, durationInFrames: 16});
          const n = Math.round(interpolate(f, [st.at, st.at + 26], [0, st.v], {...cl, easing: Easing.out(Easing.cubic)}));
          return (
            <div key={j} style={{opacity: k, transform: `translateY(${(1 - k) * 30}px)`}}>
              <div style={{font: '900 120px/1 Montserrat', letterSpacing: '-0.05em', color: HOT, textShadow: `0 0 50px ${RED}77`}}>{st.pre}{n}</div>
              <div style={{font: '600 28px DM Sans', color: '#fff', marginTop: 6, maxWidth: 360}}>{st.l}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* 06 · A oferta: Black Friday já valendo → planos a partir de R$ 39,90 → garantias → atenção: só até 30/11 */
const P6: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const i = 5;
  const enter = spring({frame: f - 2, fps, config: {damping: 18, stiffness: 60, mass: 1.1}});
  const PL = r(T.planos, i), GA = r(T.garantia, i), NA = r(T.noAr, i), AT = r(T.atencao, i), A30 = r(T.ate30, i);
  const lift = (j: number) => lerp(f, [PL - 4 + j * 5, PL + 24 + j * 5], [0, 1], OUT);
  const away = lerp(f, [GA - 16, GA], [0, 1], IO);
  const fan = [{dx: -300, dy: 40, r: -9, z: 1}, {dx: 300, dy: 40, r: 9, z: 1}, {dx: 0, dy: -60, r: 0, z: 2}];
  const order = [0, 2, 1];
  const W = 338 * CSS;
  const checks: [string, number][] = [['7 dias de garantia: não gostou, devolvemos 100%', GA], ['Loja no ar no mesmo dia', NA], ['Zero comissão e zero taxa de plataforma', NA + 14], ['Preço garantido até o fim do plano', NA + 28], ['Premium: só 5 vagas por cidade', NA + 42]];
  const urg = spring({frame: f - A30, fps, config: {damping: 11, stiffness: 140}});
  const pulse = f > A30 + 16 ? 1 + Math.sin((f - A30) / 5) * 0.025 : 1;
  return (
    <AbsoluteFill>
      <Stage />
      <Dust />
      <AbsoluteFill style={{opacity: 1 - away * 0.85, filter: `blur(${away * 10}px)`, transform: `scale(${1 - away * 0.12})`}}>
        <Phone y={interpolate(enter, [0, 1], [1300, 40])} rx={interpolate(enter, [0, 1], [20, 0])} glare={lerp(f, [8, 44], [-0.3, 1.4], IO)} dim={lerp(f, [PL, PL + 24], [0, 0.55])} blur={lerp(f, [PL, PL + 24], [0, 4])}>
          <Screen src={pl('planos.png')} />
        </Phone>
        {[0, 1, 2].map((j) => {
          const l = lift(j), fp = fan[order[j]];
          if (l <= 0) return null;
          return (
            <div key={j} style={{position: 'absolute', left: PCX - W / 2, top: PCY - 380, width: W, zIndex: fp.z, borderRadius: 16, overflow: 'hidden',
              transform: `translate(${fp.dx * l}px, ${fp.dy * l - 160 * l}px) rotate(${fp.r * l}deg) scale(${0.72 + l * 0.2})`, opacity: Math.min(1, l * 2),
              boxShadow: `0 ${40 * l}px ${90 * l}px -20px rgba(0,0,0,.9), 0 0 ${60 * l}px -10px ${RED}`}}>
              <Img src={pl('card_' + j + '.png')} style={{width: '100%', display: 'block'}} />
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,2,3,.95) 0%, rgba(10,2,3,.8) 20%, transparent 30%)'}} />
      <Headline kicker="Já está valendo" lines={[{t: 'Black Friday'}, {t: 'para parceiros.', c: HOT}]} at={r(T.D0, i)} out={PL - 6} y={230} size={100} />
      <Headline kicker="Black Friday para parceiros" lines={[{t: 'Planos a partir de'}, {t: 'R$ 39,90/mês.', c: HOT}]} at={PL} out={GA - 16} y={230} size={86} />
      <Headline kicker="Oferta de lançamento" lines={[{t: 'Sem comissão.'}, {t: 'Sem risco.', c: HOT}]} at={GA - 14} out={AT - 4} y={230} size={104} />
      <Headline kicker="Mas atenção" lines={[{t: 'Condição especial'}, {t: 'só até 30/11.', c: HOT}]} at={AT} y={230} size={90} />
      {checks.map(([c, at], j) => {
        const k = spring({frame: f - at, fps, config: {damping: 14, stiffness: 140}});
        return (
          <div key={j} style={{position: 'absolute', left: 84, right: 60, top: 600 + j * 112, display: 'flex', alignItems: 'center', gap: 26, opacity: Math.min(1, k * 1.5), transform: `translateX(${(1 - Math.min(1, k)) * -50}px)`}}>
            <div style={{flex: '0 0 62px', height: 62, borderRadius: 31, background: HOT, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${k})`, boxShadow: `0 0 24px ${RED}`}}>
              <svg width="34" height="34" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div style={{font: '700 38px/1.2 DM Sans', color: '#fff'}}>{c}</div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1196, display: 'flex', justifyContent: 'center', opacity: Math.min(1, urg * 1.5)}}>
        <div style={{padding: '20px 40px', borderRadius: 99, background: RED, font: '800 36px Montserrat', color: '#fff', letterSpacing: '-0.01em', transform: `scale(${interpolate(urg, [0, 1], [0.6, 1]) * pulse})`, boxShadow: `0 20px 60px -10px ${RED}`}}>
          Até 36% OFF no anual · até 30/11
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ================================== MONTAGEM ================================== */
const dbToGain = (db: number) => Math.pow(10, db / 20);

export const Parceiros: React.FC<{pos: any}> = ({pos}) => {
  const scenes = [<P1 />, <P2 />, <P3 />, <P4 pos={pos} />, <P5 />, <P6 />, <S7 variant="parceiro" adiant={22} screen={<Screen src={pl('plano_1.png')} />} />];
  const s = (i: number) => START[i];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <style>{fontFaces}</style>
      {scenes.map((el, i) => <Sequence key={i} from={START[i]} durationInFrames={P_SCENES[i]} premountFor={15}>{el}</Sequence>)}
      <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity: 0.12}}><Img src={staticFile('grain/g0.png')} style={{width: 1080, height: 1920}} /></AbsoluteFill>
      {/* narração editada + trilha com ducking (−9 dB nas pausas, −19 dB sob a voz) + efeitos nos eventos da imagem */}
      <Audio src={staticFile('voz/narracao-parceiros.wav')} volume={1} />
      <Audio src={staticFile('sfx/trilha-parceiros.wav')} volume={(fr) => dbToGain(T.duck[Math.min(T.duck.length - 1, Math.max(0, fr))] + 3)} />
      <Sfx at={0} s="impacto" v={0.35} />
      <Sfx at={8} s="whoosh" v={0.25} />
      <Sfx at={74} s="whoosh-grave" v={0.35} />
      <Sfx at={76} s="impacto" v={0.3} />
      <Sfx at={s(1) - 10} s="whoosh" v={0.35} />
      <Sfx at={T.centenas - 6} s="adicionado" v={0.3} />
      <Sfx at={T.noPedeai + 8} s="whoosh" v={0.22} />
      <Sfx at={T.noPedeai} s="adicionado" v={0.3} />
      <Sfx at={T.sem - 2} s="impacto" v={0.4} />
      <Sfx at={T.maisDinheiro} s="toque" v={0.2} />
      <Sfx at={T.maisControle} s="toque" v={0.2} />
      <Sfx at={s(3) + 2} s="whoosh-grave" v={0.3} />
      <Sfx at={s(3) + 40} s="toque" v={0.35} />
      <Sfx at={s(3) + 46} s="whoosh" v={0.18} />
      <Sfx at={s(3) + 82} s="toque" v={0.35} />
      <Sfx at={s(3) + 88} s="whoosh" v={0.25} />
      <Sfx at={T.semBaixar + 20} s="whoosh" v={0.2} />
      <Sfx at={T.escolhe + 4} s="adicionado" v={0.35} />
      <Sfx at={T.produtos + 6} s="adicionado" v={0.35} />
      <Sfx at={T.monta + 4} s="adicionado" v={0.35} />
      <Sfx at={T.envia + 2} s="toque" v={0.4} />
      <Sfx at={T.chega - 6} s="whoosh" v={0.4} />
      <Sfx at={T.chega + 8} s="mensagem" v={0.45} />
      <Sfx at={s(4) + 2} s="whoosh-grave" v={0.3} />
      <Sfx at={T.temos} s="whoosh" v={0.2} />
      <Sfx at={T.influ - 4} s="whoosh" v={0.2} />
      <Sfx at={T.lojas350 - 10} s="toque" v={0.3} />
      <Sfx at={s(5) + 2} s="whoosh-grave" v={0.3} />
      <Sfx at={T.planos - 4} s="whoosh" v={0.35} />
      <Sfx at={T.garantia} s="adicionado" v={0.3} />
      <Sfx at={T.noAr} s="adicionado" v={0.3} />
      <Sfx at={T.ate30} s="impacto" v={0.35} />
      {/* encerramento (mesma construção do filme dos clientes): a marca bate no "pede aí" */}
      <Sfx at={s(6) + 6} s="whoosh-grave" v={0.3} />
      <Sfx at={HIT - 60} s="subida" v={0.3} />
      <Sfx at={HIT} s="impacto" v={0.5} />
      <Sfx at={HIT + 1} s="assinatura" v={0.35} />
    </AbsoluteFill>
  );
};
