"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";

type NodeType = "router" | "switch" | "pc" | "laptop" | "server" | "printer" | "ap" | "hub" | "message" | "cable" | "cable-straight" | "cable-crossover" | "cable-fiber";

type NetworkNode = {
  id: string;
  name: string;
  type: "router" | "switch" | "pc" | "laptop" | "server" | "printer" | "ap" | "hub";
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
  cableType?: "straight" | "crossover" | "fiber";
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
      { id: "c1", fromNode: "pc1", fromPort: "eth0", toNode: "r1", toPort: "eth0", cableType: "straight" as const },
      { id: "c2", fromNode: "r1", fromPort: "eth1", toNode: "r2", toPort: "eth1", cableType: "crossover" as const },
      { id: "c3", fromNode: "r2", fromPort: "eth0", toNode: "pc2", toPort: "eth0", cableType: "straight" as const },
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
      { id: "c1", fromNode: "pc1", fromPort: "eth0", toNode: "sw1", toPort: "port1", cableType: "straight" as const },
      { id: "c2", fromNode: "pc2", fromPort: "eth0", toNode: "sw1", toPort: "port2", cableType: "straight" as const },
      { id: "c3", fromNode: "pc3", fromPort: "eth0", toNode: "sw1", toPort: "port3", cableType: "straight" as const }
    ]
  },
  {
    name: "Client-Server Web Network",
    description: "Connect standard local hosts to an enterprise server via an intermediate router and switch bridge.",
    nodes: [
      { id: "pc1", name: "pc1", type: "pc" as const, x: 140, y: 150, interfaces: [{ name: "eth0", ip: "192.168.1.10", subnet: "255.255.255.0", gateway: "192.168.1.1" }], config: ["ip addr add 192.168.1.10/24 dev eth0", "ip route add default via 192.168.1.1"] },
      { id: "laptop1", name: "laptop1", type: "laptop" as const, x: 140, y: 350, interfaces: [{ name: "eth0", ip: "192.168.1.20", subnet: "255.255.255.0", gateway: "192.168.1.1" }], config: ["ip addr add 192.168.1.20/24 dev eth0", "ip route add default via 192.168.1.1"] },
      { id: "sw1", name: "sw1", type: "switch" as const, x: 340, y: 250, interfaces: [], config: [] },
      { id: "r1", name: "r1", type: "router" as const, x: 540, y: 250, interfaces: [{ name: "eth0", ip: "192.168.1.1", subnet: "255.255.255.0", gateway: "" }, { name: "eth1", ip: "10.0.0.1", subnet: "255.255.255.252", gateway: "" }], config: ["ip addr add 192.168.1.1/24 dev eth0", "ip addr add 10.0.0.1/30 dev eth1"] },
      { id: "server1", name: "web_server", type: "server" as const, x: 740, y: 250, interfaces: [{ name: "eth0", ip: "10.0.0.2", subnet: "255.255.255.252", gateway: "10.0.0.1" }], config: ["ip addr add 10.0.0.2/30 dev eth0", "ip route add default via 10.0.0.1"] }
    ],
    connections: [
      { id: "c1", fromNode: "pc1", fromPort: "eth0", toNode: "sw1", toPort: "port1", cableType: "straight" as const },
      { id: "c2", fromNode: "laptop1", fromPort: "eth0", toNode: "sw1", toPort: "port2", cableType: "straight" as const },
      { id: "c3", fromNode: "sw1", fromPort: "port3", toNode: "r1", toPort: "eth0", cableType: "straight" as const },
      { id: "c4", fromNode: "r1", fromPort: "eth1", toNode: "server1", toPort: "eth0", cableType: "crossover" as const }
    ]
  },
  {
    name: "Triangular Switch Loop Mesh",
    description: "Explore loop detection, STP, and local broadcast behaviors with a redundant switch topology.",
    nodes: [
      { id: "sw1", name: "sw1", type: "switch" as const, x: 420, y: 130, interfaces: [], config: [] },
      { id: "sw2", name: "sw2", type: "switch" as const, x: 300, y: 310, interfaces: [], config: [] },
      { id: "sw3", name: "sw3", type: "switch" as const, x: 540, y: 310, interfaces: [], config: [] },
      { id: "pc1", name: "pc1", type: "pc" as const, x: 150, y: 310, interfaces: [{ name: "eth0", ip: "192.168.1.10", subnet: "255.255.255.0", gateway: "" }], config: ["ip addr add 192.168.1.10/24 dev eth0"] },
      { id: "pc2", name: "pc2", type: "pc" as const, x: 690, y: 310, interfaces: [{ name: "eth0", ip: "192.168.1.20", subnet: "255.255.255.0", gateway: "" }], config: ["ip addr add 192.168.1.20/24 dev eth0"] }
    ],
    connections: [
      { id: "c1", fromNode: "sw1", fromPort: "port1", toNode: "sw2", toPort: "port1", cableType: "crossover" as const },
      { id: "c2", fromNode: "sw2", fromPort: "port2", toNode: "sw3", toPort: "port2", cableType: "crossover" as const },
      { id: "c3", fromNode: "sw3", fromPort: "port3", toNode: "sw1", toPort: "port3", cableType: "crossover" as const },
      { id: "c4", fromNode: "pc1", fromPort: "eth0", toNode: "sw2", toPort: "port4", cableType: "straight" as const },
      { id: "c5", fromNode: "pc2", fromPort: "eth0", toNode: "sw3", toPort: "port4", cableType: "straight" as const }
    ]
  },
  {
    name: "Enterprise LAN with AP",
    description: "An office SOHO setup linking wired Ethernet hosts, a local server, and a wireless AP to an edge router.",
    nodes: [
      { id: "r1", name: "gateway_router", type: "router" as const, x: 420, y: 90, interfaces: [{ name: "eth0", ip: "192.168.1.1", subnet: "255.255.255.0", gateway: "" }], config: ["ip addr add 192.168.1.1/24 dev eth0"] },
      { id: "sw1", name: "core_switch", type: "switch" as const, x: 420, y: 220, interfaces: [], config: [] },
      { id: "ap1", name: "ap1", type: "ap" as const, x: 230, y: 220, interfaces: [], config: [] },
      { id: "server1", name: "file_server", type: "server" as const, x: 610, y: 220, interfaces: [{ name: "eth0", ip: "192.168.1.5", subnet: "255.255.255.0", gateway: "192.168.1.1" }], config: ["ip addr add 192.168.1.5/24 dev eth0", "ip route add default via 192.168.1.1"] },
      { id: "pc1", name: "pc1", type: "pc" as const, x: 140, y: 350, interfaces: [{ name: "eth0", ip: "192.168.1.10", subnet: "255.255.255.0", gateway: "192.168.1.1" }], config: ["ip addr add 192.168.1.10/24 dev eth0", "ip route add default via 192.168.1.1"] },
      { id: "laptop1", name: "laptop1", type: "laptop" as const, x: 280, y: 350, interfaces: [{ name: "eth0", ip: "192.168.1.11", subnet: "255.255.255.0", gateway: "192.168.1.1" }], config: ["ip addr add 192.168.1.11/24 dev eth0", "ip route add default via 192.168.1.1"] }
    ],
    connections: [
      { id: "c1", fromNode: "r1", fromPort: "eth0", toNode: "sw1", toPort: "port1", cableType: "straight" as const },
      { id: "c2", fromNode: "ap1", fromPort: "port1", toNode: "sw1", toPort: "port2", cableType: "straight" as const },
      { id: "c3", fromNode: "server1", fromPort: "eth0", toNode: "sw1", toPort: "port3", cableType: "straight" as const },
      { id: "c4", fromNode: "pc1", fromPort: "eth0", toNode: "ap1", toPort: "port2", cableType: "straight" as const },
      { id: "c5", fromNode: "laptop1", fromPort: "eth0", toNode: "ap1", toPort: "port3", cableType: "straight" as const }
    ]
  }
];

// Physical Cisco Device SVG renderer helper
function getCiscoDeviceSvg(type: NodeType) {
  switch (type) {
    case "router":
      return (
        <svg viewBox="0 0 48 32" className="w-16 h-11" fill="none" stroke="currentColor" strokeWidth="1">
          {/* 3D cylindrical base */}
          <path d="M 6 13 A 18 6 0 0 0 42 13 L 42 19 A 18 6 0 0 1 6 19 Z" fill="url(#router3dGrad)" stroke="#475569" strokeWidth="1.5" />
          {/* Cylinder top face */}
          <ellipse cx="24" cy="13" rx="18" ry="6" fill="#64748b" stroke="#475569" strokeWidth="1.5" />
          {/* Cisco Arrows on top */}
          <path d="M 12 13 L 18 13" stroke="#f1f5f9" strokeWidth="1.5" />
          <path d="M 30 13 L 36 13" stroke="#f1f5f9" strokeWidth="1.5" />
          <path d="M 24 10 L 24 16" stroke="#f1f5f9" strokeWidth="1.5" />
          <path d="M 14 11 L 12 13 L 14 15" stroke="#f1f5f9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 34 11 L 36 13 L 34 15" stroke="#f1f5f9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 22 12 L 24 10 L 26 12" stroke="#f1f5f9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 22 14 L 24 16 L 26 14" stroke="#f1f5f9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="router3dGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "switch":
      return (
        <svg viewBox="0 0 48 32" className="w-16 h-11" fill="none" stroke="currentColor" strokeWidth="1">
          {/* 3D bottom-right extrusion */}
          <path d="M 6 12 L 36 12 L 42 16 L 42 22 L 12 22 L 6 16 Z" fill="url(#switch3dGrad)" stroke="#475569" strokeWidth="1.5" />
          {/* Top face */}
          <path d="M 6 12 L 36 12 L 42 16 L 12 16 Z" fill="#64748b" stroke="#475569" strokeWidth="1.5" />
          {/* Front face */}
          <path d="M 6 16 L 12 16 L 12 22 L 6 22 Z" fill="#334155" stroke="#475569" strokeWidth="1" />
          {/* Side face */}
          <path d="M 12 16 L 42 16 L 42 22 L 12 22 Z" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          {/* Port holes/details on the front */}
          <rect x="15" y="18" width="3" height="2" fill="#475569" />
          <rect x="20" y="18" width="3" height="2" fill="#475569" />
          <rect x="25" y="18" width="3" height="2" fill="#475569" />
          <rect x="30" y="18" width="3" height="2" fill="#475569" />
          <rect x="35" y="18" width="3" height="2" fill="#475569" />
          <defs>
            <linearGradient id="switch3dGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "pc":
      return (
        <svg viewBox="0 0 48 36" className="w-13 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Monitor bezel */}
          <rect x="4" y="4" width="22" height="16" rx="1.5" fill="#64748b" stroke="#475569" strokeWidth="1.5" />
          {/* Inner screen */}
          <rect x="7" y="6" width="16" height="11" fill="#94a3b8" />
          {/* Stand */}
          <path d="M 12 20 L 10 26 L 20 26 L 18 20 Z" fill="#475569" stroke="#475569" strokeWidth="1.5" />
          {/* PC tower case */}
          <rect x="30" y="6" width="10" height="20" rx="1" fill="url(#pcGrad)" stroke="#475569" strokeWidth="1.5" />
          {/* PC tower slot / button */}
          <line x1="33" y1="10" x2="37" y2="10" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx="35" cy="20" r="1.5" fill="#22c55e" stroke="none" />
          {/* Keyboard */}
          <path d="M 6 29 L 24 29" stroke="#475569" strokeWidth="2" />
          <defs>
            <linearGradient id="pcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "laptop":
      return (
        <svg viewBox="0 0 48 40" className="w-13 h-11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Open screen */}
          <rect x="10" y="6" width="28" height="18" rx="1" fill="#64748b" stroke="#475569" strokeWidth="1.5" />
          <rect x="12" y="8" width="24" height="14" fill="#94a3b8" />
          {/* Keyboard base */}
          <path d="M 4 24 L 44 24 L 40 32 L 8 32 Z" fill="#475569" stroke="#475569" strokeWidth="1.5" />
          {/* Trackpad */}
          <rect x="21" y="28" width="6" height="2" fill="#334155" stroke="none" />
        </svg>
      );
    case "server":
      return (
        <svg viewBox="0 0 48 48" className="w-13 h-13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Main 3D column */}
          <path d="M 12 8 L 30 8 L 36 12 L 36 40 L 18 40 L 12 36 Z" fill="url(#server3dGrad)" stroke="#475569" strokeWidth="1.5" />
          {/* Front face */}
          <path d="M 12 8 L 18 12 L 18 40 L 12 36 Z" fill="#334155" stroke="#475569" strokeWidth="1.5" />
          {/* Side face */}
          <path d="M 18 12 L 36 12 L 36 40 L 18 40 Z" fill="#64748b" stroke="#475569" strokeWidth="1.5" />
          {/* Details on front face */}
          <line x1="22" y1="16" x2="32" y2="16" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="22" y1="20" x2="32" y2="20" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="22" y1="24" x2="32" y2="24" stroke="#1e293b" strokeWidth="1.5" />
          <circle cx="24" cy="30" r="1.5" fill="#22c55e" stroke="none" />
          <defs>
            <linearGradient id="server3dGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "printer":
      return (
        <svg viewBox="0 0 48 48" className="w-13 h-13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Paper tray back */}
          <path d="M 14 12 L 34 12 L 34 20 L 14 20 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
          {/* Printer body */}
          <rect x="6" y="18" width="36" height="16" rx="2" fill="url(#printerGrad)" stroke="#475569" strokeWidth="1.5" />
          {/* Front output slot */}
          <rect x="10" y="24" width="28" height="4" rx="0.5" fill="#0f172a" />
          {/* Output paper sheet */}
          <path d="M 14 26 L 34 26 L 34 38 L 14 38 Z" fill="#f8fafc" stroke="#475569" strokeWidth="1" />
          <defs>
            <linearGradient id="printerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "ap":
      return (
        <svg viewBox="0 0 48 38" className="w-13 h-11" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          {/* 3D cylindrical base */}
          <path d="M 6 18 A 18 6 0 0 0 42 18 L 42 24 A 18 6 0 0 1 6 24 Z" fill="url(#apGrad)" stroke="#475569" strokeWidth="1.5" />
          {/* Cylinder top face */}
          <ellipse cx="24" cy="18" rx="18" ry="6" fill="#64748b" stroke="#475569" strokeWidth="1.5" />
          {/* Antennas on left and right */}
          <line x1="12" y1="18" x2="12" y2="4" stroke="#475569" strokeWidth="2" />
          <line x1="36" y1="18" x2="36" y2="4" stroke="#475569" strokeWidth="2" />
          <circle cx="12" cy="4" r="1.5" fill="#475569" stroke="none" />
          <circle cx="36" cy="4" r="1.5" fill="#475569" stroke="none" />
          {/* Light dot */}
          <circle cx="24" cy="18" r="1.2" fill="#22c55e" stroke="none" />
          <defs>
            <linearGradient id="apGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "hub":
      return (
        <svg viewBox="0 0 48 32" className="w-16 h-11" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M 6 12 L 36 12 L 42 16 L 42 22 L 12 22 L 6 16 Z" fill="url(#hubGrad)" stroke="#475569" strokeWidth="1.5" />
          <path d="M 6 12 L 36 12 L 42 16 L 12 16 Z" fill="#475569" stroke="#475569" strokeWidth="1.5" />
          <path d="M 6 16 L 12 16 L 12 22 L 6 22 Z" fill="#334155" stroke="#475569" strokeWidth="1" />
          <path d="M 12 16 L 42 16 L 42 22 L 12 22 Z" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          {/* Central hub connection indicator lines */}
          <line x1="18" y1="19" x2="36" y2="19" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="20" cy="19" r="1.5" fill="#22c55e" stroke="none" />
          <circle cx="27" cy="19" r="1.5" fill="#22c55e" stroke="none" />
          <circle cx="34" cy="19" r="1.5" fill="#22c55e" stroke="none" />
          <defs>
            <linearGradient id="hubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "cable":
    case "cable-straight":
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-brand-cyan" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="3" />
        </svg>
      );
    case "cable-crossover":
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-brand-cyan" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="3" strokeDasharray="4,4" />
        </svg>
      );
    case "cable-fiber":
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="3" />
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
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [activeLabName, setActiveLabName] = useState("Custom Topology");
  const [labStatus, setLabStatus] = useState<"stopped" | "starting" | "running">("stopped");

  // Real Ticking Stopwatch Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [labId, setLabId] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  // Security / Anti-Cheating States
  const [labTimeRemaining, setLabTimeRemaining] = useState<number | null>(null);
  const [secureFullscreenActive, setSecureFullscreenActive] = useState(false);
  const [securityWarningsLeft, setSecurityWarningsLeft] = useState(3);
  const [isLabLocked, setIsLabLocked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const lId = params.get("labId");
      const mId = params.get("moduleId");
      if (lId) {
        setLabId(lId);
        // Set dynamic time limits: ipv4-addressing=10m, host-cabling=5m, router-config=8m, static-routing=12m
        const limit = lId === "ipv4-addressing" ? 600 : lId === "host-cabling" ? 300 : lId === "router-config" ? 480 : 720;
        setLabTimeRemaining(limit);

        setActiveLabName(`Lab Challenge: ${
          lId === "ipv4-addressing"
            ? "IPv4 Static Addressing"
            : lId === "host-cabling"
              ? "Local Host Cabling"
              : lId === "router-config"
                ? "Gateway Router Configuration"
                : "Inter-network Static Routing"
        }`);
      }
      if (mId) {
        setActiveModuleId(mId);
      }
    }
  }, []);

  // Full Screen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Wiring state
  const [isWiringMode, setIsWiringMode] = useState(false);
  const [wiringStartNode, setWiringStartNode] = useState<string | null>(null);
  const [canvasMousePos, setCanvasMousePos] = useState({ x: 0, y: 0 });
  const [wiringCableType, setWiringCableType] = useState<"straight" | "crossover" | "fiber" | null>(null);
  const [isCableMenuOpen, setIsCableMenuOpen] = useState(false);

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

  // Selection Box State
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
  } | null>(null);
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [isResizingBox, setIsResizingBox] = useState(false);
  const [boxDragStart, setBoxDragStart] = useState({ x: 0, y: 0 });
  const [initialBoxPos, setInitialBoxPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [initialNodesPos, setInitialNodesPos] = useState<Record<string, { x: number; y: number }>>({});

  // Packet received animation checkmark state
  const [receivedCheckNodeId, setReceivedCheckNodeId] = useState<string | null>(null);

  // Terminal Console (Floating Draggable Window)
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleNodeId, setConsoleNodeId] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<Record<string, string[]>>({});
  const [currentCommand, setCurrentCommand] = useState("");
  const [consolePos, setConsolePos] = useState({ x: 320, y: 150 });
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);
  const [consoleDragStart, setConsoleDragStart] = useState({ x: 0, y: 0 });
  const [cliModes, setCliModes] = useState<Record<string, { mode: string; activeIf: string | null }>>({});
  // Custom Modal dialogs state
  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "alert" | "confirm";
    onConfirm?: () => void;
    onCancel?: () => void;
  } | null>(null);

  const showCustomAlert = (message: string, title: string = "Simulation Notification") => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      type: "alert"
    });
  };

  const showCustomConfirm = (message: string, onConfirm: () => void, title: string = "Simulation Confirmation") => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      type: "confirm",
      onConfirm
    });
  };

  const checkTopologyConnectivity = (startNodeId: string, endNodeId: string): boolean => {
    const visited = new Set<string>();
    const queue = [startNodeId];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === endNodeId) return true;
      visited.add(current);

      connections.forEach(c => {
        if (c.fromNode === current && !visited.has(c.toNode)) {
          queue.push(c.toNode);
        } else if (c.toNode === current && !visited.has(c.fromNode)) {
          queue.push(c.fromNode);
        }
      });
    }

    return false;
  };

  const getLiveProgress = () => {
    if (!labId) return { percent: 0, checks: [] };

    const checks: { label: string; passed: boolean }[] = [];

    if (labId === "ipv4-addressing") {
      const pcs = nodes.filter(n => n.type === "pc");
      const pc1 = pcs.find(pc => pc.interfaces.some(i => i.ip === "192.168.1.10"));
      const pc2 = pcs.find(pc => pc.interfaces.some(i => i.ip === "192.168.1.20"));
      
      checks.push({
        label: "Configure PC1 with IP 192.168.1.10",
        passed: !!pc1
      });
      checks.push({
        label: "Configure PC2 with IP 192.168.1.20",
        passed: !!pc2
      });
      checks.push({
        label: "Connect PC1 and PC2 with a link",
        passed: !!(pc1 && pc2 && checkTopologyConnectivity(pc1.id, pc2.id))
      });
      
      const hasPingSuccess = pc1 ? (terminalLogs[pc1.id] || []).some(line => line.includes("4 received") && line.includes("0% packet loss")) : false;
      checks.push({
        label: "Successful ping between PC1 and PC2",
        passed: hasPingSuccess
      });

    } else if (labId === "host-cabling") {
      const pc = nodes.find(n => n.type === "pc");
      const sw = nodes.find(n => n.type === "switch");
      
      const isConnected = !!(pc && sw && connections.some(c =>
        (c.fromNode === pc.id && c.toNode === sw.id) ||
        (c.fromNode === sw.id && c.toNode === pc.id)
      ));
      checks.push({
        label: "Connect PC and Switch with cabling",
        passed: isConnected
      });

      const isStraight = !!(pc && sw && connections.some(c =>
        ((c.fromNode === pc.id && c.toNode === sw.id) ||
         (c.fromNode === sw.id && c.toNode === pc.id)) && c.cableType === "straight"
      ));
      checks.push({
        label: "Use Straight-Through cable type",
        passed: isStraight
      });

      const ipConfigured = pc ? pc.interfaces.some(i => i.ip === "10.0.0.10") : false;
      checks.push({
        label: "Configure PC with IP 10.0.0.10",
        passed: ipConfigured
      });

    } else if (labId === "router-config") {
      const pc = nodes.find(n => n.type === "pc");
      const router = nodes.find(n => n.type === "router");

      checks.push({
        label: "Connect PC and Router with cabling",
        passed: !!(pc && router && checkTopologyConnectivity(pc.id, router.id))
      });

      const rIP = router ? router.interfaces.some(i => i.ip === "192.168.1.1") : false;
      checks.push({
        label: "Configure Router with gateway IP 192.168.1.1",
        passed: rIP
      });

      const pcIP = pc ? pc.interfaces.some(i => i.ip === "192.168.1.10") : false;
      checks.push({
        label: "Configure PC with IP 192.168.1.10",
        passed: pcIP
      });

      const hasPingSuccess = pc ? (terminalLogs[pc.id] || []).some(line => line.includes("192.168.1.1") && line.includes("4 received") && line.includes("0% packet loss")) : false;
      checks.push({
        label: "Successful ping from PC to gateway (192.168.1.1)",
        passed: hasPingSuccess
      });

    } else if (labId === "static-routing") {
      const pcs = nodes.filter(n => n.type === "pc");
      const routers = nodes.filter(n => n.type === "router");

      const pc1 = pcs.find(pc => pc.interfaces.some(i => i.ip === "192.168.1.10"));
      const pc2 = pcs.find(pc => pc.interfaces.some(i => i.ip === "192.168.2.20"));
      
      checks.push({
        label: "Configure PC1 with IP 192.168.1.10",
        passed: !!pc1
      });
      checks.push({
        label: "Configure PC2 with IP 192.168.2.20",
        passed: !!pc2
      });

      const r1 = routers[0];
      const r2 = routers[1];
      const routerLink = !!(r1 && r2 && connections.some(c =>
        (c.fromNode === r1.id && c.toNode === r2.id) ||
        (c.fromNode === r2.id && c.toNode === r1.id)
      ));
      checks.push({
        label: "Interconnect Routers R1 and R2",
        passed: routerLink
      });

      const hasPingSuccess = pc1 ? (terminalLogs[pc1.id] || []).some(line => line.includes("192.168.2.20") && line.includes("4 received") && line.includes("0% packet loss")) : false;
      checks.push({
        label: "Successful ping between PC1 and PC2 (192.168.2.20)",
        passed: hasPingSuccess
      });
    }

    const passedCount = checks.filter(c => c.passed).length;
    const percent = checks.length > 0 ? Math.round((passedCount / checks.length) * 100) : 0;

    return { percent, checks };
  };

  const handleSubmitLab = async () => {
    const mistakes: string[] = [];

    if (labId === "ipv4-addressing") {
      const pcs = nodes.filter(n => n.type === "pc");
      if (pcs.length < 2) {
        mistakes.push("Lab requires at least two PCs on the canvas");
      } else {
        const pc1 = pcs.find(pc => pc.interfaces.some(i => i.ip === "192.168.1.10"));
        const pc2 = pcs.find(pc => pc.interfaces.some(i => i.ip === "192.168.1.20"));

        if (!pc1) {
          mistakes.push("No host PC configured with IP 192.168.1.10");
        }
        if (!pc2) {
          mistakes.push("No host PC configured with IP 192.168.1.20");
        }

        if (pc1 && pc2) {
          const hasConn = checkTopologyConnectivity(pc1.id, pc2.id);
          if (!hasConn) {
            mistakes.push("No physical cabling link connects PC1 and PC2");
          }

          const logs = terminalLogs[pc1.id] || [];
          const hasPingSuccess = logs.some(line => line.includes("4 received") && line.includes("0% packet loss"));
          if (!hasPingSuccess) {
            mistakes.push("Ping test between PC1 and PC2 (192.168.1.20) was not completed successfully");
          }
        }
      }
    } else if (labId === "host-cabling") {
      const pc = nodes.find(n => n.type === "pc");
      const sw = nodes.find(n => n.type === "switch");

      if (!pc) {
        mistakes.push("No host PC found on the canvas");
      }
      if (!sw) {
        mistakes.push("No central switch (sw1) found on the canvas");
      }

      if (pc && sw) {
        const conn = connections.find(c =>
          (c.fromNode === pc.id && c.toNode === sw.id) ||
          (c.fromNode === sw.id && c.toNode === pc.id)
        );

        if (!conn) {
          mistakes.push("PC and Switch are not connected");
        } else if (conn.cableType !== "straight") {
          mistakes.push("Incorrect cable type used (requires Straight-Through cable)");
        }

        const ipConfigured = pc.interfaces.some(i => i.ip === "10.0.0.10");
        if (!ipConfigured) {
          mistakes.push("PC eth0 interface not configured with IP 10.0.0.10");
        }
      }
    } else if (labId === "router-config") {
      const pc = nodes.find(n => n.type === "pc");
      const router = nodes.find(n => n.type === "router");

      if (!pc) {
        mistakes.push("No host PC found on the canvas");
      }
      if (!router) {
        mistakes.push("No Router (r1) found on the canvas");
      }

      if (pc && router) {
        const hasConn = checkTopologyConnectivity(pc.id, router.id);
        if (!hasConn) {
          mistakes.push("PC and Router are not cabled");
        }

        const rIP = router.interfaces.some(i => i.ip === "192.168.1.1");
        if (!rIP) {
          mistakes.push("Router R1 eth0 gateway interface not configured with IP 192.168.1.1");
        }

        const pcIP = pc.interfaces.some(i => i.ip === "192.168.1.10");
        if (!pcIP) {
          mistakes.push("PC PC1 interface not configured with IP 192.168.1.10");
        }

        const logs = terminalLogs[pc.id] || [];
        const hasPingSuccess = logs.some(line => line.includes("192.168.1.1") && line.includes("4 received") && line.includes("0% packet loss"));
        if (!hasPingSuccess) {
          mistakes.push("PC1 did not successfully ping the gateway (192.168.1.1)");
        }
      }
    } else if (labId === "static-routing") {
      const pcs = nodes.filter(n => n.type === "pc");
      const routers = nodes.filter(n => n.type === "router");

      if (pcs.length < 2) {
        mistakes.push("Lab requires at least two endpoint PCs (pc1 and pc2)");
      }
      if (routers.length < 2) {
        mistakes.push("Lab requires at least two routers (r1 and r2)");
      }

      if (pcs.length >= 2 && routers.length >= 2) {
        const pc1 = pcs.find(pc => pc.interfaces.some(i => i.ip === "192.168.1.10"));
        const pc2 = pcs.find(pc => pc.interfaces.some(i => i.ip === "192.168.2.20"));
        const r1 = routers[0];
        const r2 = routers[1];

        if (!pc1) {
          mistakes.push("No host PC configured with IP 192.168.1.10");
        }
        if (!pc2) {
          mistakes.push("No host PC configured with IP 192.168.2.20");
        }

        const routerLink = connections.find(c =>
          (c.fromNode === r1.id && c.toNode === r2.id) ||
          (c.fromNode === r2.id && c.toNode === r1.id)
        );
        if (!routerLink) {
          mistakes.push("Routers R1 and R2 are not interconnected by cabling link");
        }

        if (pc1 && pc2) {
          const logs = terminalLogs[pc1.id] || [];
          const hasPingSuccess = logs.some(line => line.includes("192.168.2.20") && line.includes("4 received") && line.includes("0% packet loss"));
          if (!hasPingSuccess) {
            mistakes.push("Ping across network subnets to PC2 (192.168.2.20) was not successful");
          }
        }
      }
    }

    if (mistakes.length === 0) {
      const email = localStorage.getItem("userEmail") || "";
      if (!email) {
        showCustomAlert("You must be logged in as a student to submit a lab challenge.", "Submission Failed");
        return;
      }

      try {
        const uRes = await fetch("/api/users");
        const uData = await uRes.json();
        if (!uData.success) {
          showCustomAlert("Error fetching student profile from server.", "Submission Failed");
          return;
        }

        const profile = uData.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        if (!profile) {
          showCustomAlert("Student profile not found.", "Submission Failed");
          return;
        }

        const currentCompletedTopics = profile.completedTopics || {};
        const currentInteractiveScores = profile.interactiveScores || {};
        
        const targetModuleId = Number(activeModuleId);
        const ids = [
          1782134355228, 1782182808093, 1782181968596, 1782184909611,
          1782185665993, 1782186311891, 1782186928370, 1782197552474,
          1782198533015, 1782199846377, 1782200580841, 1782203599448
        ];
        const moduleIdx = ids.indexOf(targetModuleId);
        const topicIdKey = 77777700 + (moduleIdx !== -1 ? moduleIdx : 0);

        const updatedCompleted = { ...currentCompletedTopics, [topicIdKey]: true };
        const updatedScores = {
          ...currentInteractiveScores,
          [targetModuleId]: {
            ...currentInteractiveScores[targetModuleId],
            "simulationLab": 100
          }
        };

        const updateRes = await fetch("/api/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            completedTopics: updatedCompleted,
            interactiveScores: updatedScores
          })
        });

        const updateData = await updateRes.json();
        if (updateData.success) {
          showCustomAlert("Congratulations! You have completed the Simulation Lab Activity successfully!", "Activity Completed");
          setTimeout(() => {
            window.location.href = "/student/curriculum";
          }, 2000);
        } else {
          showCustomAlert("Error saving your progress to the system.", "Submission Failed");
        }
      } catch (e) {
        console.error(e);
        showCustomAlert("An error occurred during submission.", "Submission Failed");
      }
    } else {
      const email = localStorage.getItem("userEmail") || "";
      if (email && activeModuleId) {
        try {
          const uRes = await fetch("/api/users");
          const uData = await uRes.json();
          if (uData.success) {
            const profile = uData.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
            if (profile) {
              const currentMistakes = profile.interactiveMistakes || {};
              const moduleMistakes = currentMistakes[activeModuleId] || {};
              
              const newSimMistakes = mistakes.map(m => {
                const existing = (moduleMistakes.simulationLab || []).find((x: any) => x.item === m);
                return {
                  item: m,
                  count: existing ? existing.count + 1 : 1
                };
              });

              const otherSimMistakes = (moduleMistakes.simulationLab || []).filter((x: any) => !mistakes.includes(x.item));
              const finalSimMistakes = [...otherSimMistakes, ...newSimMistakes];

              await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email,
                  interactiveMistakes: {
                    ...currentMistakes,
                    [activeModuleId]: {
                      ...moduleMistakes,
                      simulationLab: finalSimMistakes
                    }
                  }
                })
              });
            }
          }
        } catch (e) {
          console.error("Failed to record mistakes:", e);
        }
      }

      const formattedMistakes = mistakes.map((m, idx) => `${idx + 1}. ${m}`).join("\n");
      showCustomAlert(`Validation failed! Please fix the following configuration issues and try again:\n\n${formattedMistakes}`, "Validation Checklist Failed");
    }
  };
  // Dynamic CLI prompt text generator
  const getCliPrompt = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return "guest@terminal:~$";
    if (node.type === "router" || node.type === "switch") {
      const state = cliModes[nodeId] || { mode: "user-exec", activeIf: null };
      if (state.mode === "privileged-exec") return `${node.name}#`;
      if (state.mode === "global-config") return `${node.name}(config)#`;
      if (state.mode === "interface-config") return `${node.name}(config-if)#`;
      if (state.mode === "dhcp-config") return `${node.name}(config-dhcp)#`;
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

  const handleCheatingSubmit = async (reason: string) => {
    const email = localStorage.getItem("userEmail") || "";
    if (email && activeModuleId) {
      try {
        const uRes = await fetch("/api/users");
        const uData = await uRes.json();
        if (uData.success) {
          const profile = uData.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
          if (profile) {
            const currentMistakes = profile.interactiveMistakes || {};
            const moduleMistakes = currentMistakes[activeModuleId] || {};
            const simMistakes = moduleMistakes.simulationLab || [];
            
            const finalMistakes = [
              ...simMistakes.filter((x: any) => x.item !== "Security violation / Cheating detected"),
              { item: "Security violation / Cheating detected", count: (simMistakes.find((x: any) => x.item === "Security violation / Cheating detected")?.count || 0) + 1 }
            ];

            await fetch("/api/users", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                interactiveMistakes: {
                  ...currentMistakes,
                  [activeModuleId]: {
                    ...moduleMistakes,
                    simulationLab: finalMistakes
                  }
                }
              })
            });
          }
        }
      } catch (e) {
        console.error("Error logging security breach:", e);
      }
    }

    setTimeout(() => {
      window.location.href = "/student/curriculum";
    }, 2000);
  };

  useEffect(() => {
    if (labId && labStatus === "running" && labTimeRemaining !== null && !isLabLocked) {
      if (labTimeRemaining <= 0) {
        setIsLabLocked(true);
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        showCustomAlert("Time limit exceeded! This lab activity has been locked and auto-submitted.", "Secure Test Locked");
        handleCheatingSubmit("Time limit exceeded during simulation lab challenge");
        return;
      }
      const t = setTimeout(() => {
        setLabTimeRemaining(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [labId, labStatus, labTimeRemaining, isLabLocked]);

  useEffect(() => {
    if (!labId || isLabLocked) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      setSecureFullscreenActive(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen) {
        setSecurityWarningsLeft(prev => {
          const updated = prev - 1;
          if (updated <= 0) {
            setIsLabLocked(true);
            showCustomAlert("Secure testing violation! Fullscreen exited repeatedly. This lab is now locked.", "Lab Locked");
            handleCheatingSubmit("Exited fullscreen mode repeatedly");
          }
          return updated;
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setIsLabLocked(true);
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        showCustomAlert("Secure testing violation! Tab switching detected. This lab is now locked and auto-failed.", "Lab Locked");
        handleCheatingSubmit("Switching browser tabs detected");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [labId, isLabLocked]);

  useEffect(() => {
    if (!labId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        showCustomAlert("Screenshots are strictly prohibited in this assessment lab!", "Security Warning");
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "p" || e.key === "s" || e.key === "P" || e.key === "S")) {
        e.preventDefault();
        showCustomAlert("Action blocked. Printing/saving is prohibited in secure testing mode.", "Action Prohibited");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [labId]);

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
    const container = document.getElementById("canvas-container");
    let offsetX = 0;
    let offsetY = 0;
    if (container) {
      const rect = container.getBoundingClientRect();
      const canvasW = rect.width / zoom;
      const canvasH = rect.height / zoom;
      const xs = template.nodes.map(n => n.x);
      const ys = template.nodes.map(n => n.y);
      if (xs.length > 0) {
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const templateCenterX = (minX + maxX) / 2;
        const templateCenterY = (minY + maxY) / 2;
        offsetX = canvasW / 2 - templateCenterX;
        offsetY = canvasH / 2 - templateCenterY;
      }
    }

    setNodes(template.nodes.map(n => ({
      ...n,
      x: Math.round(n.x + offsetX),
      y: Math.round(n.y + offsetY),
      config: [...n.config]
    })));
    setConnections([...template.connections]);
    setActiveLabName(template.name);
    setLabStatus("stopped");
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    setIsConsoleOpen(false);
    setTerminalLogs({});
    setElapsedSeconds(0);
    setPanOffset({ x: 0, y: 0 });
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
    e.stopPropagation();
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
      toPort,
      cableType: wiringCableType || "straight"
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
    setWiringCableType(null);
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
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    // CABLE CONNECTION DRAG DROP
    if (type && type.startsWith("cable")) {
      let droppedNode = null;
      let minDistance = Infinity;
      nodes.forEach(n => {
        const dx = n.x - x;
        const dy = n.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          minDistance = dist;
          droppedNode = n;
        }
      });

      if (!droppedNode || minDistance > 65) {
        showCustomAlert("Cable must be dropped directly on top of a device node!", "Cabling Guide");
        return;
      }

      const cableKind = type.split("-")[1] as "straight" | "crossover" | "fiber" || "straight";
      setWiringCableType(cableKind);

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
        return Math.sqrt(dx * dx + dy * dy) < 45;
      });

      if (!droppedNode) {
        showCustomAlert("Simple PDU envelope must be dropped directly on top of a device node!", "PDU Guidance");
        return;
      }

      if (labStatus !== "running") {
        showCustomAlert("Please start the Kathará lab simulation first before launching message packet diagnostics!", "Lab Simulation Required");
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
          showCustomAlert("Packet Failure: No link connection route found between source and target!", "ICMP Route Error");
          return;
        }

        const targetIp = droppedNode.interfaces[0]?.ip || droppedNode.name;

        // Automatically open CLI console on the right side and shift the topology to the left
        setConsoleNodeId(startId);
        setIsConsoleOpen(true);
        if (!isConsoleOpen) {
          setPanOffset(prev => ({ ...prev, x: prev.x - 120 }));
        }
        const container = document.getElementById("canvas-container");
        const containerWidth = container ? container.getBoundingClientRect().width : 800;
        setConsolePos({ x: Math.max(10, containerWidth - 460), y: 40 });

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
        let triggeredCheck = false;

        const animInterval = setInterval(() => {
          t += 0.025; // Slower, smoother movement across devices and cables
          if (t >= 1) {
            t = 0;
            step++;
          }

          // Trigger green check when reaching destination node (midway point of loop)
          if (step === coords.length - 1 && !triggeredCheck) {
            triggeredCheck = true;
            const destId = path[path.length - 1];
            setReceivedCheckNodeId(destId);
            setTimeout(() => {
              setReceivedCheckNodeId(prev => prev === destId ? null : prev);
            }, 2500);
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

    let count = 1;
    while (nodes.some(n => n.id === `${type}${count}`)) {
      count++;
    }
    const id = `${type}${count}`;

    const interfaces = type === "switch" || type === "hub"
      ? []
      : [{ name: "eth0", ip: "", subnet: "255.255.255.0", gateway: "" }];

    const newNode: NetworkNode = {
      id,
      name: `${type}${count}`,
      type: type as "router" | "switch" | "pc" | "laptop" | "server" | "printer" | "ap" | "hub",
      x,
      y,
      interfaces,
      config: []
    };

    setNodes(prev => [...prev, newNode]);
  };

  // Canvas Panning handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isWiringMode || packetMode) return;
    setIsPanning(true);
    setPanStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    });
  };

  // Double click handler to spawn/show the selection box
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (isWiringMode || packetMode) return;

    const canvas = document.getElementById("canvas-pane");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setSelectionBox({
      x: x - 120,
      y: y - 80,
      width: 240,
      height: 160,
      visible: true
    });
  };

  // Selection box dragging mousedown handler
  const handleBoxMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectionBox) return;
    setIsDraggingBox(true);

    const canvas = document.getElementById("canvas-pane");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setBoxDragStart({ x, y });
    setInitialBoxPos({ x: selectionBox.x, y: selectionBox.y, width: selectionBox.width, height: selectionBox.height });

    // Record initial positions of all nodes inside the box
    const nodesInside: Record<string, { x: number; y: number }> = {};
    nodes.forEach(n => {
      if (
        n.x >= selectionBox.x &&
        n.x <= selectionBox.x + selectionBox.width &&
        n.y >= selectionBox.y &&
        n.y <= selectionBox.y + selectionBox.height
      ) {
        nodesInside[n.id] = { x: n.x, y: n.y };
      }
    });
    setInitialNodesPos(nodesInside);
  };

  // Selection box resizing mousedown handler
  const handleBoxResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectionBox) return;
    setIsResizingBox(true);

    const canvas = document.getElementById("canvas-pane");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setBoxDragStart({ x, y });
    setInitialBoxPos({ x: selectionBox.x, y: selectionBox.y, width: selectionBox.width, height: selectionBox.height });
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

    e.stopPropagation();
    const canvas = document.getElementById("canvas-pane");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;
    setDraggingNodeId(node.id);
    setDragOffset({
      x: mouseX - node.x,
      y: mouseY - node.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    const canvas = document.getElementById("canvas-pane");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    // Track mouse coordinates for trailing rubberband cable
    if (isWiringMode && wiringStartNode) {
      setCanvasMousePos({ x, y });
    }

    if (isDraggingBox && selectionBox) {
      const dx = x - boxDragStart.x;
      const dy = y - boxDragStart.y;

      setSelectionBox(prev => prev ? {
        ...prev,
        x: initialBoxPos.x + dx,
        y: initialBoxPos.y + dy
      } : null);

      setNodes(prev => prev.map(n => {
        if (initialNodesPos[n.id]) {
          return {
            ...n,
            x: initialNodesPos[n.id].x + dx,
            y: initialNodesPos[n.id].y + dy
          };
        }
        return n;
      }));
      return;
    }

    if (isResizingBox && selectionBox) {
      const dx = x - boxDragStart.x;
      const dy = y - boxDragStart.y;

      setSelectionBox(prev => prev ? {
        ...prev,
        width: Math.max(80, initialBoxPos.width + dx),
        height: Math.max(60, initialBoxPos.height + dy)
      } : null);
      return;
    }

    if (!draggingNodeId) return;

    const posX = x - dragOffset.x;
    const posY = y - dragOffset.y;

    setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: posX, y: posY } : n));
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
    setIsDraggingBox(false);
    setIsResizingBox(false);
  };

  // Recenter topology in viewport
  const recenterCanvas = () => {
    setZoom(1.0);
    if (nodes.length === 0) {
      setPanOffset({ x: 0, y: 0 });
      return;
    }
    const container = document.getElementById("canvas-container");
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const nodesCenterX = (minX + maxX) / 2;
    const nodesCenterY = (minY + maxY) / 2;
    setPanOffset({
      x: Math.round(rect.width / 2 - nodesCenterX * 1.0),
      y: Math.round(rect.height / 2 - nodesCenterY * 1.0)
    });
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
        showCustomAlert("Packet Failure: No link connection route found between source and target!", "ICMP Route Error");
        return;
      }

      const targetNode = nodes.find(n => n.id === nodeId);
      const targetIp = targetNode?.interfaces[0]?.ip || nodeId;

      // Automatically open CLI console on the right side and shift the topology to the left
      setConsoleNodeId(startId);
      setIsConsoleOpen(true);
      if (!isConsoleOpen) {
        setPanOffset(prev => ({ ...prev, x: prev.x - 120 }));
      }
      const container = document.getElementById("canvas-container");
      const containerWidth = container ? container.getBoundingClientRect().width : 800;
      setConsolePos({ x: Math.max(10, containerWidth - 460), y: 40 });

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
      let triggeredCheck = false;

      const animInterval = setInterval(() => {
        t += 0.025; // Slower increment step for visibility
        if (t >= 1) {
          t = 0;
          step++;
        }

        // Trigger green check when reaching destination node (midway point of loop)
        if (step === coords.length - 1 && !triggeredCheck) {
          triggeredCheck = true;
          const destId = path[path.length - 1];
          setReceivedCheckNodeId(destId);
          setTimeout(() => {
            setReceivedCheckNodeId(prev => prev === destId ? null : prev);
          }, 2500);
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
        } else if (cmdType === "ip" && cmdPartsLower[1] === "dhcp" && cmdPartsLower[2] === "pool") {
          const poolName = cmdParts[3];
          if (!poolName) {
            replies.push("% Incomplete command.");
          } else {
            setCliModes(prev => ({
              ...prev,
              [consoleNodeId]: { mode: "dhcp-config", activeIf: poolName }
            }));
            replies.push(`% Entered DHCP pool configuration mode for pool '${poolName}'.`);
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
            "  ip dhcp pool <pool_name>       Create and configure a DHCP address pool",
            "  exit                           Return to Privileged EXEC mode"
          );
        } else {
          replies.push(`% Unknown command or computer name, or incomplete command.`);
        }
      }
      else if (modeState.mode === "dhcp-config") {
        const poolName = modeState.activeIf;
        if (cmdType === "network") {
          const network = cmdParts[1];
          const mask = cmdParts[2];
          if (!network || !mask) {
            replies.push("Syntax Error: Use 'network <network_address> <subnet_mask>'");
          } else {
            setNodes(prev => prev.map(n => {
              if (n.id === consoleNodeId) {
                const pools = n.dhcpPools || [];
                const existing = pools.find((p: any) => p.name === poolName) || { name: poolName };
                const updated = { ...existing, network, mask };
                const otherPools = pools.filter((p: any) => p.name !== poolName);
                return { ...n, dhcpPools: [...otherPools, updated] };
              }
              return n;
            }));
            replies.push(`% Network ${network} ${mask} added to pool ${poolName}.`);
          }
        } else if (cmdType === "default-router") {
          const gateway = cmdParts[1];
          if (!gateway) {
            replies.push("Syntax Error: Use 'default-router <gateway_ip>'");
          } else {
            setNodes(prev => prev.map(n => {
              if (n.id === consoleNodeId) {
                const pools = n.dhcpPools || [];
                const existing = pools.find((p: any) => p.name === poolName) || { name: poolName };
                const updated = { ...existing, gateway };
                const otherPools = pools.filter((p: any) => p.name !== poolName);
                return { ...n, dhcpPools: [...otherPools, updated] };
              }
              return n;
            }));
            replies.push(`% Default router gateway ${gateway} added to pool ${poolName}.`);
          }
        } else if (cmdType === "dns-server") {
          const dns = cmdParts[1];
          if (!dns) {
            replies.push("Syntax Error: Use 'dns-server <dns_ip>'");
          } else {
            setNodes(prev => prev.map(n => {
              if (n.id === consoleNodeId) {
                const pools = n.dhcpPools || [];
                const existing = pools.find((p: any) => p.name === poolName) || { name: poolName };
                const updated = { ...existing, dns };
                const otherPools = pools.filter((p: any) => p.name !== poolName);
                return { ...n, dhcpPools: [...otherPools, updated] };
              }
              return n;
            }));
            replies.push(`% DNS server ${dns} added to pool ${poolName}.`);
          }
        } else if (cmdType === "exit") {
          setCliModes(prev => ({
            ...prev,
            [consoleNodeId]: { mode: "global-config", activeIf: null }
          }));
        } else if (cmdType === "help") {
          replies.push(
            "Cisco DHCP Pool Configuration Commands:",
            "  network <network_ip> <mask>    Set pool network subnet address",
            "  default-router <gateway_ip>    Set default gateway IP for clients",
            "  dns-server <dns_ip>            Set DNS server IP for clients",
            "  exit                           Return to global configuration mode"
          );
        } else {
          replies.push(`% Unknown command or incomplete command.`);
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
          "  udhcpc                         Obtain IP address dynamically via DHCP",
          "  clear                          Clear terminal console logs"
        );
      } else if (cmdType === "clear") {
        setTerminalLogs(prev => ({ ...prev, [consoleNodeId]: [] }));
        setCurrentCommand("");
        return;
      } else if (cmdType === "udhcpc") {
        replies.push(
          "udhcpc: started, v1.35.0",
          "udhcpc: sending discover"
        );
        
        const connectedIds = checkTopologyConnectivity(consoleNodeId);
        let foundPool: any = null;
        let serverNode: any = null;

        for (const peerId of connectedIds) {
          const peerNode = nodes.find(n => n.id === peerId);
          if (peerNode && peerNode.dhcpPools && peerNode.dhcpPools.length > 0) {
            const pool = peerNode.dhcpPools.find((p: any) => p.network && p.gateway);
            if (pool) {
              foundPool = pool;
              serverNode = peerNode;
              break;
            }
          }
        }

        if (foundPool && serverNode) {
          const prefix = foundPool.network.substring(0, foundPool.network.lastIndexOf('.'));
          
          let assignedIp = "";
          for (let hostNum = 50; hostNum < 254; hostNum++) {
            const candidateIp = `${prefix}.${hostNum}`;
            const ipExists = nodes.some(n => n.interfaces.some(i => i.ip === candidateIp));
            if (!ipExists) {
              assignedIp = candidateIp;
              break;
            }
          }
          if (!assignedIp) assignedIp = `${prefix}.50`;

          const mask = foundPool.mask;
          const gw = foundPool.gateway;

          setNodes(prev => prev.map(n => {
            if (n.id === consoleNodeId) {
              const updatedInterfaces = n.interfaces.map(i => {
                if (i.name === "eth0" || n.interfaces.length === 1) {
                  return { ...i, ip: assignedIp, subnet: mask, gateway: gw };
                }
                return i;
              });
              return { ...n, interfaces: updatedInterfaces };
            }
            return n;
          }));

          replies.push(
            `udhcpc: sending select for ${assignedIp}`,
            `udhcpc: lease of ${assignedIp} obtained, lease time 86400`,
            `udhcpc: interface eth0 IP configured automatically!`
          );
        } else {
          replies.push(
            "udhcpc: no response (DHCP server/router not found or pool configuration incomplete)"
          );
        }
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
        const ipMaskRaw = cmdParts[3];
        if (!ipMaskRaw) {
          replies.push("Syntax Error: Use 'ip addr add <ip/subnet> [dev <interface>]'");
        } else {
          const ipMask = ipMaskRaw.split("/");
          const ip = ipMask[0];
          const cidr = ipMask[1] || "24";

          // Find dev: either specified via 'dev <name>' or default to first interface
          let dev = "eth0";
          const devIdx = cmdPartsLower.indexOf("dev");
          if (devIdx !== -1 && cmdParts[devIdx + 1]) {
            dev = cmdParts[devIdx + 1];
          } else if (node.interfaces && node.interfaces.length > 0) {
            dev = node.interfaces[0].name;
          }

          const subnet = cidr === "24" ? "255.255.255.0" : cidr === "30" ? "255.255.255.252" : "255.255.255.0";

          setNodes(prev => prev.map(n => {
            if (n.id === consoleNodeId) {
              let interfaces = [...n.interfaces];
              const existing = interfaces.find(i => i.name.toLowerCase() === dev.toLowerCase());
              if (existing) {
                interfaces = interfaces.map(i => i.name.toLowerCase() === dev.toLowerCase() ? { ...i, ip, subnet } : i);
              } else {
                interfaces.push({ name: dev, ip, subnet, gateway: "" });
              }

              const newConfigs = interfaces.map(i => {
                if (!i.ip) return "";
                const cIdr = i.subnet === "255.255.255.0" ? "24" : "30";
                return `ip addr add ${i.ip}/${cIdr} dev ${i.name}`;
              }).filter(Boolean);

              const gw = interfaces.find(i => i.gateway)?.gateway;
              if (gw) {
                newConfigs.push(`ip route add default via ${gw}`);
              }

              return { ...n, interfaces, config: newConfigs };
            }
            return n;
          }));
          replies.push(`[Interface Config] Assigned IP address ${ip}/${cidr} to device ${dev}.`);
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

      <main className={`flex-grow w-full max-w-6xl mx-auto flex flex-col min-h-0 ${isFullscreen ? "fixed left-0 top-0 w-screen h-screen z-[120] bg-slate-950 p-3 max-w-full overflow-hidden" : "p-8 h-screen max-h-screen overflow-hidden"
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

            {/* Assessment Secure Time Limit Countdown */}
            {labId && labTimeRemaining !== null && (
              <div className={`flex items-center gap-1.5 font-mono text-[10px] font-bold px-3 py-1.5 rounded-xl animate-fade-in select-none self-end mb-1 ${
                labTimeRemaining < 120 
                  ? "bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse" 
                  : "bg-amber-500/10 border border-amber-500/25 text-amber-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${labTimeRemaining < 120 ? "bg-red-500 animate-ping" : "bg-amber-500"}`}></span>
                SECURE TIME REMAINING: {formatStopwatch(labTimeRemaining)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* CLI Console shortcut button - now a big prominent button */}
            <button
              onClick={() => {
                if (selectedNodeId) {
                  setConsoleNodeId(selectedNodeId);
                  setIsConsoleOpen(!isConsoleOpen);
                } else {
                  showCustomAlert("Please select a device node first to open its console CLI window!", "CLI Connection Guide");
                }
              }}
              className="bg-brand-cyan hover:bg-brand-cyan/85 text-brand-bg hover:scale-[1.03] transition-transform text-xs font-black py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg uppercase tracking-wider animate-fade-in"
              title="Open selected node console terminal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="12" x="3" y="6" rx="2" /><path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M12 12h.01" /><path d="M9 14h6" /></svg>
              Open Console CLI
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

            {labId && (
              <button
                onClick={handleSubmitLab}
                className="bg-brand-cyan hover:bg-brand-cyan/85 text-brand-bg text-xs font-black py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg transition-transform hover:scale-[1.03]"
              >
                ✓ Submit Lab
              </button>
            )}

            {/* Clear Canvas Button */}
            <button
              onClick={() => {
                showCustomConfirm(
                  "Are you sure you want to clear all devices and connections from the workspace?",
                  () => {
                    setNodes([]);
                    setConnections([]);
                    setLabStatus("stopped");
                    setElapsedSeconds(0);
                    setStartTimeStr(null);
                    setSelectedNodeId(null);
                    setSelectedConnectionId(null);
                    setIsConsoleOpen(false);
                    setTerminalLogs({});
                    setCliModes({});
                  },
                  "Clear Workspace"
                );
              }}
              className="bg-brand-card hover:bg-red-500/20 hover:border-red-500/40 border border-brand-border text-brand-muted hover:text-red-400 text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
              title="Clear all components and connections"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
              Clear Canvas
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-brand-card hover:bg-brand-card-light/40 border border-brand-border text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" /></svg>
                  Exit
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
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
                    { type: "cable", label: "Choose Cable..." },
                    { type: "message", label: "Simple PDU" }
                  ].map((item) => {
                    const isCableType = item.type.startsWith("cable");
                    const cableKind = isCableType && item.type !== "cable" ? (item.type.split("-")[1] as "straight" | "crossover" | "fiber") : null;
                    const isActiveCable = isWiringMode && wiringCableType === cableKind;
                    const element = (
                      <div
                        key={item.type}
                        draggable={item.type !== "cable"} // Disallow dragging the choose cable button
                        onDragStart={(e) => handleDragStart(e, item.type as NodeType)}
                        onClick={() => {
                          if (item.type === "cable") {
                            setIsCableMenuOpen(!isCableMenuOpen);
                          } else if (isCableType && cableKind) {
                            setIsWiringMode(true);
                            setWiringCableType(cableKind);
                            setWiringStartNode(null);
                          }
                        }}
                        className={`border p-2 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-grab transition-all text-center select-none ${isActiveCable || (item.type === "cable" && isCableMenuOpen)
                            ? "bg-brand-cyan/20 border-brand-cyan shadow-lg shadow-brand-cyan/25"
                            : "bg-brand-bg/50 border-brand-border/60 hover:border-brand-cyan/40 hover:bg-brand-card-light/25"
                          }`}
                        title={
                          item.type === "message"
                            ? "Drag and drop PDU on a node to configure diagnostics"
                            : item.type === "cable"
                              ? "Click to open cable types menu"
                              : isCableType
                                ? "Click to activate wiring mode, or drag and drop on device node"
                                : "Drag component onto grid layout"
                        }
                      >
                        <div className="w-12 h-10 flex items-center justify-center select-none pointer-events-none">
                          {getCiscoDeviceSvg(item.type as NodeType)}
                        </div>
                        <span className="text-[9px] font-extrabold tracking-tight select-none pointer-events-none text-brand-text whitespace-nowrap">{item.label}</span>
                      </div>
                    );

                    if (item.type === "cable") {
                      return (
                        <div key={item.type} className="relative">
                          {/* Sidebar floating popover above the Choose Cable card */}
                          {isCableMenuOpen && (
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-[45] bg-slate-900/95 backdrop-blur border border-brand-cyan/35 rounded-2xl p-2.5 w-56 shadow-2xl flex flex-col gap-2 animate-fade-in select-text">
                              <div className="flex items-center justify-between border-b border-brand-border/30 pb-1">
                                <span className="text-[8px] font-black text-brand-cyan uppercase tracking-wider">Select Cable Type</span>
                                <button onClick={(e) => { e.stopPropagation(); setIsCableMenuOpen(false); }} className="text-brand-muted hover:text-brand-text text-[9px] font-bold cursor-pointer">✕</button>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                {[
                                  { type: "cable-straight", label: "Straight" },
                                  { type: "cable-crossover", label: "Crossover" },
                                  { type: "cable-fiber", label: "Fiber" }
                                ].map((cable) => {
                                  const cKind = cable.type.split("-")[1] as "straight" | "crossover" | "fiber";
                                  const isAct = isWiringMode && wiringCableType === cKind;
                                  return (
                                    <div
                                      key={cable.type}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsWiringMode(true);
                                        setWiringCableType(cKind);
                                        setWiringStartNode(null);
                                        setIsCableMenuOpen(false);
                                      }}
                                      className={`border p-1 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-center select-none ${isAct
                                          ? "bg-brand-cyan/20 border-brand-cyan shadow-md shadow-brand-cyan/20"
                                          : "bg-brand-bg/50 border-brand-border/60 hover:border-brand-cyan/40 hover:bg-brand-card-light/20"
                                        }`}
                                      title={cable.type === "cable-straight" ? "Copper Straight-Through" : cable.type === "cable-crossover" ? "Copper Cross-Over" : "Fiber Optic"}
                                    >
                                      <div className="w-8 h-6 flex items-center justify-center select-none pointer-events-none scale-75">
                                        {getCiscoDeviceSvg(cable.type as NodeType)}
                                      </div>
                                      <span className="text-[7px] font-extrabold tracking-tight select-none pointer-events-none text-brand-text">{cable.label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {element}
                        </div>
                      );
                    }
                    return element;
                  })}
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

            </div>
          )}

          {/* Interactive Topology Canvas Panel (Fills 100% space in Fullscreen mode) */}
          <div
            id="canvas-container"
            className={`${isFullscreen ? "lg:col-span-4 h-full" : "lg:col-span-3"} bg-slate-950 border border-brand-border rounded-2xl relative overflow-hidden flex flex-col min-h-0`}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleCanvasDoubleClick}
          >

            {labId && (
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body {
                    display: none !important;
                  }
                }
              `}} />
            )}

            {/* Security Tiled Text Watermark */}
            {labId && (
              <div className="absolute inset-0 z-0 pointer-events-none select-none opacity-[0.02] flex flex-wrap gap-16 p-8 overflow-hidden items-center justify-center">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="-rotate-12 text-sm font-bold tracking-widest text-brand-text whitespace-nowrap">
                    {localStorage.getItem("userEmail") || "SECURE ASSESSMENT"} - {localStorage.getItem("userName") || "STUDENT ID"}
                  </div>
                ))}
              </div>
            )}

            {/* Secure Fullscreen Prompt Blocker */}
            {labId && !secureFullscreenActive && !isLabLocked && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur z-[49] flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="w-16 h-16 rounded-full bg-brand-cyan/15 border border-brand-cyan flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
                </div>
                <h3 className="text-lg font-black text-brand-text">Secure Fullscreen Required</h3>
                <p className="text-xs text-brand-muted mt-2 max-w-sm leading-relaxed">
                  This simulation lab activity is an assessment. You must enter secure fullscreen mode to start. Switching tabs or exiting fullscreen repeatedly will lock and auto-fail the lab.
                </p>
                <button
                  onClick={() => {
                    const elem = document.documentElement;
                    if (elem.requestFullscreen) {
                      elem.requestFullscreen().then(() => setSecureFullscreenActive(true)).catch(() => {});
                    } else if ((elem as any).webkitRequestFullscreen) {
                      (elem as any).webkitRequestFullscreen();
                      setSecureFullscreenActive(true);
                    }
                  }}
                  className="mt-6 bg-brand-cyan hover:bg-brand-cyan/85 text-brand-bg text-[10px] font-black py-3 px-6 rounded-xl cursor-pointer uppercase tracking-wider transition-all shadow-lg hover:scale-[1.02]"
                >
                  Enter Fullscreen & Start Challenge
                </button>
              </div>
            )}

            {/* Secure Lockout Overlay */}
            {labId && isLabLocked && (
              <div className="absolute inset-0 bg-slate-950/98 backdrop-blur z-[49] flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <h3 className="text-lg font-black text-red-500">Security Lockout Active</h3>
                <p className="text-xs text-brand-muted mt-2 max-w-sm leading-relaxed">
                  A secure testing violation has occurred (exiting fullscreen, tab change, or time limit exceeded). This lab activity has been locked and auto-submitted.
                </p>
                <span className="text-[10px] text-brand-cyan font-mono uppercase tracking-wider mt-4 animate-pulse">Redirecting to Curriculum...</span>
              </div>
            )}

            {/* Warning Overlay banner */}
            {labId && secureFullscreenActive && securityWarningsLeft < 3 && !isLabLocked && (
              <div className="absolute top-4 left-4 z-[48] bg-red-500/90 border border-red-600 text-white font-extrabold text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-full shadow-lg select-none animate-bounce">
                ⚠️ Warnings Left: {securityWarningsLeft}/3
              </div>
            )}

            {/* FLOATING ACTIVE LAB INSTRUCTIONS PANEL */}
            {labId && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                className="absolute top-4 right-4 z-[35] w-80 bg-slate-900/90 backdrop-blur border border-brand-cyan/40 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl text-brand-text animate-fade-in select-text max-h-[45%]"
              >
                <div className="flex items-center justify-between border-b border-brand-border/30 pb-2">
                  <div>
                    <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">Active Lab Goal</span>
                    <h3 className="text-xs font-black text-brand-text mt-0.5">
                      {labId === "ipv4-addressing" && "IPv4 Static Addressing"}
                      {labId === "host-cabling" && "Local Host Cabling"}
                      {labId === "router-config" && "Gateway Router Configuration"}
                      {labId === "static-routing" && "Inter-network Static Routing"}
                    </h3>
                  </div>
                </div>

                {(() => {
                  const { percent } = getLiveProgress();
                  
                  let barColor = "bg-amber-500";
                  let statusText = "IN PROGRESS";
                  let textColor = "text-amber-400";
                  let borderBg = "border-amber-500/20 bg-amber-500/5";

                  if (percent === 100) {
                    barColor = "bg-emerald-500 animate-pulse";
                    statusText = "PASSED";
                    textColor = "text-emerald-400";
                    borderBg = "border-emerald-500/30 bg-emerald-500/10";
                  } else if (percent === 0) {
                    barColor = "bg-red-500";
                    statusText = "FAILED";
                    textColor = "text-red-400";
                    borderBg = "border-red-500/30 bg-red-500/10";
                  }

                  return (
                    <div className={`border rounded-xl p-2.5 flex flex-col gap-2 transition-all ${borderBg}`}>
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                        <span className="text-brand-text">Completion Score</span>
                        <span className={`${textColor} font-bold`}>{statusText} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-brand-bg rounded-full overflow-hidden border border-brand-border/20">
                        <div
                          className={`h-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                <div className="text-[11px] text-brand-muted leading-relaxed overflow-y-auto max-h-48 pr-1 space-y-2">
                  {labId === "ipv4-addressing" && (
                    <>
                      <p>1. Drag <strong>two PCs</strong> (pc1, pc2) onto the canvas.</p>
                      <p>2. Connect them via <strong>Crossover Cable</strong> (or straight cables through a switch).</p>
                      <p>3. Set pc1 IP to <code>192.168.1.10</code> and pc2 IP to <code>192.168.1.20</code> (subnet <code>255.255.255.0</code>).</p>
                      <p>4. Start Kathará Lab, open pc1 console, and run: <code>ping 192.168.1.20</code>.</p>
                    </>
                  )}
                  {labId === "host-cabling" && (
                    <>
                      <p>1. Drag a <strong>PC</strong> (pc1) and a <strong>Switch</strong> (sw1) onto the canvas.</p>
                      <p>2. Connect them using a <strong>Straight-Through</strong> cable link.</p>
                      <p>3. Configure pc1's eth0 with IP address <code>10.0.0.10</code> (subnet <code>255.255.255.0</code>).</p>
                      <p>4. Start Kathará Lab to boot up the cabling link interfaces.</p>
                    </>
                  )}
                  {labId === "router-config" && (
                    <>
                      <p>1. Connect PC <code>pc1</code> to Router <code>r1</code> (either directly or via a switch).</p>
                      <p>2. Assign Router r1's eth0 IP to <code>192.168.1.1</code> (subnet <code>255.255.255.0</code>).</p>
                      <p>3. Assign PC pc1 IP to <code>192.168.1.10</code> and set its Gateway IP to <code>192.168.1.1</code>.</p>
                      <p>4. Start Kathará Lab, open pc1 console, and run: <code>ping 192.168.1.1</code>.</p>
                    </>
                  )}
                  {labId === "static-routing" && (
                    <>
                      <p>1. Connect Router <code>r1</code> to Router <code>r2</code> via crossover link.</p>
                      <p>2. Connect PC <code>pc1</code> to r1, and PC <code>pc2</code> to r2.</p>
                      <p>3. Set pc1 to <code>192.168.1.10</code> (gateway 192.168.1.1), pc2 to <code>192.168.2.20</code> (gateway 192.168.2.1).</p>
                      <p>4. Configure r1 interface IPs and set a static route to the 192.168.2.0/24 subnet: <code>ip route add 192.168.2.0/24 via 10.0.0.2</code>.</p>
                      <p>5. Start Kathará Lab, open pc1's terminal, and ping pc2: <code>ping 192.168.2.20</code>.</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* FLOATING LEFT SIDE DETAILS PANEL */}
            {selectedNodeId && (() => {
              const node = nodes.find(n => n.id === selectedNodeId);
              if (!node) return null;
              return (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="absolute top-4 left-4 z-[35] w-72 max-h-[calc(100%-2rem)] bg-slate-900/90 backdrop-blur border border-brand-cyan/30 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl overflow-y-auto overflow-x-hidden text-brand-text animate-fade-in select-text"
                >
                  <div className="flex items-center justify-between border-b border-brand-border/30 pb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">{node.type} Details</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${labStatus === "running" ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} title={labStatus === "running" ? "Container online" : "Container offline"}></span>
                      </div>
                      <h3 className="text-sm font-black text-brand-text">{node.name}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      className="text-brand-muted hover:text-brand-text text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setConsoleNodeId(node.id);
                        setIsConsoleOpen(true);
                      }}
                      className="flex-1 bg-brand-cyan hover:bg-brand-cyan/85 text-brand-bg text-[10px] font-black py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-md uppercase tracking-wider"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="12" x="3" y="6" rx="2" /><path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M12 12h.01" /><path d="M9 14h6" /></svg>
                      Open CLI
                    </button>
                    <button
                      onClick={() => deleteNode(node.id)}
                      className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 text-[10px] font-black py-2 px-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider animate-pulse hover:animate-none"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="bg-slate-950/40 border border-brand-border/30 rounded-xl p-1 flex">
                    <button
                      onClick={() => setActiveConfigTab("physical")}
                      className={`flex-1 text-center py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${activeConfigTab === "physical"
                          ? "bg-brand-cyan text-brand-bg shadow-sm"
                          : "text-brand-muted hover:text-brand-text"
                        }`}
                    >
                      Physical Links
                    </button>
                    <button
                      onClick={() => setActiveConfigTab("ip")}
                      className={`flex-1 text-center py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${activeConfigTab === "ip"
                          ? "bg-brand-cyan text-brand-bg shadow-sm"
                          : "text-brand-muted hover:text-brand-text"
                        }`}
                    >
                      IP Settings
                    </button>
                  </div>

                  {activeConfigTab === "physical" ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-bold text-brand-muted uppercase">Connected interfaces</span>
                      {node.type === "switch" || node.type === "hub" ? (
                        <span className="text-[9px] text-brand-muted/80 italic leading-relaxed">
                          Layer 2 local bridge structure. Frame routing is resolved automatically.
                        </span>
                      ) : node.interfaces.length === 0 ? (
                        <span className="text-[9px] text-brand-muted/80 italic">No cable interfaces connected.</span>
                      ) : (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {node.interfaces.map((iface, idx) => (
                            <div key={idx} className="bg-slate-950/30 border border-brand-border/20 p-2 rounded-xl text-[9px] flex justify-between items-center">
                              <span className="font-bold text-brand-cyan">{iface.name}</span>
                              <span className="font-mono text-brand-muted">{iface.ip ? `${iface.ip}/${iface.subnet === "255.255.255.0" ? "24" : "30"}` : "no ip address"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {node.type === "switch" || node.type === "hub" ? (
                        <span className="text-[9px] text-brand-muted/80 italic leading-relaxed">
                          This is a Layer 2 hub/switch. Standard bridges do not support host IP allocations.
                        </span>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-bold text-brand-muted uppercase">Select Interface</label>
                            <select
                              value={selectedInterface}
                              onChange={(e) => setSelectedInterface(e.target.value)}
                              className="w-full bg-slate-950 border border-brand-border/40 text-[9px] text-brand-text rounded-lg py-1 px-1.5 focus:outline-none focus:border-brand-cyan/60"
                            >
                              {node.interfaces.map(i => (
                                <option key={i.name} value={i.name}>{i.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-bold text-brand-muted uppercase">IP Address</label>
                            <input
                              type="text"
                              value={configIp}
                              onChange={(e) => setConfigIp(e.target.value)}
                              placeholder="e.g. 192.168.1.10"
                              className="w-full bg-slate-950 border border-brand-border/40 text-[9px] text-brand-text rounded-lg py-1 px-2 focus:outline-none focus:border-brand-cyan/60 font-mono"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-bold text-brand-muted uppercase">Subnet Mask</label>
                            <select
                              value={configSubnet}
                              onChange={(e) => setConfigSubnet(e.target.value)}
                              className="w-full bg-slate-950 border border-brand-border/40 text-[9px] text-brand-text rounded-lg py-1 px-1.5 focus:outline-none focus:border-brand-cyan/60"
                            >
                              <option value="255.255.255.0">255.255.255.0 (/24)</option>
                              <option value="255.255.255.252">255.255.255.252 (/30)</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-bold text-brand-muted uppercase">Default Gateway</label>
                            <input
                              type="text"
                              value={configGateway}
                              onChange={(e) => setConfigGateway(e.target.value)}
                              placeholder="e.g. 192.168.1.1"
                              className="w-full bg-slate-950 border border-brand-border/40 text-[9px] text-brand-text rounded-lg py-1 px-2 focus:outline-none focus:border-brand-cyan/60 font-mono"
                            />
                          </div>

                          <button
                            onClick={applyIpConfig}
                            className="bg-brand-cyan hover:bg-brand-cyan/85 text-brand-bg font-bold py-1.5 rounded-xl text-[9px] uppercase tracking-wider cursor-pointer transition-colors mt-1"
                          >
                            Apply Config
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* FLOATING LEFT SIDE CONNECTION DETAILS PANEL */}
            {selectedConnectionId && (() => {
              const conn = connections.find(c => c.id === selectedConnectionId);
              if (!conn) return null;
              const fromNode = nodes.find(n => n.id === conn.fromNode);
              const toNode = nodes.find(n => n.id === conn.toNode);
              if (!fromNode || !toNode) return null;

              return (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="absolute top-4 left-4 z-[35] w-72 bg-slate-900/90 backdrop-blur border border-brand-cyan/30 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl text-brand-text animate-fade-in select-text"
                >
                  <div className="flex items-center justify-between border-b border-brand-border/30 pb-2">
                    <div>
                      <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">Cable Selected</span>
                      <h3 className="text-sm font-black text-brand-text">Link Connection</h3>
                    </div>
                    <button
                      onClick={() => setSelectedConnectionId(null)}
                      className="text-brand-muted hover:text-brand-text text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="bg-slate-950/40 border border-brand-border/30 rounded-xl p-3 flex flex-col gap-2">
                    <div className="text-[10px] leading-relaxed">
                      <span className="font-bold text-brand-cyan">Source: </span>
                      <span className="font-mono text-brand-muted">{fromNode.name} ({conn.fromPort})</span>
                    </div>
                    <div className="text-[10px] leading-relaxed">
                      <span className="font-bold text-brand-cyan">Target: </span>
                      <span className="font-mono text-brand-muted">{toNode.name} ({conn.toPort})</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteConnection(conn.id)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 rounded-xl text-[10px] uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Delete Cable Link
                  </button>
                </div>
              );
            })()}
            {/* FLOATING ACTION PROMPT OVERLAY */}
            {(isWiringMode || packetSourceId) && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                className="absolute top-4 left-4 z-[35] w-72 bg-slate-900/90 backdrop-blur border border-brand-cyan/30 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl text-brand-text animate-fade-in select-none"
              >
                <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest select-none">Action Prompt</span>
                {isWiringMode && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] leading-relaxed">
                      {wiringStartNode ? (
                        <>
                          <span className="font-bold text-brand-cyan">Cabling Active: </span>
                          Select target device on canvas to connect <span className="font-bold text-brand-cyan">{wiringCableType}</span> cable from <span className="font-mono text-brand-muted">{nodes.find(n => n.id === wiringStartNode)?.name}</span>.
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-brand-cyan">Cabling Mode: </span>
                          Select source device on canvas to begin wiring a <span className="font-bold text-brand-cyan">{wiringCableType}</span> cable.
                        </>
                      )}
                    </p>
                    <button
                      onClick={() => {
                        setIsWiringMode(false);
                        setWiringStartNode(null);
                        setWiringCableType(null);
                      }}
                      className="bg-brand-cyan/20 hover:bg-brand-cyan/45 text-brand-cyan text-[10px] font-bold py-2 rounded-xl uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Cancel Cabling
                    </button>
                  </div>
                )}
                {packetSourceId && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] leading-relaxed">
                      <span className="font-bold text-amber-400">PDU Simulation: </span>
                      Source set to <span className="font-mono text-brand-muted">{nodes.find(n => n.id === packetSourceId)?.name}</span>. Select a destination device node to run ICMP ping.
                    </p>
                    <button
                      onClick={() => {
                        setPacketSourceId(null);
                        setPacketMode(null);
                      }}
                      className="bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 text-[10px] font-bold py-2 rounded-xl uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Cancel PDU Test
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* Infinite Grid Pattern Background (outside zoom wrapper to cover viewport completely) */}
            <div className="absolute inset-0 select-none pointer-events-none opacity-[0.03] z-0">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern
                    id="canvas-grid"
                    width={40 * zoom}
                    height={40 * zoom}
                    patternUnits="userSpaceOnUse"
                    patternTransform={`translate(${panOffset.x}, ${panOffset.y})`}
                  >
                    <path d={`M ${40 * zoom} 0 L 0 0 0 ${40 * zoom}`} fill="none" stroke="white" strokeWidth="2" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#canvas-grid)" />
              </svg>
            </div>

            {/* Zoom Wrapper */}
            <div
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: "top left",
              }}
              className={`absolute inset-0 overflow-visible ${isPanning ? "" : "transition-transform duration-200 ease-out"
                }`}
            >

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
                        {/* Base link line */}
                        <line
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          stroke={
                            isSelectedCable
                              ? "#f59e0b"
                              : c.cableType === "fiber"
                                ? "#ff7b00"
                                : "#00f2fe"
                          }
                          strokeWidth={c.cableType === "fiber" ? "2.5" : "3.5"}
                          strokeDasharray={c.cableType === "crossover" ? "6, 6" : undefined}
                          strokeOpacity={isSelectedCable ? "0.95" : "0.45"}
                        />
                        {/* Active data packet flow animation path */}
                        {labStatus === "running" && (
                          <line
                            x1={from.x}
                            y1={from.y}
                            x2={to.x}
                            y2={to.y}
                            stroke={
                              isSelectedCable
                                ? "#f59e0b"
                                : c.cableType === "fiber"
                                  ? "#ff7b00"
                                  : "#00f2fe"
                            }
                            strokeWidth={c.cableType === "fiber" ? "2.5" : "3.5"}
                            strokeDasharray={c.cableType === "crossover" ? "6, 6" : "8, 12"}
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
                          onDoubleClick={(e) => {
                            e.stopPropagation();
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
                className={`absolute inset-0 z-20 select-none ${isWiringMode || packetMode
                    ? "cursor-crosshair"
                    : isPanning
                      ? "cursor-grabbing"
                      : "cursor-grab"
                  }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => {
                  setSelectedNodeId(null);
                  setSelectedConnectionId(null);
                  setSelectionBox(null);
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
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                        setConsoleNodeId(node.id);
                        setIsConsoleOpen(true);
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all cursor-move select-none group/node ${isWiringCandidate
                          ? "animate-pulse animate-bounce scale-105 filter drop-shadow-[0_0_8px_rgba(0,242,254,0.8)]"
                          : isSelected
                            ? "scale-105 filter drop-shadow-[0_0_8px_rgba(0,242,254,0.8)]"
                            : "hover:scale-[1.03]"
                        }`}
                      style={{ left: node.x, top: node.y }}
                    >
                      {/* Received message checkmark badge */}
                      {receivedCheckNodeId === node.id && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-[60] animate-bounce select-none pointer-events-none">
                          <span className="bg-emerald-500 text-[8px] font-black text-slate-950 px-1.5 py-0.5 rounded-md border border-slate-950 uppercase tracking-wider shadow-md leading-none whitespace-nowrap">
                            Received
                          </span>
                          <div className="bg-emerald-500 text-slate-950 rounded-full w-6 h-6 flex items-center justify-center border-2 border-slate-950 shadow-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                        </div>
                      )}

                      {/* Device Icon using strictly accurate Cisco Packet Tracer symbols */}
                      <div className="w-20 h-14 flex items-center justify-center mb-1 pointer-events-none select-none">
                        {getCiscoDeviceSvg(node.type)}
                      </div>

                      <span className="text-[9px] font-extrabold font-mono tracking-tight text-brand-text uppercase leading-none">
                        {node.name}
                      </span>
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

                {/* Selection Box Area */}
                {selectionBox && selectionBox.visible && (
                  <div
                    onMouseDown={handleBoxMouseDown}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                    className="absolute border-2 border-dashed border-brand-cyan/60 bg-brand-cyan/5 rounded-xl cursor-grab active:cursor-grabbing flex flex-col justify-between group/selectionbox select-none"
                    style={{
                      left: selectionBox.x,
                      top: selectionBox.y,
                      width: selectionBox.width,
                      height: selectionBox.height,
                      zIndex: 15,
                    }}
                  >
                    {/* Header and Title / Drag Info */}
                    <div className="p-1 px-2.5 bg-slate-900/65 backdrop-blur-sm border-b border-brand-border/30 rounded-t-lg flex items-center justify-between text-[8px] font-black text-brand-cyan uppercase tracking-wider select-none pointer-events-none">
                      <span>Selection Area</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectionBox(null);
                        }}
                        className="text-brand-muted hover:text-red-400 font-extrabold text-[9px] cursor-pointer pointer-events-auto"
                        title="Dismiss selection box"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Resize handle at bottom right */}
                    <div
                      onMouseDown={handleBoxResizeMouseDown}
                      onDoubleClick={(e) => e.stopPropagation()}
                      className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center pointer-events-auto z-20"
                      title="Resize Selection Box"
                    >
                      <svg
                        viewBox="0 0 6 6"
                        className="w-2.5 h-2.5 text-brand-cyan/60 group-hover/selectionbox:text-brand-cyan transition-colors"
                        fill="currentColor"
                      >
                        <path d="M 6 0 L 0 6 L 6 6 Z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Floating Zoom Controls HUD */}
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              className="absolute bottom-4 right-4 z-[35] bg-slate-900/90 backdrop-blur border border-brand-border/40 rounded-xl p-1.5 flex items-center gap-1.5 shadow-2xl select-none"
            >
              <button
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                className="w-7 h-7 flex items-center justify-center bg-brand-bg hover:bg-brand-card-light text-brand-text rounded-lg border border-brand-border/30 hover:border-brand-cyan/40 transition-all font-bold cursor-pointer text-xs"
                title="Zoom Out"
              >
                －
              </button>
              <span className="text-[10px] font-mono font-bold text-brand-cyan w-12 text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(prev => Math.min(2.0, prev + 0.1))}
                className="w-7 h-7 flex items-center justify-center bg-brand-bg hover:bg-brand-card-light text-brand-text rounded-lg border border-brand-border/30 hover:border-brand-cyan/40 transition-all font-bold cursor-pointer text-xs"
                title="Zoom In"
              >
                ＋
              </button>
              <button
                onClick={() => {
                  setZoom(1.0);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="px-2 h-7 flex items-center justify-center bg-brand-bg hover:bg-brand-card-light text-[9px] font-extrabold text-brand-muted hover:text-brand-text rounded-lg border border-brand-border/30 hover:border-brand-cyan/40 transition-all cursor-pointer"
                title="Reset Zoom and Panning"
              >
                RESET
              </button>
              <button
                onClick={recenterCanvas}
                className="px-2 h-7 flex items-center justify-center bg-brand-bg hover:bg-brand-card-light text-[9px] font-extrabold text-brand-muted hover:text-brand-text rounded-lg border border-brand-border/30 hover:border-brand-cyan/40 transition-all cursor-pointer"
                title="Recenter topology in viewport"
              >
                RECENTER
              </button>
            </div>

            {/* Floating Horizontal Components Palette Dock at bottom center in Fullscreen mode */}
            {isFullscreen && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur border border-brand-cyan/35 rounded-2xl py-2 px-4 flex items-center gap-3 shadow-2xl border-brand-cyan/20"
              >
                <div className="flex items-center gap-2.5">
                  {[
                    { type: "router", label: "Router" },
                    { type: "switch", label: "Switch" },
                    { type: "pc", label: "PC" },
                    { type: "laptop", label: "Laptop" },
                    { type: "server", label: "Server" },
                    { type: "printer", label: "Printer" },
                    { type: "ap", label: "Access Point" },
                    { type: "hub", label: "Hub" },
                    { type: "cable", label: "Cable" },
                    { type: "message", label: "PDU" }
                  ].map((item) => {
                    const isCableType = item.type.startsWith("cable");
                    const cableKind = isCableType && item.type !== "cable" ? (item.type.split("-")[1] as "straight" | "crossover" | "fiber") : null;
                    const isActiveCable = isWiringMode && wiringCableType === cableKind;
                    const element = (
                      <div
                        key={item.type}
                        draggable={item.type !== "cable"}
                        onDragStart={(e) => handleDragStart(e, item.type as NodeType)}
                        onClick={() => {
                          if (item.type === "cable") {
                            setIsCableMenuOpen(!isCableMenuOpen);
                          } else if (isCableType && cableKind) {
                            setIsWiringMode(true);
                            setWiringCableType(cableKind);
                            setWiringStartNode(null);
                          }
                        }}
                        className={`border p-1.5 px-2.5 rounded-xl flex flex-col items-center justify-center gap-1 cursor-grab transition-all bg-brand-bg/50 border-brand-border/60 hover:border-brand-cyan/50 hover:bg-brand-card-light/20 ${isActiveCable || (item.type === "cable" && isCableMenuOpen)
                            ? "bg-brand-cyan/20 border-brand-cyan shadow-md"
                            : ""
                          }`}
                        title={item.label}
                      >
                        <div className="w-8 h-6 flex items-center justify-center select-none pointer-events-none scale-75">
                          {getCiscoDeviceSvg(item.type as NodeType)}
                        </div>
                        <span className="text-[8px] font-extrabold tracking-tight select-none pointer-events-none text-brand-text whitespace-nowrap">{item.label}</span>
                      </div>
                    );

                    if (item.type === "cable") {
                      return (
                        <div key={item.type} className="relative">
                          {/* Floating Popover directly above the Cable button in fullscreen */}
                          {isCableMenuOpen && (
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-[101] bg-slate-900/95 backdrop-blur border border-brand-cyan/35 rounded-2xl p-2.5 w-56 shadow-2xl flex flex-col gap-2 animate-fade-in select-text">
                              <div className="flex items-center justify-between border-b border-brand-border/30 pb-1">
                                <span className="text-[8px] font-black text-brand-cyan uppercase tracking-wider">Select Cable Type</span>
                                <button onClick={(e) => { e.stopPropagation(); setIsCableMenuOpen(false); }} className="text-brand-muted hover:text-brand-text text-[9px] font-bold cursor-pointer">✕</button>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                {[
                                  { type: "cable-straight", label: "Straight" },
                                  { type: "cable-crossover", label: "Crossover" },
                                  { type: "cable-fiber", label: "Fiber" }
                                ].map((cable) => {
                                  const cKind = cable.type.split("-")[1] as "straight" | "crossover" | "fiber";
                                  const isAct = isWiringMode && wiringCableType === cKind;
                                  return (
                                    <div
                                      key={cable.type}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsWiringMode(true);
                                        setWiringCableType(cKind);
                                        setWiringStartNode(null);
                                        setIsCableMenuOpen(false);
                                      }}
                                      className={`border p-1 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-center select-none ${isAct
                                          ? "bg-brand-cyan/20 border-brand-cyan shadow-md shadow-brand-cyan/20"
                                          : "bg-brand-bg/50 border-brand-border/60 hover:border-brand-cyan/40 hover:bg-brand-card-light/20"
                                        }`}
                                      title={cable.type === "cable-straight" ? "Copper Straight-Through" : cable.type === "cable-crossover" ? "Copper Cross-Over" : "Fiber Optic"}
                                    >
                                      <div className="w-8 h-6 flex items-center justify-center select-none pointer-events-none scale-75">
                                        {getCiscoDeviceSvg(cable.type as NodeType)}
                                      </div>
                                      <span className="text-[7px] font-extrabold tracking-tight select-none pointer-events-none text-brand-text">{cable.label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {element}
                        </div>
                      );
                    }
                    return element;
                  })}
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
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[110] flex items-center justify-center animate-fade-in p-4"
                >
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
                onMouseDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
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
            {/* CUSTOM ALERT & CONFIRM MODAL DIALOG */}
            {customModal && customModal.isOpen && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center animate-fade-in p-4"
              >
                <div className="bg-brand-card border border-brand-border w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-black text-brand-cyan uppercase tracking-wider">{customModal.title}</h3>
                    <p className="text-xs text-brand-text/95 mt-2 leading-relaxed font-semibold">{customModal.message}</p>
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    {customModal.type === "confirm" && (
                      <button
                        onClick={() => {
                          if (customModal.onCancel) customModal.onCancel();
                          setCustomModal(null);
                        }}
                        className="bg-slate-900 hover:bg-slate-850 text-brand-muted border border-brand-border/40 text-[10px] font-black py-2 px-4 rounded-xl cursor-pointer uppercase tracking-wider transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (customModal.onConfirm) customModal.onConfirm();
                        setCustomModal(null);
                      }}
                      className="bg-brand-cyan hover:bg-brand-cyan/85 text-brand-bg text-[10px] font-black py-2 px-5 rounded-xl cursor-pointer uppercase tracking-wider transition-colors shadow-md"
                    >
                      {customModal.type === "confirm" ? "OK" : "Close"}
                    </button>
                  </div>
                </div>
              </div>
            )}
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
