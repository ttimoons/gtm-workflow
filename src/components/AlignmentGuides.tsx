import { useStore, type ReactFlowState } from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import { useFlowStore } from '../store/useFlowStore';

const GUIDE_THRESHOLD = 5; // px distance in flow coords to trigger a guide
const GUIDE_COLOR = '#6366f1';
const GUIDE_EXTEND = 40; // extend guide lines past nodes

type GuideLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export function AlignmentGuides() {
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const nodeLookup = useStore((s: ReactFlowState) => s.nodeLookup);
  const transform = useStore((s: ReactFlowState) => s.transform);
  const guidesRef = useRef(guides);
  guidesRef.current = guides;

  useEffect(() => {
    const unsub = useFlowStore.subscribe((state, prev) => {
      if (state.nodes === prev.nodes) return;

      const allNodes = state.nodes;
      const dragging = allNodes.filter((n) => n.dragging);
      if (dragging.length === 0) {
        if (guidesRef.current.length > 0) setGuides([]);
        return;
      }

      const stationary = allNodes.filter((n) => !n.dragging && !n.selected);
      if (stationary.length === 0) {
        if (guidesRef.current.length > 0) setGuides([]);
        return;
      }

      const newGuides: GuideLine[] = [];

      for (const dragNode of dragging) {
        const dInt = nodeLookup.get(dragNode.id);
        const dw = dInt?.measured?.width ?? 220;
        const dh = dInt?.measured?.height ?? 80;
        const dLeft = dragNode.position.x;
        const dRight = dLeft + dw;
        const dCenterX = dLeft + dw / 2;
        const dTop = dragNode.position.y;
        const dBottom = dTop + dh;
        const dCenterY = dTop + dh / 2;
        const dHandleY = dTop + 20;

        for (const sNode of stationary) {
          const sInt = nodeLookup.get(sNode.id);
          const sw = sInt?.measured?.width ?? 220;
          const sh = sInt?.measured?.height ?? 80;
          const sLeft = sNode.position.x;
          const sRight = sLeft + sw;
          const sCenterX = sLeft + sw / 2;
          const sTop = sNode.position.y;
          const sBottom = sTop + sh;
          const sCenterY = sTop + sh / 2;
          const sHandleY = sTop + 20;

          // --- Horizontal guides (same Y values) ---
          const hChecks = [
            { d: dTop, s: sTop },
            { d: dBottom, s: sBottom },
            { d: dCenterY, s: sCenterY },
            { d: dHandleY, s: sHandleY },
          ];
          for (const { d, s } of hChecks) {
            if (Math.abs(d - s) < GUIDE_THRESHOLD) {
              const minX = Math.min(dLeft, sLeft) - GUIDE_EXTEND;
              const maxX = Math.max(dRight, sRight) + GUIDE_EXTEND;
              newGuides.push({ x1: minX, y1: s, x2: maxX, y2: s });
            }
          }

          // --- Vertical guides (same X values) ---
          const vChecks = [
            { d: dLeft, s: sLeft },
            { d: dRight, s: sRight },
            { d: dCenterX, s: sCenterX },
            { d: dLeft, s: sRight },
            { d: dRight, s: sLeft },
          ];
          for (const { d, s } of vChecks) {
            if (Math.abs(d - s) < GUIDE_THRESHOLD) {
              const minY = Math.min(dTop, sTop) - GUIDE_EXTEND;
              const maxY = Math.max(dBottom, sBottom) + GUIDE_EXTEND;
              newGuides.push({ x1: s, y1: minY, x2: s, y2: maxY });
            }
          }
        }
      }

      // Deduplicate close guides
      const deduped = newGuides.filter((g, i) => {
        for (let j = 0; j < i; j++) {
          const o = newGuides[j];
          if (
            Math.abs(g.x1 - o.x1) < 2 &&
            Math.abs(g.y1 - o.y1) < 2 &&
            Math.abs(g.x2 - o.x2) < 2 &&
            Math.abs(g.y2 - o.y2) < 2
          ) return false;
        }
        return true;
      });

      setGuides(deduped);
    });
    return unsub;
  }, [nodeLookup]);

  if (guides.length === 0) return null;

  const [tx, ty, tScale] = transform;

  return (
    <svg
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 5,
        overflow: 'visible',
      }}
    >
      <g transform={`translate(${tx},${ty}) scale(${tScale})`}>
        {guides.map((g, i) => (
          <line
            key={i}
            x1={g.x1}
            y1={g.y1}
            x2={g.x2}
            y2={g.y2}
            stroke={GUIDE_COLOR}
            strokeWidth={1 / tScale}
            strokeDasharray={`${4 / tScale} ${3 / tScale}`}
            opacity={0.7}
          />
        ))}
      </g>
    </svg>
  );
}
