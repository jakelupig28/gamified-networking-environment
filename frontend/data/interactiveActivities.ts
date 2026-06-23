export interface DropdownOption {
  val: string;
  label: string;
}

export interface TaskConfig {
  title: string;
  description: string;
  type: "match" | "select" | "order" | "anding" | "pcConfig" | "banner" | "trouble" | "summarize";
  options?: DropdownOption[];
  rows?: { id: string; label: string; options?: DropdownOption[] }[];
  correctAnswers: Record<string, string>;
  maxScore: number;
}

export const INTERACTIVE_ACTIVITIES_CONFIG: Record<number, TaskConfig[]> = {
  // Module 1: Introduction to Networking
  0: [
    {
      title: "Device Role Matching",
      description: "Connect each network hardware device to its core function or description.",
      type: "match",
      options: [
        { val: "RouterOption", label: "Router" },
        { val: "SwitchOption", label: "Switch" },
        { val: "HostOption", label: "Host" },
        { val: "FirewallOption", label: "Firewall" }
      ],
      rows: [
        { id: "Router", label: "Connects different network segments and routes traffic between them." },
        { id: "Switch", label: "Forwards data frames within a local area network (LAN)." },
        { id: "Host", label: "Sends/receives endpoint traffic (e.g., PC, server, phone)." },
        { id: "Firewall", label: "Monitors and filters network traffic based on security rules." }
      ],
      correctAnswers: {
        Router: "RouterOption",
        Switch: "SwitchOption",
        Host: "HostOption",
        Firewall: "FirewallOption"
      },
      maxScore: 4
    },
    {
      title: "Topology Selection Scenario",
      description: "Scenario: Choose the best topology (Mesh, Star, or Bus) based on the business requirements.",
      type: "match",
      options: [
        { val: "Mesh", label: "Mesh Topology" },
        { val: "Star", label: "Star Topology" },
        { val: "Bus", label: "Bus Topology" }
      ],
      rows: [
        { id: "scenarioA", label: "Scenario A: Critical datacenter requiring fault tolerance and backup connections between all routers." },
        { id: "scenarioB", label: "Scenario B: Small office LAN connecting all workstations to a central networking switch." },
        { id: "scenarioC", label: "Scenario C: Legacy linear network layouts linking device-to-device with a primary backbone cable." }
      ],
      correctAnswers: {
        scenarioA: "Mesh",
        scenarioB: "Star",
        scenarioC: "Bus"
      },
      maxScore: 3
    },
    {
      title: "Network Types Identification",
      description: "Scenario: Classify each networking environment description as LAN, WAN, or WLAN.",
      type: "match",
      options: [
        { val: "LAN", label: "LAN (Local Area Network)" },
        { val: "WAN", label: "WAN (Wide Area Network)" },
        { val: "WLAN", label: "WLAN (Wireless LAN)" }
      ],
      rows: [
        { id: "netA", label: "Scenario A: Connecting workstations inside a local business office floor." },
        { id: "netB", label: "Scenario B: Interconnecting office routers in Paris, New York, and Sydney." },
        { id: "netC", label: "Scenario C: Employees connecting laptops wirelessly inside the cafeteria." }
      ],
      correctAnswers: {
        netA: "LAN",
        netB: "WAN",
        netC: "WLAN"
      },
      maxScore: 3
    }
  ],
  // Module 2: Communicating Over The Internet Part 1
  1: [
    {
      title: "OSI vs TCP/IP Layer Mapping",
      description: "Map the OSI layers to their corresponding layer in the modern TCP/IP model.",
      type: "match",
      options: [
        { val: "TCPApp", label: "Application Layer" },
        { val: "TCPTrans", label: "Transport Layer" },
        { val: "TCPInternet", label: "Internet Layer" },
        { val: "TCPNetAccess", label: "Network Access Layer" }
      ],
      rows: [
        { id: "OSIApp", label: "OSI Application / Presentation / Session" },
        { id: "OSITrans", label: "OSI Transport" },
        { id: "OSINet", label: "OSI Network" },
        { id: "OSIPhys", label: "OSI Data Link / Physical" }
      ],
      correctAnswers: {
        OSIApp: "TCPApp",
        OSITrans: "TCPTrans",
        OSINet: "TCPInternet",
        OSIPhys: "TCPNetAccess"
      },
      maxScore: 4
    },
    {
      title: "Network Model Classification",
      description: "Scenario: Read the descriptions and identify whether they describe a Peer-to-Peer (P2P) or Client-Server network model.",
      type: "match",
      options: [
        { val: "P2P", label: "Peer-to-Peer Model" },
        { val: "CS", label: "Client-Server Model" }
      ],
      rows: [
        { id: "p2p", label: "Scenario A: Two coworkers transferring design files directly between their laptops using a crossover Ethernet cable." },
        { id: "clientServer", label: "Scenario B: Hundreds of branch employees accessing customer data files from a central database host server." }
      ],
      correctAnswers: {
        p2p: "P2P",
        clientServer: "CS"
      },
      maxScore: 2
    }
  ],
  // Module 3: Communicating Over The Internet Part 2
  2: [
    {
      title: "Network Protocols Matching",
      description: "Match common Application layer protocols to their core function.",
      type: "match",
      options: [
        { val: "DNSOption", label: "DNS" },
        { val: "HTTPOption", label: "HTTP" },
        { val: "DHCPOption", label: "DHCP" },
        { val: "SMTPOption", label: "SMTP" }
      ],
      rows: [
        { id: "DNS", label: "Resolves human-readable domain names to IP addresses." },
        { id: "HTTP", label: "Transfers webpages and media assets across the Web." },
        { id: "DHCP", label: "Dynamically assigns IP configuration to host devices." },
        { id: "SMTP", label: "Transfers electronic mail messages between mail servers." }
      ],
      correctAnswers: {
        DNS: "DNSOption",
        HTTP: "HTTPOption",
        DHCP: "DHCPOption",
        SMTP: "SMTPOption"
      },
      maxScore: 4
    },
    {
      title: "Data Encapsulation Sequence",
      description: "Scenario: Arrange the data encapsulation steps in order, from raw application data down to physical transmission bits.",
      type: "match",
      options: [
        { val: "Data", label: "Data" },
        { val: "Segment", label: "Segment" },
        { val: "Packet", label: "Packet" },
        { val: "Frame", label: "Frame" },
        { val: "Bits", label: "Bits" }
      ],
      rows: [
        { id: "step1", label: "Slot 1 (Application Layer)" },
        { id: "step2", label: "Slot 2 (Transport Layer / Ports)" },
        { id: "step3", label: "Slot 3 (Network Layer / IPs)" },
        { id: "step4", label: "Slot 4 (Data Link Layer / MACs)" },
        { id: "step5", label: "Slot 5 (Physical Layer / Medium)" }
      ],
      correctAnswers: {
        step1: "Data",
        step2: "Segment",
        step3: "Packet",
        step4: "Frame",
        step5: "Bits"
      },
      maxScore: 5
    }
  ],
  // Module 4: Addressing IPv4
  3: [
    {
      title: "IP Address Class & Type",
      description: "Identify the address class (A, B, C) and address type (Public or Private) for the given IPv4 addresses.",
      type: "match",
      options: [
        { val: "PrivateClassA", label: "Private / Class A" },
        { val: "PrivateClassB", label: "Private / Class B" },
        { val: "PrivateClassC", label: "Private / Class C" },
        { val: "PublicClassA", label: "Public / Class A" }
      ],
      rows: [
        { id: "ip1", label: "10.0.0.50" },
        { id: "ip2", label: "192.168.1.100" },
        { id: "ip3", label: "8.8.8.8" },
        { id: "ip4", label: "172.16.5.20" }
      ],
      correctAnswers: {
        ip1: "PrivateClassA",
        ip2: "PrivateClassC",
        ip3: "PublicClassA",
        ip4: "PrivateClassB"
      },
      maxScore: 4
    },
    {
      title: "Bitwise ANDing Operations",
      description: "Perform bitwise ANDing on the last octet for a packet destined to 192.168.1.75 with a mask of 255.255.255.192 (/26).",
      type: "anding",
      correctAnswers: {
        anding: "64"
      },
      maxScore: 9
    },
    {
      title: "Subnet Host Capacity",
      description: "Calculate the total number of usable host IP addresses for each CIDR prefix.",
      type: "match",
      options: [
        { val: "2", label: "2 usable hosts" },
        { val: "62", label: "62 usable hosts" },
        { val: "254", label: "254 usable hosts" }
      ],
      rows: [
        { id: "mask1", label: "/24 (255.255.255.0)" },
        { id: "mask2", label: "/26 (255.255.255.192)" },
        { id: "mask3", label: "/30 (255.255.255.252)" }
      ],
      correctAnswers: {
        mask1: "254",
        mask2: "62",
        mask3: "2"
      },
      maxScore: 3
    }
  ],
  // Module 5: Ethernet Part 1
  4: [
    {
      title: "MAC Address Anatomy",
      description: "Identify the parts of the MAC address: the OUI and the device NIC identifier.",
      type: "match",
      options: [
        { val: "OUI", label: "OUI (Organizationally Unique Identifier)" },
        { val: "NIC", label: "NIC-Specific Identifier" }
      ],
      rows: [
        { id: "oui", label: "First 3 Octets (e.g. 00:60:2F)" },
        { id: "nic", label: "Last 3 Octets (e.g. 3A:07:BC)" }
      ],
      correctAnswers: {
        oui: "OUI",
        nic: "NIC"
      },
      maxScore: 2
    },
    {
      title: "CSMA Mode Selection",
      description: "Scenario: Select the appropriate media access control (CSMA) mechanism based on the physical media environment.",
      type: "match",
      options: [
        { val: "CSMACD", label: "CSMA/CD (Collision Detection)" },
        { val: "CSMACA", label: "CSMA/CA (Collision Avoidance)" }
      ],
      rows: [
        { id: "scenA", label: "Scenario A: Half-duplex wired Ethernet connections connected through a legacy hub." },
        { id: "scenB", label: "Scenario B: Shared wireless network channel (802.11 Wi-Fi) with multiple devices." }
      ],
      correctAnswers: {
        scenA: "CSMACD",
        scenB: "CSMACA"
      },
      maxScore: 2
    }
  ],
  // Module 6: Ethernet Part 2
  5: [
    {
      title: "ARP Resolution Flow",
      description: "Sort the chronological steps of the Address Resolution Protocol (ARP) from cache check to data forwarding.",
      type: "match",
      options: [
        { val: "1", label: "Step 1" },
        { val: "2", label: "Step 2" },
        { val: "3", label: "Step 3" },
        { val: "4", label: "Step 4" },
        { val: "5", label: "Step 5" }
      ],
      rows: [
        { id: "step1", label: "Host searches its local ARP cache for the destination IP." },
        { id: "step2", label: "Cache miss: Host broadcasts an ARP request frame on the LAN." },
        { id: "step3", label: "All devices receive the frame; non-matching devices discard it." },
        { id: "step4", label: "Destination device sends a unicast ARP reply containing its MAC." },
        { id: "step5", label: "Sender caches the MAC address and sends the queued IP packet." }
      ],
      correctAnswers: {
        step1: "1",
        step2: "2",
        step3: "3",
        step4: "4",
        step5: "5"
      },
      maxScore: 5
    },
    {
      title: "Switch MAC Table Learning",
      description: "Scenario: A frame arrives at a blank switch. Predict how the MAC address table is populated and how the frame is forwarded.",
      type: "match",
      options: [
        { val: "Yes", label: "Yes, performed" },
        { val: "No", label: "No, not performed" }
      ],
      rows: [
        { id: "action1", label: "Action 1: Switch records MAC A mapped to Port 1 in its MAC address table." },
        { id: "action2", label: "Action 2: Switch floods the frame out all ports except the incoming Port 1." },
        { id: "action3", label: "Action 3: Switch unicasts the frame directly out Port 2." }
      ],
      correctAnswers: {
        action1: "Yes",
        action2: "Yes",
        action3: "No"
      },
      maxScore: 3
    }
  ],
  // Module 7: Network Configuration
  6: [
    {
      title: "Cisco IOS CLI Modes",
      description: "Match the Cisco IOS CLI configuration prompt to its correct configuration mode.",
      type: "match",
      options: [
        { val: "UserEXEC", label: "User EXEC Mode" },
        { val: "PrivEXEC", label: "Privileged EXEC Mode" },
        { val: "GlobalConfig", label: "Global Configuration Mode" },
        { val: "InterfaceConfig", label: "Interface Configuration Mode" }
      ],
      rows: [
        { id: "RouterUser", label: "Router>" },
        { id: "RouterPriv", label: "Router#" },
        { id: "RouterGlobal", label: "Router(config)#" },
        { id: "RouterInterface", label: "Router(config-if)#" }
      ],
      correctAnswers: {
        RouterUser: "UserEXEC",
        RouterPriv: "PrivEXEC",
        RouterGlobal: "GlobalConfig",
        RouterInterface: "InterfaceConfig"
      },
      maxScore: 4
    },
    {
      title: "Essential Commands Matching",
      description: "Match standard Cisco IOS configuration commands to their purpose.",
      type: "match",
      options: [
        { val: "hostCmd", label: "hostname" },
        { val: "secCmd", label: "enable secret" },
        { val: "saveCmd", label: "copy running-config startup-config" },
        { val: "pingCmd", label: "ping" }
      ],
      rows: [
        { id: "hostname", label: "Configures a unique text name identifier for the network device." },
        { id: "secret", label: "Enables password encryption for access into Privileged EXEC mode." },
        { id: "save", label: "Saves active configuration variables from RAM to startup config NVRAM." },
        { id: "ping", label: "Sends ICMP echo request packets to verify network connectivity." }
      ],
      correctAnswers: {
        hostname: "hostCmd",
        secret: "secCmd",
        save: "saveCmd",
        ping: "pingCmd"
      },
      maxScore: 4
    },
    {
      title: "Host IP Configuration Scenario",
      description: "Scenario: Select the correct IP, Subnet Mask, and Gateway configurations to connect PC1 to the local network.",
      type: "pcConfig",
      correctAnswers: {
        ip: "192.168.1.10",
        mask: "255.255.255.0",
        gateway: "192.168.1.1"
      },
      maxScore: 3
    }
  ],
  // Module 8: Basic Router Configuration
  7: [
    {
      title: "Router Memory Components",
      description: "Match router hardware components (RAM, NVRAM, ROM, Flash) to the configurations or files they store.",
      type: "match",
      options: [
        { val: "RAMOption", label: "RAM (Volatile)" },
        { val: "NVRAMOption", label: "NVRAM (Non-Volatile)" },
        { val: "FlashOption", label: "Flash Memory" },
        { val: "ROMOption", label: "ROM (Read-Only)" }
      ],
      rows: [
        { id: "RAM", label: "Stores the currently running configuration file (running-config)." },
        { id: "NVRAM", label: "Stores the startup configuration file (startup-config)." },
        { id: "Flash", label: "Stores the Cisco IOS operating system software image." },
        { id: "ROM", label: "Stores diagnostics, power-on self-test (POST), and boot code." }
      ],
      correctAnswers: {
        RAM: "RAMOption",
        NVRAM: "NVRAMOption",
        Flash: "FlashOption",
        ROM: "ROMOption"
      },
      maxScore: 4
    },
    {
      title: "Interface Configuration Sequence",
      description: "Arrange the commands in sequence to enter configuration mode, select GigabitEthernet0/0, assign IP 192.168.1.1/24, and enable the port.",
      type: "match",
      options: [
        { val: "1", label: "Step 1" },
        { val: "2", label: "Step 2" },
        { val: "3", label: "Step 3" },
        { val: "4", label: "Step 4" }
      ],
      rows: [
        { id: "s1", label: "Router(config)# configure terminal" },
        { id: "s2", label: "Router(config)# interface gigabitethernet 0/0" },
        { id: "s3", label: "Router(config-if)# ip address 192.168.1.1 255.255.255.0" },
        { id: "s4", label: "Router(config-if)# no shutdown" }
      ],
      correctAnswers: {
        s1: "1",
        s2: "2",
        s3: "3",
        s4: "4"
      },
      maxScore: 4
    },
    {
      title: "CLI Banner Setup Scenario",
      description: "Scenario: Complete the Cisco CLI command input to set up an authorized access warning banner (MOTD). banner motd # Authorized Access Only! #",
      type: "banner",
      correctAnswers: {
        kw: "bannermotd",
        delim: "hash",
        msg: "auth"
      },
      maxScore: 3
    }
  ],
  // Module 9: Routing Protocol Concepts
  8: [
    {
      title: "Routing Table Path Selection",
      description: "Scenario: Examine the routing table. A packet is destined to 10.1.1.45. Select the matching route the router will use to forward the packet.",
      type: "match",
      options: [
        { val: "route1", label: "10.0.0.0/8 via 192.168.1.2" },
        { val: "route2", label: "10.1.1.0/24 via 192.168.2.2" },
        { val: "route3", label: "10.1.1.32/28 via 192.168.3.2" }
      ],
      rows: [
        { id: "route", label: "Selected forwarding path based on the Longest Prefix Match rule:" }
      ],
      correctAnswers: {
        route: "route3"
      },
      maxScore: 1
    },
    {
      title: "Routing Method Comparison",
      description: "Scenario: Select the best routing method (Static or Dynamic) based on the size and fault-tolerance needs of the network.",
      type: "match",
      options: [
        { val: "Static", label: "Static Routing" },
        { val: "Dynamic", label: "Dynamic Routing" }
      ],
      rows: [
        { id: "methodA", label: "Scenario A: A simple hub-and-spoke network with only 2 remote office routers connecting back to HQ." },
        { id: "methodB", label: "Scenario B: A massive ISP core network that needs automated routing metric updates to bypass link failures." }
      ],
      correctAnswers: {
        methodA: "Static",
        methodB: "Dynamic"
      },
      maxScore: 2
    },
    {
      title: "RIP vs OSPF Metrics",
      description: "Identify the metric metrics used by Routing Information Protocol (RIP) and Open Shortest Path First (OSPF).",
      type: "match",
      options: [
        { val: "hops", label: "Hop Count" },
        { val: "cost", label: "Cost (Bandwidth)" }
      ],
      rows: [
        { id: "rip", label: "RIP metric indicator" },
        { id: "ospf", label: "OSPF metric indicator" }
      ],
      correctAnswers: {
        rip: "hops",
        ospf: "cost"
      },
      maxScore: 2
    }
  ],
  // Module 10: Static Routing Part 1
  9: [
    {
      title: "Next-Hop IP vs Exit Interface",
      description: "Scenario: R1 connects to R2 (LAN IP 192.168.2.0/24). R1's GigabitEthernet0/1 interface has IP 10.0.0.1 and connects to R2's interface with IP 10.0.0.2. What exits R1 to reach R2's LAN?",
      type: "match",
      options: [
        { val: "Gig00", label: "GigabitEthernet0/0" },
        { val: "Gig01", label: "GigabitEthernet0/1" },
        { val: "10001", label: "10.0.0.1" },
        { val: "10002", label: "10.0.0.2" }
      ],
      rows: [
        { id: "exitIf", label: "Exit Interface on R1", options: [{ val: "Gig00", label: "GigabitEthernet0/0" }, { val: "Gig01", label: "GigabitEthernet0/1" }] },
        { id: "nextHop", label: "Next-Hop IP address", options: [{ val: "10001", label: "10.0.0.1" }, { val: "10002", label: "10.0.0.2" }] }
      ],
      correctAnswers: {
        exitIf: "Gig01",
        nextHop: "10002"
      },
      maxScore: 2
    },
    {
      title: "Static Route Command Assembly",
      description: "Assemble the full command syntax to configure a static route on R1 to reach R2's LAN 192.168.2.0/24 via next-hop 10.0.0.2.",
      type: "match",
      options: [],
      rows: [
        { id: "prefix", label: "Command keyword", options: [{ val: "iproute", label: "ip route" }, { val: "route", label: "route" }] },
        { id: "dest", label: "Destination network", options: [{ val: "192.168.2.0", label: "192.168.2.0" }, { val: "192.168.2.1", label: "192.168.2.1" }] },
        { id: "mask", label: "Subnet mask", options: [{ val: "255.255.255.0", label: "255.255.255.0" }, { val: "255.255.255.255", label: "255.255.255.255" }] },
        { id: "hop", label: "Next-hop gateway IP", options: [{ val: "10.0.0.2", label: "10.0.0.2" }, { val: "10.0.0.1", label: "10.0.0.1" }] }
      ],
      correctAnswers: {
        prefix: "iproute",
        dest: "192.168.2.0",
        mask: "255.255.255.0",
        hop: "10.0.0.2"
      },
      maxScore: 4
    }
  ],
  // Module 11: Static Routing Part 2
  10: [
    {
      title: "Default Static Route Anatomy",
      description: "Match the parameters in a default static route command to their function. ip route 0.0.0.0 0.0.0.0 203.0.113.1",
      type: "match",
      options: [
        { val: "matchesAny", label: "Matches any destination network address (default)" },
        { val: "gatewayIP", label: "Gateway of Last Resort next-hop IP address" }
      ],
      rows: [
        { id: "allZeros", label: "0.0.0.0 0.0.0.0 parameter function" },
        { id: "gateway", label: "203.0.113.1 parameter function" }
      ],
      correctAnswers: {
        allZeros: "matchesAny",
        gateway: "gatewayIP"
      },
      maxScore: 2
    },
    {
      title: "Floating Static Route Scenario",
      description: "Scenario: Configure a backup floating static route that only becomes active if the primary OSPF route (AD=110) fails. What AD should be chosen?",
      type: "match",
      options: [
        { val: "1", label: "AD = 1 (Static default)" },
        { val: "90", label: "AD = 90 (EIGRP default)" },
        { val: "120", label: "AD = 120 (RIP default - larger than OSPF)" }
      ],
      rows: [
        { id: "adChoice", label: "Administrative Distance setting for backup route:" }
      ],
      correctAnswers: {
        adChoice: "120"
      },
      maxScore: 1
    }
  ],
  // Module 12: Advance Static Routing
  11: [
    {
      title: "Route Summarization Calculation",
      description: "Calculate the summarized routing prefix for four contiguous Class C networks: 192.168.0.0/24 to 192.168.3.0/24.",
      type: "match",
      options: [
        { val: "1921680023", label: "192.168.0.0/23" },
        { val: "1921680022", label: "192.168.0.0/22" },
        { val: "1921680021", label: "192.168.0.0/21" }
      ],
      rows: [
        { id: "summary", label: "Summarized CIDR Address block:" }
      ],
      correctAnswers: {
        summary: "1921680022"
      },
      maxScore: 1
    },
    {
      title: "Troubleshooting Static Routes",
      description: "Scenario: R1 has a static route to 192.168.2.0/24 via 10.0.0.2, but cannot ping PC2. Pinging next-hop 10.0.0.2 directly also fails. Diagnose the issue.",
      type: "match",
      options: [
        { val: "wrongSyntax", label: "Syntax error in static route command" },
        { val: "interfaceDown", label: "Next-hop interface is down / physically disconnected" },
        { val: "wrongMask", label: "Mismatching subnet mask sizes" }
      ],
      rows: [
        { id: "rootCause", label: "Select the most likely physical/logic error root cause:" }
      ],
      correctAnswers: {
        rootCause: "interfaceDown"
      },
      maxScore: 1
    },
    {
      title: "IPv6 Static Route Assembly",
      description: "Assemble the correct IPv6 static route command prefix, destination prefix, and next-hop IPv6 address. ipv6 route 2001:db8:2::/64 2001:db8:1::2",
      type: "match",
      options: [],
      rows: [
        { id: "cmd", label: "IPv6 route command prefix", options: [{ val: "ipv6route", label: "ipv6 route" }, { val: "iproute", label: "ip route" }] },
        { id: "dest", label: "IPv6 destination network prefix", options: [{ val: "ipv6prefix", label: "2001:db8:2::/64" }, { val: "ipv6prefixno", label: "2001:db8:2::" }] },
        { id: "hop", label: "IPv6 next-hop gateway address", options: [{ val: "ipv6hop", label: "2001:db8:1::2" }, { val: "ipv6hopno", label: "2001:db8:1::1" }] }
      ],
      correctAnswers: {
        cmd: "ipv6route",
        dest: "ipv6prefix",
        hop: "ipv6hop"
      },
      maxScore: 3
    }
  ]
};
