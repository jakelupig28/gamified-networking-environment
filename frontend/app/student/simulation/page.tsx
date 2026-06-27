"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";

type NodeType = "router" | "switch" | "pc" | "laptop" | "server" | "printer" | "ap" | "hub" | "message" | "cable";

type NetworkNode = {
  id: string;
  name: string;
  type: Exclude<NodeType, "message" | "cable">;
  x: number;
  y: number;
  interfaces: { name: string; ip: string; subnet: string; gateway: string }[];
  config: string[]; // Mock CLI command configs
};

type Connection = {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
};

// Preset Lab Templates
const LAB_TEMPLATES = [
  {
    name: "Dual-Router Static Routing",
    description: "Connect 2 PCs through 2 Routers using static route configurations.",
    nodes: [
      { id: "pc1", name: "pc1", type: "pc" as const, x: 150, y: 320, interfaces: [{ name: "eth0", ip: "192.168.1.10", subnet: "255.255.255.0", gateway: "192.168.1.1" }], config: ["ip addr add 192.168.1.10/24 dev eth0", "ip route add default via 192.168.1.1"] },
      { id: "r1", name: "r1", type: "router" as const, x: 320, y: 200, interfaces: [{ name: "eth0", ip: "192.168.1.1", subnet: "255.255.255.0", gateway: "" }, { name: "eth1", ip: "10.0.0.1", subnet: "255.255.255.252", gateway: "" }], config: ["ip addr add 192.168.1.1/24 dev eth0", "ip addr add 10.0.0.1/30 dev eth1", "ip route add 192.168.2.0/24 via 10.0.0.2"] },
      { id: "r2", name: "r2", type: "router" as const, x: 520, y: 200, interfaces: [{ name: "eth0", ip: "192.168.2.1", subnet: "255.255.255.0", gateway: "" }, { name: "eth1", ip: "10.0.0.2", subnet: "255.255.255.252", gateway: "" }], config: ["ip addr add 192.168.2.1/24 dev eth0", "ip addr add 10.0.0.2/30 dev eth1", "ip route add 192.168.1.0/24 via 10.0.0.1"] },
      { id: "pc2", name: "pc2", type: "pc" as const, x: 700, y: 320, interfaces: [{ name: "eth0", ip: "192.168.2.10", subnet: "255.255.255.0", gateway: "192.168.2.1" }], config: ["ip addr add 192.168.2.10/24 dev eth0", "ip route add default via 192.168.2.1"] },
    ],
    connections: [
      { id: "c1", fromNode: "pc1", fromPort: "eth0", toNode: "r1", toPort: "eth0" },
      { id: "c2", fromNode: "r1", fromPort: "eth1", toNode: "r2", toPort: "eth1" },
      { id: "c3", fromNode: "r2", fromPort: "eth0", toNode: "pc2", toPort: "eth0" },
    ]
  },
  {
    name: "Single-Switch Subnet",
    description: "A local area network connecting 3 PCs to a central Switch sharing the 192.168.1.0/24 subnet.",
    nodes: [
      { id: "pc1", name: "pc1", type: "pc" as const, x: 180, y: 120, interfaces: [{ name: "eth0", ip: "192.168.1.10", subnet: "255.255.255.0", gateway: "" }], config: ["ip addr add 192.168.1.10/24 dev eth0"] },
      { id: "pc2", name: "pc2", type: "pc" as const, x: 180, y: 340, interfaces: [{ name: "eth0", ip: "192.168.1.20", subnet: "255.255.255.0", gateway: "" }], config: ["ip addr add 192.168.1.20/24 dev eth0"] },
      { id: "sw1", name: "sw1", type: "switch" as const, x: 420, y: 220, interfaces: [], config: [] },
      { id: "pc3", name: "pc3", type: "pc" as const, x: 660, y: 220, interfaces: [{ name: "eth0", ip: "192.168.1.30", subnet: "255.255.255.0", gateway: "" }], config: ["ip addr add 192.168.1.30/24 dev eth0"] }
    ],
    connections: [
      { id: "c1", fromNode: "pc1", fromPort: "eth0", toNode: "sw1", toPort: "port1" },
      { id: "c2", fromNode: "pc2", fromPort: "eth0", toNode: "sw1", toPort: "port2" },
      { id: "c3", fromNode: "pc3", fromPort: "eth0", toNode: "sw1", toPort: "port3" }
    ]
  }
];

// Physical Cisco Device SVG renderer helper
function getCiscoDeviceSvg(type: NodeType) {
  switch (type) {
    case "router":
      return (
        <svg viewBox="0 0 48 32" className="w-12 h-8 text-brand-cyan" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="8" width="44" height="16" rx="2" fill="#1e293b" stroke="#00f2fe" strokeWidth="2" />
          <line x1="6" y1="13" x2="14" y2="13" stroke="#64748b" strokeWidth="1.5" />
          <line x1="6" y1="16" x2="14" y2="16" stroke="#64748b" strokeWidth="1.5" />
          <line x1="6" y1="19" x2="14" y2="19" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="20" cy="16" r="1.5" fill="#22c55e" stroke="none" />
          <circle cx="24" cy="16" r="1.5" fill="#22c55e" stroke="none" />
          <rect x="30" y="12" width="6" height="8" rx="1" fill="#0f172a" stroke="#64748b" />
          <rect x="38" y="12" width="6" height="8" rx="1" fill="#0f172a" stroke="#64748b" />
        </svg>
      );
    case "switch":
      return (
        <svg viewBox="0 0 48 32" className="w-12 h-8 text-brand-cyan" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="10" width="44" height="12" rx="1.5" fill="#334155" stroke="#00f2fe" strokeWidth="2" />
          <rect x="8" y="14" width="4" height="4" fill="#0f172a" stroke="#64748b" />
          <rect x="14" y="14" width="4" height="4" fill="#0f172a" stroke="#64748b" />
          <rect x="20" y="14" width="4" height="4" fill="#0f172a" stroke="#64748b" />
          <rect x="26" y="14" width="4" height="4" fill="#0f172a" stroke="#64748b" />
          <rect x="32" y="14" width="4" height="4" fill="#0f172a" stroke="#64748b" />
          <rect x="38" y="14" width="4" height="4" fill="#0f172a" stroke="#64748b" />
          <circle cx="10" cy="12" r="0.8" fill="#22c55e" stroke="none" />
          <circle cx="16" cy="12" r="0.8" fill="#22c55e" stroke="none" />
          <circle cx="22" cy="12" r="0.8" fill="#22c55e" stroke="none" />
        </svg>
      );
    case "pc":
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10 text-brand-cyan" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="4" width="30" height="20" rx="2" fill="#0f172a" stroke="#00f2fe" strokeWidth="2" />
          <rect x="6" y="6" width="26" height="16" fill="#1e293b" stroke="none" />
          <path d="M16 24v6M12 30h14" stroke="#00f2fe" strokeWidth="2" />
          <rect x="36" y="10" width="8" height="20" rx="1.5" fill="#1e293b" stroke="#00f2fe" strokeWidth="2" />
          <line x1="38" y1="14" x2="42" y2="14" stroke="#64748b" />
          <circle cx="40" cy="26" r="1.2" fill="#22c55e" stroke="none" />
        </svg>
      );
    case "laptop":
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10 text-brand-cyan" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 8h32v22H8z" fill="#0f172a" stroke="#00f2fe" strokeWidth="2" />
          <rect x="10" y="10" width="28" height="18" fill="#1e293b" stroke="none" />
          <path d="M2 30h44l-3 8H5z" fill="#334155" stroke="#00f2fe" strokeWidth="2" />
        </svg>
      );
    case "server":
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10 text-brand-cyan" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="10" y="2" width="28" height="44" rx="3" fill="#1e293b" stroke="#00f2fe" strokeWidth="2" />
          <rect x="13" y="6" width="22" height="8" rx="1" fill="#334155" stroke="#64748b" />
          <rect x="13" y="18" width="22" height="8" rx="1" fill="#334155" stroke="#64748b" />
          <rect x="13" y="30" width="22" height="8" rx="1" fill="#334155" stroke="#64748b" />
          <circle cx="16" cy="10" r="1.2" fill="#22c55e" stroke="none" />
          <circle cx="16" cy="22" r="1.2" fill="#22c55e" stroke="none" />
          <circle cx="16" cy="34" r="1.2" fill="#22c55e" stroke="none" />
        </svg>
      );
    case "printer":
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10 text-brand-cyan" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="8" y="14" width="32" height="20" rx="2" fill="#334155" stroke="#00f2fe" strokeWidth="2" />
          <path d="M14 6h20v8H14z" fill="#1e293b" stroke="#64748b" />
          <path d="M12 34h24v8H12z" fill="#0f172a" stroke="#64748b" />
        </svg>
      );
    case "ap":
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10 text-brand-cyan" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 32a16 16 0 0 1 32 0z" fill="#1e293b" stroke="#00f2fe" strokeWidth="2" />
          <rect x="4" y="32" width="40" height="4" rx="1" fill="#334155" stroke="#64748b" />
          <line x1="24" y1="16" x2="24" y2="4" stroke="#00f2fe" strokeWidth="2.5" />
          <circle cx="24" cy="4" r="2" fill="#22c55e" stroke="none" />
        </svg>
      );
    case "hub":
      return (
        <svg viewBox="0 0 48 32" className="w-12 h-8 text-brand-cyan" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="8" width="40" height="16" rx="2" fill="#1e293b" stroke="#00f2fe" strokeWidth="2" />
          <path d="M12 16h24" stroke="#64748b" strokeWidth="2" />
          <circle cx="16" cy="16" r="2" fill="#22c55e" stroke="none" />
          <circle cx="24" cy="16" r="2" fill="#22c55e" stroke="none" />
          <circle cx="32" cy="16" r="2" fill="#22c55e" stroke="none" />
        </svg>
      );
    case "cable":
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-brand-cyan" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m7 21 14-14"/>
          <circle cx="5" cy="19" r="2"/>
          <circle cx="19" cy="5" r="2"/>
        </svg>
      );
    case "message":
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-brand-cyan" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
    default:
      return null;
  }
}

export default function SimulationLab() {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeLabName, setActiveLabName] = useState("Custom Topology");
  const [labStatus, setLabStatus] = useState<"stopped" | "starting" | "running">("stopped");
  
  // Real Ticking Stopwatch Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Full Screen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Wiring state
  const [isWiringMode, setIsWiringMode] = useState(false);
  const [wiringStartNode, setWiringStartNode] = useState<string | null>(null);
  const [canvasMousePos, setCanvasMousePos] = useState({ x: 0, y: 0 });

  // Pending Cabling Connection dialog selectors
  const [pendingConnection, setPendingConnection] = useState<{ fromNode: string; toNode: string } | null>(null);

  // Tabs for side panel config settings
  const [activeConfigTab, setActiveConfigTab] = useState<"physical" | "ip">("physical");

  // Selections
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // Form Configurations
  const [selectedInterface, setSelectedInterface] = useState("eth0");
  const [configIp, setConfigIp] = useState("");
  const [configSubnet, setConfigSubnet] = useState("255.255.255.0");
  const [configGateway, setConfigGateway] = useState("");

  // Terminal Console (Floating Draggable Window)
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleNodeId, setConsoleNodeId] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<Record<string, string[]>>({});
  const [currentCommand, setCurrentCommand] = useState("");
  const [consolePos, setConsolePos] = useState({ x: 320, y: 150 });
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);
  const [consoleDragStart, setConsoleDragStart] = useState({ x: 0, y: 0 });
  const [cliModes, setCliModes] = useState<Record<string, { mode: string; activeIf: string | null }>>({});

  // Dynamic CLI prompt text generator
  const getCliPrompt = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return "guest@terminal:~$";
    if (node.type === "router" || node.type === "switch") {
      const state = cliModes[nodeId] || { mode: "user-exec", activeIf: null };
      if (state.mode === "privileged-exec") return `${node.name}#`;
      if (state.mode === "global-config") return `${node.name}(config)#`;
      if (state.mode === "interface-config") return `${node.name}(config-if)#`;
      return `${node.name}>`;
    }
    return `guest@${nodeId}:~$`;
  };

  // Helper to retrieve console logs dynamically (online/offline welcome)
  const getLogsForNode = (nodeId: string) => {
    if (terminalLogs[nodeId]) {
      return terminalLogs[nodeId];
    }
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];
    return [
      `Welcome to ${node.name} console terminal.`,
      "Type 'help' to see available tools.",
      "",
      "[Status] Container system is offline.",
      "Click 'Start Kathará Lab' in the header to spin up Docker nodes and wire interfaces."
    ];
  };

  // Send Message / Packet Simulation State
  const [packetMode, setPacketMode] = useState<null | "source" | "destination">(null);
  const [packetSourceId, setPacketSourceId] = useState<string | null>(null);
  const [packetPos, setPacketPos] = useState({ x: 0, y: 0 });
  const [packetVisible, setPacketVisible] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs, consoleNodeId]);

  // Real Timer stopwatch ticker
  useEffect(() => {
    let intervalId: any;
    if (labStatus === "running") {
      setElapsedSeconds(0);
      intervalId = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [labStatus]);

  // Format Elapsed seconds to HH:MM:SS
  const formatStopwatch = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0")
    ].join(":");
  };

  // Load a preset template
  const loadTemplate = (template: typeof LAB_TEMPLATES[0]) => {
    setNodes(template.nodes.map(n => ({ ...n, config: [...n.config] })));
    setConnections([...template.connections]);
    setActiveLabName(template.name);
    setLabStatus("stopped");
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    setIsConsoleOpen(false);
    setTerminalLogs({});
    setElapsedSeconds(0);
  };

  // Load selected interface configuration
  useEffect(() => {
    if (selectedNodeId) {
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node && node.interfaces.length > 0) {
        const iface = node.interfaces.find(i => i.name === selectedInterface) || node.interfaces[0];
        setSelectedInterface(iface.name);
        setConfigIp(iface.ip || "");
        setConfigSubnet(iface.subnet || "255.255.255.0");
        setConfigGateway(iface.gateway || "");
      } else {
        setConfigIp("");
        setConfigSubnet("255.255.255.0");
        setConfigGateway("");
      }
    }
  }, [selectedNodeId, selectedInterface, nodes]);

  // Handle Dragging of Floating Console Window
  const handleConsoleMouseDown = (e: React.MouseEvent) => {
    setIsDraggingConsole(true);
    setConsoleDragStart({
      x: e.clientX - consolePos.x,
      y: e.clientY - consolePos.y
    });
  };

  const handleConsoleMouseMove = (e: MouseEvent) => {
    if (!isDraggingConsole) return;
    setConsolePos({
      x: e.clientX - consoleDragStart.x,
      y: e.clientY - consoleDragStart.y
    });
  };

  const handleConsoleMouseUp = () => {
    setIsDraggingConsole(false);
  };

  useEffect(() => {
    if (isDraggingConsole) {
      window.addEventListener("mousemove", handleConsoleMouseMove);
      window.addEventListener("mouseup", handleConsoleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleConsoleMouseMove);
      window.removeEventListener("mouseup", handleConsoleMouseUp);
    };
  }, [isDraggingConsole, consoleDragStart, consolePos]);

  // Delete node and clean connections
  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.fromNode !== id && c.toNode !== id));
    setSelectedNodeId(null);
    if (consoleNodeId === id) {
      setIsConsoleOpen(false);
      setConsoleNodeId(null);
    }
  };

  // Delete single cable connection link
  const deleteConnection = (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
    setSelectedConnectionId(null);
  };

  // Available interface port calculator
  const getAvailablePorts = (node: NetworkNode, connectionsList: Connection[]) => {
    const isSwitchOrHub = node.type === "switch" || node.type === "hub";
    const prefix = isSwitchOrHub ? "port" : "eth";
    const limit = isSwitchOrHub ? 8 : 4;
    
    const ports = [];
    for (let i = 0; i < limit; i++) {
      const portName = `${prefix}${i}`;
      const inUse = connectionsList.some(c => 
        (c.fromNode === node.id && c.fromPort === portName) ||
        (c.toNode === node.id && c.toPort === portName)
      );
      ports.push({ name: portName, inUse });
    }
    return ports;
  };

  // Apply ports configuration parameters
  const confirmConnection = (fromPort: string, toPort: string) => {
    if (!pendingConnection) return;
    const { fromNode, toNode } = pendingConnection;
    const connId = `conn_${Date.now()}`;
    const newConn: Connection = {
      id: connId,
      fromNode,
      fromPort,
      toNode,
      toPort
    };

    // Update node interfaces if they don't have this port added yet
    setNodes(prev => prev.map(n => {
      if (n.id === fromNode && n.type !== "switch" && n.type !== "hub") {
        const hasPort = n.interfaces.some(i => i.name === fromPort);
        if (!hasPort) {
          return {
            ...n,
            interfaces: [...n.interfaces, { name: fromPort, ip: "", subnet: "255.255.255.0", gateway: "" }]
          };
        }
      }
      if (n.id === toNode && n.type !== "switch" && n.type !== "hub") {
        const hasPort = n.interfaces.some(i => i.name === toPort);
        if (!hasPort) {
          return {
            ...n,
            interfaces: [...n.interfaces, { name: toPort, ip: "", subnet: "255.255.255.0", gateway: "" }]
          };
        }
      }
      return n;
    }));

    setConnections(prev => [...prev, newConn]);
    setPendingConnection(null);
  };

  // Apply Form IP settings
  const applyIpConfig = () => {
    if (!selectedNodeId) return;
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNodeId) {
        const updatedIf = n.interfaces.map(i => {
          if (i.name === selectedInterface) {
            return {
              ...i,
              ip: configIp,
              subnet: configSubnet,
              gateway: configGateway
            };
          }
          return i;
        });

        // Sync CLI configurations
        const newConfigs = updatedIf.map(i => {
          if (!i.ip) return "";
          const cidr = i.subnet === "255.255.255.0" ? "24" : i.subnet === "255.255.255.252" ? "30" : "24";
          return `ip addr add ${i.ip}/${cidr} dev ${i.name}`;
        }).filter(Boolean);
        if (configGateway) {
          newConfigs.push(`ip route add default via ${configGateway}`);
        }

        return {
          ...n,
          interfaces: updatedIf,
          config: newConfigs
        };
      }
      return n;
    }));

    // Alert details to device terminal console
    setTerminalLogs(prev => ({
      ...prev,
      [selectedNodeId]: [
        ...(prev[selectedNodeId] || []),
        `[GUI Config] Applied configuration: IP=${configIp}, Subnet=${configSubnet}, GW=${configGateway} on interface ${selectedInterface}`
      ]
    }));
  };

  // Start Kathará containers simulation
  const startLab = () => {
    setLabStatus("starting");
    setIsConsoleOpen(false);

    // Save exact run time
    const now = new Date();
    setStartTimeStr(now.toLocaleTimeString("en-US", { hour12: false }));

    // Generate startup logs
    const startupLogs = [
      "[Kathará] Parsing network topology JSON...",
      `[Kathará] Binding virtual collision domains for active connections...`,
    ];

    nodes.forEach(node => {
      startupLogs.push(`[Kathará] Creating network namespaces for container '${node.name}'...`);
    });

    setTimeout(() => {
      nodes.forEach(node => {
        startupLogs.push(`[Kathará] container '${node.id}' successfully booted (Kernel: Linux 6.1-kathara).`);
      });
      startupLogs.push("[Kathará] Applying startup network configs and static routing tables...");
      startupLogs.push("[Kathará] Lab Status: RUNNING. Access CLI consoles by clicking CLI icons.");
      
      // Load standard configurations into terminal logs
      const initialTerminalState: Record<string, string[]> = {};
      nodes.forEach(node => {
        initialTerminalState[node.id] = [
          `Welcome to ${node.name} console terminal.`,
          "Type 'help' to see available tools.",
          "",
          ...node.config.map(cmd => `guest@${node.id}:~$ ${cmd}`)
        ];
      });

      setTerminalLogs(initialTerminalState);
      setLabStatus("running");
    }, 1500);
  };

  const stopLab = () => {
    setLabStatus("stopped");
    setSelectedNodeId(null);
    setIsConsoleOpen(false);
    setTerminalLogs({});
    setElapsedSeconds(0);
    setStartTimeStr(null);
  };

  // Drag and Drop (Toolbar to Canvas) handlers
  const handleDragStart = (e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData("nodeType", type);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("nodeType") as NodeType;
    if (!type) return;

    const canvas = document.getElementById("canvas-pane");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // CABLE CONNECTION DRAG DROP
    if (type === "cable") {
      const droppedNode = nodes.find(n => {
        const dx = n.x - x;
        const dy = n.y - y;
        return Math.sqrt(dx*dx + dy*dy) < 45;
      });

      if (!droppedNode) {
        alert("Cable must be dropped directly on top of a device node!");
        return;
      }

      if (!wiringStartNode) {
        setWiringStartNode(droppedNode.id);
        setIsWiringMode(true);
      } else if (wiringStartNode !== droppedNode.id) {
        // Trigger port selection menu popup overlay
        setPendingConnection({ fromNode: wiringStartNode, toNode: droppedNode.id });
        setWiringStartNode(null);
        setIsWiringMode(false);
      }
      return;
    }

    // MESSAGE PDU DRAG DROP LOGIC
    if (type === "message") {
      const droppedNode = nodes.find(n => {
        const dx = n.x - x;
        const dy = n.y - y;
        return Math.sqrt(dx*dx + dy*dy) < 45;
      });

      if (!droppedNode) {
        alert("Simple PDU envelope must be dropped directly on top of a device node!");
        return;
      }

      if (labStatus !== "running") {
        alert("Please start the Kathará lab simulation first before launching message packet diagnostics!");
        return;
      }

      if (!packetSourceId) {
        setPacketSourceId(droppedNode.id);
        setPacketMode("destination");
        
        // Output trace logs
        if (consoleNodeId) {
          setTerminalLogs(prev => ({
            ...prev,
            [consoleNodeId]: [
              ...(prev[consoleNodeId] || []),
              `[ICMP PDU] PDU source set to: ${droppedNode.name}. Drag another PDU and drop on destination device.`
            ]
          }));
        }
      } else {
        if (packetSourceId === droppedNode.id) return;
        const startId = packetSourceId;
        if (!startId) return;
        setPacketSourceId(null);
        setPacketMode(null);

        const path = findShortestPath(startId, droppedNode.id);
        if (!path) {
          alert("Packet Failure: No link connection route found between source and target!");
          return;
        }

        const targetIp = droppedNode.interfaces[0]?.ip || droppedNode.name;

        // Automatically open CLI for the source node
        setConsoleNodeId(startId);
        setIsConsoleOpen(true);

        setTerminalLogs(prev => ({
          ...prev,
          [startId]: [
            ...(prev[startId] || getLogsForNode(startId)),
            `guest@${startId}:~$ ping ${targetIp}`,
            `PING ${targetIp} (${targetIp}) 56(84) bytes of data.`
          ]
        }));

        // Convert path nodes to coordinates
        const coords = path.map(id => {
          const node = nodes.find(n => n.id === id);
          return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
        });

        // ICMP Request & Reply full path loop
        const fullCoords = [...coords, ...[...coords].reverse().slice(1)];
        
        setPacketVisible(true);
        setPacketPos({ x: fullCoords[0].x, y: fullCoords[0].y });

        let step = 0;
        let t = 0;

        const animInterval = setInterval(() => {
          t += 0.025; // Slower, smoother movement across devices and cables
          if (t >= 1) {
            t = 0;
            step++;
          }

          if (step >= fullCoords.length - 1) {
            clearInterval(animInterval);
            setPacketVisible(false);
            
            // Print message output to console terminal
            setTerminalLogs(prev => ({
              ...prev,
              [startId]: [
                ...(prev[startId] || getLogsForNode(startId)),
                `64 bytes from ${targetIp}: icmp_seq=1 ttl=64 time=0.92 ms`,
                `--- ping statistics ---`,
                `1 packets transmitted, 1 received, 0% packet loss`
              ]
            }));
            return;
          }

          const curr = fullCoords[step];
          const next = fullCoords[step + 1];
          
          // Linear interpolation calculation
          const posX = curr.x + (next.x - curr.x) * t;
          const posY = curr.y + (next.y - curr.y) * t;

          setPacketPos({ x: posX, y: posY });
        }, 30); // 33 fps
      }
      return;
    }

    const count = nodes.filter(n => n.type === type).length + 1;
    const id = `${type}${count}`;

    const interfaces = type === "switch" || type === "hub"
      ? []
      : [{ name: "eth0", ip: "", subnet: "255.255.255.0", gateway: "" }];

    const newNode: NetworkNode = {
      id,
      name: `${type}${count}`,
      type: type as Exclude<NodeType, "message" | "cable">,
      x,
      y,
      interfaces,
      config: []
    };

    setNodes(prev => [...prev, newNode]);
  };

  // Node movement drag handlers
  const handleNodeMouseDown = (e: React.MouseEvent, node: NetworkNode) => {
    if (packetMode) {
      e.stopPropagation();
      handlePacketNodeSelect(node.id);
      return;
    }

    if (isWiringMode) {
      if (!wiringStartNode) {
        setWiringStartNode(node.id);
      } else if (wiringStartNode !== node.id) {
        // Trigger port selection menu popup overlay
        setPendingConnection({ fromNode: wiringStartNode, toNode: node.id });
        setWiringStartNode(null);
        setIsWiringMode(false);
      }
      return;
    }

    setDraggingNodeId(node.id);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - dragOffset.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = document.getElementById("canvas-pane");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Track mouse coordinates for trailing rubberband cable
    if (isWiringMode && wiringStartNode) {
      setCanvasMousePos({ x, y });
    }

    if (!draggingNodeId) return;

    const posX = Math.max(40, Math.min(x - dragOffset.x, rect.width - 40));
    const posY = Math.max(40, Math.min(y - dragOffset.y, rect.height - 40));

    setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: posX, y: posY } : n));
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  // Breadth-First Search (BFS) path-finding for connections
  const findShortestPath = (startId: string, endId: string): string[] | null => {
    const queue: string[][] = [[startId]];
    const visited = new Set<string>([startId]);

    while (queue.length > 0) {
      const path = queue.shift()!;
      const lastNode = path[path.length - 1];

      if (lastNode === endId) return path;

      const neighbors: string[] = [];
      connections.forEach(c => {
        if (c.fromNode === lastNode) neighbors.push(c.toNode);
        if (c.toNode === lastNode) neighbors.push(c.fromNode);
      });

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
    return null;
  };

  // Packet Selection Click helper
  const handlePacketNodeSelect = (nodeId: string) => {
    if (packetMode === "source") {
      setPacketSourceId(nodeId);
      setPacketMode("destination");
    } else if (packetMode === "destination") {
      if (packetSourceId === nodeId) return;
      const startId = packetSourceId;
      if (!startId) return;
      setPacketSourceId(null);
      setPacketMode(null);

      const path = findShortestPath(startId, nodeId);
      if (!path) {
        alert("Packet Failure: No link connection route found between source and target!");
        return;
      }

      const targetNode = nodes.find(n => n.id === nodeId);
      const targetIp = targetNode?.interfaces[0]?.ip || nodeId;

      // Automatically open CLI for the source node
      setConsoleNodeId(startId);
      setIsConsoleOpen(true);

      setTerminalLogs(prev => ({
        ...prev,
        [startId]: [
          ...(prev[startId] || getLogsForNode(startId)),
          `guest@${startId}:~$ ping ${targetIp}`,
          `PING ${targetIp} (${targetIp}) 56(84) bytes of data.`
        ]
      }));

      // Convert path nodes to coordinates
      const coords = path.map(id => {
        const node = nodes.find(n => n.id === id);
        return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
      });

      // ICMP Request & Reply full path loop
      const fullCoords = [...coords, ...[...coords].reverse().slice(1)];
      
      setPacketVisible(true);
      setPacketPos({ x: fullCoords[0].x, y: fullCoords[0].y });

      let step = 0;
      let t = 0;

      const animInterval = setInterval(() => {
        t += 0.025; // Slower increment step for visibility
        if (t >= 1) {
          t = 0;
          step++;
        }

        if (step >= fullCoords.length - 1) {
          clearInterval(animInterval);
          setPacketVisible(false);
          
          // Print message output to console terminal
          setTerminalLogs(prev => ({
            ...prev,
            [startId]: [
              ...(prev[startId] || getLogsForNode(startId)),
              `64 bytes from ${targetIp}: icmp_seq=1 ttl=64 time=0.92 ms`,
              `--- ping statistics ---`,
              `1 packets transmitted, 1 received, 0% packet loss`
            ]
          }));
          return;
        }

        const curr = fullCoords[step];
        const next = fullCoords[step + 1];
        
        // Linear interpolation calculation
        const posX = curr.x + (next.x - curr.x) * t;
        const posY = curr.y + (next.y - curr.y) * t;

        setPacketPos({ x: posX, y: posY });
      }, 30);
    }
  };

  // Timestamp active logger helper
  const [startTimeStr, setStartTimeStr] = useState<string | null>(null);

  // Helper to run mock ping operations
  const runPingCommand = (targetIp: string | undefined, replies: string[]) => {
    if (!targetIp) {
      replies.push("Usage: ping <ip_address>");
      return;
    }
    replies.push(`PING ${targetIp} (${targetIp}) 56(84) bytes of data.`);
    const targetNode = nodes.find(n => n.interfaces.some(i => i.ip === targetIp));

    if (targetNode) {
      replies.push(
        `64 bytes from ${targetIp}: icmp_seq=1 ttl=64 time=0.88 ms`,
        `64 bytes from ${targetIp}: icmp_seq=2 ttl=64 time=0.92 ms`,
        `--- ${targetIp} ping statistics ---`,
        "2 packets transmitted, 2 received, 0% packet loss, time 1003ms"
      );
    } else {
      replies.push(
        "Request timeout for icmp_seq 1",
        "Request timeout for icmp_seq 2",
        `--- ${targetIp} ping statistics ---`,
        "2 packets transmitted, 0 received, 100% packet loss"
      );
    }
  };

  // CLI execution logic
  const executeCliCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCommand.trim() || !consoleNodeId) return;

    const cmd = currentCommand.trim();
    const node = nodes.find(n => n.id === consoleNodeId);
    if (!node) return;

    // Check online status
    if (labStatus !== "running") {
      setTerminalLogs(prev => ({
        ...prev,
        [consoleNodeId]: [
          ...getLogsForNode(consoleNodeId),
          `${getCliPrompt(consoleNodeId)} ${cmd}`,
          `[Error] Cannot execute command. The Kathará container lab is currently offline. Please click 'Start Kathará Lab' in the header.`
        ]
      }));
      setCurrentCommand("");
      return;
    }

    const modeState = cliModes[consoleNodeId] || { mode: "user-exec", activeIf: null };
    const cmdLower = cmd.toLowerCase();
    const cmdParts = cmd.split(/\s+/);
    const cmdPartsLower = cmdLower.split(/\s+/);
    const cmdType = cmdPartsLower[0];

    let replies = [`${getCliPrompt(consoleNodeId)} ${cmd}`];

    // CISCO IOS INTERFACE SIMULATOR
    if (node.type === "router" || node.type === "switch") {
      if (modeState.mode === "user-exec") {
        if (cmdType === "enable" || cmdType === "en") {
          setCliModes(prev => ({
            ...prev,
            [consoleNodeId]: { mode: "privileged-exec", activeIf: null }
          }));
        } else if (cmdType === "help") {
          replies.push(
            "Cisco User EXEC Commands:",
            "  enable / en                    Enter Privileged EXEC mode",
            "  ping <ip>                      Ping target host address"
          );
        } else if (cmdType === "ping") {
          runPingCommand(cmdPartsLower[1], replies);
        } else {
          replies.push(`% Unknown command or computer name, or incomplete command.`);
        }
      } 
      else if (modeState.mode === "privileged-exec") {
        if (cmdType === "configure" && (cmdPartsLower[1] === "terminal" || cmdPartsLower[1] === "t")) {
          setCliModes(prev => ({
            ...prev,
            [consoleNodeId]: { mode: "global-config", activeIf: null }
          }));
        } else if (cmdType === "disable") {
          setCliModes(prev => ({
            ...prev,
            [consoleNodeId]: { mode: "user-exec", activeIf: null }
          }));
        } else if (cmdType === "show" && (cmdPartsLower[1] === "running-config" || cmdPartsLower[1] === "run")) {
          replies.push(
            "Building configuration...",
            "Current configuration:",
            "!",
            `hostname ${node.name}`
          );
          node.interfaces.forEach(i => {
            replies.push(
              `interface ${i.name}`,
              i.ip ? ` ip address ${i.ip} ${i.subnet}` : " no ip address"
            );
          });
          replies.push("!", "end");
        } else if (cmdType === "help") {
          replies.push(
            "Cisco Privileged EXEC Commands:",
            "  configure terminal / conf t    Enter global configuration mode",
            "  disable                        Exit Privileged EXEC mode",
            "  show running-config / show run Display active configs"
          );
        } else if (cmdType === "ping") {
          runPingCommand(cmdPartsLower[1], replies);
        } else {
          replies.push(`% Unknown command or computer name, or incomplete command.`);
        }
      } 
      else if (modeState.mode === "global-config") {
        if (cmdType === "interface" || cmdType === "int") {
          const ifName = cmdParts[1];
          if (!ifName) {
            replies.push("% Incomplete command.");
          } else {
            setCliModes(prev => ({
              ...prev,
              [consoleNodeId]: { mode: "interface-config", activeIf: ifName }
            }));
          }
        } else if (cmdType === "ip" && cmdPartsLower[1] === "route") {
          const dest = cmdParts[2];
          const mask = cmdParts[3];
          const gw = cmdParts[4];
          if (!dest || !mask || !gw) {
            replies.push("Syntax Error: Use 'ip route <destination> <mask;> <gateway>'");
          } else {
            setNodes(prev => prev.map(n => {
              if (n.id === consoleNodeId) {
                const updatedIf = n.interfaces.map(i => dest === "0.0.0.0" ? { ...i, gateway: gw } : i);
                const newConfigs = updatedIf.map(i => {
                  if (!i.ip) return "";
                  const cidr = i.subnet === "255.255.255.0" ? "24" : "30";
                  return `ip addr add ${i.ip}/${cidr} dev ${i.name}`;
                }).filter(Boolean);
                if (dest === "0.0.0.0") {
                  newConfigs.push(`ip route add default via ${gw}`);
                }
                return { ...n, interfaces: updatedIf, config: newConfigs };
              }
              return n;
            }));
            replies.push(`% Static route configured.`);
          }
        } else if (cmdType === "exit") {
          setCliModes(prev => ({
            ...prev,
            [consoleNodeId]: { mode: "privileged-exec", activeIf: null }
          }));
        } else if (cmdType === "help") {
          replies.push(
            "Cisco Global Configuration Commands:",
            "  interface <if>                 Enter interface configuration mode",
            "  ip route <dest> <mask;> <gw>   Configure static route",
            "  exit                           Return to Privileged EXEC mode"
          );
        } else {
          replies.push(`% Unknown command or computer name, or incomplete command.`);
        }
      } 
      else if (modeState.mode === "interface-config") {
        const activeIf = modeState.activeIf;
        if (cmdType === "ip" && cmdPartsLower[1] === "address") {
          const ip = cmdParts[2];
          const mask = cmdParts[3];
          if (!ip || !mask) {
            replies.push("Syntax Error: Use 'ip address <ip> <subnet_mask>'");
          } else {
            setNodes(prev => prev.map(n => {
              if (n.id === consoleNodeId && activeIf) {
                let interfaces = [...n.interfaces];
                const existing = interfaces.find(i => i.name === activeIf);
                if (existing) {
                  interfaces = interfaces.map(i => i.name === activeIf ? { ...i, ip, subnet: mask } : i);
                } else {
                  interfaces.push({ name: activeIf, ip, subnet: mask, gateway: "" });
                }

                const newConfigs = interfaces.map(i => {
                  if (!i.ip) return "";
                  const cidr = i.subnet === "255.255.255.0" ? "24" : "30";
                  return `ip addr add ${i.ip}/${cidr} dev ${i.name}`;
                }).filter(Boolean);
                
                const mainGw = interfaces.find(i => i.gateway)?.gateway;
                if (mainGw) {
                  newConfigs.push(`ip route add default via ${mainGw}`);
                }

                return { ...n, interfaces, config: newConfigs };
              }
              return n;
            }));
            replies.push(`% Interface ${activeIf} IP configured to ${ip}/${mask}.`);
          }
        } else if (cmdType === "no" && cmdPartsLower[1] === "shutdown") {
          replies.push(`%LINK-5-CHANGED: Interface ${activeIf}, changed state to up`);
        } else if (cmdType === "exit") {
          setCliModes(prev => ({
            ...prev,
            [consoleNodeId]: { mode: "global-config", activeIf: null }
          }));
        } else if (cmdType === "help") {
          replies.push(
            "Cisco Interface Configuration Commands:",
            "  ip address <ip> <mask>         Assign IP address and mask to interface",
            "  no shutdown / no shut          Enable interface link",
            "  exit                           Return to global configuration mode"
          );
        } else {
          replies.push(`% Unknown command or computer name, or incomplete command.`);
        }
      }
    } 
    // LINUX HOST MODE
    else {
      if (cmdType === "help") {
        replies.push(
          "Available Linux CLI commands:",
          "  help                           Show this help menu",
          "  ip addr add <ip/mask> dev <if> Configure IP address on interface",
          "  ip route add default via <ip>  Configure default gateway routing",
          "  ip addr show / ip link show    Display interface configurations",
          "  ip route show                  Display current routing tables",
          "  ifconfig                       Show classic network interface stats",
          "  ping <ip_address>              Test connectivity between hosts",
          "  clear                          Clear terminal console logs"
        );
      } else if (cmdType === "clear") {
        setTerminalLogs(prev => ({ ...prev, [consoleNodeId]: [] }));
        setCurrentCommand("");
        return;
      } else if (cmdType === "ifconfig") {
        node.interfaces.forEach(i => {
          replies.push(
            `${i.name}: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500`,
            `        inet ${i.ip || "0.0.0.0"}  netmask ${i.subnet}  broadcast ${i.ip ? i.ip.substring(0, i.ip.lastIndexOf('.')) + '.255' : "0.0.0.0"}`,
            `        ether 02:42:ac:11:00:02  txqueuelen 1000  (Ethernet)`,
            `        RX packets 42  bytes 3108 (3.1 KB)  RX errors 0  dropped 0  overruns 0  frame 0`,
            `        TX packets 42  bytes 3108 (3.1 KB)  TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0`,
            ""
          );
        });
      } else if (cmdType === "ip" && (cmdPartsLower[1] === "addr" || cmdPartsLower[1] === "address") && cmdPartsLower[2] === "add") {
        if (cmdPartsLower[4] === "dev") {
          const ipMask = cmdParts[3].split("/");
          const ip = ipMask[0];
          const cidr = ipMask[1] || "24";
          const dev = cmdParts[5];

          const subnet = cidr === "24" ? "255.255.255.0" : cidr === "30" ? "255.255.255.252" : "255.255.255.0";

          setNodes(prev => prev.map(n => {
            if (n.id === consoleNodeId) {
              const updatedIf = n.interfaces.map(i => i.name === dev ? { ...i, ip, subnet } : i);
              const newConfigs = updatedIf.map(i => {
                if (!i.ip) return "";
                const cIdr = i.subnet === "255.255.255.0" ? "24" : "30";
                return `ip addr add ${i.ip}/${cIdr} dev ${i.name}`;
              }).filter(Boolean);
              
              const gw = updatedIf.find(i => i.gateway)?.gateway;
              if (gw) {
                newConfigs.push(`ip route add default via ${gw}`);
              }

              return { ...n, interfaces: updatedIf, config: newConfigs };
            }
            return n;
          }));
          replies.push(`[Interface Config] Assigned IP address ${ip}/${cidr} to device ${dev}.`);
        } else {
          replies.push("Syntax Error: Use 'ip addr add <ip/subnet> dev <interface>'");
        }
      } else if (cmdType === "ip" && cmdPartsLower[1] === "route" && cmdPartsLower[2] === "add") {
        if (cmdPartsLower[3] === "default" && cmdPartsLower[4] === "via") {
          const gw = cmdParts[5];
          setNodes(prev => prev.map(n => {
            if (n.id === consoleNodeId) {
              const updatedIf = n.interfaces.map(i => ({ ...i, gateway: gw }));
              const newConfigs = updatedIf.map(i => {
                if (!i.ip) return "";
                const cIdr = i.subnet === "255.255.255.0" ? "24" : "30";
                return `ip addr add ${i.ip}/${cIdr} dev ${i.name}`;
              }).filter(Boolean);
              newConfigs.push(`ip route add default via ${gw}`);
              return { ...n, interfaces: updatedIf, config: newConfigs };
            }
            return n;
          }));
          replies.push(`[Route Config] Configured default gateway via ${gw}.`);
        } else {
          replies.push("Syntax Error: Use 'ip route add default via <gateway_ip>'");
        }
      } else if (cmdType === "ip" && (cmdPartsLower[1] === "addr" || cmdPartsLower[1] === "address" || cmdPartsLower[1] === "link") && cmdPartsLower[2] === "show") {
        node.interfaces.forEach(i => {
          replies.push(
            `${i.name}: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP`,
            `    link/ether 02:42:ac:11:00:02 brd ff:ff:ff:ff:ff:ff`,
            `    inet ${i.ip || "0.0.0.0"}/${i.subnet === "255.255.255.252" ? "30" : "24"} brd ${i.ip ? i.ip.substring(0, i.ip.lastIndexOf('.')) + '.255' : "0.0.0.0"} scope global ${i.name}`
          );
        });
      } else if (cmdType === "ip" && cmdPartsLower[1] === "route" && cmdPartsLower[2] === "show") {
        replies.push("Kernel routing table:");
        node.interfaces.forEach(i => {
          if (i.ip) {
            const netIp = i.ip.substring(0, i.ip.lastIndexOf('.')) + '.0';
            replies.push(`${netIp.padEnd(16)}${"0.0.0.0".padEnd(16)}${i.subnet.padEnd(16)}U     0      0        0 ${i.name}`);
          }
          if (i.gateway) {
            replies.push(`${"0.0.0.0".padEnd(16)}${i.gateway.padEnd(16)}${"0.0.0.0".padEnd(16)}UG    0      0        0 ${i.name}`);
          }
        });
      } else if (cmdType === "ping") {
        runPingCommand(cmdPartsLower[1], replies);
      } else {
        replies.push(`bash: ${cmdType}: command not found. Type 'help' to review commands.`);
      }
    }

    setTerminalLogs(prev => ({
      ...prev,
      [consoleNodeId]: [...(prev[consoleNodeId] || getLogsForNode(consoleNodeId)), ...replies]
    }));
    setCurrentCommand("");
  };

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col text-brand-text">
      <Sidebar activePath="/student/simulation" />

      <main className={`flex-grow w-full max-w-6xl mx-auto flex flex-col min-h-0 ${
        isFullscreen ? "fixed left-0 top-0 w-screen h-screen z-[120] bg-slate-950 p-3 max-w-full overflow-hidden" : "p-8 h-screen max-h-screen overflow-hidden"
      }`}>
        
        {/* Header Section */}
        <header className="mb-4 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan font-mono">Kathará Integration</span>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-2xl font-bold">{activeLabName}</h1>
                <span className="text-xs bg-brand-bg/50 border border-brand-border/40 text-brand-muted px-2.5 py-0.5 rounded-full font-bold select-none">
                  {nodes.length} nodes
                </span>
              </div>
            </div>

            {/* Real Ticking Stopwatch Timer */}
            {labStatus === "running" && (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[10px] font-bold px-3 py-1.5 rounded-xl animate-fade-in select-none self-end mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                ACTIVE TIME: {formatStopwatch(elapsedSeconds)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* CLI Console shortcut button on left side of the dropdown */}
            <button
              onClick={() => {
                if (selectedNodeId) {
                  setConsoleNodeId(selectedNodeId);
                  setIsConsoleOpen(!isConsoleOpen);
                } else {
                  alert("Please select a device node first to open its console CLI window!");
                }
              }}
              className="bg-brand-card hover:bg-brand-card-light/45 border border-brand-border text-brand-cyan p-2.5 rounded-xl cursor-pointer transition-all shadow-md animate-fade-in"
              title="Open selected node console terminal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="12" x="3" y="6" rx="2" /><path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M12 12h.01" /><path d="M9 14h6" /></svg>
            </button>

            <select
              onChange={(e) => {
                const idx = parseInt(e.target.value);
                if (!isNaN(idx)) loadTemplate(LAB_TEMPLATES[idx]);
              }}
              className="bg-brand-card border border-brand-border text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-brand-cyan/60 cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>Load Lab Preset Template...</option>
              {LAB_TEMPLATES.map((tmpl, idx) => (
                <option key={idx} value={idx}>{tmpl.name}</option>
              ))}
            </select>

            {labStatus === "stopped" ? (
              <button
                onClick={startLab}
                className="bg-emerald-600 hover:bg-emerald-700 text-brand-bg text-xs font-black py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg transition-transform hover:scale-[1.03]"
              >
                ▶ Start Kathará Lab
              </button>
            ) : (
              <button
                onClick={stopLab}
                className="bg-red-500 hover:bg-red-600 text-white text-xs font-black py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg transition-transform hover:scale-[1.03]"
              >
                ■ Stop Lab
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-brand-card hover:bg-brand-card-light/40 border border-brand-border text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/></svg>
                  Exit
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
                  Fullscreen
                </>
              )}
            </button>
          </div>
        </header>

        {/* Workbench Workspace Layout */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 mb-4 overflow-hidden">
          
          {/* Node Toolbar & Settings (Left Column) - Hidden entirely in fullscreen view */}
          {!isFullscreen && (
            <div className="lg:col-span-1 bg-brand-card border border-brand-border rounded-2xl p-5 flex flex-col gap-5 overflow-y-auto">
              
              {/* Draggable Components Palette using Cisco Standards */}
              <div>
                <h3 className="text-[10px] font-black text-brand-cyan uppercase tracking-widest mb-3 select-none">
                  Component Palette (Drag to Canvas)
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { type: "router", label: "Router" },
                    { type: "switch", label: "Switch" },
                    { type: "pc", label: "Host PC" },
                    { type: "laptop", label: "Laptop" },
                    { type: "server", label: "Server" },
                    { type: "printer", label: "Printer" },
                    { type: "ap", label: "Access Point" },
                    { type: "hub", label: "Hub" },
                    { type: "cable", label: "Cable Link" },
                    { type: "message", label: "Simple PDU" }
                  ].map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.type as NodeType)}
                      className="border p-2 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-grab transition-all text-center select-none bg-brand-bg/50 border-brand-border/60 hover:border-brand-cyan/40 hover:bg-brand-card-light/25"
                      title={
                        item.type === "message" 
                          ? "Drag and drop PDU on a node to configure diagnostics" 
                          : item.type === "cable"
                            ? "Drag and drop Cable on device node to begin wiring"
                            : "Drag component onto grid layout"
                      }
                    >
                      <div className="w-12 h-10 flex items-center justify-center select-none pointer-events-none">
                        {getCiscoDeviceSvg(item.type as NodeType)}
                      </div>
                      <span className="text-[9px] font-extrabold tracking-tight select-none pointer-events-none text-brand-text">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnostics feedback widget */}
              {(isWiringMode || packetSourceId) && (
                <div className="flex flex-col gap-2 border-t border-brand-border/30 pt-4 animate-fade-in">
                  <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest select-none">Action Prompt</span>
                  {isWiringMode && (
                    <div className="bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan p-2.5 rounded-xl text-[9px] leading-relaxed font-bold text-center">
                      Cabling Active. Source: {nodes.find(n => n.id === wiringStartNode)?.name || ""}. Select another target node on canvas to connect links.
                      <button
                        onClick={() => {
                          setIsWiringMode(false);
                          setWiringStartNode(null);
                        }}
                        className="mt-2 block w-full bg-brand-cyan/20 hover:bg-brand-cyan/40 text-brand-cyan py-1 rounded text-[8px] uppercase tracking-wider cursor-pointer font-bold"
                      >
                        Cancel Cabling
                      </button>
                    </div>
                  )}
                  {packetSourceId && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-2.5 rounded-xl text-[9px] leading-relaxed font-bold text-center">
                      PDU Source: {nodes.find(n => n.id === packetSourceId)?.name || ""}. Drag another Simple PDU from palette and drop on target device node to simulate.
                      <button
                        onClick={() => {
                          setPacketSourceId(null);
                          setPacketMode(null);
                        }}
                        className="mt-2 block w-full bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 py-1 rounded text-[8px] uppercase tracking-wider cursor-pointer font-bold"
                      >
                        Cancel PDU Test
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Connection Sidebar settings card */}
              {selectedConnectionId && (() => {
                const conn = connections.find(c => c.id === selectedConnectionId);
                if (!conn) return null;
                const fromNode = nodes.find(n => n.id === conn.fromNode);
                const toNode = nodes.find(n => n.id === conn.toNode);
                if (!fromNode || !toNode) return null;

                return (
                  <div className="border-t border-brand-border/30 pt-4 flex flex-col gap-3 flex-grow animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">Cable Selected</span>
                      <button
                        onClick={() => deleteConnection(conn.id)}
                        className="text-red-400 hover:text-red-500 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Delete Cable
                      </button>
                    </div>
                    <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-3.5 flex flex-col gap-2">
                      <div className="text-[10px] leading-relaxed">
                        <span className="font-bold text-brand-cyan">Source device: </span>
                        <span className="font-mono text-brand-muted">{fromNode.name} ({conn.fromPort})</span>
                      </div>
                      <div className="text-[10px] leading-relaxed">
                        <span className="font-bold text-brand-cyan">Target device: </span>
                        <span className="font-mono text-brand-muted">{toNode.name} ({conn.toPort})</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-brand-muted italic mt-1 leading-relaxed">
                      Click anywhere else on the empty canvas space to deselect this cable link.
                    </p>
                  </div>
                );
              })()}

              {/* Configuration Settings Panel */}
              {selectedNodeId && (() => {
                const node = nodes.find(n => n.id === selectedNodeId);
                if (!node) return null;
                return (
                  <div className="border-t border-brand-border/30 pt-4 flex flex-col gap-3.5 flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">Device Settings</span>
                      <button
                        onClick={() => deleteNode(node.id)}
                        className="text-red-400 hover:text-red-500 text-[10px] font-bold cursor-pointer"
                      >
                        Delete Node
                      </button>
                    </div>

                    <div className="bg-brand-bg/40 border border-brand-border/30 rounded-xl p-1 flex">
                      <button
                        onClick={() => setActiveConfigTab("physical")}
                        className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          activeConfigTab === "physical" 
                            ? "bg-brand-cyan text-brand-bg shadow-sm"
                            : "text-brand-muted hover:text-brand-text"
                        }`}
                      >
                        Physical Links
                      </button>
                      <button
                        onClick={() => setActiveConfigTab("ip")}
                        className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          activeConfigTab === "ip" 
                            ? "bg-brand-cyan text-brand-bg shadow-sm"
                            : "text-brand-muted hover:text-brand-text"
                        }`}
                      >
                        IP Settings
                      </button>
                    </div>

                    {activeConfigTab === "physical" ? (
                      /* PHYSICAL PORTS TAB */
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-bold text-brand-muted uppercase">Connected interfaces</span>
                        {node.type === "switch" || node.type === "hub" ? (
                          <span className="text-[10px] text-brand-muted/80 italic leading-relaxed">
                            Layer 2 local bridge structure. Frame routing is resolved automatically.
                          </span>
                        ) : node.interfaces.length === 0 ? (
                          <span className="text-[10px] text-brand-muted/80 italic">No cable interfaces connected.</span>
                        ) : (
                          <div className="space-y-1.5">
                            {node.interfaces.map((iface, idx) => (
                              <div key={idx} className="bg-brand-bg/20 border border-brand-border/30 p-2 rounded-xl text-[10px] flex justify-between items-center">
                                <span className="font-bold text-brand-cyan">{iface.name}</span>
                                <span className="font-mono text-brand-muted">{iface.ip ? `${iface.ip}/${iface.subnet === "255.255.255.0" ? "24" : "30"}` : "no ip address"}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* GRAPHICAL IP CONFIGURATION TAB */
                      <div className="flex flex-col gap-3">
                        {node.type === "switch" || node.type === "hub" ? (
                          <span className="text-[10px] text-brand-muted/80 italic leading-relaxed">
                            This is a Layer 2 hub/switch. Standard bridges do not support host IP allocations.
                          </span>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {/* Interface Selection */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-bold text-brand-muted uppercase">Select Interface</label>
                              <select
                                value={selectedInterface}
                                onChange={(e) => setSelectedInterface(e.target.value)}
                                className="w-full bg-brand-bg/50 border border-brand-border/40 text-[10px] text-brand-text rounded-lg py-1.5 px-2 focus:outline-none focus:border-brand-cyan/60"
                              >
                                {node.interfaces.map(i => (
                                  <option key={i.name} value={i.name}>{i.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* IP Address Field */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-bold text-brand-muted uppercase">IP Address</label>
                              <input
                                type="text"
                                value={configIp}
                                onChange={(e) => setConfigIp(e.target.value)}
                                placeholder="e.g. 192.168.1.10"
                                className="w-full bg-brand-bg/50 border border-brand-border/40 text-[10px] text-brand-text rounded-lg py-1.5 px-3 focus:outline-none focus:border-brand-cyan/60 font-mono"
                              />
                            </div>

                            {/* Subnet Mask Select */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-bold text-brand-muted uppercase">Subnet Mask</label>
                              <select
                                value={configSubnet}
                                onChange={(e) => setConfigSubnet(e.target.value)}
                                className="w-full bg-brand-bg/50 border border-brand-border/40 text-[10px] text-brand-text rounded-lg py-1.5 px-2 focus:outline-none focus:border-brand-cyan/60"
                              >
                                <option value="255.255.255.0">255.255.255.0 (/24)</option>
                                <option value="255.255.255.252">255.255.255.252 (/30)</option>
                              </select>
                            </div>

                            {/* Gateway Field */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-bold text-brand-muted uppercase">Default Gateway</label>
                              <input
                                type="text"
                                value={configGateway}
                                onChange={(e) => setConfigGateway(e.target.value)}
                                placeholder="e.g. 192.168.1.1"
                                className="w-full bg-brand-bg/50 border border-brand-border/40 text-[10px] text-brand-text rounded-lg py-1.5 px-3 focus:outline-none focus:border-brand-cyan/60 font-mono"
                              />
                            </div>

                            <button
                              onClick={applyIpConfig}
                              className="bg-brand-cyan hover:bg-brand-cyan/85 text-brand-bg font-bold py-2 rounded-xl text-[10px] uppercase tracking-wider cursor-pointer transition-colors mt-2"
                            >
                              Apply Interface Config
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Interactive Topology Canvas Panel (Fills 100% space in Fullscreen mode) */}
          <div className={`${isFullscreen ? "lg:col-span-4 h-full" : "lg:col-span-3"} bg-slate-950 border border-brand-border rounded-2xl relative overflow-hidden flex flex-col min-h-0`}>
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 select-none pointer-events-none opacity-[0.03] z-0">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="canvas-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="2" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#canvas-grid)" />
              </svg>
            </div>

            {/* Connection Cables SVG */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full z-10">
              <g>
                {connections.map((c) => {
                  const from = nodes.find(n => n.id === c.fromNode);
                  const to = nodes.find(n => n.id === c.toNode);
                  if (!from || !to) return null;

                  const isSelectedCable = selectedConnectionId === c.id;

                  // Vector offsets for ports labeling
                  const dx = to.x - from.x;
                  const dy = to.y - from.y;
                  const len = Math.sqrt(dx * dx + dy * dy) || 1;
                  const ux = dx / len;
                  const uy = dy / len;

                  // Place labels 45px away from nodes
                  const labelFromX = from.x + ux * 45;
                  const labelFromY = from.y + uy * 45;
                  const labelToX = to.x - ux * 45;
                  const labelToY = to.y - uy * 45;

                  return (
                    <g key={c.id} className="pointer-events-auto">
                      <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke={isSelectedCable ? "#f59e0b" : "#00f2fe"}
                        strokeWidth="3.5"
                        strokeOpacity={isSelectedCable ? "0.95" : "0.45"}
                      />
                      {labStatus === "running" && (
                        <line
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          stroke={isSelectedCable ? "#f59e0b" : "#00f2fe"}
                          strokeWidth="3.5"
                          strokeDasharray="8, 12"
                          className="animate-dash"
                          style={{
                            strokeDashoffset: 100,
                            animation: "dash 3s linear infinite"
                          }}
                        />
                      )}

                      {/* Transparent click catcher path to make clicking cables extremely easy */}
                      <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke="transparent"
                        strokeWidth="12"
                        className="cursor-pointer hover:stroke-brand-cyan/20 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConnectionId(c.id);
                          setSelectedNodeId(null);
                        }}
                      />
                      
                      {/* Port names labels near ends */}
                      <text
                        x={labelFromX}
                        y={labelFromY}
                        fill="#00f2fe"
                        fontSize="8px"
                        fontWeight="bold"
                        className="bg-slate-950 font-mono select-none"
                        textAnchor="middle"
                      >
                        {c.fromPort}
                      </text>
                      <text
                        x={labelToX}
                        y={labelToY}
                        fill="#00f2fe"
                        fontSize="8px"
                        fontWeight="bold"
                        className="bg-slate-950 font-mono select-none"
                        textAnchor="middle"
                      >
                        {c.toPort}
                      </text>

                      {/* Cable midpoint delete circular badge overlay */}
                      {isSelectedCable && (() => {
                        const midX = from.x + (to.x - from.x) / 2;
                        const midY = from.y + (to.y - from.y) / 2;
                        return (
                          <g
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConnection(c.id);
                            }}
                            className="cursor-pointer"
                          >
                            <circle cx={midX} cy={midY} r="8" fill="#ef4444" stroke="white" strokeWidth="1" />
                            <text x={midX} y={midY + 2.5} fill="white" fontSize="8px" fontWeight="black" textAnchor="middle">✕</text>
                          </g>
                        );
                      })()}
                    </g>
                  );
                })}

                {/* Rubberband trailing cabling guide line */}
                {isWiringMode && wiringStartNode && (() => {
                  const from = nodes.find(n => n.id === wiringStartNode);
                  if (!from) return null;
                  return (
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={canvasMousePos.x}
                      y2={canvasMousePos.y}
                      stroke="#00f2fe"
                      strokeWidth="2.5"
                      strokeDasharray="5, 5"
                      className="animate-pulse"
                    />
                  );
                })()}
              </g>
            </svg>

            {/* Droppable and Draggable Canvas Area */}
            <div
              id="canvas-pane"
              className="flex-grow w-full relative z-20 select-none cursor-crosshair min-h-[420px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={() => {
                setSelectedNodeId(null);
                setSelectedConnectionId(null);
              }}
            >
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none z-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted/40 mb-3"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 17V9h6v8" /><path d="M9 13h6" /></svg>
                  <p className="text-xs font-extrabold text-brand-muted">Topology Workspace Canvas</p>
                  <p className="text-[10px] text-brand-muted/75 mt-1 max-w-sm">
                    Drag and drop network devices from the palette menu. Drag and drop Cable Link on node to begin wiring connection bridges. Double click device nodes to open active consoles.
                  </p>
                </div>
              )}

              {/* Node cards */}
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isWiringCandidate = isWiringMode && wiringStartNode === node.id;

                return (
                  <div
                    key={node.id}
                    onMouseDown={(e) => handleNodeMouseDown(e, node)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(node.id);
                      setSelectedConnectionId(null);
                    }}
                    onDoubleClick={() => {
                      setConsoleNodeId(node.id);
                      setIsConsoleOpen(true);
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all cursor-move select-none group/node ${
                      isWiringCandidate
                        ? "bg-brand-cyan/20 border-brand-cyan shadow-lg shadow-brand-cyan/25 animate-pulse animate-bounce"
                        : isSelected
                          ? "bg-brand-card/95 border-brand-cyan shadow-lg shadow-brand-cyan/15 scale-105"
                          : "bg-brand-card border-brand-border/60 hover:border-brand-cyan/45"
                    }`}
                    style={{ left: node.x, top: node.y }}
                  >
                    {/* Device Icon using strictly accurate Cisco Packet Tracer symbols */}
                    <div className="w-14 h-10 flex items-center justify-center mb-1.5 pointer-events-none select-none">
                      {getCiscoDeviceSvg(node.type)}
                    </div>

                    <span className="text-[9px] font-extrabold font-mono tracking-tight text-brand-text uppercase leading-none">
                      {node.name}
                    </span>

                    {/* Small CLI console quick link trigger badge */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConsoleNodeId(node.id);
                        setIsConsoleOpen(true);
                      }}
                      className="absolute -top-2.5 -right-2.5 bg-brand-cyan text-brand-bg rounded-full w-5 h-5 flex items-center justify-center shadow-lg border border-brand-border/40 hover:scale-110 active:scale-95 cursor-pointer transition-transform duration-100"
                      title="Open CLI terminal console"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="12" x="3" y="6" rx="2" /><path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M12 12h.01" /><path d="M9 14h6" /></svg>
                    </button>
                  </div>
                );
              })}

              {/* VISUAL PACKET ENVELOPE TRANSMISSION ANIMATION (Cisco Simple PDU shape) */}
              {packetVisible && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-8 bg-amber-500 text-brand-bg rounded border-2 border-white shadow-xl shadow-amber-500/50 flex items-center justify-center text-xl font-bold z-[99] pointer-events-none transition-all duration-75 select-none animate-pulse"
                  style={{ left: packetPos.x, top: packetPos.y }}
                >
                  ✉
                </div>
              )}

              {/* Floating Horizontal Components Palette Dock at bottom center in Fullscreen mode */}
              {isFullscreen && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur border border-brand-cyan/35 rounded-2xl py-2 px-4 flex items-center gap-3 shadow-2xl border-brand-cyan/20">
                  <div className="flex items-center gap-2.5">
                    {[
                      { type: "router", label: "Router" },
                      { type: "switch", label: "Switch" },
                      { type: "pc", label: "PC" },
                      { type: "laptop", label: "Laptop" },
                      { type: "server", label: "Server" },
                      { type: "printer", label: "Printer" },
                      { type: "ap", label: "AP" },
                      { type: "hub", label: "Hub" },
                      { type: "cable", label: "Cable" },
                      { type: "message", label: "PDU" }
                    ].map((item) => (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.type as NodeType)}
                        className="border p-1.5 px-2.5 rounded-xl flex flex-col items-center justify-center gap-1 cursor-grab transition-all bg-brand-bg/50 border-brand-border/60 hover:border-brand-cyan/50 hover:bg-brand-card-light/20"
                        title={item.label}
                      >
                        <div className="w-8 h-6 flex items-center justify-center select-none pointer-events-none scale-75">
                          {getCiscoDeviceSvg(item.type as NodeType)}
                        </div>
                        <span className="text-[8px] font-extrabold tracking-tight select-none pointer-events-none text-brand-text">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FLOATING PORT INTERFACE SELECTOR MODAL FOR CABLING */}
              {pendingConnection && (() => {
                const fromNode = nodes.find(n => n.id === pendingConnection.fromNode);
                const toNode = nodes.find(n => n.id === pendingConnection.toNode);
                if (!fromNode || !toNode) return null;

                const fromPorts = getAvailablePorts(fromNode, connections);
                const toPorts = getAvailablePorts(toNode, connections);

                return (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[110] flex items-center justify-center animate-fade-in p-4">
                    <div className="bg-brand-card border border-brand-border w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
                      <div>
                        <h3 className="text-sm font-black text-brand-cyan uppercase tracking-wider">Cabling Port Selection</h3>
                        <p className="text-[10px] text-brand-muted mt-1">Select available interface ports to bridge the connection.</p>
                      </div>

                      <div className="flex flex-col gap-3">
                        {/* Node A Port Select */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-brand-muted uppercase">Port on {fromNode.name}</label>
                          <select
                            id="port-select-from"
                            defaultValue={fromPorts.find(p => !p.inUse)?.name || fromPorts[0].name}
                            className="w-full bg-brand-bg border border-brand-border/40 text-xs text-brand-text rounded-lg py-2 px-2.5 focus:outline-none focus:border-brand-cyan/60 font-mono"
                          >
                            {fromPorts.map(p => (
                              <option key={p.name} value={p.name} disabled={p.inUse}>
                                {p.name} {p.inUse ? "(in use)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Node B Port Select */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-brand-muted uppercase">Port on {toNode.name}</label>
                          <select
                            id="port-select-to"
                            defaultValue={toPorts.find(p => !p.inUse)?.name || toPorts[0].name}
                            className="w-full bg-brand-bg border border-brand-border/40 text-xs text-brand-text rounded-lg py-2 px-2.5 focus:outline-none focus:border-brand-cyan/60 font-mono"
                          >
                            {toPorts.map(p => (
                              <option key={p.name} value={p.name} disabled={p.inUse}>
                                {p.name} {p.inUse ? "(in use)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setPendingConnection(null)}
                          className="flex-1 bg-brand-bg/50 border border-brand-border text-xs font-bold py-2 rounded-xl text-brand-muted hover:text-brand-text cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            const fromPortSelect = document.getElementById("port-select-from") as HTMLSelectElement;
                            const toPortSelect = document.getElementById("port-select-to") as HTMLSelectElement;
                            if (fromPortSelect && toPortSelect) {
                              confirmConnection(fromPortSelect.value, toPortSelect.value);
                            }
                          }}
                          className="flex-1 bg-brand-cyan hover:bg-brand-cyan/85 text-brand-bg font-bold py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-colors"
                        >
                          Connect Ports
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* FLOATING DRAGGABLE CLI TERMINAL WINDOW WITH GLASSMORPHISM TRANSLUCENCY */}
              {isConsoleOpen && consoleNodeId && (
                <div
                  className="absolute w-[440px] bg-slate-950/65 backdrop-blur-md border border-brand-border/85 rounded-2xl flex flex-col overflow-hidden shadow-2xl z-[80] animate-fade-in hover:bg-slate-950/95 transition-all duration-300"
                  style={{ left: consolePos.x, top: consolePos.y }}
                >
                  {/* Console Header */}
                  <div
                    onMouseDown={handleConsoleMouseDown}
                    className="bg-brand-card/80 border-b border-brand-border/40 px-4 py-2.5 flex items-center justify-between text-xs font-bold cursor-move select-none active:cursor-grabbing"
                  >
                    <span className="text-brand-cyan flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
                      Console Console CLI: {consoleNodeId}
                    </span>
                    <button
                      onClick={() => setIsConsoleOpen(false)}
                      className="text-brand-muted hover:text-red-400 text-xs font-extrabold cursor-pointer transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Terminal body */}
                  <div className="h-52 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed text-slate-300 select-text">
                    <div className="space-y-1">
                      {getLogsForNode(consoleNodeId).map((log, idx) => (
                        <div key={idx} className="whitespace-pre-wrap">{log}</div>
                      ))}
                      <div ref={terminalEndRef} />
                    </div>
                  </div>

                  {/* Input form */}
                  <form onSubmit={executeCliCommand} className="bg-brand-card/85 border-t border-brand-border/40 p-2 flex gap-1">
                    <span className="text-brand-cyan font-mono text-[11px] pl-2 pt-1 select-none">{getCliPrompt(consoleNodeId)}</span>
                    <input
                      type="text"
                      value={currentCommand}
                      onChange={(e) => setCurrentCommand(e.target.value)}
                      placeholder="Enter command (e.g. 'help', 'ip addr add', 'ping')..."
                      className="flex-grow bg-transparent text-[11px] text-brand-text focus:outline-none border-none pl-1 focus:ring-0 font-mono"
                    />
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Styled global animations */}
      <style jsx global>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
