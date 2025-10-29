const API_BASE = window.location.origin;
const TICKERS = ["MSFT", "AAPL", "NVDA"];
let useCandlestick = false; // vista iniziale: grafico lineare

window.onload = () => {
    const select = document.getElementById("tickerSelect");
    TICKERS.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        select.appendChild(opt);
    });

    // Aggiunge pulsante per cambiare vista
    const switchBtn = document.createElement("button");
    switchBtn.textContent = "🕯 Candlestick / 📈 Lineare";
    switchBtn.style.marginLeft = "10px";
    switchBtn.onclick = () => {
        useCandlestick = !useCandlestick;
        aggiornaDati();
    };
    document.getElementById("ticker-selector").appendChild(switchBtn);

    aggiornaDati();
};

async function aggiornaDati() {
    const ticker = document.getElementById("tickerSelect").value;
    const resp = await fetch(`${API_BASE}/data/${ticker}`);
    const dati = await resp.json();

    if (!dati || !dati.data || dati.data.length === 0) {
        document.getElementById("info").innerText = "⏳ Dati non disponibili...";
        Plotly.purge("grafico");
        return;
    }

    // Serie dati
    const x = dati.data.map(p => p.Date);
    const y = dati.data.map(p => p.Close || null);
    const sma20 = dati.data.map(p => p.SMA_20 || null);
    const sma50 = dati.data.map(p => p.SMA_50 || null);
    const volume = dati.data.map(p => p.Volume || null);

    const ultimo = dati.data[dati.data.length - 1] || {};
    let openVal = ultimo.Open ?? ultimo.open ?? null;
    let closeVal = ultimo.Close ?? ultimo.close ?? null;
    let colorePrezzo = "#1f77b4";
    if (openVal !== null && closeVal !== null) {
        if (closeVal > openVal) colorePrezzo = "#2ca02c";
        else if (closeVal < openVal) colorePrezzo = "#d62728";
    }

    const segnali = dati.data.filter(p => p.Signal === "BUY" || p.Signal === "SELL");

    // 🔹 Grafico prezzo
    let traces = [];

    if (useCandlestick) {
        // Grafico a candele OHLC
        const traceCandle = {
            x,
            open: dati.data.map(p => p.Open),
            high: dati.data.map(p => p.High),
            low: dati.data.map(p => p.Low),
            close: dati.data.map(p => p.Close),
            type: "candlestick",
            name: "Candlestick",
            increasing: { line: { color: "#2ca02c" }, fillcolor: "#c6f6d5" },
            decreasing: { line: { color: "#d62728" }, fillcolor: "#fed7d7" },
            yaxis: "y1"
        };
        traces.push(traceCandle);
    } else {
        // Grafico lineare classico
        const tracePrezzo = {
            x, y,
            mode: "lines",
            name: "Prezzo",
            line: { color: colorePrezzo, width: 2.2 },
            yaxis: "y1"
        };
        traces.push(tracePrezzo);

        const traceSMA20 = {
            x, y: sma20,
            mode: "lines",
            name: "SMA 20",
            line: { color: "#2b6cb0", width: 1.5 },
            yaxis: "y1"
        };

        const traceSMA50 = {
            x, y: sma50,
            mode: "lines",
            name: "SMA 50",
            line: { color: "#38a169", width: 1.5 },
            yaxis: "y1"
        };

        traces.push(traceSMA20, traceSMA50);

        const traceSegnali = {
            x: segnali.map(p => p.Date),
            y: segnali.map(p => p.Close),
            mode: "markers+text",
            name: "Segnali",
            text: segnali.map(p => p.Signal),
            textposition: "top center",
            marker: {
                color: segnali.map(p => (p.Signal === "BUY" ? "green" : "red")),
                size: 10
            },
            yaxis: "y1"
        };

        traces.push(traceSegnali);
    }

    // 🔹 Volumi (sempre visibili)
    const traceVolume = {
        x, y: volume,
        type: "bar",
        name: "Volume",
        marker: { color: "#888", opacity: 0.4 },
        yaxis: "y2"
    };
    traces.push(traceVolume);

    // Layout
    const layout = {
        grid: { rows: 2, columns: 1, subplots: [["xy"], ["xy2"]], roworder: "bottom to top" },
        title: `${ticker} — Ultimo segnale: ${dati.last_signal || "Nessuno"} | Prezzo: ${dati.last_price}`,
        xaxis: { title: "Data", matches: "x2" },
        yaxis: { title: "Prezzo ($)", domain: [0.3, 1] },
        yaxis2: { title: "Volumi", domain: [0, 0.25] },
        showlegend: true,
        plot_bgcolor: "#fff",
        paper_bgcolor: "#fff",
        margin: { l: 60, r: 20, t: 60, b: 40 }
    };

    Plotly.newPlot("grafico", traces, layout);

    // 🔹 Barra informativa
    const last = dati.data[dati.data.length - 1];
    document.getElementById("info-ticker").innerText = ticker;
    document.getElementById("info-rsi").innerText = last.RSI ? last.RSI.toFixed(2) : "–";
    document.getElementById("info-macd").innerText = last.MACD ? last.MACD.toFixed(2) : "–";
    document.getElementById("info-signal").innerText = dati.last_signal || "–";

    const infoBar = document.getElementById("info-bar");
    if (dati.last_signal === "BUY") {
        infoBar.style.backgroundColor = "#e6ffed";
    } else if (dati.last_signal === "SELL") {
        infoBar.style.backgroundColor = "#ffe6e6";
    } else {
        infoBar.style.backgroundColor = "#f0f4f8";
    }

    document.getElementById("info").innerText =
        `✅ Ultimo aggiornamento: ${new Date().toLocaleTimeString()}`;
}
