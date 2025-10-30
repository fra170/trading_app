document.addEventListener("DOMContentLoaded", function () {
    const updateButton = document.getElementById("updateButton");
    const tickerInput = document.getElementById("tickerInput");

    async function fetchData() {
        const ticker = tickerInput.value || "MSFT";
        const response = await fetch(`/data?ticker=${ticker}`);
        const data = await response.json();
        return data;
    }

    async function updateChart() {
        const data = await fetchData();

        const dates = data.map(item => item.Date);
        const close = data.map(item => item.Close);
        const sma20 = data.map(item => item.SMA_20);
        const sma50 = data.map(item => item.SMA_50);
        const rsi = data.map(item => item.RSI);
        const macd = data.map(item => item.MACD);
        const macdSignal = data.map(item => item.MACD_Signal);
        const macdHist = data.map(item => item.MACD_Hist);

        // === GRAFICO PRINCIPALE (Prezzo + SMA) ===
        const tracePrice = {
            x: dates,
            y: close,
            name: "Prezzo",
            type: "scatter",
            mode: "lines",
            line: { color: "#1f77b4", width: 2 },
            yaxis: "y1"
        };

        const traceSMA20 = {
            x: dates,
            y: sma20,
            name: "SMA 20",
            type: "scatter",
            mode: "lines",
            line: { color: "#ff7f0e", width: 1.5, dash: "dot" },
            yaxis: "y1"
        };

        const traceSMA50 = {
            x: dates,
            y: sma50,
            name: "SMA 50",
            type: "scatter",
            mode: "lines",
            line: { color: "#2ca02c", width: 1.5, dash: "dot" },
            yaxis: "y1"
        };

        // === GRAFICO RSI ===
        const traceRSI = {
            x: dates,
            y: rsi,
            name: "RSI",
            type: "scatter",
            mode: "lines",
            line: { color: "#9467bd", width: 1.8 },
            yaxis: "y2"
        };

        // === Linee orizzontali RSI ===
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
            line: { color: "#17becf", width: 1.8 },
            yaxis: "y3"
        };

        const traceMACDSignal = {
            x: dates,
            y: macdSignal,
            name: "Signal",
            type: "scatter",
            mode: "lines",
            line: { color: "#ff7f0e", width: 1.5, dash: "dot" },
            yaxis: "y3"
        };

        const traceMACDHist = {
            x: dates,
            y: macdHist,
            name: "Istogramma",
            type: "bar",
            marker: { color: macdHist.map(v => v >= 0 ? "#2ca02c" : "#d62728") },
            yaxis: "y3"
        };

        // === LAYOUT COMPLETO ===
        const layout = {
            grid: { rows: 3, columns: 1, pattern: "independent", roworder: "top to bottom" },
            showlegend: true,
            height: 900,
            margin: { t: 50, b: 40 },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#fff" },
            xaxis: { showgrid: true },
            yaxis: { title: "Prezzo" },
            yaxis2: { title: "RSI", range: [0, 100] },
            yaxis3: { title: "MACD" },
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

    updateButton.addEventListener("click", updateChart);
    updateChart();
});
