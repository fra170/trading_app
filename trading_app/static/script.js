document.addEventListener("DOMContentLoaded", () => {
  const chartDiv = document.getElementById("chart");
  const loadingDiv = document.getElementById("loading");
  const addButton = document.getElementById("addTicker");
  const tickerInput = document.getElementById("tickerInput");
  const tickerSelect = document.getElementById("tickerSelect");

  let currentTicker = "MSFT";

  async function loadTickers() {
    const res = await fetch("/tickers");
    const tickers = await res.json();
    tickerSelect.innerHTML = "";
    tickers.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      tickerSelect.appendChild(opt);
    });
    if (!tickers.includes(currentTicker)) currentTicker = tickers[0];
    tickerSelect.value = currentTicker;
  }

  async function fetchData() {
    try {
      const response = await fetch(`/data/${currentTicker}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      return json.data || [];
    } catch (err) {
      console.error("Errore dati:", err);
      return [];
    }
  }

  async function updateChart() {
    loadingDiv.style.display = "block";
    chartDiv.innerHTML = "";

    const data = await fetchData();
    if (data.length === 0) {
      loadingDiv.textContent = "Nessun dato disponibile.";
      return;
    }

    const dates = data.map(d => d.Date);
    const traceCandles = {
      x: dates,
      open: data.map(d => d.Open),
      high: data.map(d => d.High),
      low: data.map(d => d.Low),
      close: data.map(d => d.Close),
      type: "candlestick",
      name: currentTicker,
      increasing: { line: { color: "#00e676" } },
      decreasing: { line: { color: "#e53935" } },
      yaxis: "y1"
    };

    const traceSMA20 = {
      x: dates, y: data.map(d => d.SMA_20),
      type: "scatter", mode: "lines", name: "SMA 20",
      line: { color: "#42a5f5", width: 1.5, dash: "dot" },
      yaxis: "y1"
    };

    const traceSMA50 = {
      x: dates, y: data.map(d => d.SMA_50),
      type: "scatter", mode: "lines", name: "SMA 50",
      line: { color: "#ffb300", width: 1.5, dash: "dot" },
      yaxis: "y1"
    };

    const traceRSI = {
      x: dates, y: data.map(d => d.RSI),
      type: "scatter", mode: "lines", name: "RSI",
      line: { color: "#ab47bc", width: 1.8 }, yaxis: "y2"
    };

    const rsiShapes = [
      { type: "line", xref: "x", yref: "y2", x0: dates[0], x1: dates[dates.length - 1], y0: 70, y1: 70, line: { color: "red", width: 1, dash: "dash" }},
      { type: "line", xref: "x", yref: "y2", x0: dates[0], x1: dates[dates.length - 1], y0: 30, y1: 30, line: { color: "green", width: 1, dash: "dash" }}
    ];

    const traceMACD = {
      x: dates, y: data.map(d => d.MACD),
      type: "scatter", mode: "lines", name: "MACD",
      line: { color: "#00bcd4", width: 1.8 }, yaxis: "y3"
    };

    const traceMACDSignal = {
      x: dates, y: data.map(d => d.MACD_Signal),
      type: "scatter", mode: "lines", name: "Signal",
      line: { color: "#ff7043", width: 1.5, dash: "dot" }, yaxis: "y3"
    };

    const traceMACDHist = {
      x: dates, y: data.map(d => d.MACD_Hist),
      type: "bar", name: "Istogramma",
      marker: { color: data.map(d => d.MACD_Hist >= 0 ? "#4caf50" : "#e53935") },
      yaxis: "y3"
    };

    const layout = {
      grid: { rows: 3, columns: 1, pattern: "independent" },
      height: 900,
      paper_bgcolor: "#111", plot_bgcolor: "#111",
      font: { color: "#fff" },
      showlegend: true,
      yaxis: { title: "Prezzo" },
      yaxis2: { title: "RSI", range: [0, 100] },
      yaxis3: { title: "MACD" },
      shapes: [...rsiShapes]
    };

    const allTraces = [traceCandles, traceSMA20, traceSMA50, traceRSI, traceMACD, traceMACDSignal, traceMACDHist];
    Plotly.newPlot(chartDiv, allTraces, layout, { responsive: true });

    const last = data[data.length - 1];
    document.getElementById("lastPrice").textContent = last.Close?.toFixed(2) || "--";
    document.getElementById("lastSignal").textContent = last.Signal || "--";
    document.getElementById("rsiValue").textContent = last.RSI?.toFixed(2) || "--";
    document.getElementById("macdValue").textContent = last.MACD?.toFixed(2) || "--";

    loadingDiv.style.display = "none";
  }

  tickerSelect.addEventListener("change", e => {
    currentTicker = e.target.value;
    updateChart();
  });

 async function updateChart() {
  loadingDiv.style.display = "block";
  chartDiv.innerHTML = "";

  const data = await fetchData();
  if (!data || !data.length) {
    loadingDiv.textContent = "Nessun dato disponibile.";
    return;
  }

  const dates = data.map(d => d.Date);

  // === GRAFICO CANDELE ===
  const traceCandles = {
    x: dates,
    open: data.map(d => d.Open),
    high: data.map(d => d.High),
    low: data.map(d => d.Low),
    close: data.map(d => d.Close),
    type: "candlestick",
    name: currentTicker,
    increasing: { line: { color: "#00e676" } },
    decreasing: { line: { color: "#e53935" } },
    yaxis: "y1"
  };

  // === BUY / SELL MARKERS ===
  const buySignals = data.filter(d => d.Signal && d.Signal === "BUY");
  const sellSignals = data.filter(d => d.Signal && d.Signal === "SELL");

  const traceBUY = buySignals.length > 0 ? {
    x: buySignals.map(d => d.Date),
    y: buySignals.map(d => d.Low * 0.995),
    mode: "markers+text",
    name: "BUY",
    text: Array(buySignals.length).fill("▲"),
    textposition: "bottom center",
    textfont: { color: "#00e676", size: 18 },
    marker: { color: "#00e676", size: 8, symbol: "triangle-up" },
    yaxis: "y1"
  } : null;

  const traceSELL = sellSignals.length > 0 ? {
    x: sellSignals.map(d => d.Date),
    y: sellSignals.map(d => d.High * 1.005),
    mode: "markers+text",
    name: "SELL",
    text: Array(sellSignals.length).fill("▼"),
    textposition: "top center",
    textfont: { color: "#e53935", size: 18 },
    marker: { color: "#e53935", size: 8, symbol: "triangle-down" },
    yaxis: "y1"
  } : null;

  // === SMA 20 / 50 ===
  const traceSMA20 = {
    x: dates, y: data.map(d => d.SMA_20),
    type: "scatter", mode: "lines", name: "SMA 20",
    line: { color: "#42a5f5", width: 1.5, dash: "dot" },
    yaxis: "y1"
  };

  const traceSMA50 = {
    x: dates, y: data.map(d => d.SMA_50),
    type: "scatter", mode: "lines", name: "SMA 50",
    line: { color: "#ffb300", width: 1.5, dash: "dot" },
    yaxis: "y1"
  };

  // === RSI ===
  const traceRSI = {
    x: dates, y: data.map(d => d.RSI),
    type: "scatter", mode: "lines", name: "RSI",
    line: { color: "#ab47bc", width: 1.8 },
    yaxis: "y2"
  };

  const rsiShapes = [
    { type: "line", xref: "x", yref: "y2", x0: dates[0], x1: dates[dates.length - 1], y0: 70, y1: 70, line: { color: "red", width: 1, dash: "dash" }},
    { type: "line", xref: "x", yref: "y2", x0: dates[0], x1: dates[dates.length - 1], y0: 30, y1: 30, line: { color: "green", width: 1, dash: "dash" }}
  ];

  // === MACD ===
  const traceMACD = {
    x: dates, y: data.map(d => d.MACD),
    type: "scatter", mode: "lines", name: "MACD",
    line: { color: "#00bcd4", width: 1.8 },
    yaxis: "y3"
  };

  const traceMACDSignal = {
    x: dates, y: data.map(d => d.MACD_Signal),
    type: "scatter", mode: "lines", name: "Signal",
    line: { color: "#ff7043", width: 1.5, dash: "dot" },
    yaxis: "y3"
  };

  const traceMACDHist = {
    x: dates, y: data.map(d => d.MACD_Hist),
    type: "bar", name: "Istogramma",
    marker: { color: data.map(d => d.MACD_Hist >= 0 ? "#4caf50" : "#e53935") },
    yaxis: "y3"
  };

  // === LAYOUT ===
  const layout = {
    grid: { rows: 3, columns: 1, pattern: "independent" },
    height: 900,
    paper_bgcolor: "#111",
    plot_bgcolor: "#111",
    font: { color: "#fff" },
    showlegend: true,
    yaxis: { title: "Prezzo" },
    yaxis2: { title: "RSI", range: [0, 100] },
    yaxis3: { title: "MACD" },
    shapes: [...rsiShapes]
  };

  const traces = [traceCandles, traceSMA20, traceSMA50, traceRSI, traceMACD, traceMACDSignal, traceMACDHist];
  if (traceBUY) traces.push(traceBUY);
  if (traceSELL) traces.push(traceSELL);

  Plotly.newPlot(chartDiv, traces, layout, { responsive: true });

  const last = data[data.length - 1];
  document.getElementById("lastPrice").textContent = last.Close?.toFixed(2) || "--";
  document.getElementById("lastSignal").textContent = last.Signal || "--";
  document.getElementById("rsiValue").textContent = last.RSI?.toFixed(2) || "--";
  document.getElementById("macdValue").textContent = last.MACD?.toFixed(2) || "--";

  loadingDiv.style.display = "none";
}
 
