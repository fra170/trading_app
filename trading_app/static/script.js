document.addEventListener("DOMContentLoaded", async () => {
  const chartDiv = document.getElementById("chart");
  const loadingDiv = document.getElementById("loading");
  const tickerSelect = document.getElementById("tickerSelect");
  const addButton = document.getElementById("addTicker");
  const inputTicker = document.getElementById("tickerInput");
  let currentTicker = "MSFT";

  const priceEl = document.getElementById("lastPrice");
  const signalEl = document.getElementById("lastSignal");
  const rsiEl = document.getElementById("rsiValue");
  const macdEl = document.getElementById("macdValue");

  // === Carica lista titoli ===
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
    currentTicker = tickers[0];
  }

  // === Aggiunge nuovo titolo ===
  addButton.addEventListener("click", async () => {
    const t = inputTicker.value.trim().toUpperCase();
    if (!t) return alert("Inserisci un simbolo valido.");
    await fetch(`/tickers/add/${t}`, { method: "POST" });
    await loadTickers();
    tickerSelect.value = t;
    currentTicker = t;
    updateChart();
  });

  // === Recupera dati dal server ===
  async function fetchData() {
    const res = await fetch(`/data/${currentTicker}`);
    const json = await res.json();
    if (!json || !json.data) throw new Error("Dati non disponibili");
    return json;
  }

  // === Disegna grafico ===
  async function updateChart() {
    loadingDiv.style.display = "block";
    chartDiv.innerHTML = "";

    try {
      const json = await fetchData();
      let data = json.data;
      if (!data || data.length === 0) throw new Error("Nessun dato valido");

      // --- Pulizia dati ---
      data = data.filter(d => d.Open && d.High && d.Low && d.Close);
      data.forEach(d => {
        d.MACD = d.MACD ?? 0;
        d.MACD_Signal = d.MACD_Signal ?? 0;
        d.MACD_Hist = d.MACD_Hist ?? 0;
        d.RSI = d.RSI ?? 50;
        d.SMA_20 = d.SMA_20 ?? d.Close;
        d.SMA_50 = d.SMA_50 ?? d.Close;
      });

      const dates = data.map(d => d.Date);

      // --- CANDELE ---
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

      // --- SMA ---
      const traceSMA20 = {
        x: dates,
        y: data.map(d => d.SMA_20),
        type: "scatter",
        mode: "lines",
        name: "SMA 20",
        line: { color: "#42a5f5", width: 1.5, dash: "dot" },
        yaxis: "y1"
      };

      const traceSMA50 = {
        x: dates,
        y: data.map(d => d.SMA_50),
        type: "scatter",
        mode: "lines",
        name: "SMA 50",
        line: { color: "#ffb300", width: 1.5, dash: "dot" },
        yaxis: "y1"
      };

      // --- BUY / SELL ---
      const buySignals = data.filter(d => d.Signal === "BUY");
      const sellSignals = data.filter(d => d.Signal === "SELL");

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

      // --- RSI ---
      const traceRSI = {
        x: dates,
        y: data.map(d => d.RSI),
        type: "scatter",
        mode: "lines",
        name: "RSI",
        line: { color: "#ab47bc", width: 1.8 },
        yaxis: "y2"
      };

      const rsiShapes = [
        { type: "line", xref: "x", yref: "y2", x0: dates[0], x1: dates[dates.length - 1], y0: 70, y1: 70, line: { color: "red", width: 1, dash: "dash" }},
        { type: "line", xref: "x", yref: "y2", x0: dates[0], x1: dates[dates.length - 1], y0: 30, y1: 30, line: { color: "green", width: 1, dash: "dash" }}
      ];

      // --- MACD ---
      const traceMACD = {
        x: dates,
        y: data.map(d => d.MACD),
        type: "scatter",
        mode: "lines",
        name: "MACD",
        line: { color: "#00bcd4", width: 1.8 },
        yaxis: "y3"
      };

      const traceMACDSignal = {
        x: dates,
        y: data.map(d => d.MACD_Signal),
        type: "scatter",
        mode: "lines",
        name: "Signal",
        line: { color: "#ff7043", width: 1.5, dash: "dot" },
        yaxis: "y3"
      };

      const traceMACDHist = {
        x: dates,
        y: data.map(d => d.MACD_Hist),
        type: "bar",
        name: "Istogramma",
        marker: { color: data.map(d => d.MACD_Hist >= 0 ? "#4caf50" : "#e53935") },
        yaxis: "y3"
      };

      // --- Layout ---
     const layout = {
  grid: { rows: 3, columns: 1, pattern: "independent" },
  height: 900,
  paper_bgcolor: "#111",
  plot_bgcolor: "#111",
  font: { color: "#fff" },
  showlegend: true,
  
  // 🔹 Assegna proporzioni di spazio
  yaxis: { title: "Prezzo", domain: [0.40, 1.00] },   // parte alta, più grande
  yaxis2: { title: "RSI", domain: [0.20, 0.38], range: [0, 100] },
  yaxis3: { title: "MACD", domain: [0.00, 0.18] },
  
  shapes: [...rsiShapes]
};


      const traces = [traceCandles, traceSMA20, traceSMA50, traceRSI, traceMACD, traceMACDSignal, traceMACDHist];
      if (traceBUY) traces.push(traceBUY);
      if (traceSELL) traces.push(traceSELL);

      Plotly.newPlot(chartDiv, traces, layout, { responsive: true, displaylogo: false });

      // --- Aggiornamento pannello valori ---
      const last = data[data.length - 1];
      priceEl.textContent = (last.Close || json.last_price || 0).toFixed(2);
      rsiEl.textContent = last.RSI ? last.RSI.toFixed(2) : "--";
      macdEl.textContent = last.MACD ? last.MACD.toFixed(2) : "--";

      // Segnale dinamico colorato
      const signal = last.Signal || json.last_signal || "--";
      signalEl.textContent = signal;
      if (signal === "BUY") signalEl.style.color = "#00e676";
      else if (signal === "SELL") signalEl.style.color = "#ff5252";
      else signalEl.style.color = "#ccc";

    } catch (err) {
      alert("Errore nel caricamento dati: " + err.message);
    }

    loadingDiv.style.display = "none";
  }

  tickerSelect.addEventListener("change", () => {
    currentTicker = tickerSelect.value;
    updateChart();
  });

  await loadTickers();
  await updateChart();
});

