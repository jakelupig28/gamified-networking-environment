export interface MultipleChoiceQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MatchingItem {
  id: string;
  label: string;
  matchVal: string;
}

export interface MatchingQuestion {
  description: string;
  items: MatchingItem[];
  options: { val: string; label: string }[];
  correctAnswers: Record<string, string>;
  explanation: string;
}

export interface CliCommandCheck {
  expectedCommands: string[][]; // Array of acceptable equivalent sets of commands
  targetState: Record<string, unknown>;
  promptPrefix: string;
}

export interface CliSimQuestion {
  scenario: string;
  instructions: string[];
  startingPrompt: string;
  initialConfig: Record<string, unknown>;
  checks: CliCommandCheck;
  correctCliSequence: string[]; // Example reference sequence
  explanation: string;
}

export interface QuizConfig {
  moduleId: number;
  moduleTitle: string;
  mcqs: MultipleChoiceQuestion[];
  matching: MatchingQuestion;
  cliSim: CliSimQuestion;
  competencyDomain: string;
}

export function generate50Mcqs(moduleId: number): MultipleChoiceQuestion[] {
  const mcqs: MultipleChoiceQuestion[] = [];
  
  // Define topic key words based on moduleId
  let domain = "";
  if (moduleId === 1782134355228) domain = "intro";
  else if (moduleId === 1782182808093) domain = "comm1";
  else if (moduleId === 1782181968596) domain = "comm2";
  else if (moduleId === 1782144355228 || moduleId === 1782184909611) domain = "ipv4";
  else if (moduleId === 1782185665993) domain = "eth1";
  else if (moduleId === 1782186311891) domain = "eth2";
  else if (moduleId === 1782186928370) domain = "netconfig";
  else if (moduleId === 1782197552474) domain = "basicrouter";
  else if (moduleId === 1782198533015) domain = "routingconcepts";
  else if (moduleId === 1782199846377) domain = "static1";
  else if (moduleId === 1782200580841) domain = "static2";
  else if (moduleId === 1782203599448) domain = "static3";
  else domain = "intro";

  // Generate 50 items
  for (let i = 1; i <= 50; i++) {
    if (domain === "intro") {
      const collisionPorts = [8, 12, 16, 24, 48][i % 5];
      mcqs.push({
        question: `Question ${i}: A new star topology LAN is being set up with a switch. If the switch has ${collisionPorts} ports, how many collision domains are created?`,
        options: [
          "1 collision domain",
          `${collisionPorts} collision domains`,
          `${collisionPorts / 2} collision domains`,
          "0 collision domains"
        ],
        correctIndex: 1,
        explanation: `In Ethernet switching, each individual port on a switch forms its own separate collision domain. Therefore, a switch with ${collisionPorts} ports creates exactly ${collisionPorts} collision domains.`
      });
    } else if (domain === "comm1") {
      const port = [80, 443, 21, 22, 23, 25, 53, 110][i % 8];
      const service = ["HTTP", "HTTPS", "FTP", "SSH", "Telnet", "SMTP", "DNS", "POP3"][i % 8];
      mcqs.push({
        question: `Question ${i}: Which TCP/UDP port number is standard for the network communication service '${service}'?`,
        options: [
          "Port 80",
          `Port ${port}`,
          `Port ${port + 10}`,
          "Port 443"
        ],
        correctIndex: 1,
        explanation: `Standard TCP/UDP transport protocol mappings assign port ${port} specifically to run '${service}' communication operations.`
      });
    } else if (domain === "comm2") {
      const type = ["DNS Resolution", "DHCP Allocation", "ARP Request", "ICMP Ping"][i % 4];
      const proto = ["UDP/53", "UDP/67-68", "Broadcast", "ICMP Type 8/0"][i % 4];
      mcqs.push({
        question: `Question ${i}: During communication processes, which transport/addressing format does a ${type} use?`,
        options: [
          "Unicast TCP",
          `${proto}`,
          "Multicast OSPF",
          "Anycast BGP"
        ],
        correctIndex: 1,
        explanation: `${type} relies on ${proto} messaging formats to establish logical network links.`
      });
    } else if (domain === "ipv4") {
      const masks = [24, 25, 26, 27, 28, 29, 30][i % 7];
      const subnets = [256, 128, 64, 32, 16, 8, 4][i % 7];
      const maxHosts = subnets - 2;
      mcqs.push({
        question: `Question ${i}: Given a Class C address range divided with a custom subnet mask prefix of /${masks}, how many usable host IP addresses are available per subnet?`,
        options: [
          `${subnets} hosts`,
          `${maxHosts} hosts`,
          `${maxHosts + 2} hosts`,
          `${subnets * 2} hosts`
        ],
        correctIndex: 1,
        explanation: `A /${masks} subnet mask provides ${32 - masks} host bits. The total hosts are 2^${32 - masks} = ${subnets}. Subtracting the network address and broadcast address yields ${maxHosts} usable host IPs.`
      });
    } else if (domain === "eth1") {
      const speed = [10, 100, 1000, 10000][i % 4];
      const name = ["Ethernet", "Fast Ethernet", "Gigabit Ethernet", "10-Gigabit Ethernet"][i % 4];
      mcqs.push({
        question: `Question ${i}: Which speed rating matches the IEEE standard definition for '${name}'?`,
        options: [
          "1 Mbps",
          `${speed} Mbps`,
          `${speed * 10} Mbps`,
          "100 Gbps"
        ],
        correctIndex: 1,
        explanation: `'${name}' standard configurations define a maximum data transmission rate of ${speed} Mbps.`
      });
    } else if (domain === "eth2") {
      const vlanId = [10, 20, 30, 40, 50, 99][i % 6];
      mcqs.push({
        question: `Question ${i}: A switchport is configured as an access port linked to VLAN ${vlanId}. What does the switch do with tagging headers on this link?`,
        options: [
          `Adds an 802.1Q header tag of ID ${vlanId}`,
          "Strips the 802.1Q VLAN tag before forwarding frames to the endpoint",
          "Forwards tagged frames directly to the computer",
          "Replaces the destination MAC address with the VLAN ID"
        ],
        correctIndex: 1,
        explanation: `Access ports interface directly with end-user devices (PCs) which do not understand VLAN tagging. Therefore, the switch strips the 802.1Q VLAN tag before transmission on access links.`
      });
    } else if (domain === "netconfig") {
      const mode = ["User EXEC", "Privileged EXEC", "Global Configuration", "Line Configuration"][i % 4];
      const prompt = [">", "#", "(config)#", "(config-line)#"][i % 4];
      mcqs.push({
        question: `Question ${i}: Which command prompt format represents Cisco IOS access in '${mode}' mode?`,
        options: [
          "Router(config-if)#",
          `Router${prompt}`,
          "Router(config-router)#",
          "Router>"
        ],
        correctIndex: 1,
        explanation: `The '${prompt}' suffix in a hostname prompt signifies that the device is running in '${mode}' configuration mode.`
      });
    } else if (domain === "basicrouter") {
      const command = ["description", "ip address", "no shutdown", "shutdown"][i % 4];
      const purpose = [
        "document interface links",
        "configure the interface IP/subnet mask",
        "activate the physical port to up state",
        "disable the physical port to down state"
      ][i % 4];
      mcqs.push({
        question: `Question ${i}: What is the primary purpose of the Cisco IOS interface command '${command}'?`,
        options: [
          "To configure routing protocols",
          `To ${purpose}`,
          "To rename the hostname",
          "To encrypt user passwords"
        ],
        correctIndex: 1,
        explanation: `The '${command}' command is executed in interface configuration mode to ${purpose}.`
      });
    } else if (domain === "routingconcepts") {
      const proto = ["OSPF", "EIGRP", "RIP", "Static Route"][i % 4];
      const ad = [110, 90, 120, 1][i % 4];
      mcqs.push({
        question: `Question ${i}: What is the default Administrative Distance (AD) for a route learned via ${proto}?`,
        options: [
          "AD 115",
          `AD ${ad}`,
          `AD ${ad + 5}`,
          "AD 100"
        ],
        correctIndex: 1,
        explanation: `Cisco IOS defines a default Administrative Distance of ${ad} to rank the trustworthiness of ${proto} paths.`
      });
    } else if (domain === "static1") {
      const hop = ["10.0.0.2", "192.168.12.2", "203.0.113.1", "172.16.5.2"][i % 4];
      mcqs.push({
        question: `Question ${i}: In the command 'ip route 192.168.20.0 255.255.255.0 ${hop}', what does '${hop}' represent?`,
        options: [
          "The local exit interface",
          "The next-hop router gateway IP address",
          "The destination network IP address",
          "The administrative distance value"
        ],
        correctIndex: 1,
        explanation: `In a static route statement, the final IP parameter represents the next-hop router's receiving gateway interface (${hop}).`
      });
    } else if (domain === "static2") {
      const name = ["GigabitEthernet0/0", "Serial0/0/0", "FastEthernet0/1", "Loopback0"][i % 4];
      mcqs.push({
        question: `Question ${i}: In the command 'ip route 10.0.5.0 255.255.255.0 ${name}', which exit mapping is used?`,
        options: [
          "Next-hop IP address routing",
          `Directly connected exit interface routing via ${name}`,
          "Recursive routing lookup",
          "Floating default gateway"
        ],
        correctIndex: 1,
        explanation: `When a static route uses a device port name like '${name}' instead of an IP, it is configured as a directly connected route pointing to that exit interface.`
      });
    } else { // static3 / advance static
      const ad = [5, 10, 50, 150, 200, 250][i % 6];
      mcqs.push({
        question: `Question ${i}: A floating static route is configured with an administrative distance of ${ad}. When will this route be loaded into the routing table?`,
        options: [
          "Only if the primary route with a lower administrative distance fails",
          `Immediately, because its administrative distance of ${ad} is higher than default`,
          `Only when EIGRP dynamic metrics exceed ${ad}`,
          "Never, as dynamic routes take priority over any static routes"
        ],
        correctIndex: 0,
        explanation: `A floating static route serves as a backup. It has a higher AD than the primary route (e.g. ${ad} > 1). It is only installed in the routing table when the primary link/route goes down.`
      });
    }
  }

  return mcqs;
}

export const QUIZZES_CONFIG: QuizConfig[] = [
  {
    moduleId: 1782134355228,
    moduleTitle: "Introduction to Networking",
    competencyDomain: "Introduction to Networks & Topologies",
    mcqs: generate50Mcqs(1782134355228),
    matching: {
      description: "Match the network physical topologies to their core connectivity characteristics.",
      items: [
        { id: "star", label: "Centralized switch link hubs", matchVal: "star_opt" },
        { id: "mesh", label: "Highly redundant point-to-point lines", matchVal: "mesh_opt" },
        { id: "bus", label: "Single linear trunk line medium", matchVal: "bus_opt" },
        { id: "ring", label: "Circular next-neighbor routing", matchVal: "ring_opt" }
      ],
      options: [
        { val: "star_opt", label: "Star Topology" },
        { val: "mesh_opt", label: "Mesh Topology" },
        { val: "bus_opt", label: "Bus Topology" },
        { val: "ring_opt", label: "Ring Topology" }
      ],
      correctAnswers: {
        star: "star_opt",
        mesh: "mesh_opt",
        bus: "bus_opt",
        ring: "ring_opt"
      },
      explanation: "Star connects nodes to a central device; Mesh provides full redundances; Bus uses a single bus cable; Ring links devices in a circular ring format."
    },
    cliSim: {
      scenario: "Verify command prompt authorization by naming a new core switch.",
      instructions: [
        "Go into privileged EXEC mode using 'enable'.",
        "Enter configuration mode with 'configure terminal'.",
        "Set the switch hostname to 'SW-Core' using the hostname command.",
        "Return to privileged mode with 'exit'."
      ],
      startingPrompt: "Switch>",
      initialConfig: { hostname: "Switch", mode: "user" },
      checks: {
        promptPrefix: "SW-Core",
        expectedCommands: [
          ["enable"],
          ["configure terminal", "config t"],
          ["hostname SW-Core"],
          ["exit", "end"]
        ],
        targetState: { hostname: "SW-Core" }
      },
      correctCliSequence: ["enable", "configure terminal", "hostname SW-Core", "exit"],
      explanation: "To rename a device, access privileged mode with 'enable', configure mode via 'configure terminal', and execute 'hostname SW-Core'."
    }
  },
  {
    moduleId: 1782182808093,
    moduleTitle: "Communicating Over The Internet Part 1",
    competencyDomain: "Introduction to Networks & Topologies",
    mcqs: generate50Mcqs(1782182808093),
    matching: {
      description: "Match TCP/IP model layers to their primary protocols.",
      items: [
        { id: "app", label: "HTTP, DNS, and FTP protocols", matchVal: "app_opt" },
        { id: "trans", label: "TCP and UDP packets control", matchVal: "trans_opt" },
        { id: "internet", label: "IP and ICMP packet routing", matchVal: "internet_opt" },
        { id: "netaccess", label: "Ethernet frames and physical cabling", matchVal: "netaccess_opt" }
      ],
      options: [
        { val: "app_opt", label: "Application Layer" },
        { val: "trans_opt", label: "Transport Layer" },
        { val: "internet_opt", label: "Internet Layer" },
        { val: "netaccess_opt", label: "Network Access Layer" }
      ],
      correctAnswers: {
        app: "app_opt",
        trans: "trans_opt",
        internet: "internet_opt",
        netaccess: "netaccess_opt"
      },
      explanation: "Application layers host HTTP/DNS; Transport manages TCP/UDP; Internet layer handles IP; Network Access controls hardware cabling."
    },
    cliSim: {
      scenario: "Review the system configuration currently active in volatile RAM.",
      instructions: [
        "Enter privileged EXEC mode with 'enable'.",
        "Display the active running config configuration file using 'show running-config'."
      ],
      startingPrompt: "Router>",
      initialConfig: { mode: "user" },
      checks: {
        promptPrefix: "Router",
        expectedCommands: [
          ["enable"],
          ["show running-config", "show run", "sh run"]
        ],
        targetState: { showConfig: true }
      },
      correctCliSequence: ["enable", "show running-config"],
      explanation: "The 'show running-config' command lists the current configuration residing in RAM. It requires privileged EXEC mode access."
    }
  },
  {
    moduleId: 1782181968596,
    moduleTitle: "Communicating Over The Internet Part 2",
    competencyDomain: "Introduction to Networks & Topologies",
    mcqs: generate50Mcqs(1782181968596),
    matching: {
      description: "Match networking protocols to their default ports.",
      items: [
        { id: "p80", label: "HTTP cleartext web traffic", matchVal: "p80_opt" },
        { id: "p443", label: "HTTPS secure encrypted traffic", matchVal: "p443_opt" },
        { id: "p25", label: "SMTP mail server relays", matchVal: "p25_opt" },
        { id: "p22", label: "SSH secured command shells", matchVal: "p22_opt" }
      ],
      options: [
        { val: "p80_opt", label: "Port 80" },
        { val: "p443_opt", label: "Port 443" },
        { val: "p25_opt", label: "Port 25" },
        { val: "p22_opt", label: "Port 22" }
      ],
      correctAnswers: {
        p80: "p80_opt",
        p443: "p443_opt",
        p25: "p25_opt",
        p22: "p22_opt"
      },
      explanation: "Port 80 is HTTP; Port 443 is HTTPS; Port 25 is SMTP; Port 22 is SSH."
    },
    cliSim: {
      scenario: "Configure the domain name resolution servers address.",
      instructions: [
        "Enter privileged EXEC mode with 'enable'.",
        "Enter configuration mode with 'configure terminal'.",
        "Add a primary name server host with IP '8.8.8.8' using 'ip name-server 8.8.8.8'."
      ],
      startingPrompt: "Router>",
      initialConfig: { mode: "user" },
      checks: {
        promptPrefix: "Router",
        expectedCommands: [
          ["enable"],
          ["configure terminal", "config t"],
          ["ip name-server 8.8.8.8"]
        ],
        targetState: { dns: "8.8.8.8" }
      },
      correctCliSequence: ["enable", "configure terminal", "ip name-server 8.8.8.8"],
      explanation: "To configure DNS servers on a router, use 'ip name-server [IP]' from global configuration mode."
    }
  },
  {
    moduleId: 1782184909611,
    moduleTitle: "Addressing IPv4",
    competencyDomain: "Subnetting & IPv4 Addressing",
    mcqs: generate50Mcqs(1782184909611),
    matching: {
      description: "Match CIDR subnet mask prefixes to their total count of usable host IPs.",
      items: [
        { id: "c24", label: "/24 Standard Subnet", matchVal: "c24_opt" },
        { id: "c25", label: "/25 Split Subnet", matchVal: "c25_opt" },
        { id: "c29", label: "/29 WAN Subnet", matchVal: "c29_opt" },
        { id: "c30", label: "/30 Serial Link Subnet", matchVal: "c30_opt" }
      ],
      options: [
        { val: "c24_opt", label: "254 usable IPs" },
        { val: "c25_opt", label: "126 usable IPs" },
        { val: "c29_opt", label: "6 usable IPs" },
        { val: "c30_opt", label: "2 usable IPs" }
      ],
      correctAnswers: {
        c24: "c24_opt",
        c25: "c25_opt",
        c29: "c29_opt",
        c30: "c30_opt"
      },
      explanation: "/24 provides 254 hosts; /25 provides 126 hosts; /29 provides 6 hosts; /30 provides 2 hosts."
    },
    cliSim: {
      scenario: "Assign static IP configurations on the GigabitEthernet0/0 interface.",
      instructions: [
        "Enter privileged EXEC mode with 'enable'.",
        "Enter configuration mode with 'configure terminal'.",
        "Enter interface config mode for 'interface GigabitEthernet0/0'.",
        "Set the interface IP to '192.168.10.1' and mask '255.255.255.0' using 'ip address 192.168.10.1 255.255.255.0'.",
        "Enable the interface using 'no shutdown'."
      ],
      startingPrompt: "Router>",
      initialConfig: { mode: "user" },
      checks: {
        promptPrefix: "Router",
        expectedCommands: [
          ["enable"],
          ["configure terminal", "config t"],
          ["interface GigabitEthernet0/0", "interface g0/0", "int g0/0"],
          ["ip address 192.168.10.1 255.255.255.0"],
          ["no shutdown", "no shut"]
        ],
        targetState: { ip: "192.168.10.1", mask: "255.255.255.0", state: "up" }
      },
      correctCliSequence: ["enable", "configure terminal", "interface g0/0", "ip address 192.168.10.1 255.255.255.0", "no shutdown"],
      explanation: "Static IP addresses are assigned to routing interfaces using 'ip address [IP] [MASK]', followed by 'no shutdown' to power up the link."
    }
  },
  {
    moduleId: 1782185665993,
    moduleTitle: "Ethernet Part 1",
    competencyDomain: "Ethernet & Switching (VLANs)",
    mcqs: generate50Mcqs(1782185665993),
    matching: {
      description: "Match Ethernet collision domains and modes to their physical descriptions.",
      items: [
        { id: "halfd", label: "CSMA/CD active, half transmission", matchVal: "halfd_opt" },
        { id: "fulld", label: "Collision-free bidirectional lines", matchVal: "fulld_opt" },
        { id: "colld", label: "Area where packets collide", matchVal: "colld_opt" },
        { id: "mac", label: "48-bit hex hardware address", matchVal: "mac_opt" }
      ],
      options: [
        { val: "halfd_opt", label: "Half-Duplex Mode" },
        { val: "fulld_opt", label: "Full-Duplex Mode" },
        { val: "colld_opt", label: "Collision Domain" },
        { val: "mac_opt", label: "MAC Address" }
      ],
      correctAnswers: {
        halfd: "halfd_opt",
        fulld: "fulld_opt",
        colld: "colld_opt",
        mac: "mac_opt"
      },
      explanation: "Half-duplex runs CSMA/CD; Full-duplex is collision-free; Collision domain defines collision boundaries; MAC address is hardware identity."
    },
    cliSim: {
      scenario: "Manually force a FastEthernet port to operate in Full Duplex mode.",
      instructions: [
        "Access global configuration mode ('enable' then 'configure terminal').",
        "Select interface config for 'interface FastEthernet0/1'.",
        "Set the interface mode duplex to 'duplex full'."
      ],
      startingPrompt: "Switch>",
      initialConfig: { mode: "user" },
      checks: {
        promptPrefix: "Switch",
        expectedCommands: [
          ["enable"],
          ["configure terminal", "config t"],
          ["interface FastEthernet0/1", "interface f0/1", "int f0/1"],
          ["duplex full"]
        ],
        targetState: { duplex: "full" }
      },
      correctCliSequence: ["enable", "configure terminal", "interface f0/1", "duplex full"],
      explanation: "Manual configuration of ports like speed and duplex parameters is done using 'duplex full' under the target interface submode."
    }
  },
  {
    moduleId: 1782186311891,
    moduleTitle: "Ethernet Part 2",
    competencyDomain: "Ethernet & Switching (VLANs)",
    mcqs: generate50Mcqs(1782186311891),
    matching: {
      description: "Match VLAN ID classifications to their default configurations.",
      items: [
        { id: "v1", label: "Default VLAN for access ports", matchVal: "v1_opt" },
        { id: "v99", label: "Common management VLAN ID", matchVal: "v99_opt" },
        { id: "v666", label: "Recommended black-hole/dead VLAN", matchVal: "v666_opt" },
        { id: "native", label: "Handles untagged trunk traffic", matchVal: "native_opt" }
      ],
      options: [
        { val: "v1_opt", label: "VLAN 1" },
        { val: "v99_opt", label: "VLAN 99" },
        { val: "v666_opt", label: "VLAN 666" },
        { val: "native_opt", label: "Native VLAN" }
      ],
      correctAnswers: {
        v1: "v1_opt",
        v99: "v99_opt",
        v666: "v666_opt",
        native: "native_opt"
      },
      explanation: "VLAN 1 is the factory default; VLAN 99 is management; VLAN 666 blackholes unused ports; Native handles untagged trunks."
    },
    cliSim: {
      scenario: "Assign an access port Switchport on the switch to VLAN 20.",
      instructions: [
        "Go into privileged and config mode ('enable' then 'configure terminal').",
        "Select interface config for 'interface FastEthernet0/10'.",
        "Change mode to access with 'switchport mode access'.",
        "Assign the port access to vlan 20 with 'switchport access vlan 20'."
      ],
      startingPrompt: "Switch>",
      initialConfig: { mode: "user" },
      checks: {
        promptPrefix: "Switch",
        expectedCommands: [
          ["enable"],
          ["configure terminal", "config t"],
          ["interface FastEthernet0/10", "interface f0/10", "int f0/10"],
          ["switchport mode access"],
          ["switchport access vlan 20"]
        ],
        targetState: { mode: "access", vlan: 20 }
      },
      correctCliSequence: ["enable", "configure terminal", "interface f0/10", "switchport mode access", "switchport access vlan 20"],
      explanation: "Access ports are statically mapped to a VLAN by entering interface config mode, declaring 'switchport mode access', and configuring 'switchport access vlan [ID]'."
    }
  },
  {
    moduleId: 1782186928370,
    moduleTitle: "Network Configuration",
    competencyDomain: "Router & Device Configuration",
    mcqs: generate50Mcqs(1782186928370),
    matching: {
      description: "Match the IOS command shell configuration prompts to their privilege level modes.",
      items: [
        { id: "puser", label: "Router>", matchVal: "puser_opt" },
        { id: "ppriv", label: "Router#", matchVal: "ppriv_opt" },
        { id: "pglob", label: "Router(config)#", matchVal: "pglob_opt" },
        { id: "pif", label: "Router(config-if)#", matchVal: "pif_opt" }
      ],
      options: [
        { val: "puser_opt", label: "User EXEC Mode" },
        { val: "ppriv_opt", label: "Privileged EXEC Mode" },
        { val: "pglob_opt", label: "Global Configuration Mode" },
        { val: "pif_opt", label: "Interface Configuration Mode" }
      ],
      correctAnswers: {
        puser: "puser_opt",
        ppriv: "ppriv_opt",
        pglob: "pglob_opt",
        pif: "pif_opt"
      },
      explanation: "Router> is User EXEC; Router# is Privileged EXEC; Router(config)# is Global; Router(config-if)# is Interface mode."
    },
    cliSim: {
      scenario: "Secure access to privileged EXEC mode using a hashed secret password.",
      instructions: [
        "Go into config mode ('enable' then 'configure terminal').",
        "Set the encrypted enable secret password to 'cisco123' using 'enable secret cisco123'."
      ],
      startingPrompt: "Router>",
      initialConfig: { mode: "user" },
      checks: {
        promptPrefix: "Router",
        expectedCommands: [
          ["enable"],
          ["configure terminal", "config t"],
          ["enable secret cisco123"]
        ],
        targetState: { enableSecret: "cisco123" }
      },
      correctCliSequence: ["enable", "configure terminal", "enable secret cisco123"],
      explanation: "To safeguard admin access, configure an enable password secret using 'enable secret [password]' from global config mode."
    }
  },
  {
    moduleId: 1782197552474,
    moduleTitle: "Basic Router Configuration",
    competencyDomain: "Router & Device Configuration",
    mcqs: generate50Mcqs(1782197552474),
    matching: {
      description: "Match the CLI diagnostic commands to their primary operational actions.",
      items: [
        { id: "ping", label: "Test ICMP roundtrip latency link diagnostics", matchVal: "ping_opt" },
        { id: "showip", label: "Summarize status & IPs of all interfaces", matchVal: "showip_opt" },
        { id: "showroute", label: "Print current active logical routing table", matchVal: "showroute_opt" },
        { id: "showarp", label: "Check MAC address bindings mapped from IPs", matchVal: "showarp_opt" }
      ],
      options: [
        { val: "ping_opt", label: "ping [IP]" },
        { val: "showip_opt", label: "show ip interface brief" },
        { val: "showroute_opt", label: "show ip route" },
        { val: "showarp_opt", label: "show ip arp" }
      ],
      correctAnswers: {
        ping: "ping_opt",
        showip: "showip_opt",
        showroute: "showroute_opt",
        showarp: "showarp_opt"
      },
      explanation: "ping tests connectivity; show ip interface brief summarizes link IPs; show ip route outputs routing paths; show ip arp reads MAC table mappings."
    },
    cliSim: {
      scenario: "Label the GigabitEthernet0/1 interface pointing to the WAN backbone.",
      instructions: [
        "Go into interface configuration submode ('enable' -> 'configure terminal' -> 'interface GigabitEthernet0/1').",
        "Add interface metadata label 'Link to WAN' using 'description Link to WAN'."
      ],
      startingPrompt: "Router>",
      initialConfig: { mode: "user" },
      checks: {
        promptPrefix: "Router",
        expectedCommands: [
          ["enable"],
          ["configure terminal", "config t"],
          ["interface GigabitEthernet0/1", "interface g0/1", "int g0/1"],
          ["description Link to WAN"]
        ],
        targetState: { description: "Link to WAN" }
      },
      correctCliSequence: ["enable", "configure terminal", "interface g0/1", "description Link to WAN"],
      explanation: "Descriptions are added using 'description [text]' inside interface configuration mode to aid troubleshooting."
    }
  },
  {
    moduleId: 1782198533015,
    moduleTitle: "Routing Protocol Concepts",
    competencyDomain: "Routing Protocols & Static Routing",
    mcqs: generate50Mcqs(1782198533015),
    matching: {
      description: "Match the routing protocols to their default administrative distances.",
      items: [
        { id: "rip", label: "Distance-vector basic hop routing protocol", matchVal: "rip_opt" },
        { id: "ospf", label: "Link-state cost based SPF protocol", matchVal: "ospf_opt" },
        { id: "eigrp", label: "Advanced distance-vector hybrid routing", matchVal: "eigrp_opt" },
        { id: "static", label: "Statically programmed override paths", matchVal: "static_opt" }
      ],
      options: [
        { val: "rip_opt", label: "AD 120" },
        { val: "ospf_opt", label: "AD 110" },
        { val: "eigrp_opt", label: "AD 90" },
        { val: "static_opt", label: "AD 1" }
      ],
      correctAnswers: {
        rip: "rip_opt",
        ospf: "ospf_opt",
        eigrp: "eigrp_opt",
        static: "static_opt"
      },
      explanation: "RIP uses AD 120; OSPF uses AD 110; EIGRP uses AD 90; Static routes use AD 1."
    },
    cliSim: {
      scenario: "Initiate dynamic routing configuration using RIP protocol configuration.",
      instructions: [
        "Enter global configuration mode ('enable' -> 'configure terminal').",
        "Access the dynamic router configuration submode for RIP protocol using 'router rip'."
      ],
      startingPrompt: "Router>",
      initialConfig: { mode: "user" },
      checks: {
        promptPrefix: "Router",
        expectedCommands: [
          ["enable"],
          ["configure terminal", "config t"],
          ["router rip"]
        ],
        targetState: { routingProtocol: "rip" }
      },
      correctCliSequence: ["enable", "configure terminal", "router rip"],
      explanation: "Dynamic routing protocols are configured by starting the dynamic process, for instance using 'router rip' in config mode."
    }
  },
  {
    moduleId: 1782199846377,
    moduleTitle: "Static Routing Part 1",
    competencyDomain: "Routing Protocols & Static Routing",
    mcqs: generate50Mcqs(1782199846377),
    matching: {
      description: "Match standard static routing classifications to their definitions.",
      items: [
        { id: "std", label: "Standard static path mapping to a single subnet", matchVal: "std_opt" },
        { id: "def", label: "Gateway of last resort matching all targets", matchVal: "def_opt" },
        { id: "sum", label: "Summarized pathway mapping multiple routes", matchVal: "sum_opt" },
        { id: "flt", label: "Backup path with a high AD offset threshold", matchVal: "flt_opt" }
      ],
      options: [
        { val: "std_opt", label: "Standard Static Route" },
        { val: "def_opt", label: "Default Static Route (0.0.0.0/0)" },
        { val: "sum_opt", label: "Summary Static Route" },
        { val: "flt_opt", label: "Floating Static Route" }
      ],
      correctAnswers: {
        std: "std_opt",
        def: "def_opt",
        sum: "sum_opt",
        flt: "flt_opt"
      },
      explanation: "Standard routes match single subnets; Default matches all traffic; Summary groups subnets; Floating routes act as backups."
    },
    cliSim: {
      scenario: "Configure a static route directing traffic to subnet 192.168.20.0/24 via next-hop IP 10.0.0.2.",
      instructions: [
        "Enter configuration mode ('enable' -> 'configure terminal').",
        "Configure standard static route targeting network '192.168.20.0', mask '255.255.255.0' via next hop gateway '10.0.0.2' using 'ip route 192.168.20.0 255.255.255.0 10.0.0.2'."
      ],
      startingPrompt: "Router>",
      initialConfig: { mode: "user" },
      checks: {
        promptPrefix: "Router",
        expectedCommands: [
          ["enable"],
          ["configure terminal", "config t"],
          ["ip route 192.168.20.0 255.255.255.0 10.0.0.2"]
        ],
        targetState: { route: "192.168.20.0/24", nextHop: "10.0.0.2" }
      },
      correctCliSequence: ["enable", "configure terminal", "ip route 192.168.20.0 255.255.255.0 10.0.0.2"],
      explanation: "Standard static routes are defined via 'ip route [dest_ip] [dest_mask] [next_hop_ip]'."
    }
  },
  {
    moduleId: 1782200580841,
    moduleTitle: "Static Routing Part 2",
    competencyDomain: "Routing Protocols & Static Routing",
    mcqs: generate50Mcqs(1782200580841),
    matching: {
      description: "Match static route styles to their forwarding parameters.",
      items: [
        { id: "nhroute", label: "Specifies gateway next-hop IP address", matchVal: "nhroute_opt" },
        { id: "dirroute", label: "Specifies egress serial exit interface directly", matchVal: "dirroute_opt" },
        { id: "fullyspec", label: "Declares both exit interface and next hop", matchVal: "fullyspec_opt" },
        { id: "recurse", label: "Forces router to lookup route twice", matchVal: "recurse_opt" }
      ],
      options: [
        { val: "nhroute_opt", label: "Next-Hop Route" },
        { val: "dirroute_opt", label: "Directly Connected Route" },
        { val: "fullyspec_opt", label: "Fully Specified Route" },
        { val: "recurse_opt", label: "Recursive Lookup Route" }
      ],
      correctAnswers: {
        nhroute: "nhroute_opt",
        dirroute: "dirroute_opt",
        fullyspec: "fullyspec_opt",
        recurse: "recurse_opt"
      },
      explanation: "Next-hop uses gateway IP; Directly connected declares exit interface; Fully specified declares both parameters; Recursive triggers dual lookups."
    },
    cliSim: {
      scenario: "Configure a static route to network 10.0.5.0/24 using exit interface GigabitEthernet0/0.",
      instructions: [
        "Access config mode ('enable' -> 'configure terminal').",
        "Configure directly connected static route targeting '10.0.5.0' mask '255.255.255.0' using exit interface 'GigabitEthernet0/0' using 'ip route 10.0.5.0 255.255.255.0 GigabitEthernet0/0'."
      ],
      startingPrompt: "Router>",
      initialConfig: { mode: "user" },
      checks: {
        promptPrefix: "Router",
        expectedCommands: [
          ["enable"],
          ["configure terminal", "config t"],
          ["ip route 10.0.5.0 255.255.255.0 GigabitEthernet0/0", "ip route 10.0.5.0 255.255.255.0 g0/0"]
        ],
        targetState: { route: "10.0.5.0/24", exitInterface: "g0/0" }
      },
      correctCliSequence: ["enable", "configure terminal", "ip route 10.0.5.0 255.255.255.0 GigabitEthernet0/0"],
      explanation: "Directly connected static routes use the interface name as the exit selector instead of a remote IP."
    }
  },
  {
    moduleId: 1782203599448,
    moduleTitle: "Advance Static Routing",
    competencyDomain: "Routing Protocols & Static Routing",
    mcqs: generate50Mcqs(1782203599448),
    matching: {
      description: "Match troubleshooting tools to their primary routing diagnostics.",
      items: [
        { id: "ping", label: "Send ICMP echo requests to confirm host is up", matchVal: "ping_opt" },
        { id: "trace", label: "Trace interface hops path router latency", matchVal: "trace_opt" },
        { id: "showip", label: "Lists details about active routing paths", matchVal: "showip_opt" },
        { id: "showrun", label: "Lists configuration file details active in RAM", matchVal: "showrun_opt" }
      ],
      options: [
        { val: "ping_opt", label: "ping [IP]" },
        { val: "trace_opt", label: "traceroute [IP]" },
        { val: "showip_opt", label: "show ip route" },
        { val: "showrun_opt", label: "show running-config" }
      ],
      correctAnswers: {
        ping: "ping_opt",
        trace: "trace_opt",
        showip: "showip_opt",
        showrun: "showrun_opt"
      },
      explanation: "ping tests connectivity; traceroute traces path hops; show ip route dumps routing database; show running-config lists RAM state."
    },
    cliSim: {
      scenario: "Configure a floating static default gateway route with an AD weight of 150 directing all outbound traffic to backup gateway IP 203.0.113.2.",
      instructions: [
        "Enter global configuration mode ('enable' -> 'configure terminal').",
        "Configure default static route via '203.0.113.2' with administrative distance '150' using 'ip route 0.0.0.0 0.0.0.0 203.0.113.2 150'."
      ],
      startingPrompt: "Router>",
      initialConfig: { mode: "user" },
      checks: {
        promptPrefix: "Router",
        expectedCommands: [
          ["enable"],
          ["configure terminal", "config t"],
          ["ip route 0.0.0.0 0.0.0.0 203.0.113.2 150"]
        ],
        targetState: { route: "0.0.0.0/0", nextHop: "203.0.113.2", ad: 150 }
      },
      correctCliSequence: ["enable", "configure terminal", "ip route 0.0.0.0 0.0.0.0 203.0.113.2 150"],
      explanation: "A floating default route is configured via 'ip route 0.0.0.0 0.0.0.0 [gateway] [AD_value]' where the AD is larger than the dynamic routing protocol's AD."
    }
  }
];
