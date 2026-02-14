import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import type { AppNode, AppEdge } from './types';
import { saveProject, loadProject, getActiveProjectId } from '../utils/storage';
import { generateId } from '../utils/idGenerator';

// --- History helpers ---

type Snapshot = { nodes: AppNode[]; edges: AppEdge[] };

const MAX_HISTORY = 50;

function takeSnapshot(state: FlowState): Snapshot {
  return {
    nodes: structuredClone(state.nodes),
    edges: structuredClone(state.edges),
  };
}

// --- Store type ---

type FlowState = {
  projectId: string;
  projectName: string;

  nodes: AppNode[];
  edges: AppEdge[];

  // History
  past: Snapshot[];
  future: Snapshot[];

  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  addNode: (node: AppNode) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  setProjectName: (name: string) => void;

  // Undo / redo
  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Alignment
  alignSelected: (axis: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom') => void;
  distributeSelected: (axis: 'horizontal' | 'vertical') => void;

  saveCurrentProject: () => void;
  loadProjectById: (id: string) => void;
  loadFromTemplate: (nodes: AppNode[], edges: AppEdge[], name: string) => void;
  newProject: () => void;
  exportProject: () => string;
  importProject: (json: string) => void;
  loadLastProject: () => void;
};

export const useFlowStore = create<FlowState>()((set, get) => ({
  projectId: generateId(),
  projectName: 'Untitled Project',
  nodes: [],
  edges: [],

  past: [],
  future: [],

  // ---- React Flow callbacks ----

  onNodesChange: (changes) => {
    // Push snapshot for significant changes (add, remove, position done)
    const significant = changes.some(
      (c) =>
        c.type === 'remove' ||
        c.type === 'add' ||
        (c.type === 'position' && c.dragging === false)
    );
    if (significant) {
      get().pushSnapshot();
    }
    set({ nodes: applyNodeChanges(changes, get().nodes) as AppNode[] });
  },

  onEdgesChange: (changes) => {
    const significant = changes.some(
      (c) => c.type === 'remove' || c.type === 'add'
    );
    if (significant) {
      get().pushSnapshot();
    }
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    get().pushSnapshot();
    set({
      edges: addEdge(
        { ...connection, type: 'dataFlow', animated: true },
        get().edges
      ),
    });
  },

  addNode: (node) => {
    get().pushSnapshot();
    set({ nodes: [...get().nodes, node] });
  },

  updateNodeData: (nodeId, data) => {
    get().pushSnapshot();
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ) as AppNode[],
    });
  },

  setProjectName: (name) => set({ projectName: name }),

  // ---- History ----

  pushSnapshot: () => {
    const state = get();
    const snapshot = takeSnapshot(state);
    const past = [...state.past, snapshot];
    if (past.length > MAX_HISTORY) past.shift();
    set({ past, future: [] });
  },

  undo: () => {
    const { past, nodes, edges } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    set({
      past: newPast,
      future: [{ nodes: structuredClone(nodes), edges: structuredClone(edges) }, ...get().future],
      nodes: previous.nodes,
      edges: previous.edges,
    });
  },

  redo: () => {
    const { future, nodes, edges } = get();
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    set({
      past: [...get().past, { nodes: structuredClone(nodes), edges: structuredClone(edges) }],
      future: newFuture,
      nodes: next.nodes,
      edges: next.edges,
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  // ---- Alignment ----

  alignSelected: (axis) => {
    const { nodes } = get();
    const selected = nodes.filter((n) => n.selected);
    if (selected.length < 2) return;

    get().pushSnapshot();

    let target: number;
    switch (axis) {
      case 'left':
        target = Math.min(...selected.map((n) => n.position.x));
        break;
      case 'right':
        target = Math.max(...selected.map((n) => n.position.x));
        break;
      case 'center-x': {
        const avg = selected.reduce((s, n) => s + n.position.x, 0) / selected.length;
        target = avg;
        break;
      }
      case 'top':
        target = Math.min(...selected.map((n) => n.position.y));
        break;
      case 'bottom':
        target = Math.max(...selected.map((n) => n.position.y));
        break;
      case 'center-y': {
        const avg = selected.reduce((s, n) => s + n.position.y, 0) / selected.length;
        target = avg;
        break;
      }
    }

    const selectedIds = new Set(selected.map((n) => n.id));
    const isX = axis === 'left' || axis === 'center-x' || axis === 'right';

    set({
      nodes: nodes.map((n) => {
        if (!selectedIds.has(n.id)) return n;
        return {
          ...n,
          position: {
            x: isX ? target : n.position.x,
            y: isX ? n.position.y : target,
          },
        };
      }) as AppNode[],
    });
  },

  distributeSelected: (axis) => {
    const { nodes } = get();
    const selected = nodes.filter((n) => n.selected);
    if (selected.length < 3) return;

    get().pushSnapshot();

    const isX = axis === 'horizontal';
    const sorted = [...selected].sort((a, b) =>
      isX ? a.position.x - b.position.x : a.position.y - b.position.y
    );

    const first = isX ? sorted[0].position.x : sorted[0].position.y;
    const last = isX
      ? sorted[sorted.length - 1].position.x
      : sorted[sorted.length - 1].position.y;
    const step = (last - first) / (sorted.length - 1);

    const posMap = new Map<string, number>();
    sorted.forEach((n, i) => posMap.set(n.id, first + step * i));

    const selectedIds = new Set(selected.map((n) => n.id));
    set({
      nodes: nodes.map((n) => {
        if (!selectedIds.has(n.id)) return n;
        const v = posMap.get(n.id) ?? (isX ? n.position.x : n.position.y);
        return {
          ...n,
          position: {
            x: isX ? v : n.position.x,
            y: isX ? n.position.y : v,
          },
        };
      }) as AppNode[],
    });
  },

  // ---- Project management ----

  saveCurrentProject: () => {
    const { projectId, projectName, nodes, edges } = get();
    const now = new Date().toISOString();
    saveProject({
      id: projectId,
      name: projectName,
      nodes,
      edges,
      createdAt: now,
      updatedAt: now,
    });
  },

  loadProjectById: (id) => {
    const project = loadProject(id);
    if (project) {
      set({
        projectId: project.id,
        projectName: project.name,
        nodes: project.nodes,
        edges: project.edges,
        past: [],
        future: [],
      });
    }
  },

  loadFromTemplate: (nodes, edges, name) => {
    set({
      projectId: generateId(),
      projectName: name,
      nodes,
      edges,
      past: [],
      future: [],
    });
  },

  newProject: () => {
    set({
      projectId: generateId(),
      projectName: 'Untitled Project',
      nodes: [],
      edges: [],
      past: [],
      future: [],
    });
  },

  exportProject: () => {
    const { projectId, projectName, nodes, edges } = get();
    return JSON.stringify(
      { id: projectId, name: projectName, nodes, edges },
      null,
      2
    );
  },

  importProject: (json) => {
    const data = JSON.parse(json);
    set({
      projectId: data.id || generateId(),
      projectName: data.name || 'Imported Project',
      nodes: data.nodes || [],
      edges: data.edges || [],
      past: [],
      future: [],
    });
  },

  loadLastProject: () => {
    const activeId = getActiveProjectId();
    if (activeId) {
      get().loadProjectById(activeId);
    }
  },
}));

// Auto-save with debounce
let saveTimeout: ReturnType<typeof setTimeout>;
useFlowStore.subscribe((state, prevState) => {
  if (
    state.nodes !== prevState.nodes ||
    state.edges !== prevState.edges ||
    state.projectName !== prevState.projectName
  ) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      useFlowStore.getState().saveCurrentProject();
    }, 1000);
  }
});
