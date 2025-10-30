document.addEventListener("DOMContentLoaded", () => {
  const updateButton = document.getElementById("updateButton");
  const tickerSelect = document.getElementById("ticker");

  async function fetchData(ticker) {
    const res = await fetch(`/data/${ticker}`);
    if (!res.ok) throw new Error(`Errore ${res.status}`);
    const json = await res.json();
    return json;
  }

  // --- Funzione principale di rendering grafico ---
  function renderChart(data) {
    const dates = data.map(d => d.Date);
    const close = data.map(d => d.Close);
    const sma20 = data.map(d => d.SMA_20);
    const sma50 = data.map(d => d.SMA_50);
    const rsi = data.map(d => d.RSI);
    const macd = data.map(d => d.MACD);
    const macdSignal = data.map(d => d.MACD_Signal);
    const macdHist = data.map(d => d.MACD_Hist);

    // === GRAFICO CANDELE ===
    const tracePrice = {
      x: dates,
      close: data.map(d => d.Close),
      open: data.map(d => d.Open),
      high: data.map(d => d.High),
      low: data.map(d => d.Low),
      type: "candlestick",
      name: "Prezzo",
      yaxis: "y",
      increasing: { line: { color: "#00ff7f" } },
      decreasing: { line: { color: "#ff6347" } }
    };

    const traceSMA20 = {
      x: dates,
      y: sma20,
      type: "scatter",
      mode: "lines",
      line: { color: "#1f77b4", width: 1.2 },
      name: "SMA 20",
      yaxis: "y"
    };

    const traceSMA50 = {
      x: dates,
      y: sma50,
      type: "scatter",
      mode: "lines",
      line: { color: "#ff7f0e", width: 1.2 },
      name: "SMA 50",
      yaxis: "y"
    };

    // === GRAFICO RSI ===
    const traceRSI = {
      x: dates,
      y: rsi,
      name: "RSI",
      type: "scatter",
      mode: "lines",
      line: { color: "#9467bd", width: 1.5 },
      yaxis: "y2"
    };

    const rsiShapes = [
      {
        type: "line", xref: "x", yref: "y2",
        x0: dates[0], x1: dates[dates.length - 1],
        y0: 70, y1: 70,
        line: { color: "red", width: 1, dash: "dash" }
      },
      {
        type: "line", xref: "x", yref: "y2",
        x0: dates[0], x1: dates[dates.length - 1],
        y0: 30, y1: 30,
        line: { color: "green", width: 1, dash: "dash" }
      }
    ];

    // === GRAFICO MACD ===
    const traceMACD = {
      x: dates,
      y: macd,
      name: "MACD",
      type: "scatter",
      mode: "lines",
      line: { color: "#17becf", width: 1.5 },
      yaxis: "y3"
    };

    const traceMACDSignal = {
      x: dates,
      y: macdSignal,
      name: "Segnale MACD",
      type: "scatter",
      mode: "lines",
      line: { color: "#ff7f0e", width: 1.2, dash: "dot" },
      yaxis: "y3"
    };

    const traceMACDHist = {
      x: dates,
      y: macdHist,
      name: "Istogramma MACD",
      type: "bar",
      marker: { color: macdHist.map(v => v >= 0 ? "#2ca02c" : "#d62728") },
      yaxis: "y3"
    };

    // === LAYOUT ===
    const layout = {
      grid: { rows: 3, columns: 1, pattern: "independent", roworder: "top to bottom" },
      showlegend: true,
      height: 900,
      paper_bgcolor: "#111",
      plot_bgcolor: "#111",
      font: { color: "#fff" },
      margin: { t: 40, b: 40 },
      xaxis: {
        title: "Data",
        rangeselector: {
          buttons: [
            { count: 7, label: "1W", step: "day", stepmode: "backward" },
            { count: 30, label: "1M", step: "day", stepmode: "backward" },
            { count: 60, label: "2M", step: "day", stepmode: "backward" },
            { count: 90, label: "3M", step: "day", stepmode: "backward" },
            { step: "all", label: "Tutto" }
          ]
        },
        rangeslider: { visible: true },
        type: "date"
      },
      yaxis: { title: "Prezzo", domain: [0.40, 1.00] },
      yaxis2: { title: "RSI", domain: [0.20, 0.38], range: [0, 100] },
      yaxis3: { title: "MACD", domain: [0.00, 0.18] },
      shapes: [...rsiShapes]
    };

    const config = {
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ["lasso2d", "select2d"]
    };

    const allTraces = [tracePrice, traceSMA20, traceSMA50, traceRSI, traceMACD, traceMACDSignal, traceMACDHist];
    Plotly.newPlot("chart", allTraces, layout, config);
  }

  // --- Funzione di aggiornamento principale ---
  async function updateChart() {
    const ticker = tickerSelect.value;
    document.getElementById("loading").style.display = "block";

    try {
      const json = await fetchData(ticker);
      const data = json.data;
      renderChart(data);

      document.getElementById("lastPrice").textContent = json.last_price || "--";
      document.getElementById("lastSignal").textContent = json.last_signal || "--";
      const last = data[data.length - 1];
      document.getElementById("rsiValue").textContent = last.RSI ? last.RSI.toFixed(2) : "--";
      document.getElementById("macdValue").textContent = last.MACD ? last.MACD.toFixed(2) : "--";
    } catch (err) {
      alert("Errore nel caricamento dati: " + err);
    }

    document.getElementById("loading").style.display = "none";
  }

  // --- Pulsante "Aggiorna Grafico" ---
  updateButton.addEventListener("click", updateChart);

  // --- Pulsanti periodo personalizzati ---
  document.querySelectorAll(".period-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const days = btn.dataset.days;
      const ticker = tickerSelect.value;

      try {
        const json = await fetchData(ticker);
        let data = json.data;

        if (days !== "all") {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - parseInt(days));
          data = data.filter(d => new Date(d.Date) >= cutoff);
        }

        renderChart(data);
        document.getElementById("lastPrice").textContent = json.last_price || "--";
        document.getElementById("lastSignal").textContent = json.last_signal || "--";
        const last = data[data.length - 1];
        document.getElementById("rsiValue").textContent = last.RSI ? last.RSI.toFixed(2) : "--";
        document.getElementById("macdValue").textContent = last.MACD ? last.MACD.toFixed(2) : "--";

      } catch (err) {
        alert("Errore nel filtraggio periodo: " + err);
      }
    });
  });

  // --- Caricamento iniziale ---
  updateChart();
});
