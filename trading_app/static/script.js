const API_BASE = window.location.origin;
const TICKERS = ["AAPL", "MSFT", "NVDA"];
let useCandlestick = false;

window.onload = () => {
    const select = document.getElementById("tickerSelect");
    TICKERS.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        select.appendChild(opt);
    });

    const switchBtn = document.createElement("button");
    switchBtn.textContent = "🕯 Candlestick / 📈 Lineare";
    switchBtn.style.marginLeft = "10px";
    switchBtn.onclick = () => {
        useCandlestick = !useCandlestick;
        aggiornaDati();
    };

    document.getElementById("controls").appendChild(switchBtn);
    aggiornaDati();
};

async function aggiornaDati() {
    const ticker = document.getElementById("tickerSelect").value || "AAPL";
    try {
        const response = await fetch(`${API_BASE}/data/${ticker}`);
        const json = await response.json();
        if (json.error) {
            console.error("Errore:", json.error);
            return;
        }

        document.getElementById("lastPrice").innerText = json.last_price.toFixed(2);
        document.getElementById("lastSignal").innerText = json.last_signal || "--";

        const data = json.data;
        const x = data.map(d => d.Date);

        // === Grafico Prezzo ===
        const priceTrace = useCandlestick
            ? {
                  x,
                  close: data.map(d => d.Close),
                  open: data.map(d => d.Open),
                  high: data.map(d => d.High),
                  low: data.map(d => d.Low),
                  type: "candlestick",
                  name: "Prezzo"
              }
            : {
                  x,
                  y: data.map(d => d.Close),
                  type: "scatter",
                  mode: "lines",
                  name: "Prezzo"
              };

        // === RSI ===
        const rsiTrace = {
            x,
            y: data.map(d => d.RSI),
            type: "scatter",
            mode: "lines",
            name: "RSI",
            line: { color: "#ffa500" },
            yaxis: "y2"
        };

        // === MACD ===
        const macdTrace = {
            x,
            y: data.map(d => d.MACD),
            type: "scatter",
            mode: "lines",
            name: "MACD",
            line: { color: "#00ffff" },
            yaxis: "y3"
        };

        const macdSignalTrace = {
            x,
            y: data.map(d => d.MACD_SIGNAL),
            type: "scatter",
            mode: "lines",
            name: "MACD Signal",
            line: { color: "#ff00ff", dash: "dot" },
            yaxis: "y3"
        };

        // === Segnali BUY/SELL ===
        const buySignals = data
            .filter(d => d.Signal && d.Signal.includes("BUY"))
            .map(d => ({ x: d.Date, y: d.Close }));

        const sellSignals = data
            .filter(d => d.Signal && d.Signal.includes("SELL"))
            .map(d => ({ x: d.Date, y: d.Close }));

        const buyTrace = {
            x: buySignals.map(p => p.x),
            y: buySignals.map(p => p.y),
            mode: "markers",
            marker: { color: "lime", size: 10, symbol: "triangle-up" },
            name: "BUY"
        };

        const sellTrace = {
            x: sellSignals.map(p => p.x),
            y: sellSignals.map(p => p.y),
            mode: "markers",
            marker: { color: "red", size: 10, symbol: "triangle-down" },
            name: "SELL"
        };

        const layout = {
            title: `${ticker} — Analisi Tecnica`,
            grid: { rows: 3, columns: 1, pattern: "independent" },
            xaxis: { title: "Data" },
            yaxis: { title: "Prezzo ($)", domain: [0.55, 1.0] },
            yaxis2: { title: "RSI", domain: [0.30, 0.5] },
            yaxis3: { title: "MACD", domain: [0.0, 0.25] },
            plot_bgcolor: "#1e1e1e",
            paper_bgcolor: "#1e1e1e",
            font: { color: "#ddd" },
            legend: { orientation: "h", y: -0.2 }
        };

        Plotly.newPlot("chart", [priceTrace, rsiTrace, macdTrace, macdSignalTrace, buyTrace, sellTrace], layout);
    } catch (err) {
        console.error("Errore caricamento dati:", err);
    }
}
