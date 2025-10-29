# app.py — versione Alpha Vantage stabile per Render
from flask import Flask, jsonify, render_template
import threading
import time
import pandas as pd
import numpy as np
from datetime import datetime
from alpha_vantage.timeseries import TimeSeries
from signals import generate_signals

app = Flask(__name__)

# === CONFIG ===
API_KEY = "3FF37IFVE08TO963"   # tua chiave personale
TICKERS = ["MSFT", "AAPL", "NVDA"]
UPDATE_INTERVAL = 300  # secondi = 5 minuti
DATA = {}

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.replace([np.nan, np.inf, -np.inf], None)
    return df

def fetch_alpha_vantage(ticker: str) -> pd.DataFrame:
    """Scarica dati reali da Alpha Vantage (Daily Adjusted)."""
    ts = TimeSeries(key=API_KEY, output_format='pandas')
    data, _ = ts.get_daily_adjusted(symbol=ticker, outputsize='compact')
    data = data.rename(columns={
        '1. open': 'Open',
        '2. high': 'High',
        '3. low': 'Low',
        '4. close': 'Close',
        '6. volume': 'Volume'
    })
    data.index = pd.to_datetime(data.index)
    data = data.sort_index()
    return data

def update_data():
    global DATA
    while True:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Aggiornamento dati...")
        for t in TICKERS:
            try:
                df = fetch_alpha_vantage(t)
                df = generate_signals(df)
                df["Date"] = df.index.strftime("%Y-%m-%d")
                df = clean_dataframe(df)
                last_row = df.iloc[-1].to_dict()
                DATA[t] = {
                    "last_price": round(last_row.get("Close", 0) or 0, 2),
                    "last_signal": last_row.get("Signal") or "",
                    "data": df.tail(100).to_dict(orient="records"),
                }
            except Exception as e:
                print(f"Errore aggiornamento {t}: {e}")
        time.sleep(UPDATE_INTERVAL)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/data/<ticker>")
def get_data(ticker):
    ticker = ticker.upper()
    if ticker in DATA:
        return jsonify(DATA[ticker])
    else:
        return jsonify({"error": "Ticker non trovato"}), 404

if __name__ == "__main__":
    threading.Thread(target=update_data, daemon=True).start()
    app.run(host="0.0.0.0", port=5000)


