import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Easing} from 'remotion';
import {
  RED, HOT, GREEN, CSS, PW, CREAM, WA, PCX, PCY, SB, cl, OUT, IO, IN, shot, lerp, fontFaces,
  Sfx, Grain, Dust, Stage, Headline, Phone, Screen, Cam, Tap, Streak, Chat, SpeedLines, S7,
} from './Film';

/* =====================================================================================
   PedeAi · Filme para parceiros (restaurantes) — 1080×1920, 30 qps, 39 s
   Mesma linguagem do filme dos clientes (palco escuro, luz vermelha, iPhone realista, Montserrat 900,
   etapas e a tela virando a marca), com outra função: vender o plano. Todos os números e promessas vêm
   da página /planos: o cálculo "Faça a conta", zero comissão e zero taxa, marketing com tráfego pago e
   influenciadores regionais, +350 lojas, 10 cidades, preços de Black Friday, garantia de 7 dias,
   loja no ar no mesmo dia, preço garantido e Premium com 5 vagas por cidade.
   ===================================================================================== */

const pl = (n: string) => staticFile('shots/planos/' + n);
const brl = (v: number, dec = 0) => 'R$ ' + v.toFixed(dec).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/* 01 · Gancho: o restaurante faz o lanche — e quanto fica com ele? (filmagem original, sem efeitos) */
const P1: React.FC = () => {
  const f = useCurrentFrame();
  const whip = lerp(f, [168, 180], [0, 1], IN);
  const full: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, objectFit: 'cover', filter: 'contrast(1.06) saturate(1.04)'};
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `translateY(${-whip * 1500}px)`, filter: `blur(${whip * 18}px)`}}>
        <AbsoluteFill style={{transform: `scale(${1 + 0.05 * lerp(f, [150, 180], [0, 1], IO)})`, transformOrigin: '560px 990px'}}>
          <Sequence durationInFrames={156} layout="none">
            <OffthreadVideo src={staticFile('motim/original.mp4')} muted style={full} />
          </Sequence>
          {f >= 154 && <Img src={staticFile('motim/ultimo-quadro.png')} style={full} />}
        </AbsoluteFill>
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.55) 24%, transparent 38%)', opacity: lerp(f, [90, 102], [0, 1])}} />
        <Headline kicker="Para quem vende no delivery" lines={[{t: 'O produto é seu.'}, {t: 'E o lucro?', c: HOT}]} at={98} y={230} size={92} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#000', opacity: lerp(f, [0, 3], [1, 0])}} />
    </AbsoluteFill>
  );
};

/* 02 · A conta (números e premissas da própria página de planos) */
const Row: React.FC<{y: number; at: number; label: string; sub: string; value: number; dec?: number; color: string; strike?: number; o?: number; pre?: string; unit?: string}> =
  ({y, at, label, sub, value, dec = 0, color, strike = 0, o = 1, pre, unit = 'por ano'}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = spring({frame: f - at, fps, config: {damping: 200}, durationInFrames: 16});
  const n = interpolate(f, [at + 6, at + 34], [0, value], {...cl, easing: Easing.out(Easing.cubic)});
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: y, height: 150, borderRadius: 30, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
      opacity: k * o, transform: `translateY(${(1 - k) * 40}px)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px'}}>
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
  const {fps} = useVideoConfig();
  const out = lerp(f, [318, 334], [1, 0], IN);
  const big = spring({frame: f - 336, fps, config: {damping: 15, stiffness: 110}});
  const save = interpolate(f, [338, 376], [0, 12241], {...cl, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      <Stage />
      <Dust />
      <Headline kicker="Faça a conta" lines={[{t: 'Quanto custa vender'}, {t: 'no delivery?', c: HOT}]} at={4} out={318} y={230} size={72} />
      <div style={{position: 'absolute', left: 74, top: 560, font: '700 36px DM Sans', color: '#ffb3b9', opacity: lerp(f, [24, 36], [0, 1]) * out}}>Vendendo R$ 8.000 por mês:</div>
      <Row y={640} at={50} label="Aplicativos comuns" sub="Comissão de 12% + mensalidade" value={1060} unit="por mês" color="#fff" strike={lerp(f, [196, 208], [0, 1])} o={out} />
      <Row y={820} at={222} label="PedeAi" sub="Comissão 0% + plano fixo" value={39.9} dec={2} pre="a partir de" unit="por mês" color={HOT} o={out} />
      {/* economia */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 600, textAlign: 'center', opacity: Math.min(1, big * 1.4), transform: `scale(${interpolate(big, [0, 1], [1.25, 1])})`}}>
        <div style={{font: '700 38px DM Sans', color: '#ffb3b9'}}>Com o PedeAi, você deixa de pagar</div>
        <div style={{font: '900 170px/1.05 Montserrat', letterSpacing: '-0.05em', color: HOT, textShadow: `0 0 70px ${RED}88`, marginTop: 10}}>{brl(save)}</div>
        <div style={{font: '900 70px Montserrat', letterSpacing: '-0.03em', color: '#fff', textTransform: 'uppercase'}}>por ano.</div>
      </div>
      <Streak y={760} o={lerp(f, [336, 339, 358], [0, 1, 0], Easing.linear)} />
      <div style={{position: 'absolute', left: 90, right: 90, top: 1060, textAlign: 'center', font: '500 22px/1.4 DM Sans', color: 'rgba(255,255,255,.5)', opacity: lerp(f, [350, 362], [0, 1])}}>
        Cálculo ilustrativo: R$ 8.000 de vendas por mês, comissão de 12% e mensalidade de R$ 100 nos aplicativos comuns; no PedeAi, plano Essencial anual.
      </div>
    </AbsoluteFill>
  );
};

/* 03 · 0% */
const P3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = spring({frame: f - 4, fps, config: {damping: 13, stiffness: 120}});
  const line = (at: number) => spring({frame: f - at, fps, config: {damping: 200}, durationInFrames: 14});
  const items: [string, number, string, number][] = [['de comissão.', 84, '#fff', 20], ['Zero taxa de plataforma.', 50, 'rgba(255,255,255,.85)', 34], ['100% da venda é sua.', 50, HOT, 46]];
  return (
    <AbsoluteFill>
      <Stage beam={lerp(f, [0, 10], [0.6, 1.4])} />
      <SpeedLines o={0.7} />
      <Dust />
      <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', font: '900 520px/1 Montserrat', letterSpacing: '-0.06em', color: HOT,
        textShadow: `0 0 120px ${RED}aa`, transform: `scale(${interpolate(k, [0, 1], [1.7, 1])})`, filter: `blur(${(1 - Math.min(1, k)) * 20}px)`, opacity: Math.min(1, k * 1.5)}}>0%</div>
      <Streak y={560} o={lerp(f, [4, 7, 28], [0, 1, 0], Easing.linear)} />
      {items.map(([t, size, color, at], i) => {
        const s = line(at);
        return (
          <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 860 + i * 104 + (i ? 28 : 0), textAlign: 'center', overflow: 'hidden', paddingBottom: 6}}>
            <div style={{font: `900 ${size}px/1.05 Montserrat`, letterSpacing: '-0.035em', textTransform: 'uppercase', color, transform: `translateY(${(1 - s) * 110}%)`}}>{t}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* 04 · Como funciona: o cliente escolhe no seu cardápio, o pedido cai pronto no seu WhatsApp */
const P4: React.FC<{pos: any}> = ({pos}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame: f - 2, fps, config: {damping: 18, stiffness: 60, mass: 1.1}});
  const taps = [{id: 'maromba', at: 40}, {id: 'tropical', at: 62}, {id: 'old-school', at: 84}];
  let src = 'store_menu.png';
  taps.forEach((t) => { if (f >= t.at + 1) src = 'store_menu_' + t.id + '.png'; });
  const whip = lerp(f, [120, 132], [0, 1], IO);
  const trail = Math.sin(whip * Math.PI);
  const push = lerp(f, [136, 236], [1.0, 1.12], IO);
  const fy = lerp(f, [132, 156], [368, 300], IO);
  const wa = f > 126;
  return (
    <AbsoluteFill>
      <Stage hue={wa ? '#1f9e57' : RED} />
      <Dust tint={wa ? '140,255,190' : '255,120,110'} />
      <Cam s={push} fx={195} fy={fy}>
        <Phone y={interpolate(enter, [0, 1], [1300, 0])} rx={interpolate(enter, [0, 1], [20, 0])} ry={lerp(f, [120, 132, 236], [0, 8, 3], IO)} rim={wa ? GREEN : RED}
          glare={lerp(f, [10, 50], [-0.3, 1.4], IO)} bar={wa ? WA : CREAM} darkBar={wa}>
          {f < 132 && [0, 1, 2, 3].map((i) => (
            <div key={i} style={{position: 'absolute', inset: 0, transform: `translateX(${-whip * PW * 1.1 + i * trail * 50}px)`, opacity: i ? 0.2 : 1}}>
              <Screen src={shot(src)} />
            </div>
          ))}
          {f >= 120 && [0, 1, 2, 3].map((i) => (
            <div key={'c' + i} style={{position: 'absolute', inset: 0, transform: `translateX(${(1 - whip) * PW * 1.1 - i * trail * 50}px)`, opacity: i ? 0.2 : 1}}>
              <Chat start={134} />
            </div>
          ))}
          {taps.map((t) => <Tap key={t.id} x={pos['add_' + t.id].x} y={pos['add_' + t.id].y} at={t.at} />)}
          {taps.map((t) => f >= t.at && f < t.at + 20 ? (
            <div key={'p' + t.id} style={{position: 'absolute', left: pos['add_' + t.id].x * CSS - 120, top: pos['add_' + t.id].y * CSS - 40 - lerp(f, [t.at, t.at + 20], [0, 60]), padding: '8px 16px', borderRadius: 99, background: HOT, color: '#fff', font: '800 26px Montserrat', opacity: lerp(f, [t.at, t.at + 4, t.at + 14, t.at + 20], [0, 1, 1, 0])}}>+ adicionado</div>
          ) : null)}
        </Phone>
      </Cam>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,2,3,.95) 0%, rgba(10,2,3,.82) 20%, transparent 29%)'}} />
      <Headline kicker="Como funciona" lines={[{t: 'O cliente escolhe'}, {t: 'no seu cardápio.', c: HOT}]} at={8} out={120} y={230} size={84} />
      <Headline kicker="Sem comissão no meio" lines={[{t: 'O pedido cai pronto'}, {t: 'no seu WhatsApp.', c: GREEN}]} at={134} y={230} size={80} />
    </AbsoluteFill>
  );
};

/* 05 · Marketing a seu favor */
const P5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rows = [
    {t: 'Tráfego pago', d: 'Nossos gestores de tráfego enchem a plataforma de clientes.', at: 70},
    {t: 'Influenciadores regionais', d: 'Campanhas que levam a cidade inteira para o PedeAi.', at: 112},
  ];
  const stats = [{v: 350, pre: '+', l: 'lojas no PedeAi', at: 160}, {v: 10, pre: '', l: 'cidades do Vale do Araguaia', at: 176}];
  return (
    <AbsoluteFill>
      <Stage />
      <SpeedLines o={0.55} />
      <Dust />
      <Headline kicker="Marketing a seu favor" lines={[{t: 'Nós levamos'}, {t: 'os clientes'}, {t: 'até você.', c: HOT}]} at={4} y={230} size={96} />
      {rows.map((r, i) => {
        const k = spring({frame: f - r.at, fps, config: {damping: 200}, durationInFrames: 16});
        return (
          <div key={i} style={{position: 'absolute', left: 84, right: 70, top: 640 + i * 170, opacity: k, transform: `translateX(${(1 - k) * -60}px)`, display: 'flex', gap: 26, alignItems: 'flex-start'}}>
            <div style={{width: 10, height: 120, borderRadius: 5, background: HOT, boxShadow: `0 0 20px ${HOT}`, transform: `scaleY(${k})`, transformOrigin: 'top'}} />
            <div>
              <div style={{font: '900 58px/1.05 Montserrat', letterSpacing: '-0.035em', color: '#fff', textTransform: 'uppercase'}}>{r.t}</div>
              <div style={{font: '500 30px/1.35 DM Sans', color: 'rgba(255,255,255,.72)', marginTop: 8}}>{r.d}</div>
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 84, right: 70, top: 1000, display: 'flex', gap: 60}}>
        {stats.map((s, i) => {
          const k = spring({frame: f - s.at, fps, config: {damping: 200}, durationInFrames: 16});
          const n = Math.round(interpolate(f, [s.at, s.at + 26], [0, s.v], {...cl, easing: Easing.out(Easing.cubic)}));
          return (
            <div key={i} style={{opacity: k, transform: `translateY(${(1 - k) * 30}px)`}}>
              <div style={{font: '900 120px/1 Montserrat', letterSpacing: '-0.05em', color: HOT, textShadow: `0 0 50px ${RED}77`}}>{s.pre}{n}</div>
              <div style={{font: '600 28px DM Sans', color: '#fff', marginTop: 6, maxWidth: 360}}>{s.l}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* 06 · A oferta: página real de planos, os três planos saltam da tela, depois a lista de garantias */
const P6: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame: f - 2, fps, config: {damping: 18, stiffness: 60, mass: 1.1}});
  const lift = (i: number) => lerp(f, [30 + i * 5, 58 + i * 5], [0, 1], OUT);
  const away = lerp(f, [150, 168], [0, 1], IO);
  const fan = [{dx: -300, dy: 40, r: -9, z: 1}, {dx: 300, dy: 40, r: 9, z: 1}, {dx: 0, dy: -60, r: 0, z: 2}]; // Essencial, Premium, Destaque (na frente)
  const order = [0, 2, 1]; // índice do cartão → posição no leque
  const W = 338 * CSS;
  const checks = ['Zero comissão e zero taxa de plataforma', 'Cardápio montado pela nossa equipe, loja no ar no mesmo dia', 'Garantia de 7 dias: não gostou, devolvemos 100%', 'Preço garantido até o fim do plano', 'Premium: só 5 vagas por cidade'];
  const chip = spring({frame: f - 280, fps, config: {damping: 13, stiffness: 120}});
  return (
    <AbsoluteFill>
      <Stage />
      <Dust />
      <AbsoluteFill style={{opacity: 1 - away * 0.85, filter: `blur(${away * 10}px)`, transform: `scale(${1 - away * 0.12})`}}>
        <Phone y={interpolate(enter, [0, 1], [1300, 40])} rx={interpolate(enter, [0, 1], [20, 0])} glare={lerp(f, [8, 44], [-0.3, 1.4], IO)} dim={lerp(f, [30, 58], [0, 0.55])} blur={lerp(f, [30, 58], [0, 4])}>
          <Screen src={pl('planos.png')} />
        </Phone>
        {[0, 1, 2].map((i) => {
          const l = lift(i), fp = fan[order[i]];
          if (l <= 0) return null;
          return (
            <div key={i} style={{position: 'absolute', left: PCX - W / 2, top: PCY - 380, width: W, zIndex: fp.z, borderRadius: 26 * CSS / 1.6, overflow: 'hidden',
              transform: `translate(${fp.dx * l}px, ${fp.dy * l - 160 * l}px) rotate(${fp.r * l}deg) scale(${0.72 + l * 0.2})`, opacity: Math.min(1, l * 2),
              boxShadow: `0 ${40 * l}px ${90 * l}px -20px rgba(0,0,0,.9), 0 0 ${60 * l}px -10px ${RED}`}}>
              <Img src={pl('card_' + i + '.png')} style={{width: '100%', display: 'block'}} />
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,2,3,.95) 0%, rgba(10,2,3,.8) 20%, transparent 30%)'}} />
      <Headline kicker="Black Friday para parceiros" lines={[{t: 'Planos a partir de'}, {t: 'R$ 39,90/mês.', c: HOT}]} at={16} out={150} y={230} size={86} />
      <Headline kicker="Oferta de lançamento" lines={[{t: 'Sem comissão.'}, {t: 'Sem risco.', c: HOT}]} at={162} y={230} size={104} />
      {checks.map((c, i) => {
        const k = spring({frame: f - (176 + i * 18), fps, config: {damping: 14, stiffness: 140}});
        return (
          <div key={i} style={{position: 'absolute', left: 84, right: 60, top: 600 + i * 112, display: 'flex', alignItems: 'center', gap: 26, opacity: Math.min(1, k * 1.5), transform: `translateX(${(1 - Math.min(1, k)) * -50}px)`}}>
            <div style={{flex: '0 0 62px', height: 62, borderRadius: 31, background: HOT, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${k})`, boxShadow: `0 0 24px ${RED}`}}>
              <svg width="34" height="34" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div style={{font: '700 38px/1.2 DM Sans', color: '#fff'}}>{c}</div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1196, display: 'flex', justifyContent: 'center', opacity: Math.min(1, chip * 1.5)}}>
        <div style={{padding: '18px 38px', borderRadius: 99, background: RED, font: '800 34px Montserrat', color: '#fff', letterSpacing: '-0.01em', transform: `scale(${interpolate(chip, [0, 1], [0.7, 1])})`, boxShadow: `0 20px 60px -10px ${RED}`}}>
          Black Friday · até 36% OFF no anual · até 30/11
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ================================== MONTAGEM ================================== */
export const P_SCENES = [180, 450, 180, 240, 255, 360, 180]; // tempo para a narração; cortes na batida da trilha (15 quadros)
export const P_TOTAL = P_SCENES.reduce((a, b) => a + b, 0);
const PAT = (i: number) => P_SCENES.slice(0, i).reduce((a, b) => a + b, 0);

export const Parceiros: React.FC<{pos: any}> = ({pos}) => {
  const scenes = [<P1 />, <P2 />, <P3 />, <P4 pos={pos} />, <P5 />, <P6 />, <S7 variant="parceiro" screen={<Screen src={pl('plano_1.png')} />} />];
  const s = PAT;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <style>{fontFaces}</style>
      {scenes.map((el, i) => <Sequence key={i} from={PAT(i)} durationInFrames={P_SCENES[i]} premountFor={15}>{el}</Sequence>)}
      <Grain />
      {/* som: cada efeito nasce de um evento da imagem */}
      <Sfx at={0} s="impacto" v={0.35} />
      {[7, 11, 14, 17, 22, 28, 31, 35].map((t) => <Sfx key={'m' + t} at={t} s="toque" v={0.16} />)}
      <Sfx at={55} s="farelo" v={0.5} />
      <Sfx at={79} s="pressao" v={0.42} />
      <Sfx at={100} s="impacto" v={0.4} />
      <Sfx at={168} s="whoosh" v={0.5} />
      <Sfx at={s(1) + 56} s="adicionado" v={0.4} />
      <Sfx at={s(1) + 196} s="whoosh" v={0.3} />
      <Sfx at={s(1) + 228} s="adicionado" v={0.4} />
      <Sfx at={s(1) + 336} s="impacto" v={0.5} />
      <Sfx at={s(2) + 2} s="whoosh-grave" v={0.4} />
      <Sfx at={s(2) + 4} s="impacto" v={0.55} />
      <Sfx at={s(3) + 2} s="whoosh-grave" v={0.4} />
      {[40, 62, 84].map((t) => <Sfx key={'a' + t} at={s(3) + t} s="adicionado" v={0.5} />)}
      <Sfx at={s(3) + 120} s="whoosh" v={0.55} />
      <Sfx at={s(3) + 134} s="mensagem" v={0.6} />
      <Sfx at={s(4) + 70} s="whoosh" v={0.3} />
      <Sfx at={s(4) + 112} s="whoosh" v={0.3} />
      <Sfx at={s(4) + 160} s="toque" v={0.4} />
      <Sfx at={s(4) + 176} s="toque" v={0.4} />
      <Sfx at={s(5) + 2} s="whoosh-grave" v={0.4} />
      <Sfx at={s(5) + 30} s="whoosh" v={0.45} />
      {[0, 1, 2, 3, 4].map((i) => <Sfx key={'c' + i} at={s(5) + 176 + i * 18} s="adicionado" v={0.4} />)}
      <Sfx at={s(5) + 280} s="impacto" v={0.4} />
      {/* encerramento (mesma construção do filme dos clientes) */}
      <Sfx at={s(6) + 6} s="whoosh-grave" v={0.4} />
      <Sfx at={s(6) + 45 - 60} s="subida" v={0.4} />
      <Sfx at={s(6) + 45} s="impacto" v={0.6} />
      <Sfx at={s(6) + 46} s="assinatura" v={0.42} />
      <Sfx at={s(6) + 45 + 84} s="adicionado" v={0.35} />
      <Audio src={staticFile('sfx/trilha-parceiros.wav')} volume={0.4} />
    </AbsoluteFill>
  );
};
