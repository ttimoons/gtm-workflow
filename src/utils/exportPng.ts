import { toPng } from 'html-to-image';
import { getNodesBounds, getViewportForBounds } from '@xyflow/react';
import type { AppNode } from '../store/types';

const PADDING = 40;
const MIN_DIM = 100;

export async function exportCanvasAsPng(
  filename: string,
  nodes: AppNode[],
): Promise<void> {
  const viewportEl = document.querySelector<HTMLElement>('.react-flow__viewport');
  if (!viewportEl || nodes.length === 0) return;

  // Get the bounding box of all nodes in flow coordinates
  const bounds = getNodesBounds(nodes);
  if (bounds.width === 0 || bounds.height === 0) return;

  const imageWidth = Math.max(MIN_DIM, bounds.width + PADDING * 2);
  const imageHeight = Math.max(MIN_DIM, bounds.height + PADDING * 2);

  // Compute the viewport transform that fits all nodes into the image at 1:1 scale
  const viewport = getViewportForBounds(bounds, imageWidth, imageHeight, 0.5, 2, PADDING);

  // Save original transform so we can restore it
  const originalTransform = viewportEl.style.transform;

  try {
    const dataUrl = await toPng(viewportEl, {
      backgroundColor: '#f9fafb',
      width: imageWidth,
      height: imageHeight,
      pixelRatio: 2,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    });

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${filename}.png`;
    a.click();
  } finally {
    // Restore original transform
    viewportEl.style.transform = originalTransform;
  }
}
