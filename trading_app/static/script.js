const API_BASE = window.location.origin;
const TICKERS = ["AAPL", "MSFT", "NVDA"];
let useCandlestick = false;

// al caricamento iniziale
window.onload = () => {
    const select = document.getElementById("tickerSelect");
    TICKERS.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        select.appendChild(opt);
    });

    // pulsante per cambiare vista
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

        // aggiorna i valori
        document.getElementById("lastPrice").innerText = json.last_price.toFixed(2);
        document.getElementById("lastSignal").innerText = json.last_signal || "--";

        const data = json.data;
        const x = data.map(d => d.Date);
        const y = data.map(d => d.Close);

        const trace = useCandlestick
            ? {
                  x,
                  close: data.map(d => d.Close),
                  open: data.map(d => d.Open),
                  high: data.map(d => d.High),
                  low: data.map(d => d.Low),
                  type: "candlestick",
                  name: ticker
              }
            : {
                  x,
                  y,
                  type: "scatter",
                  mode: "lines",
                  name: ticker
              };

        const layout = {
            title: `${ticker} — Andamento Prezzi`,
            xaxis: { title: "Data" },
            yaxis: { title: "Prezzo ($)" },
            plot_bgcolor: "#1e1e1e",
            paper_bgcolor: "#1e1e1e",
            font: { color: "#ddd" }
        };

        Plotly.newPlot("chart", [trace], layout);
    } catch (err) {
        console.error("Errore caricamento dati:", err);
    }
}
