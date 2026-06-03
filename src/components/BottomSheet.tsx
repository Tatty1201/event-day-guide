"use client";
import React, { useRef, useState, useEffect, useCallback, useLayoutEffect } from "react";

type Props = {
  open: boolean;
  onClose?: () => void;
  snaps?: number[];
  initial?: number;
  children: React.ReactNode;
  dimEnabled?: boolean;
};

export default function BottomSheet({
  open, onClose, snaps = [0.45, 0.88], initial = 0, children, dimEnabled = false,
}: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; ty: number; moved: boolean } | null>(null);
  const [H, setH] = useState(700);
  const [ty, setTy] = useState(99999);
  const [anim, setAnim] = useState(true);
  const maxSnap = snaps[snaps.length - 1];

  useLayoutEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    const measure = () => setH(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tyForSnap = useCallback(
    (i: number) => (maxSnap - snaps[i]) * H,
    [maxSnap, snaps, H]
  );

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => { setAnim(true); setTy(tyForSnap(initial)); });
    } else {
      setAnim(true);
      setTy(maxSnap * H + 80);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, H]);

  const startDrag = (e: React.PointerEvent) => {
    drag.current = { y: e.clientY, ty, moved: false };
    setAnim(false);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  };
  const moveDrag = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    const dy = e.clientY - d.y;
    if (Math.abs(dy) > 3) d.moved = true;
    setTy(Math.max(-20, d.ty + dy));
  };
  const endDrag = () => {
    const d = drag.current; drag.current = null;
    setAnim(true);
    if (!d) return;
    const closeThreshold = tyForSnap(0) + Math.min(140, 0.16 * H);
    if (ty > closeThreshold) { onClose?.(); return; }
    let best = 0, bestDist = Infinity;
    snaps.forEach((_, i) => {
      const dist = Math.abs(ty - tyForSnap(i));
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    setTy(tyForSnap(best));
  };

  const sheetH = maxSnap * H;
  const closeFromBackdrop = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target === layerRef.current) onClose?.();
  };

  return (
    <div
      ref={layerRef}
      className={"sheet-layer" + (open ? " open" : "")}
      onPointerDown={closeFromBackdrop}
    >
      {dimEnabled && (
        <div className="sheet-dim" style={{ opacity: open ? 1 : 0 }} onClick={onClose} />
      )}
      <div
        className={"bottom-sheet" + (anim ? " anim" : "")}
        style={{ height: sheetH, transform: `translateY(${ty}px)` }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          className="sheet-grab"
          onPointerDown={startDrag} onPointerMove={moveDrag}
          onPointerUp={endDrag} onPointerCancel={endDrag}
        >
          <span className="grab-bar" />
        </div>
        <div className="sheet-scroll">{children}</div>
      </div>
    </div>
  );
}
