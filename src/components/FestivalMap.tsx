"use client";
import React, {
  useRef, useState, useEffect, useImperativeHandle, forwardRef, useCallback,
} from "react";
import Icon from "./Icon";
import { catById, type Spot } from "@/data/data";

const MAP_W = 1000, MAP_H = 1400;

function MapArt() {
  const zone = (x: number, y: number, w: number, h: number, rx: number, fill: string, label: string, lx?: number, ly?: number) => (
    <g key={label + x}>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} />
      {label && <text x={lx ?? x + w / 2} y={ly ?? y + 34} className="zone-label" textAnchor="middle">{label}</text>}
    </g>
  );
  const pathRect = (x: number, y: number, w: number, h: number, rx: number) => (
    <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx={rx} fill="#efe7d6" stroke="#e0d6bf" strokeWidth="2" />
  );
  const trees: [number, number][] = [
    [120,200],[200,320],[90,480],[150,1000],[110,1180],[250,1280],
    [880,200],[930,360],[900,740],[930,1080],[870,1240],[760,1300],
    [430,120],[600,110],[480,1320],
  ];
  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} width={MAP_W} height={MAP_H} className="map-art">
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="#e4eed5" />
      <rect x="14" y="14" width={MAP_W - 28} height={MAP_H - 28} rx="36" fill="#eaf2dd" stroke="#d4e3bf" strokeWidth="3" />
      {zone(296,120,408,230,26,"#f4dde8","ステージエリア",500,158)}
      {zone(150,430,250,190,22,"#f6ead0","体験ゾーン",275,466)}
      {zone(150,636,300,280,24,"#fbe5d4","フードエリア",300,672)}
      {zone(648,350,308,280,30,"#d6e8bb","芝生ひろば",802,388)}
      {zone(372,812,320,232,30,"#efe6d2","中央広場",532,848)}
      {zone(560,1024,280,196,24,"#f7eccf","キッズ縁日",700,1060)}
      <ellipse cx="858" cy="912" rx="76" ry="54" fill="#bfe0e8" stroke="#a6d2dd" strokeWidth="3" />
      <text x="858" y="918" className="zone-label" textAnchor="middle">池</text>
      {pathRect(456,300,88,1050,44)}
      {pathRect(120,700,780,74,37)}
      {pathRect(300,880,420,66,33)}
      {pathRect(250,470,60,250,30)}
      {trees.map(([tx, ty], i) => (
        <g key={i}>
          <circle cx={tx} cy={ty + 6} r="9" fill="#7ba84e" opacity="0.35" />
          <circle cx={tx} cy={ty} r="13" fill="#86b756" />
          <circle cx={tx - 5} cy={ty - 4} r="8" fill="#9bc96a" />
        </g>
      ))}
      <Gate x={500} y={1352} label="正面ゲート" />
      <Gate x={62} y={700} label="西ゲート" vertical />
      <Gate x={938} y={700} label="東ゲート" vertical />
      <g transform="translate(905, 80)">
        <circle r="30" fill="#ffffff" stroke="#dfe3da" strokeWidth="2" />
        <path d="M0 -18 L7 4 L0 -2 L-7 4 Z" fill="#1f8a5b" />
        <text y="24" textAnchor="middle" className="compass-n">N</text>
      </g>
    </svg>
  );
}

function Gate({ x, y, label, vertical: _v }: { x: number; y: number; label: string; vertical?: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-46" y="-20" width="92" height="40" rx="20" fill="#ffffff" stroke="#d8ddd2" strokeWidth="2" />
      <text textAnchor="middle" y="6" className="gate-label">{label}</text>
    </g>
  );
}

export type FestivalMapHandle = {
  flyTo: (x: number, y: number, scale?: number) => void;
  resetView: () => void;
};

type Props = {
  spots: Spot[];
  selectedId: string | null;
  onSelect: (spot: Spot) => void;
  userLocation: { x: number; y: number; acc: number } | null;
  onMapTap?: () => void;
};

const FestivalMap = forwardRef<FestivalMapHandle, Props>(function FestivalMap(
  { spots, selectedId, onSelect, userLocation, onMapTap }, ref
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ px: number; py: number; x: number; y: number; moved: boolean } | null>(null);
  const [size, setSize] = useState({ w: 400, h: 700 });
  const [view, setView] = useState({ x: 0, y: 0, scale: 0.5 });
  const [animate, setAnimate] = useState(true);
  const didInit = useRef(false);

  const cover = Math.max(size.w / MAP_W, size.h / MAP_H);
  const minScale = Math.min(size.w / MAP_W, size.h / MAP_H) * 0.92;
  const maxScale = cover * 3.2;

  const clamp = useCallback((v: { x: number; y: number; scale: number }) => {
    const s = Math.max(minScale, Math.min(maxScale, v.scale));
    const mw = MAP_W * s, mh = MAP_H * s;
    const pad = 60;
    const minX = Math.min(pad, size.w - mw - pad);
    const maxX = Math.max(size.w - mw - pad, pad);
    const minY = Math.min(pad, size.h - mh - pad);
    const maxY = Math.max(size.h - mh - pad, pad);
    return {
      scale: s,
      x: Math.max(Math.min(v.x, maxX), minX),
      y: Math.max(Math.min(v.y, maxY), minY),
    };
  }, [minScale, maxScale, size.w, size.h]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (didInit.current || size.w < 50) return;
    didInit.current = true;
    const s = Math.max(size.w / MAP_W, size.h / MAP_H) * 1.04;
    setView(clamp({ scale: s, x: size.w / 2 - 500 * s, y: size.h / 2 - 1010 * s }));
  }, [size, clamp]);

  const flyTo = useCallback((mx: number, my: number, targetScale?: number) => {
    setView((prev) => {
      const s = targetScale ?? Math.max(prev.scale, cover * 1.5);
      return clamp({ scale: s, x: size.w / 2 - mx * s, y: size.h / 2 - my * s });
    });
    setAnimate(true);
  }, [clamp, cover, size.w, size.h]);

  useImperativeHandle(ref, () => ({
    flyTo,
    resetView: () => {
      const s = cover * 1.04;
      setView(clamp({ scale: s, x: size.w / 2 - 500 * s, y: size.h / 2 - 1010 * s }));
      setAnimate(true);
    },
  }));

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-pin]")) return;
    dragRef.current = { px: e.clientX, py: e.clientY, x: view.x, y: view.y, moved: false };
    setAnimate(false);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current; if (!d) return;
    const dx = e.clientX - d.px, dy = e.clientY - d.py;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    setView((v) => clamp({ ...v, x: d.x + dx, y: d.y + dy }));
  };
  const onPointerUp = () => {
    const d = dragRef.current; dragRef.current = null;
    setAnimate(true);
    if (d && !d.moved) onMapTap?.();
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = wrapRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    setView((v) => {
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      const ns = Math.max(minScale, Math.min(maxScale, v.scale * factor));
      const k = ns / v.scale;
      return clamp({ scale: ns, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k });
    });
    setAnimate(false);
  };

  const zoomBy = (factor: number) => {
    setView((v) => {
      const ns = Math.max(minScale, Math.min(maxScale, v.scale * factor));
      const k = ns / v.scale;
      const cx = size.w / 2, cy = size.h / 2;
      return clamp({ scale: ns, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k });
    });
    setAnimate(true);
  };

  const proj = (mx: number, my: number) => ({
    left: mx * view.scale + view.x,
    top: my * view.scale + view.y,
  });

  return (
    <div className="map-wrap" ref={wrapRef}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove}
      onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      <div
        className={"map-canvas" + (animate ? " anim" : "")}
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
      >
        <MapArt />
      </div>

      {userLocation && (() => {
        const p = proj(userLocation.x, userLocation.y);
        const r = userLocation.acc * view.scale;
        return (
          <>
            <div className="loc-acc" style={{ left: p.left, top: p.top, width: r * 2, height: r * 2 }} />
            <div className="loc-dot" style={{ left: p.left, top: p.top }} />
          </>
        );
      })()}

      {spots.map((s) => {
        const cat = catById(s.cat);
        const p = proj(s.x, s.y);
        const sel = s.id === selectedId;
        return (
          <button key={s.id} data-pin className={"pin" + (sel ? " sel" : "")}
            style={{ left: p.left, top: p.top, color: cat.color, zIndex: sel ? 40 : 20 }}
            onClick={(e) => { e.stopPropagation(); onSelect(s); }}
            aria-label={s.name}
          >
            <span className="pin-body">
              <Icon name={cat.icon} size={sel ? 19 : 16} stroke={2.2} />
            </span>
            {sel && <span className="pin-label">{s.name}</span>}
          </button>
        );
      })}

      <div className="zoom-ctl" onPointerDown={(e) => e.stopPropagation()}>
        <button onClick={() => zoomBy(1.3)} aria-label="拡大"><Icon name="plus" size={20} /></button>
        <span className="zoom-div" />
        <button onClick={() => zoomBy(0.77)} aria-label="縮小"><Icon name="minus" size={20} /></button>
      </div>
    </div>
  );
});

export default FestivalMap;
