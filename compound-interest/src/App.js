import { useState, useEffect, useRef } from "react";

// waluta
const formatCurrency = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const lerp = (a, b, t) => a + (b - a) * t;

export default function CompoundInterest() {
  // stany wejsciowe
  const [principal, setPrincipal] = useState(10000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(20);
  const [monthly, setMonthly] = useState(200);
  
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const progressRef = useRef(0);

  // generowanie danych wykresu
  const data = Array.from({ length: years + 1 }, (_, y) => {
    let balance = principal;
    for (let m = 0; m < y * 12; m++) {
      balance = balance * (1 + rate / 100 / 12) + monthly;
    }
    const contributed = principal + monthly * 12 * y;
    return { year: y, balance, contributed, interest: balance - contributed };
  });

  const maxVal = data[data.length - 1].balance;
  const finalBalance = data[years].balance;
  const totalContributed = data[years].contributed;
  const totalInterest = data[years].interest;
  
  // animacja
  useEffect(() => {
    progressRef.current = 0;
    const start = performance.now();
    const duration = 900;

    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      progressRef.current = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      drawChart(progressRef.current);
      if (t < 1) animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [principal, rate, years, monthly]);

  // rysowanie canvas
  const drawChart = (progress) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const pad = { top: 20, right: 20, bottom: 40, left: 70 };
    const cw = W - pad.left - pad.right;
    const ch = H - pad.top - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    // linie tla 
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + ch - (i / 4) * ch;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "11px 'DM Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(formatCurrency((i / 4) * maxVal), pad.left - 8, y + 4);
    }

    const visibleYears = Math.ceil(years * progress);
    const pts = data.slice(0, visibleYears + 1);
    const xPos = (i) => pad.left + (i / years) * cw;
    const yPos = (v) => pad.top + ch - (v / maxVal) * ch;

    // wypelnienie obszaru wplat
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(0));
    pts.forEach((d) => ctx.lineTo(xPos(d.year), yPos(d.contributed)));
    ctx.lineTo(xPos(pts[pts.length - 1].year), pad.top + ch);
    ctx.lineTo(xPos(0), pad.top + ch);
    ctx.closePath();
    ctx.fillStyle = "rgba(99,179,237,0.25)";
    ctx.fill();

    // wypelnienie obszaru odsetek
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(data[0].balance));
    pts.forEach((d) => ctx.lineTo(xPos(d.year), yPos(d.balance)));
    ctx.lineTo(xPos(pts[pts.length - 1].year), yPos(pts[pts.length - 1].contributed));
    pts.slice().reverse().forEach((d) => ctx.lineTo(xPos(d.year), yPos(d.contributed)));
    ctx.closePath();
    ctx.fillStyle = "rgba(154,230,180,0.3)";
    ctx.fill();

    //  linia salda
    ctx.beginPath();
    pts.forEach((d, i) => i === 0 ? ctx.moveTo(xPos(d.year), yPos(d.balance)) : ctx.lineTo(xPos(d.year), yPos(d.balance)));
    ctx.strokeStyle = "#68d391";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // przerywana linia wplat
    ctx.beginPath();
    pts.forEach((d, i) => i === 0 ? ctx.moveTo(xPos(d.year), yPos(d.contributed)) : ctx.lineTo(xPos(d.year), yPos(d.contributed)));
    ctx.strokeStyle = "#63b3ed";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // os x
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "11px 'DM Mono', monospace";
    ctx.textAlign = "center";
    for (let y = 0; y <= years; y += Math.ceil(years / 5)) {
      ctx.fillText(`yr ${y}`, xPos(y), pad.top + ch + 22);
    }
  };

  //  suwakf
  const Slider = ({ label, value, setValue, min, max, step, format }) => (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)", fontFamily: "'DM Mono', monospace" }}>{label}</span>
        <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff", fontFamily: "'DM Mono', monospace" }}>{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#68d391", cursor: "pointer", height: "4px" }}
      />
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#0b0f1a",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "24px",
      backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(104,211,145,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(99,179,237,0.05) 0%, transparent 60%)"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: "820px" }}>

        <div style={{ marginBottom: "32px" }}>
          <p style={{ color: "rgba(104,211,145,0.7)", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: "8px" }}>
            ◆ Interactive Explorer
          </p>
          <h1 style={{ color: "#fff", fontSize: "clamp(28px, 5vw, 42px)", fontWeight: "700", margin: "0 0 8px", lineHeight: 1.1 }}>
            Odsetki skladane
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: 0 }}>
            Twoje pieniadze zarabiaja pieniadze
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "24px", alignItems: "start" }}>

          <div>
            <canvas
              ref={canvasRef}
              width={520} height={280}
              style={{ width: "100%", height: "auto", display: "block", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            />

            <div style={{ display: "flex", gap: "20px", marginTop: "12px" }}>
              {[
                { color: "#68d391", label: "calkowite saldo" },
                { color: "#63b3ed", label: "suma wplat", dashed: true },
              ].map(({ color, label, dashed }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <svg width="24" height="10">
                    <line x1="0" y1="5" x2="24" y2="5" stroke={color} strokeWidth="2"
                      strokeDasharray={dashed ? "4 3" : "none"} />
                  </svg>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontFamily: "'DM Mono', monospace" }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "20px" }}>
              {[
                { label: "bilans koncowy", value: formatCurrency(finalBalance), color: "#68d391" },
                { label: "suma wplat", value: formatCurrency(totalContributed), color: "#63b3ed" },
                { label: "naliczone odsetki", value: formatCurrency(totalInterest), color: "#f6ad55" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "14px 16px" }}>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'DM Mono', monospace", marginBottom: "6px" }}>{label}</div>
                  <div style={{ color, fontSize: "18px", fontWeight: "700", fontFamily: "'DM Mono', monospace" }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontFamily: "'DM Mono', monospace" }}>Kapital wplacony vs Zarobione odsetki</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontFamily: "'DM Mono', monospace" }}>
                  {Math.round((totalInterest / finalBalance) * 100)}% to darmowe pieniadze.
                </span>
              </div>
              <div style={{ height: "8px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ display: "flex", height: "100%" }}>
                  <div style={{ width: `${(totalContributed / finalBalance) * 100}%`, background: "#63b3ed", transition: "width 0.5s ease" }} />
                  <div style={{ flex: 1, background: "#68d391" }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "22px" }}>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace", marginBottom: "20px", marginTop: 0 }}>Parameters</p>
            <Slider label="Kwota poczatkowa" value={principal} setValue={setPrincipal} min={0} max={100000} step={500} format={formatCurrency} />
            <Slider label="Skladka miesieczna" value={monthly} setValue={setMonthly} min={0} max={2000} step={50} format={formatCurrency} />
            <Slider label="Roczny zwrot" value={rate} setValue={setRate} min={1} max={15} step={0.5} format={(v) => `${v}%`} />
            <Slider label="okres inwestycyjny" value={years} setValue={setYears} min={1} max={40} step={1} format={(v) => `${v} yrs`} />

            <div style={{ marginTop: "20px", padding: "14px", background: "rgba(246,173,85,0.08)", border: "1px solid rgba(246,173,85,0.2)", borderRadius: "10px" }}>
              <div style={{ color: "#f6ad55", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'DM Mono', monospace", marginBottom: "5px" }}>Regula 72</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", lineHeight: 1.5 }}>
                Przy {rate}% twoje pieniadze podwajaja sie co <strong style={{ color: "#f6ad55" }}>{(72 / rate).toFixed(1)} lat/roku</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}