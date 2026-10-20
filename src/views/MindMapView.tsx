import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  GitBranch,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Sparkles,
  RefreshCw,
  Printer,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface MindNodeProps {
  node: any;
  depth: number;
}

const MindNodeComponent: React.FC<MindNodeProps> = ({ node, depth }) => {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const nodeColorClass =
    depth === 0
      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-sm shadow-[0_0_20px_rgba(239,68,68,0.7)] border-2 border-red-400'
      : depth === 1
      ? 'bg-[#141422] text-zinc-100 font-bold text-xs border border-red-800/60 shadow-[0_0_10px_rgba(220,38,38,0.2)]'
      : 'bg-[#0a0a14] text-zinc-300 font-medium text-[11px] border border-zinc-800';

  return (
    <div className="flex flex-col items-start gap-2">
      <div
        onClick={() => hasChildren && setCollapsed(!collapsed)}
        className={`px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-2 select-none hover:scale-102 ${nodeColorClass}`}
      >
        <span>{node.label}</span>
        {hasChildren && (
          <span className="text-zinc-400 hover:text-white">
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        )}
      </div>

      {hasChildren && !collapsed && (
        <div className="pl-6 border-l-2 border-red-950/60 space-y-2 mt-1 relative">
          {node.children.map((child: any, idx: number) => (
            <div key={idx} className="relative">
              {/* Connector horizontal dash */}
              <div className="absolute -left-6 top-4 w-4 h-0.5 bg-red-950/60" />
              <MindNodeComponent node={child} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const MindMapView: React.FC = () => {
  const { activeSubject, subjects, showToast, triggerConfetti } = useApp();
  const currentSubject = activeSubject || subjects[0];

  const [selectedUnit, setSelectedUnit] = useState<string>(
    currentSubject?.units[0]?.name || 'Unit 1'
  );
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [mindmapData, setMindmapData] = useState<any>(null);

  const handleGenerate = async () => {
    if (!currentSubject) return;

    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: currentSubject.id,
          subjectName: currentSubject.name,
          topicOrUnitName: selectedUnit,
        }),
      });

      if (!res.ok) {
        showToast('Unable to generate mind map.', 'error');
        return;
      }

      const data = await res.json();
      setMindmapData(data.mindmap?.root);
      showToast('Visual Mind Map generated!', 'success');
      triggerConfetti();
    } catch (err) {
      console.error(err);
      showToast('Failed to generate mind map.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentSubject) {
      handleGenerate();
    }
  }, [selectedUnit]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-heavy border border-red-950/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-red-400">
            <GitBranch className="w-4 h-4 text-red-500" />
            <span>VISUAL HIERARCHY CANVAS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">AI Mind Map Generator</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Convert units and complex concept relationships into an interactive visual hierarchy.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
            className="p-2 rounded-xl bg-[#12121c] border border-zinc-800 text-zinc-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
            className="p-2 rounded-xl bg-[#12121c] border border-zinc-800 text-zinc-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-2 rounded-xl bg-[#12121c] border border-zinc-800 text-zinc-300 hover:text-white"
            title="Reset Zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl bg-[#12121c] border border-zinc-800 text-zinc-300 hover:text-white"
            title="Print Map"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-red-glow flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white uppercase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* Unit Selector */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-[#090910] border border-red-950/40">
        <label className="text-xs font-semibold text-zinc-400">Select Focus Module:</label>
        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="bg-[#0f0f18] border border-red-950/60 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
        >
          {currentSubject?.units.map((u) => (
            <option key={u.id} value={u.name}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* Canvas Area */}
      <div className="min-h-[500px] p-8 sm:p-12 rounded-2xl bg-[#07070c] border border-red-950/50 shadow-2xl overflow-auto relative flex items-center justify-center">
        {loading ? (
          <div className="text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-red-500 mx-auto" />
            <div className="text-sm font-bold text-white">Mapping Visual Hierarchy...</div>
          </div>
        ) : mindmapData ? (
          <div
            className="transition-transform duration-200 origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <MindNodeComponent node={mindmapData} depth={0} />
          </div>
        ) : null}
      </div>
    </div>
  );
};
