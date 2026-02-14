'use client';

import { useState, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Node,
  Edge,
  NodeProps,
  Handle,
  Position,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

/* ── Custom Node (matches admin styling exactly) ── */
function OrgNode({ data }: NodeProps) {
  return (
    <div
      className={`rounded-lg px-5 py-3 text-sm text-white shadow-lg border ${
        data.isRoot
          ? 'bg-teal-700 border-teal-500 text-base font-bold'
          : 'bg-zinc-800 border-zinc-700'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-none !w-0 !h-0" />
      {data.label}
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-none !w-0 !h-0" />
    </div>
  );
}

const nodeTypes = { org: OrgNode };

const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { stroke: '#14b8a6', strokeWidth: 2 },
  markerEnd: { type: 'arrowclosed' as const },
};

/* ── Main Component ── */
export default function StructureTab() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStructure = async () => {
      try {
        const res = await fetch(`${API_URL}/org-structure/?page=3`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (data.length > 0) {
          const record = data[0];
          const chartData = record.chart_data;
          if (chartData?.nodes) {
            setNodes(
              chartData.nodes.map((n: any) => ({
                ...n,
                type: n.type || 'org',
                draggable: true,
                selectable: false,
                connectable: false,
              }))
            );
          }
          if (chartData?.edges) {
            setEdges(
              chartData.edges.map((e: any) => ({
                ...e,
                ...defaultEdgeOptions,
              }))
            );
          }
          setTitle(record.title || '');
          setDescription(record.description || '');
        }
      } catch (err) {
        console.error('Failed to fetch org structure:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStructure();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-500">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Ачаалж байна...</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="py-24 text-center text-gray-500">
        <p className="text-sm">Бүтцийн мэдээлэл байхгүй</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      {/* Title & Description from DB */}
      {(title || description) && (
        <div className="text-center max-w-3xl mx-auto mb-4">
          {title && (
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{title}</h2>
          )}
          {description && (
            <p className="text-gray-600 text-lg leading-relaxed">{description}</p>
          )}
        </div>
      )}

      {/* ReactFlow Chart - same as admin */}
      <div className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white" style={{ height: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={true}
          zoomOnScroll={true}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
          proOptions={{ hideAttribution: true }}
          style={{ background: '#ffffff' }}
        >
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(n) => (n.data?.isRoot ? '#0d9488' : '#3f3f46')}
            maskColor="rgba(255,255,255,0.7)"
            style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
