import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from "recharts";

// import shared constants and generators from utilities so they can be unit tested
import {
  EMOTIONS,
  EMOTION_COLORS,
  EMOTION_ICONS,
  randBetween,
  generateEmotionSnapshot,
  generateTimeline,
  generateConfusionMatrix,
  generateModelMetrics,
  generateTrainingHistory,
  generateAlerts,
  generatePerEmotionMetrics,
} from "./dataGenerators";


// ─── HELPERS ──────────────────────────────────────────────────────────────────
const GlowRing = ({ pct, color, size = 90, label, sub }) => {
  const r = 36; const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <svg width={size} height={size} viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6"/>
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ filter:`drop-shadow(0 0 6px ${color})`, transition:"stroke-dasharray 0.8s ease" }}
        />
        <text x="45" y="49" textAnchor="middle" fill="white" fontSize="13" fontWeight="700"
          fontFamily="'Space Mono', monospace">{pct}%</text>
      </svg>
      <span style={{ fontSize:11, color:"#8B9BAF", fontFamily:"'Space Mono', monospace", letterSpacing:1 }}>{label}</span>
      {sub && <span style={{ fontSize:10, color: color, fontFamily:"monospace" }}>{sub}</span>}
    </div>
  );
};

const StatBadge = ({ value, label, color, suffix="" }) => (
  <div style={{
    background:"rgba(255,255,255,0.04)", border:`1px solid ${color}33`,
    borderRadius:10, padding:"14px 18px", display:"flex", flexDirection:"column", gap:4
  }}>
    <span style={{ fontSize:24, fontWeight:800, color, fontFamily:"'Space Mono',monospace",
      textShadow:`0 0 12px ${color}99` }}>
      {value}{suffix}
    </span>
    <span style={{ fontSize:11, color:"#8B9BAF", letterSpacing:1.5, textTransform:"uppercase" }}>{label}</span>
  </div>
);
StatBadge.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  suffix: PropTypes.string,
};
const EmotionBar = ({ emotion, value, onClick, selected }) => (
  <div onClick={() => onClick(emotion)}
    style={{ cursor:"pointer", padding:"8px 12px", borderRadius:8,
      background: selected ? `${EMOTION_COLORS[emotion]}18` : "transparent",
      border: `1px solid ${selected ? EMOTION_COLORS[emotion]+"55" : "transparent"}`,
      transition:"all 0.2s" }}>
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
      <span style={{ fontSize:12, color:"#cdd6f4", fontFamily:"monospace" }}>
        {EMOTION_ICONS[emotion]} {emotion}
      </span>
      <span style={{ fontSize:12, color: EMOTION_COLORS[emotion], fontWeight:700, fontFamily:"monospace" }}>
        {value}%
      </span>
    </div>
    <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:4, height:6, overflow:"hidden" }}>
      <div style={{
        width:`${value}%`, height:"100%", borderRadius:4,
        background:`linear-gradient(90deg, ${EMOTION_COLORS[emotion]}aa, ${EMOTION_COLORS[emotion]})`,
        boxShadow:`0 0 8px ${EMOTION_COLORS[emotion]}88`,
        transition:"width 0.6s cubic-bezier(0.34,1.56,0.64,1)"
      }}/>
    </div>
  </div>
);

EmotionBar.propTypes = {
  emotion: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
  selected: PropTypes.bool,
};

const AlertItem = ({ item }) => {
  const colors = { warning:"#FFD166", info:"#5E9AFF", success:"#06D6A0", error:"#FF5757" };
  const icons = { warning:"⚡", info:"ℹ", success:"✓", error:"✕" };
  return (
    <div style={{ display:"flex", gap:10, padding:"8px 0",
      borderBottom:"1px solid rgba(255,255,255,0.05)", alignItems:"flex-start" }}>
      <span style={{ color:colors[item.type], fontSize:13, marginTop:1 }}>{icons[item.type]}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, color="#cdd6f4" }}>{item.msg}</div>
        <div style={{ fontSize:10, color="#8B9BAF", marginTop:2, fontFamily:"monospace" }}>{item.time}</div>
      </div>
    </div>
  );
};

AlertItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    time: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["warning","info","success","error"]).isRequired,
    msg: PropTypes.string.isRequired,
  }).isRequired,
};

AlertItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    time: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["warning","info","success","error"]).isRequired,
    msg: PropTypes.string.isRequired,
  }).isRequired,
};

// ─── CONFUSION MATRIX ─────────────────────────────────────────────────────────
const ConfusionMatrix = ({ matrix }) => {
  const [hovered, setHovered] = useState(null);
  const maxVal = 99;
  return (
    <div style={{ overflowX:"auto" }}>
      <div style={{ display:"inline-grid", gridTemplateColumns:`60px repeat(${EMOTIONS.length}, 44px)`,
        gap:2, fontSize:10, fontFamily:"monospace" }}>
        <div/>
        {EMOTIONS.map(e => (
          <div key={e} style={{ textAlign:"center", color:"#8B9BAF", padding:"4px 0",
            writingMode:"vertical-lr", transform:"rotate(180deg)", height:60,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            {e.slice(0,3)}
          </div>
        ))}
        {EMOTIONS.map((rowE, i) => [
          <div key={`r${i}`} style={{ color:"#8B9BAF", padding:"4px 6px", display:"flex",
            alignItems:"center", justifyContent:"flex-end" }}>{rowE.slice(0,3)}</div>,
          ...EMOTIONS.map((colE, j) => {
            const val = matrix[i][j];
            const isCorrect = i === j;
            const intensity = val / maxVal;
            const bg = isCorrect
              ? `rgba(6,214,160,${0.15 + intensity * 0.7})`
              : `rgba(255,87,87,${intensity * 0.6})`;
            const isHov = hovered && hovered[0] === i && hovered[1] === j;
            return (
              <div key={`${i}-${j}`}
                onMouseEnter={() => setHovered([i, j])}
                onMouseLeave={() => setHovered(null)}
                style={{
                  width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center",
                  background: isHov ? "rgba(255,255,255,0.2)" : bg,
                  borderRadius:4, cursor:"default", transition:"background 0.2s",
                  border: isCorrect ? "1px solid rgba(6,214,160,0.3)" : "1px solid rgba(255,255,255,0.04)",
                  color: isHov ? "white" : val > 50 ? "white" : "#cdd6f4",
                  fontWeight: isCorrect ? 700 : 400,
                  fontSize: isHov ? 12 : 11,
                  boxShadow: isHov ? "0 0 10px rgba(255,255,255,0.2)" : "none"
                }}>{val}</div>
            );
          })
        ])}
      </div>
      <div style={{ marginTop:8, fontSize:10, color:"#8B9BAF" }}>
        ■ <span style={{ color:"#06D6A0" }}>Correct</span> &nbsp; ■ <span style={{ color:"#FF5757" }}>Incorrect</span>
      </div>
    </div>
  );
};

// ─── FACE SIMULATION ──────────────────────────────────────────────────────────
const FaceSimulator = ({ dominant, confidence }) => {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame(f => f + 1), 400);
    return () => clearInterval(t);
  }, []);

  const scanY = (frame * 3) % 96;
  const color = EMOTION_COLORS[dominant] || "#06D6A0";
  const icon = EMOTION_ICONS[dominant] || "😐";

  return (
    <div style={{ position:"relative", width:"100%", aspectRatio:"4/3",
      background:"linear-gradient(135deg,#0d0f14,#161b22)",
      borderRadius:12, overflow:"hidden",
      border:`1px solid ${color}33` }}>
      {/* Grid overlay */}
      <svg style={{ position:"absolute", inset:0, opacity:0.12 }} width="100%" height="100%">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#06D6A0" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>

      {/* Scan line */}
      <div style={{
        position:"absolute", left:0, right:0, top:`${scanY}%`, height:2,
        background:`linear-gradient(90deg, transparent, ${color}88, transparent)`,
        boxShadow:`0 0 10px ${color}66`
      }}/>

      {/* Face box */}
      <div style={{
        position:"absolute", top:"15%", left:"25%", right:"25%", bottom:"10%",
        border:`2px solid ${color}`, borderRadius:8,
        boxShadow:`0 0 20px ${color}44, inset 0 0 20px ${color}11`
      }}>
        {/* Corners */}
        {[["0","0","top","left"], ["0","0","top","right"], ["0","0","bottom","left"], ["0","0","bottom","right"]].map(([x, y, v, h], idx) => (
          <div key={idx} style={{
            position:"absolute", [v]:-1, [h]:-1,
            width:12, height:12,
            borderTop: v === "top" ? `3px solid ${color}` : "none",
            borderBottom: v === "bottom" ? `3px solid ${color}` : "none",
            borderLeft: h === "left" ? `3px solid ${color}` : "none",
            borderRight: h === "right" ? `3px solid ${color}` : "none",
            boxShadow:`0 0 6px ${color}`,
          }}/>
        ))}

        {/* Emoji face */}
        <div style={{
          position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:52, filter:"drop-shadow(0 0 8px rgba(0,0,0,0.8))"
        }}>{icon}</div>

        {/* Label */}
        <div style={{
          position:"absolute", bottom:-28, left:"50%", transform:"translateX(-50%)",
          background: color, color:"#000", padding:"2px 10px", borderRadius:4,
          fontSize:11, fontWeight:700, fontFamily:"'Space Mono',monospace", whiteSpace:"nowrap",
          boxShadow:`0 0 12px ${color}`
        }}>
          {dominant?.toUpperCase()} {confidence?.toFixed(1)}%
        </div>
      </div>

      {/* HUD elements */}
      <div style={{ position:"absolute", top:8, left:8, fontSize:9, color:color,
        fontFamily:"monospace", opacity:0.8, lineHeight:1.6 }}>
        <div>● REC LIVE</div>
        <div>CAM 01 • 1080p</div>
        <div>FRAME #{(12600 + frame).toString()}</div>
      </div>
      <div style={{ position:"absolute", top:8, right:8, fontSize:9, color:"#8B9BAF",
        fontFamily:"monospace", textAlign:"right", lineHeight:1.6 }}>
        <div>FACES: 1</div>
        <div>REGION: A</div>
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function EmotionDashboard() {
  const [tab, setTab] = useState("overview");
  const [live, setLive] = useState(true);
  const [snapshot, setSnapshot] = useState(generateEmotionSnapshot());
  const [timeline, setTimeline] = useState(generateTimeline(30));
  const [metrics, setMetrics] = useState(generateModelMetrics());
  const [matrix, setMatrix] = useState(generateConfusionMatrix());
  const [perEmotionMetrics] = useState(generatePerEmotionMetrics());
  const [trainingData] = useState(generateTrainingHistory());
  const [alerts, setAlerts] = useState(generateAlerts());
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [tick, setTick] = useState(0);
  const [capturePhase, setCapturePhase] = useState("capturing"); // "capturing", "ready", "displaying"
  const [captureTimeLeft, setCaptureTimeLeft] = useState(8); // 5-10 seconds, using 8 as default
  const [sessionStats] = useState({
    totalFrames: 14823,
    facesDetected: 3201,
    sessionDuration: "02:28:14",
    avgConfidence: 87.4,
  });

  // Find dominant emotion
  const dominant = Object.entries(snapshot).sort((a, b) => b[1] - a[1])[0];

  // Capture phase countdown
  useEffect(() => {
    if (capturePhase !== "capturing") return;
    
    const timer = setInterval(() => {
      setCaptureTimeLeft(prev => {
        if (prev <= 1) {
          setCapturePhase("displaying");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [capturePhase]);

  // Live update loop
  useEffect(() => {
    if (!live || capturePhase !== "displaying") return;
    const interval = setInterval(() => {
      const newSnap = generateEmotionSnapshot();
      setSnapshot(newSnap);
      setMetrics(generateModelMetrics());
      setTimeline(prev => {
        const updated = [...prev.slice(1), { time: "now", ...newSnap }];
        return updated;
      });
      setTick(t => t + 1);
      if (tick % 5 === 0) {
        const newAlert = [
          { id: Date.now(), time: new Date().toLocaleTimeString(), type:"info", msg: `Dominant emotion: ${dominant[0]} at ${dominant[1]}%` },
          { id: Date.now(), time: new Date().toLocaleTimeString(), type:"warning", msg: "Micro-expression shift detected — latency spike" },
        ][Math.floor(Math.random() * 2)];
        setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [live, tick, capturePhase]);

  const pieData = EMOTIONS.map(e => ({ name: e, value: snapshot[e] }));
  const radarData = EMOTIONS.map(e => ({
    subject: e, A: snapshot[e], fullMark: 100
  }));

  const tabs = [
    { id:"overview", label:"Overview" },
    { id:"model", label:"Model Performance" },
    { id:"training", label:"Training Analytics" },
    { id:"realtime", label:"Live Detection" },
    { id:"insights", label:"Insights" },
  ];

  const cardStyle = {
    background:"rgba(255,255,255,0.03)",
    border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:14, padding:20
  };

  const headerStyle = {
    fontSize:11, color:"#5E9AFF", fontFamily:"'Space Mono',monospace",
    letterSpacing:2, textTransform:"uppercase", marginBottom:14
  };

  // Capture screen component
  const CaptureScreen = () => (
    <div style={{
      position:"fixed", inset:0, background:"#0a0d12",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      zIndex:1000, backdropFilter:"blur(8px)"
    }}>
      {/* Animated grid background */}
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:"linear-gradient(0deg, rgba(94,154,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(94,154,255,0.03) 1px, transparent 1px)",
        backgroundSize:"40px 40px",
        animation:"moveGrid 4s linear infinite"
      }}>
        <style>{`
          @keyframes moveGrid {
            0% { backgroundPosition: 0 0; }
            100% { backgroundPosition: 40px 40px; }
          }
        `}</style>
      </div>

      <div style={{ position:"relative", zIndex:10, textAlign:"center", display:"flex", flexDirection:"column", gap:32 }}>
        {/* Title */}
        <div>
          <div style={{ fontSize:28, fontWeight:800, color:"#cdd6f4", marginBottom:8, letterSpacing:2 }}>
            🎥 CAPTURING FACE DATA
          </div>
          <div style={{ fontSize:13, color:"#8B9BAF", fontFamily:"'Space Mono',monospace", letterSpacing:1 }}>
            Please keep your face visible and still for clear emotion detection
          </div>
        </div>

        {/* Video preview box */}
        <div style={{
          width:300, height:225, borderRadius:16,
          border:"2px solid #5E9AFF", boxShadow:"0 0 30px rgba(94,154,255,0.3)",
          background:"linear-gradient(135deg,#0d0f14,#161b22)",
          display:"flex", alignItems:"center", justifyContent:"center",
          position:"relative", overflow:"hidden"
        }}>
          {/* Animated scan effect */}
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(180deg, transparent 0%, rgba(94,154,255,0.2) 50%, transparent 100%)",
            animation:`scanLine ${1.5}s infinite`,
            pointerEvents:"none"
          }}>
            <style>{`
              @keyframes scanLine {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
              }
            `}</style>
          </div>

          {/* Corner indicators */}
          {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y], idx) => (
            <div key={idx} style={{
              position:"absolute",
              [x === 0 ? "left" : "right"]: 8,
              [y === 0 ? "top" : "bottom"]: 8,
              width:16, height:16,
              borderTop: y === 0 ? "2px solid #5E9AFF" : "none",
              borderLeft: x === 0 ? "2px solid #5E9AFF" : "none",
              borderBottom: y === 1 ? "2px solid #5E9AFF" : "none",
              borderRight: x === 1 ? "2px solid #5E9AFF" : "none",
              boxShadow:"0 0 8px rgba(94,154,255,0.5)"
            }} />
          ))}

          {/* Face placeholder */}
          <div style={{ fontSize:80, opacity:0.3 }}>📷</div>

          {/* Recording indicator */}
          <div style={{
            position:"absolute", top:12, right:12,
            display:"flex", alignItems:"center", gap:6,
            background:"rgba(255,87,87,0.15)", border:"1px solid #FF575744",
            padding:"4px 10px", borderRadius:6
          }}>
            <div style={{
              width:6, height:6, borderRadius:"50%",
              background:"#FF5757", animation:"pulse 1.5s infinite"
            }} />
            <span style={{ fontSize:10, color:"#FF5757", fontFamily:"monospace", fontWeight:700 }}>REC</span>
          </div>
        </div>

        {/* Countdown timer */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{
            fontSize:64, fontWeight:900, color:"#5E9AFF",
            fontFamily:"'Space Mono',monospace", textShadow:"0 0 20px rgba(94,154,255,0.5)"
          }}>
            {captureTimeLeft}
          </div>
          
          {/* Progress bar */}
          <div style={{
            width:280, height:4, borderRadius:2,
            background:"rgba(255,255,255,0.08)", border:"1px solid rgba(94,154,255,0.2)",
            overflow:"hidden"
          }}>
            <div style={{
              height:"100%", background:"linear-gradient(90deg, #5E9AFF, #C77DFF)",
              width:`${((8 - captureTimeLeft) / 8) * 100}%`,
              transition:"width 1s linear", boxShadow:"0 0 12px rgba(94,154,255,0.5)"
            }} />
          </div>

          <div style={{ fontSize:11, color:"#8B9BAF", fontFamily:"monospace", letterSpacing:1 }}>
            INITIALIZING FACIAL RECOGNITION SYSTEM
          </div>
        </div>

        {/* Status messages */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 1fr", gap:12,
          maxWidth:400, marginTop:8
        }}>
          {[
            ["🎬", "Frames Captured", "480 frames"],
            ["👤", "Faces Detected", "1 face"],
            ["📊", "Data Quality", "Excellent"],
            ["⚡", "Processing", "Ready"],
          ].map(([icon, label, value], idx) => (
            <div key={idx} style={{
              background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:8, padding:12, textAlign:"center"
            }}>
              <div style={{ fontSize:16, marginBottom:4 }}>{icon}</div>
              <div style={{ fontSize:10, color:"#8B9BAF", marginBottom:2 }}>{label}</div>
              <div style={{ fontSize:11, color:"#5E9AFF", fontWeight:700 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight:"100vh",
      background:"#0a0d12",
      color:"#cdd6f4",
      fontFamily:"'Outfit', 'Space Grotesk', sans-serif",
      padding:0,
    }}>
      {/* Show capture screen during capturing phase */}
      {capturePhase === "capturing" && <CaptureScreen />}

      {/* Load fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:#0a0d12}
        ::-webkit-scrollbar-thumb{background:#2a2f3d;border-radius:3px}
        .nav-tab:hover{background:rgba(255,255,255,0.06)!important}
        .card-hover:hover{border-color:rgba(94,154,255,0.3)!important;transform:translateY(-1px)}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        .live-dot{animation:pulse 1.5s infinite}
        .blink{animation:blink 1s infinite}
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        .slide-in{animation:slideIn 0.3s ease}
      `}</style>

      {/* Top bar */}
      <div style={{
        background:"rgba(10,13,18,0.95)", backdropFilter:"blur(12px)",
        borderBottom:"1px solid rgba(255,255,255,0.07)",
        padding:"0 28px", position:"sticky", top:0, zIndex:100,
        display:"flex", alignItems:"center", justifyContent:"space-between", height:56,
        opacity: capturePhase === "capturing" ? 0.4 : 1,
        pointerEvents: capturePhase === "capturing" ? "none" : "auto"
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background:"linear-gradient(135deg,#5E9AFF,#C77DFF)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, boxShadow:"0 0 14px rgba(94,154,255,0.5)"
          }}>🧠</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, letterSpacing:0.5 }}>EmotionLens AI</div>
            <div style={{ fontSize:9, color:"#8B9BAF", fontFamily:"monospace", letterSpacing:1 }}>
              REAL-TIME FACIAL EMOTION DETECTION
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4 }}>
          {tabs.map(t => (
            <button key={t.id} className="nav-tab"
              onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? "rgba(94,154,255,0.15)" : "transparent",
                border: tab === t.id ? "1px solid rgba(94,154,255,0.4)" : "1px solid transparent",
                color: tab === t.id ? "#5E9AFF" : "#8B9BAF",
                padding:"6px 14px", borderRadius:8, cursor:"pointer",
                fontSize:12, fontFamily:"'Outfit',sans-serif", fontWeight:500,
                transition:"all 0.2s"
              }}>{t.label}</button>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#8B9BAF" }}>
            <div className="live-dot" style={{
              width:7, height:7, borderRadius:"50%",
              background: live ? "#06D6A0" : "#FF5757",
              boxShadow: live ? "0 0 8px #06D6A0" : "none"
            }}/>
            <span style={{ fontFamily:"monospace" }}>{live ? "LIVE" : "PAUSED"}</span>
          </div>
          <button onClick={() => setLive(l => !l)} style={{
            background: live ? "rgba(255,87,87,0.15)" : "rgba(6,214,160,0.15)",
            border: `1px solid ${live ? "#FF575744" : "#06D6A044"}`,
            color: live ? "#FF5757" : "#06D6A0",
            padding:"5px 12px", borderRadius:7, cursor:"pointer",
            fontSize:11, fontFamily:"monospace"
          }}>{live ? "⏸ Pause" : "▶ Resume"}</button>
          <button onClick={() => setMatrix(generateConfusionMatrix())} style={{
            background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.1)",
            color:"#cdd6f4", padding:"5px 12px", borderRadius:7,
            cursor:"pointer", fontSize:11
          }}>↻ Refresh</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding:"24px 28px", maxWidth:1600, margin:"0 auto", 
        opacity: capturePhase === "capturing" ? 0.3 : 1,
        pointerEvents: capturePhase === "capturing" ? "none" : "auto",
        transition:"opacity 0.3s ease"
      }}>

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Top stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
              <StatBadge value={metrics.accuracy} label="Model Accuracy" color="#06D6A0" suffix="%"/>
              <StatBadge value={metrics.fps} label="Frames Per Second" color="#5E9AFF" suffix=" fps"/>
              <StatBadge value={`${metrics.latency}`} label="Inference Latency" color="#FFD166" suffix=" ms"/>
              <StatBadge value={sessionStats.facesDetected.toLocaleString()} label="Faces Detected" color="#C77DFF"/>
            </div>

            {/* Middle row */}
            <div style={{ display:"grid", gridTemplateColumns:"300px 1fr 280px", gap:20 }}>

              {/* Emotion distribution */}
              <div style={cardStyle}>
                <div style={headerStyle}>Current Emotions</div>
                {EMOTIONS.map(e => (
                  <EmotionBar key={e} emotion={e} value={snapshot[e]}
                    onClick={setSelectedEmotion}
                    selected={selectedEmotion === e}/>
                ))}
                <div style={{ marginTop:10, padding:"8px 12px", borderRadius:8,
                  background:"rgba(6,214,160,0.08)", border:"1px solid rgba(6,214,160,0.2)" }}>
                  <span style={{ fontSize:11, color:"#8B9BAF" }}>Dominant: </span>
                  <span style={{ fontSize:12, color: EMOTION_COLORS[dominant[0]],
                    fontWeight:700, fontFamily:"monospace" }}>
                    {EMOTION_ICONS[dominant[0]]} {dominant[0]} — {dominant[1]}%
                  </span>
                </div>
              </div>

              {/* Timeline area chart */}
              <div style={cardStyle}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={headerStyle}>Emotion Timeline</div>
                  <div style={{ display:"flex", gap:6 }}>
                    {EMOTIONS.slice(0,4).map(e => (
                      <div key={e} style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:"#8B9BAF" }}>
                        <div style={{ width:8, height:8, borderRadius:2, background:EMOTION_COLORS[e] }}/>
                        {e}
                      </div>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={timeline}>
                    <defs>
                      {EMOTIONS.map(e => (
                        <linearGradient key={e} id={`g${e}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={EMOTION_COLORS[e]} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={EMOTION_COLORS[e]} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3"/>
                    <XAxis dataKey="time" tick={{ fill:"#8B9BAF", fontSize:9 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill:"#8B9BAF", fontSize:9 }} axisLine={false} tickLine={false} domain={[0,100]}/>
                    <Tooltip contentStyle={{ background:"#161b22", border:"1px solid rgba(255,255,255,0.1)",
                      borderRadius:8, fontSize:11 }} />
                    {(selectedEmotion ? [selectedEmotion] : EMOTIONS.slice(0,4)).map(e => (
                      <Area key={e} type="monotone" dataKey={e} stroke={EMOTION_COLORS[e]}
                        fill={`url(#g${e})`} strokeWidth={2} dot={false}
                        activeDot={{ r:4, fill:EMOTION_COLORS[e], stroke:"none" }}/>
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Pie + ring metrics */}
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={cardStyle}>
                  <div style={headerStyle}>Distribution</div>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                        dataKey="value" stroke="none">
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={EMOTION_COLORS[entry.name]}
                            opacity={!selectedEmotion || selectedEmotion === entry.name ? 1 : 0.25}/>
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background:"#161b22", border:"1px solid rgba(255,255,255,0.1)",
                        borderRadius:8, fontSize:11 }} formatter={(v) => `${v}%`}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ ...cardStyle, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <GlowRing pct={metrics.accuracy} color="#06D6A0" label="ACCURACY" size={80}/>
                  <GlowRing pct={metrics.f1} color="#C77DFF" label="F1 SCORE" size={80}/>
                </div>
              </div>
            </div>

            {/* Bottom row */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20 }}>
              {/* Session stats + radar */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div style={cardStyle}>
                  <div style={headerStyle}>Radar Emotion Profile</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)"/>
                      <PolarAngleAxis dataKey="subject" tick={{ fill:"#8B9BAF", fontSize:10 }}/>
                      <PolarRadiusAxis angle={30} domain={[0,100]} tick={false} axisLine={false}/>
                      <Radar name="Emotion" dataKey="A" stroke="#5E9AFF" fill="#5E9AFF" fillOpacity={0.2}
                        dot={{ fill:"#5E9AFF", r:3 }}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div style={cardStyle}>
                  <div style={headerStyle}>Session Summary</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    {[
                      ["Total Frames", sessionStats.totalFrames.toLocaleString(), "#FFD166"],
                      ["Session Duration", sessionStats.sessionDuration, "#5E9AFF"],
                      ["Avg Confidence", `${sessionStats.avgConfidence}%`, "#06D6A0"],
                      ["Active Faces", metrics.faces, "#C77DFF"],
                      ["Model FPS", metrics.fps, "#FF9500"],
                    ].map(([k, v, c]) => (
                      <div key={k} style={{ display:"flex", justifyContent:"space-between",
                        padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{ fontSize:12, color:"#8B9BAF" }}>{k}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:c, fontFamily:"monospace" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alerts */}
              <div style={cardStyle}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={headerStyle}>System Alerts</div>
                  <span className="blink" style={{ fontSize:9, color:"#FF5757", fontFamily:"monospace" }}>
                    ● MONITORING
                  </span>
                </div>
                <div style={{ maxHeight:220, overflowY:"auto" }}>
                  {alerts.map(a => <AlertItem key={a.id} item={a}/>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MODEL PERFORMANCE TAB ── */}
        {tab === "model" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
              {[
                ["Accuracy", metrics.accuracy, "#06D6A0"],
                ["Precision", metrics.precision, "#5E9AFF"],
                ["Recall", metrics.recall, "#FFD166"],
                ["F1 Score", metrics.f1, "#C77DFF"],
              ].map(([k, v, c]) => (
                <div key={k} style={{ ...cardStyle, textAlign:"center", padding:24 }}>
                  <GlowRing pct={v} color={c} size={100} label={k.toUpperCase()} sub={`${v}%`}/>
                </div>
              ))}
            </div>

            {/* Per-class metrics */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div style={cardStyle}>
                <div style={headerStyle}>Per-Class F1 Score</div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={perEmotionMetrics} layout="vertical">
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                    <XAxis type="number" domain={[0,100]} tick={{ fill:"#8B9BAF", fontSize:9 }}
                      axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="emotion" tick={{ fill:"#cdd6f4", fontSize:11 }}
                      axisLine={false} tickLine={false} width={65}/>
                    <Tooltip contentStyle={{ background:"#161b22", border:"1px solid rgba(255,255,255,0.1)",
                      borderRadius:8, fontSize:11 }} formatter={v => `${v}%`}/>
                    <Bar dataKey="precision" name="Precision" radius={[0,4,4,0]}>
                      {perEmotionMetrics.map((entry) => (
                        <Cell key={entry.emotion} fill={EMOTION_COLORS[entry.emotion]}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={cardStyle}>
                <div style={headerStyle}>Precision vs Recall</div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={perEmotionMetrics}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="emotion" tick={{ fill:"#8B9BAF", fontSize:9 }} axisLine={false} tickLine={false}/>
                    <YAxis domain={[50,100]} tick={{ fill:"#8B9BAF", fontSize:9 }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{ background:"#161b22", border:"1px solid rgba(255,255,255,0.1)",
                      borderRadius:8, fontSize:11 }} formatter={v => `${v}%`}/>
                    <Legend wrapperStyle={{ fontSize:11 }}/>
                    <Bar dataKey="precision" name="Precision" fill="#5E9AFF" opacity={0.85} radius={[3,3,0,0]}/>
                    <Bar dataKey="recall" name="Recall" fill="#C77DFF" opacity={0.85} radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Confusion matrix */}
            <div style={cardStyle}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={headerStyle}>Confusion Matrix</div>
                <button onClick={() => setMatrix(generateConfusionMatrix())} style={{
                  background:"rgba(94,154,255,0.1)", border:"1px solid rgba(94,154,255,0.3)",
                  color:"#5E9AFF", padding:"4px 12px", borderRadius:6, cursor:"pointer", fontSize:11
                }}>↻ Regenerate</button>
              </div>
              <div style={{ display:"flex", justifyContent:"center" }}>
                <ConfusionMatrix matrix={matrix}/>
              </div>
            </div>

            {/* Support per class */}
            <div style={cardStyle}>
              <div style={headerStyle}>Class Distribution (Support)</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={perEmotionMetrics}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="emotion" tick={{ fill:"#8B9BAF", fontSize:10 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:"#8B9BAF", fontSize:9 }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ background:"#161b22", border:"1px solid rgba(255,255,255,0.1)",
                    borderRadius:8, fontSize:11 }}/>
                  <Bar dataKey="support" name="Samples" radius={[4,4,0,0]}>
                    {perEmotionMetrics.map(entry => (
                      <Cell key={entry.emotion} fill={EMOTION_COLORS[entry.emotion]} opacity={0.8}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── TRAINING ANALYTICS TAB ── */}
        {tab === "training" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
              {[
                ["Final Val Accuracy", `${trainingData[49].valAcc.toFixed(1)}%`, "#06D6A0"],
                ["Final Val Loss", trainingData[49].valLoss.toFixed(3), "#FF5757"],
                ["Total Epochs", "50", "#FFD166"],
              ].map(([k, v, c]) => (
                <StatBadge key={k} value={v} label={k} color={c}/>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div style={cardStyle}>
                <div style={headerStyle}>Training & Validation Loss</div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trainingData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3"/>
                    <XAxis dataKey="epoch" tick={{ fill:"#8B9BAF", fontSize:9 }} axisLine={false} tickLine={false}
                      label={{ value:"Epoch", fill:"#8B9BAF", fontSize:10, position:"insideBottom", offset:-2 }}/>
                    <YAxis tick={{ fill:"#8B9BAF", fontSize:9 }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{ background:"#161b22", border:"1px solid rgba(255,255,255,0.1)",
                      borderRadius:8, fontSize:11 }}/>
                    <Legend wrapperStyle={{ fontSize:11 }}/>
                    <Line type="monotone" dataKey="trainLoss" name="Train Loss" stroke="#5E9AFF"
                      strokeWidth={2} dot={false} activeDot={{ r:4, fill:"#5E9AFF" }}/>
                    <Line type="monotone" dataKey="valLoss" name="Val Loss" stroke="#FF5757"
                      strokeWidth={2} dot={false} strokeDasharray="5 3"
                      activeDot={{ r:4, fill:"#FF5757" }}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={cardStyle}>
                <div style={headerStyle}>Training & Validation Accuracy</div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trainingData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3"/>
                    <XAxis dataKey="epoch" tick={{ fill:"#8B9BAF", fontSize:9 }} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,100]} tick={{ fill:"#8B9BAF", fontSize:9 }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{ background:"#161b22", border:"1px solid rgba(255,255,255,0.1)",
                      borderRadius:8, fontSize:11 }} formatter={v => `${v.toFixed(1)}%`}/>
                    <Legend wrapperStyle={{ fontSize:11 }}/>
                    <Line type="monotone" dataKey="trainAcc" name="Train Acc" stroke="#06D6A0"
                      strokeWidth={2} dot={false} activeDot={{ r:4, fill:"#06D6A0" }}/>
                    <Line type="monotone" dataKey="valAcc" name="Val Acc" stroke="#C77DFF"
                      strokeWidth={2} dot={false} strokeDasharray="5 3"
                      activeDot={{ r:4, fill:"#C77DFF" }}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Model architecture info */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div style={cardStyle}>
                <div style={headerStyle}>Model Architecture</div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, lineHeight:2 }}>
                  {[
                    ["Base Model", "ResNet-50 (pretrained)"],
                    ["Input Shape", "48 × 48 × 3"],
                    ["Output Classes", "7 Emotions"],
                    ["Parameters", "25.6M total / 1.2M trainable"],
                    ["Optimizer", "Adam (lr=1e-4)"],
                    ["Loss Function", "Categorical Cross-Entropy"],
                    ["Augmentation", "Flip, Rotate±15°, Brightness"],
                    ["Batch Size", "32"],
                    ["Dataset", "AffectNet + FER2013"],
                    ["Training Samples", "283,901"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display:"flex", justifyContent:"space-between",
                      borderBottom:"1px solid rgba(255,255,255,0.04)", paddingBottom:4 }}>
                      <span style={{ color:"#8B9BAF" }}>{k}</span>
                      <span style={{ color:"#5E9AFF" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={headerStyle}>Overfitting Analysis</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trainingData.slice(30)}>
                    <defs>
                      <linearGradient id="gapGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFD166" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FFD166" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="epoch" tick={{ fill:"#8B9BAF", fontSize:9 }} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,2]} tick={{ fill:"#8B9BAF", fontSize:9 }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{ background:"#161b22", border:"1px solid rgba(255,255,255,0.1)",
                      borderRadius:8, fontSize:11 }}/>
                    <Area type="monotone" dataKey="valLoss" name="Val Loss"
                      stroke="#FFD166" fill="url(#gapGrad)" strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="trainLoss" name="Train Loss"
                      stroke="#06D6A0" strokeWidth={2} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ marginTop:8, fontSize:11, color:"#8B9BAF", padding:"8px 12px",
                  background:"rgba(6,214,160,0.06)", border:"1px solid rgba(6,214,160,0.15)", borderRadius:8 }}>
                  ✓ Val/Train loss gap: <span style={{ color:"#06D6A0" }}>0.09</span> — Model generalizing well
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LIVE DETECTION TAB ── */}
        {tab === "realtime" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div style={cardStyle}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={headerStyle}>Live Camera Feed</div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["CAM 01", "CAM 02", "CAM 03"].map((c, i) => (
                      <button key={c} style={{
                        background: i === 0 ? "rgba(94,154,255,0.15)" : "transparent",
                        border: `1px solid ${i === 0 ? "#5E9AFF44" : "rgba(255,255,255,0.1)"}`,
                        color: i === 0 ? "#5E9AFF" : "#8B9BAF",
                        padding:"3px 10px", borderRadius:5, cursor:"pointer", fontSize:10, fontFamily:"monospace"
                      }}>{c}</button>
                    ))}
                  </div>
                </div>
                <FaceSimulator dominant={dominant[0]} confidence={dominant[1]}/>
              </div>

              {/* Live bar chart */}
              <div style={cardStyle}>
                <div style={headerStyle}>Live Confidence Scores</div>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={EMOTIONS.map(e => ({ emotion: e, confidence: snapshot[e] }))}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
                    <XAxis dataKey="emotion" tick={{ fill:"#cdd6f4", fontSize:10 }} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,100]} tick={{ fill:"#8B9BAF", fontSize:9 }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{ background:"#161b22", border:"1px solid rgba(255,255,255,0.1)",
                      borderRadius:8, fontSize:11 }} formatter={v => `${v}%`}/>
                    <Bar dataKey="confidence" name="Confidence %" radius={[4,4,0,0]}>
                      {EMOTIONS.map(e => <Cell key={e} fill={EMOTION_COLORS[e]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right panel */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={cardStyle}>
                <div style={headerStyle}>Detection Metrics</div>
                {[
                  ["Latency", `${metrics.latency} ms`, "#FFD166"],
                  ["FPS", metrics.fps, "#5E9AFF"],
                  ["Confidence", `${dominant[1]}%`, "#06D6A0"],
                  ["Faces", metrics.faces, "#C77DFF"],
                  ["Frame #", (12600 + tick).toString(), "#8B9BAF"],
                ].map(([k, v, c]) => (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between",
                    padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,0.05)",
                    fontFamily:"monospace", fontSize:12 }}>
                    <span style={{ color:"#8B9BAF" }}>{k}</span>
                    <span style={{ color:c, fontWeight:700 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={cardStyle}>
                <div style={headerStyle}>Emotion Breakdown</div>
                {EMOTIONS.map(e => (
                  <EmotionBar key={e} emotion={e} value={snapshot[e]}
                    onClick={() => {}} selected={dominant[0] === e}/>
                ))}
              </div>

              <div style={cardStyle}>
                <div style={headerStyle}>Alerts</div>
                {alerts.slice(0, 3).map(a => <AlertItem key={a.id} item={a}/>)}
              </div>
            </div>
          </div>
        )}

        {/* ── INSIGHTS TAB ── */}
        {tab === "insights" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Emotion hourly heatmap simulation */}
            <div style={cardStyle}>
              <div style={headerStyle}>Emotion Frequency Heatmap (Last 24h)</div>
              <div style={{ overflowX:"auto" }}>
                <div style={{ display:"grid",
                  gridTemplateColumns:`80px repeat(24, 1fr)`, gap:3, minWidth:700 }}>
                  <div/>
                  {Array.from({length:24},(_,i) => (
                    <div key={i} style={{ textAlign:"center", fontSize:9, color:"#8B9BAF", fontFamily:"monospace" }}>
                      {String(i).padStart(2,"0")}h
                    </div>
                  ))}
                  {EMOTIONS.map(e => [
                    <div key={`l${e}`} style={{ fontSize:11, color:EMOTION_COLORS[e],
                      display:"flex", alignItems:"center", gap:4 }}>
                      {EMOTION_ICONS[e]} {e}
                    </div>,
                    ...Array.from({length:24},(_,h) => {
                      const val = parseFloat(randBetween(5,80).toFixed(0));
                      const alpha = val/80;
                      return (
                        <div key={`${e}-${h}`} title={`${e} at ${h}:00 — ${val}%`}
                          style={{
                            height:28, borderRadius:4,
                            background:`rgba(${parseInt(EMOTION_COLORS[e].slice(1,3),16)},${parseInt(EMOTION_COLORS[e].slice(3,5),16)},${parseInt(EMOTION_COLORS[e].slice(5,7),16)},${0.08 + alpha*0.8})`,
                            cursor:"pointer", transition:"transform 0.1s",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:8, color:"rgba(255,255,255,0.6)", fontFamily:"monospace"
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform="scale(1.15)"}
                          onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}
                        >{val}</div>
                      );
                    })
                  ])}
                </div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              {/* Top emotions this session */}
              <div style={cardStyle}>
                <div style={headerStyle}>Dominant Emotion Over Time</div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={timeline}>
                    <defs>
                      <linearGradient id="happyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFD166" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#FFD166" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="time" tick={{ fill:"#8B9BAF", fontSize:9 }} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,100]} tick={{ fill:"#8B9BAF", fontSize:9 }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{ background:"#161b22", border:"1px solid rgba(255,255,255,0.1)",
                      borderRadius:8, fontSize:11 }} formatter={v => `${v}%`}/>
                    <Area dataKey="Happy" stroke="#FFD166" fill="url(#happyGrad)" strokeWidth={2} dot={false}/>
                    <Area dataKey="Neutral" stroke="#8B9BAF" fill="rgba(139,155,175,0.1)" strokeWidth={1.5} dot={false}/>
                    <Area dataKey="Sad" stroke="#5E9AFF" fill="rgba(94,154,255,0.1)" strokeWidth={1.5} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Valence arousal scatter */}
              <div style={cardStyle}>
                <div style={headerStyle}>Valence–Arousal Space</div>
                <div style={{ position:"relative" }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <ScatterChart margin={{ top:10, right:20, bottom:10, left:0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)"/>
                      <XAxis type="number" dataKey="x" name="Valence" domain={[-1,1]}
                        tick={{ fill:"#8B9BAF", fontSize:9 }} axisLine={false} tickLine={false}
                        label={{ value:"Valence →", fill:"#8B9BAF", fontSize:9, position:"insideRight", offset:-5 }}/>
                      <YAxis type="number" dataKey="y" name="Arousal" domain={[-1,1]}
                        tick={{ fill:"#8B9BAF", fontSize:9 }} axisLine={false} tickLine={false}
                        label={{ value:"Arousal", fill:"#8B9BAF", fontSize:9, angle:-90, position:"insideLeft" }}/>
                      <ZAxis range={[60,200]}/>
                      <Tooltip cursor={{ strokeDasharray:"3 3" }}
                        contentStyle={{ background:"#161b22", border:"1px solid rgba(255,255,255,0.1)",
                          borderRadius:8, fontSize:11 }}/>
                      <Scatter name="Emotions" data={[
                        { x:0.9, y:0.7, z:snapshot.Happy, name:"Happy", fill:"#FFD166" },
                        { x:-0.7, y:-0.5, z:snapshot.Sad, name:"Sad", fill:"#5E9AFF" },
                        { x:-0.5, y:0.9, z:snapshot.Angry, name:"Angry", fill:"#FF5757" },
                        { x:-0.5, y:0.8, z:snapshot.Fear, name:"Fear", fill:"#C77DFF" },
                        { x:0.5, y:0.9, z:snapshot.Surprise, name:"Surprise", fill:"#06D6A0" },
                        { x:-0.8, y:0.3, z:snapshot.Disgust, name:"Disgust", fill:"#FF9500" },
                        { x:0, y:0, z:snapshot.Neutral, name:"Neutral", fill:"#8B9BAF" },
                      ].map(d => ({ ...d, fill:d.fill }))}>
                        {[
                          { fill:"#FFD166" }, { fill:"#5E9AFF" }, { fill:"#FF5757" },
                          { fill:"#C77DFF" }, { fill:"#06D6A0" }, { fill:"#FF9500" }, { fill:"#8B9BAF" },
                        ].map((p, i) => (
                          <Cell key={i} fill={p.fill}/>
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Insight cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
              {[
                { icon:"🎯", title:"Peak Performance", body:`Model achieves ${metrics.accuracy}% accuracy — highest on Happy (${perEmotionMetrics.find(e=>e.emotion==="Happy")?.f1}% F1)`, color:"#06D6A0" },
                { icon:"⚡", title:"Real-Time Ready", body:`${metrics.fps} FPS with ${metrics.latency}ms latency — suitable for live deployment on GPU hardware`, color:"#FFD166" },
                { icon:"⚠️", title:"Watch: Disgust/Fear", body:`Confusion between Disgust and Anger (8%) remains the primary misclassification source`, color:"#FF5757" },
              ].map(card => (
                <div key={card.title} style={{
                  ...cardStyle,
                  borderLeft:`3px solid ${card.color}`,
                  borderLeftColor: card.color
                }}>
                  <div style={{ fontSize:20, marginBottom:8 }}>{card.icon}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:card.color, marginBottom:6 }}>{card.title}</div>
                  <div style={{ fontSize:12, color:"#8B9BAF", lineHeight:1.6 }}>{card.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{
        borderTop:"1px solid rgba(255,255,255,0.06)", padding:"10px 28px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        fontSize:10, color:"#8B9BAF", fontFamily:"monospace"
      }}>
        <span>EmotionLens AI — Real-Time Facial Emotion Detection Dashboard</span>
        <span style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span className="live-dot" style={{ display:"inline-block", width:6, height:6,
            borderRadius:"50%", background:"#06D6A0", boxShadow:"0 0 6px #06D6A0" }}/>
          System Normal • Model v3.2.1 • Session {sessionStats.sessionDuration}
        </span>
      </div>
    </div>
  );
}

// named exports make the individual pieces easier to import in tests
export { GlowRing, StatBadge, EmotionBar, AlertItem, ConfusionMatrix, FaceSimulator };
