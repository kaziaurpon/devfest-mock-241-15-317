import React, { useState, useMemo, type ChangeEvent } from 'react';

// --- Types & Interfaces ---[span_0](start_span)[span_0](end_span)[span_1](start_span)[span_1](end_span)
interface NodeData {
  id: string;
  label: string;
  type: 'room' | 'junction' | 'exit';
  x: number;
  y: number;
}

interface EdgeData {
  id: string;
  from: string;
  to: string;
  cost: number;
}

interface InitialState {
  blocked_nodes: string[];
  blocked_edges: string[];
  closed_exits: string[];
}

interface BuildingJSON {
  building: string;
  nodes: NodeData[];
  edges: EdgeData[];
  initial_state: InitialState;
}

// Explicit Return Type for Dijkstra Calculation to eliminate 'never' type bugs
interface RouteResult {
  status: 'BLOCKED_START' | 'NO_ROUTE' | 'SUCCESS';
  cost: number | null;
  path: string[];
  edgePath: string[];
}

// Default Dataset[span_2](start_span)[span_2](end_span)
const DEFAULT_BUILDING_DATA: BuildingJSON = {
  building: "East Annex - Practice Building",
  nodes: [
    { id: "R1", label: "Room 101", type: "room", x: 60, y: 65 },
    { id: "R2", label: "Room 102", type: "room", x: 60, y: 185 },
    { id: "C1", label: "Junction A", type: "junction", x: 190, y: 65 },
    { id: "C2", label: "Junction B", type: "junction", x: 325, y: 65 },
    { id: "C3", label: "Junction C", type: "junction", x: 190, y: 185 },
    { id: "C4", label: "Junction D", type: "junction", x: 325, y: 185 },
    { id: "E1", label: "North Exit", type: "exit", x: 445, y: 65 },
    { id: "E2", label: "South Exit", type: "exit", x: 445, y: 185 }
  ],
  edges: [
    { id: "L01", from: "R1", to: "C1", cost: 2 },
    { id: "L02", from: "C1", to: "C2", cost: 3 },
    { id: "L03", from: "C2", to: "E1", cost: 2 },
    { id: "L04", from: "R1", to: "R2", cost: 4 },
    { id: "L05", from: "R2", to: "C3", cost: 2 },
    { id: "L06", from: "C3", to: "C4", cost: 3 },
    { id: "L07", from: "C4", to: "E2", cost: 2 },
    { id: "L08", from: "C1", to: "C3", cost: 4 },
    { id: "L09", from: "C2", to: "C4", cost: 3 }
  ],
  initial_state: {
    blocked_nodes: [],
    blocked_edges: [],
    closed_exits: []
  }
};

// Translations Dictionary[span_3](start_span)[span_3](end_span)
const i18n = {
  en: {
    title: "Smart Escape - Evacuation Simulator",
    langToggle: "বাংলা",
    building: "Building",
    startNode: "Select Starting Location",
    hazardControls: "Hazard Controls",
    blockedNodes: "Blocked Nodes",
    blockedEdges: "Blocked Edges",
    closedExits: "Closed Exits",
    reset: "Reset Hazards",
    importJson: "Import JSON File",
    routeResult: "Evacuation Route Result",
    totalCost: "Total Cost",
    path: "Optimal Path",
    status: "Status",
    statusBlockedStart: "Starting location blocked",
    statusNoRoute: "No route available",
    statusSuccess: "Route Found",
    testCases: "Section 4.1 Sample Checks",
    runTest: "Apply Test",
    legend: "Legend",
    room: "Room",
    junction: "Junction",
    exit: "Exit"
  },
  bn: {
    title: "স্মার্ট এস্কেপ - জরুরি নির্গমন সিমুলেটর",
    langToggle: "English",
    building: "ভবন",
    startNode: "শুরুর স্থান নির্বাচন করুন",
    hazardControls: "ঝুঁকি/বাধা নিয়ন্ত্রণ (Hazards)",
    blockedNodes: "ব্লকড নোডসমূহ",
    blockedEdges: "ব্লকড করিডোরসমূহ",
    closedExits: "বন্ধ এক্সিটসমূহ",
    reset: "রিসেট করুন",
    importJson: "JSON ফাইল ইমপোর্ট করুন",
    routeResult: "নির্গমন পথের ফলাফল",
    totalCost: "মোট খরচ (Total Cost)",
    path: "সর্বোত্তম পথ (Optimal Path)",
    status: "স্ট্যাটাস",
    statusBlockedStart: "Starting location blocked",
    statusNoRoute: "No route available",
    statusSuccess: "পথ পাওয়া গেছে",
    testCases: "সেকশন ৪.১ স্যাম্পল টেস্ট",
    runTest: "টেস্ট চালান",
    legend: "সংকেত",
    room: "রুম",
    junction: "জংশন",
    exit: "এক্সিট"
  }
};

export default function App() {
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [data, setData] = useState<BuildingJSON>(DEFAULT_BUILDING_DATA);
  const [startNodeId, setStartNodeId] = useState<string>("R1");
  
  const [blockedNodes, setBlockedNodes] = useState<string[]>([]);
  const [blockedEdges, setBlockedEdges] = useState<string[]>([]);
  const [closedExits, setClosedExits] = useState<string[]>([]);

  const t = i18n[lang];

  // --- Reset Hazards ---[span_4](start_span)[span_4](end_span)
  const handleReset = () => {
    setBlockedNodes(data.initial_state.blocked_nodes || []);
    setBlockedEdges(data.initial_state.blocked_edges || []);
    setClosedExits(data.initial_state.closed_exits || []);
  };

  // --- File Import Handler ---[span_5](start_span)[span_5](end_span)
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as BuildingJSON;
        if (parsed.nodes && parsed.edges && parsed.initial_state) {
          setData(parsed);
          setBlockedNodes(parsed.initial_state.blocked_nodes || []);
          setBlockedEdges(parsed.initial_state.blocked_edges || []);
          setClosedExits(parsed.initial_state.closed_exits || []);
          const firstRoom = parsed.nodes.find(n => n.type === 'room')?.id || parsed.nodes[0]?.id;
          if (firstRoom) setStartNodeId(firstRoom);
        } else {
          alert("Invalid JSON Schema!");
        }
      } catch {
        alert("Error parsing JSON file!");
      }
    };
    reader.readAsText(file);
  };

  // --- Dijkstra Algorithm with Strict Type Guarantee ---[span_6](start_span)[span_6](end_span)
  const calculateRoute = useMemo<RouteResult>(() => {
    // 1. Check if Start Node is Blocked[span_7](start_span)[span_7](end_span)
    if (blockedNodes.includes(startNodeId)) {
      return { status: "BLOCKED_START", cost: null, path: [], edgePath: [] };
    }

    // Build Adjacency List excluding blocked nodes/edges[span_8](start_span)[span_8](end_span)
    const adj: Record<string, { to: string; cost: number; edgeId: string }[]> = {};
    data.nodes.forEach(n => { adj[n.id] = []; });

    data.edges.forEach(edge => {
      if (blockedEdges.includes(edge.id)) return;
      if (blockedNodes.includes(edge.from) || blockedNodes.includes(edge.to)) return;

      adj[edge.from].push({ to: edge.to, cost: edge.cost, edgeId: edge.id });
      adj[edge.to].push({ to: edge.from, cost: edge.cost, edgeId: edge.id });
    });

    // Valid Target Exits[span_9](start_span)[span_9](end_span)
    const validExits = new Set<string>(
      data.nodes
        .filter(n => n.type === 'exit' && !closedExits.includes(n.id) && !blockedNodes.includes(n.id))
        .map(n => n.id)
    );

    if (validExits.size === 0) {
      return { status: "NO_ROUTE", cost: null, path: [], edgePath: [] };
    }

    // Standard Dijkstra Search
    const distances: Record<string, number> = {};
    const paths: Record<string, string[][]> = {};

    data.nodes.forEach(n => { distances[n.id] = Infinity; paths[n.id] = []; });
    distances[startNodeId] = 0;
    paths[startNodeId] = [[startNodeId]];

    const queue: string[] = [startNodeId];

    while (queue.length > 0) {
      queue.sort((a, b) => distances[a] - distances[b]);
      const current = queue.shift()!;

      for (const neighbor of adj[current]) {
        const newDist = distances[current] + neighbor.cost;

        if (newDist < distances[neighbor.to]) {
          distances[neighbor.to] = newDist;
          paths[neighbor.to] = paths[current].map(p => [...p, neighbor.to]);
          if (!queue.includes(neighbor.to)) queue.push(neighbor.to);
        } else if (newDist === distances[neighbor.to]) {
          const candidatePaths = paths[current].map(p => [...p, neighbor.to]);
          paths[neighbor.to].push(...candidatePaths);
        }
      }
    }

    // Collect candidate paths[span_10](start_span)[span_10](end_span)
    interface Candidate {
      exitId: string;
      cost: number;
      path: string[];
    }

    const candidates: Candidate[] = [];

    validExits.forEach(exitId => {
      if (distances[exitId] !== Infinity) {
        paths[exitId].forEach(p => {
          candidates.push({ exitId, cost: distances[exitId], path: p });
        });
      }
    });

    if (candidates.length === 0) {
      return { status: "NO_ROUTE", cost: null, path: [], edgePath: [] };
    }

    // Sort Candidates by Tie-Breaking Rules[span_11](start_span)[span_11](end_span)
    candidates.sort((a, b) => {
      if (a.cost !== b.cost) return a.cost - b.cost;
      if (a.exitId !== b.exitId) return a.exitId.localeCompare(b.exitId);
      
      const len = Math.min(a.path.length, b.path.length);
      for (let i = 0; i < len; i++) {
        if (a.path[i] !== b.path[i]) return a.path[i].localeCompare(b.path[i]);
      }
      return a.path.length - b.path.length;
    });

    const best = candidates[0];

    const edgePath: string[] = [];
    for (let i = 0; i < best.path.length - 1; i++) {
      const u = best.path[i];
      const v = best.path[i + 1];
      const e = data.edges.find(edge => 
        (edge.from === u && edge.to === v) || (edge.from === v && edge.to === u)
      );
      if (e) edgePath.push(e.id);
    }

    return {
      status: "SUCCESS",
      cost: best.cost,
      path: best.path,
      edgePath
    };
  }, [data, startNodeId, blockedNodes, blockedEdges, closedExits]);

  // --- Toggle Helpers ---[span_12](start_span)[span_12](end_span)
  const toggleNodeBlock = (id: string) => {
    setBlockedNodes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleEdgeBlock = (id: string) => {
    setBlockedEdges(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleExitClose = (id: string) => {
    setClosedExits(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // --- Sample Checks (Section 4.1) ---[span_13](start_span)[span_13](end_span)[span_14](start_span)[span_14](end_span)
  const runTestCase = (testNum: number) => {
    handleReset();
    if (testNum === 1) {
      setStartNodeId("R1");
    } else if (testNum === 2) {
      setStartNodeId("R1");
      setBlockedNodes(["C2"]);
    } else if (testNum === 3) {
      setStartNodeId("R1");
      setClosedExits(["E1", "E2"]);
    } else if (testNum === 4) {
      setStartNodeId("R1");
      setBlockedNodes(["R1"]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b border-slate-700 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-amber-400">{t.title}</h1>
          <p className="text-sm text-slate-400">{t.building}: <span className="text-slate-200 font-semibold">{data.building}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-600 text-xs font-semibold">
            {t.importJson}
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-lg font-bold text-sm transition"
          >
            {t.langToggle}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Controls & Result */}
        <div className="space-y-6">
          
          {/* Start Location Selector */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <label className="block text-sm font-medium mb-2 text-amber-300">{t.startNode}</label>
            <select
              value={startNodeId}
              onChange={(e) => setStartNodeId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:outline-none focus:border-amber-400"
            >
              {data.nodes.filter(n => n.type === 'room').map(node => (
                <option key={node.id} value={node.id}>
                  {node.label} ({node.id})
                </option>
              ))}
            </select>
          </div>

          {/* Route Status Card */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h2 className="text-lg font-semibold mb-3 text-amber-300">{t.routeResult}</h2>
            {calculateRoute.status === 'BLOCKED_START' && (
              <div className="bg-red-950/80 border border-red-500 text-red-200 p-3 rounded-lg text-sm font-bold">
                ⚠️ {t.statusBlockedStart}
              </div>
            )}
            {calculateRoute.status === 'NO_ROUTE' && (
              <div className="bg-orange-950/80 border border-orange-500 text-orange-200 p-3 rounded-lg text-sm font-bold">
                🚫 {t.statusNoRoute}
              </div>
            )}
            {calculateRoute.status === 'SUCCESS' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700">
                  <span className="text-sm text-slate-400">{t.totalCost}:</span>
                  <span className="text-xl font-extrabold text-emerald-400">{calculateRoute.cost}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">{t.path}:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {calculateRoute.path.map((nid, idx) => (
                      <React.Fragment key={nid}>
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-xs font-mono font-bold">
                          {nid}
                        </span>
                        {idx < calculateRoute.path.length - 1 && <span className="text-slate-500 text-xs">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4.1 Test Cases */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h3 className="text-sm font-semibold text-amber-300 mb-2">{t.testCases}</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button onClick={() => runTestCase(1)} className="bg-slate-700 hover:bg-slate-600 p-2 rounded text-left border border-slate-600">
                1. Baseline (R1)
              </button>
              <button onClick={() => runTestCase(2)} className="bg-slate-700 hover:bg-slate-600 p-2 rounded text-left border border-slate-600">
                2. Block C2
              </button>
              <button onClick={() => runTestCase(3)} className="bg-slate-700 hover:bg-slate-600 p-2 rounded text-left border border-slate-600">
                3. Close E1 & E2
              </button>
              <button onClick={() => runTestCase(4)} className="bg-slate-700 hover:bg-slate-600 p-2 rounded text-left border border-slate-600">
                4. Block R1
              </button>
            </div>
          </div>

          {/* Hazard Controls List */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <h3 className="text-sm font-semibold text-amber-300">{t.hazardControls}</h3>
              <button onClick={handleReset} className="text-xs text-red-400 hover:text-red-300 underline font-semibold">
                {t.reset}
              </button>
            </div>

            {/* Blocked Nodes */}
            <div>
              <span className="text-xs text-slate-400 block mb-1">{t.blockedNodes}:</span>
              <div className="flex flex-wrap gap-1.5">
                {data.nodes.map(node => (
                  <button
                    key={node.id}
                    onClick={() => toggleNodeBlock(node.id)}
                    className={`px-2 py-0.5 rounded text-xs font-mono transition ${
                      blockedNodes.includes(node.id)
                        ? 'bg-red-600 text-white font-bold'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {node.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Blocked Edges */}
            <div>
              <span className="text-xs text-slate-400 block mb-1">{t.blockedEdges}:</span>
              <div className="flex flex-wrap gap-1.5">
                {data.edges.map(edge => (
                  <button
                    key={edge.id}
                    onClick={() => toggleEdgeBlock(edge.id)}
                    className={`px-2 py-0.5 rounded text-xs font-mono transition ${
                      blockedEdges.includes(edge.id)
                        ? 'bg-red-600 text-white font-bold'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {edge.id} ({edge.from}-{edge.to})
                  </button>
                ))}
              </div>
            </div>

            {/* Closed Exits */}
            <div>
              <span className="text-xs text-slate-400 block mb-1">{t.closedExits}:</span>
              <div className="flex flex-wrap gap-1.5">
                {data.nodes.filter(n => n.type === 'exit').map(exit => (
                  <button
                    key={exit.id}
                    onClick={() => toggleExitClose(exit.id)}
                    className={`px-2 py-0.5 rounded text-xs font-mono transition ${
                      closedExits.includes(exit.id)
                        ? 'bg-red-600 text-white font-bold'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {exit.id}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Interactive Visualizer Map */}
        <div className="lg:col-span-2 bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
          
          <div className="w-full flex justify-between items-center mb-2 text-xs text-slate-400">
            <span>Map Visualizer</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span> {t.room}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-500 rounded-full inline-block"></span> {t.junction}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-full inline-block"></span> {t.exit}</span>
            </div>
          </div>

          <svg viewBox="0 0 520 250" className="w-full h-auto bg-slate-950 rounded-lg border border-slate-800">
            
            {/* Draw Edges */}
            {data.edges.map(edge => {
              const u = data.nodes.find(n => n.id === edge.from);
              const v = data.nodes.find(n => n.id === edge.to);
              if (!u || !v) return null;

              const isBlocked = blockedEdges.includes(edge.id) || blockedNodes.includes(u.id) || blockedNodes.includes(v.id);
              const isPath = calculateRoute.edgePath.includes(edge.id);

              const midX = (u.x + v.x) / 2;
              const midY = (u.y + v.y) / 2;

              return (
                <g key={edge.id} className="cursor-pointer" onClick={() => toggleEdgeBlock(edge.id)}>
                  <line
                    x1={u.x}
                    y1={u.y}
                    x2={v.x}
                    y2={v.y}
                    stroke={isBlocked ? '#ef4444' : isPath ? '#10b981' : '#475569'}
                    strokeWidth={isPath ? 5 : isBlocked ? 2 : 3}
                    strokeDasharray={isBlocked ? "4 4" : "none"}
                  />
                  {/* Cost Label */}
                  <rect x={midX - 10} y={midY - 8} width="20" height="16" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                  <text x={midX} y={midY + 4} textAnchor="middle" fill={isPath ? "#34d399" : "#94a3b8"} fontSize="10" fontWeight="bold">
                    {edge.cost}
                  </text>
                </g>
              );
            })}

            {/* Draw Nodes */}
            {data.nodes.map(node => {
              const isBlocked = blockedNodes.includes(node.id);
              const isClosed = node.type === 'exit' && closedExits.includes(node.id);
              const isStart = node.id === startNodeId;
              const isPath = calculateRoute.path.includes(node.id);

              let fillColor = "#64748b"; // junction
              if (node.type === 'room') fillColor = "#3b82f6";
              if (node.type === 'exit') fillColor = "#10b981";

              if (isBlocked || isClosed) fillColor = "#ef4444";

              return (
                <g key={node.id} className="cursor-pointer" onClick={() => {
                  if (node.type === 'exit') toggleExitClose(node.id);
                  else toggleNodeBlock(node.id);
                }}>
                  {/* Node Shape */}
                  {node.type === 'exit' ? (
                    <rect
                      x={node.x - 16}
                      y={node.y - 16}
                      width="32"
                      height="32"
                      rx="6"
                      fill={fillColor}
                      stroke={isPath ? "#a7f3d0" : isStart ? "#f59e0b" : "#1e293b"}
                      strokeWidth={isPath || isStart ? 3 : 1}
                    />
                  ) : (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.type === 'room' ? 18 : 14}
                      fill={fillColor}
                      stroke={isPath ? "#a7f3d0" : isStart ? "#f59e0b" : "#1e293b"}
                      strokeWidth={isPath || isStart ? 3 : 1}
                    />
                  )}

                  {/* Node ID */}
                  <text x={node.x} y={node.y + 4} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                    {node.id}
                  </text>

                  {/* Node Label */}
                  <text x={node.x} y={node.y + 32} textAnchor="middle" fill="#94a3b8" fontSize="9">
                    {node.label}
                  </text>

                  {/* Hazard Indicator overlay */}
                  {(isBlocked || isClosed) && (
                    <text x={node.x} y={node.y - 20} textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">
                      ✖
                    </text>
                  )}
                  {isStart && !isBlocked && (
                    <text x={node.x} y={node.y - 22} textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">
                      START
                    </text>
                  )}
                </g>
              );
            })}

          </svg>

        </div>

      </div>
    </div>
  );
}
