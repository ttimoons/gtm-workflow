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

type FlowState = {
  projectId: string;
  projectName: string;

  nodes: AppNode[];
  edges: AppEdge[];

  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  addNode: (node: AppNode) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  setProjectName: (name: string) => void;

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

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) as AppNode[] });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(
        { ...connection, type: 'dataFlow', animated: true },
        get().edges
      ),
    });
  },

  addNode: (node) => {
    set({ nodes: [...get().nodes, node] });
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ) as AppNode[],
    });
  },

  setProjectName: (name) => set({ projectName: name }),

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
      });
    }
  },

  loadFromTemplate: (nodes, edges, name) => {
    set({
      projectId: generateId(),
      projectName: name,
      nodes,
      edges,
    });
  },

  newProject: () => {
    set({
      projectId: generateId(),
      projectName: 'Untitled Project',
      nodes: [],
      edges: [],
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
