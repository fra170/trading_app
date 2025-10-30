document.addEventListener("DOMContentLoaded", () => {
  const chartDiv = document.getElementById("chart");
  const loadingDiv = document.getElementById("loading");
  const updateButton = document.getElementById("updateButton");

  // Titolo di default
  let currentTicker = "MSFT";

  async function fetchData() {
    try {
      const response = await fetch(`/data/${currentTicker}`);
      if (!response.ok) throw new Error(`Errore HTTP ${response.status}`);
      const json = await response.json();
      return json.data || [];
    } catch (err) {
      console.error("Errore nel recupero dati:", err);
      return [];
    }
  }

  async function updateChart() {
    loadingDiv.style.display = "block";
    chartDiv.innerHTML = "";

    const data = await fetchData();
    if (data.length === 0) {
      loadingDiv.textContent = "Nessun dato disponibile o errore nel caricamento.";
      return;
    }

    // Estrazione colonne principali
    const dates = data.map(d => d.Date);
    const close = data.map(d => d.Close);
    const sma20 = data.map(d => d.SMA_20);
    const sma50 = data.map(d => d.SMA_50);
    const rsi = data.map(d => d.RSI);
    const macd = data.map(d => d.MACD);
    const macdSignal = data.map(d => d.MACD_Signal);
    const macdHist = data.map(d => d.MACD_Hist);

    // === GRAFICO PREZZO PRINCIPALE ===
    const tracePrice = {
      x: dates,
      y: close,
      type: "scatter",
      mode: "lines",
      name: "Prezzo",
      line: { color: "#00e676", width: 2 },
      yaxis: "y1"
    };

    const traceSMA20 = {
      x: dates,
      y: sma20,
      type: "scatter",
      mode: "lines",
      name: "SMA 20",
      line: { color: "#42a5f5", width: 1.5, dash: "dot" },
      yaxis: "y1"
    };

    const traceSMA50 = {
      x: dates,
      y: sma50,
      type: "scatter",
      mode: "lines",
      name: "SMA 50",
      line: { color: "#ffb300", width: 1.5, dash: "dot" },
      yaxis: "y1"
    };

    // === GRAFICO RSI ===
    const traceRSI = {
      x: dates,
      y: rsi,
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

    // === GRAFICO MACD ===
    const traceMACD = {
      x: dates,
      y: macd,
      type: "scatter",
      mode: "lines",
      name: "MACD",
      line: { color: "#00bcd4", width: 1.8 },
      yaxis: "y3"
    };

    const traceMACDSignal = {
      x: dates,
      y: macdSignal,
      type: "scatter",
      mode: "lines",
      name: "Signal",
      line: { color: "#ff7043", width: 1.5, dash: "dot" },
      yaxis: "y3"
    };

    const traceMACDHist = {
      x: dates,
      y: macdHist,
      type: "bar",
      name: "Istogramma",
      marker: { color: macdHist.map(v => v >= 0 ? "#4caf50" : "#e53935") },
      yaxis: "y3"
    };

    // === LAYOUT COMPLETO ===
    const layout = {
      grid: { rows: 3, columns: 1, pattern: "independent" },
      height: 900,
      paper_bgcolor: "#111",
      plot_bgcolor: "#111",
      font: { color: "#fff" },
      margin: { t: 40, b: 40 },
      showlegend: true,
      xaxis: { showgrid: true, color: "#aaa" },
      yaxis: { title: "Prezzo", color: "#aaa" },
      yaxis2: { title: "RSI", range: [0, 100], color: "#aaa" },
      yaxis3: { title: "MACD", color: "#aaa" },
      shapes: [...rsiShapes]
    };

    const config = {
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ["lasso2d", "select2d"]
    };

    // Unione di tutte le tracce
    const allTraces = [tracePrice, traceSMA20, traceSMA50, traceRSI, traceMACD, traceMACDSignal, traceMACDHist];

    Plotly.newPlot(chartDiv, allTraces, layout, config);

    // Aggiornamento valori numerici
    const last = data[data.length - 1];
    document.getElementById("lastPrice").textContent = last.Close ? last.Close.toFixed(2) : "--";
    document.getElementById("lastSignal").textContent = last.Signal || "--";
    document.getElementById("rsiValue").textContent = last.RSI ? last.RSI.toFixed(2) : "--";
    document.getElementById("macdValue").textContent = last.MACD ? last.MACD.toFixed(2) : "--";

    loadingDiv.style.display = "none";
  }

  updateButton.addEventListener("click", updateChart);

  // Caricamento iniziale
  updateChart();
});


