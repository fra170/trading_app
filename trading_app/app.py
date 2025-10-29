# app.py — versione finale per Render con Alpha Vantage e fallback immediato
from flask import Flask, jsonify, render_template
import threading
import time
import pandas as pd
import numpy as np
from datetime import datetime
from alpha_vantage.timeseries import TimeSeries
from signals import generate_signals

app = Flask(__name__)

API_KEY = "3FF37IFVE08TO963"
TICKERS = ["MSFT", "AAPL", "NVDA"]
UPDATE_INTERVAL = 300  # 5 minuti
DATA = {}
LOCK = threading.Lock()


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.replace([np.nan, np.inf, -np.inf], None)
    return df


def fetch_alpha_vantage(ticker: str) -> pd.DataFrame:
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
                with LOCK:
                    DATA[t] = {
                        "last_price": round(last_row.get("Close", 0) or 0, 2),
                        "last_signal": last_row.get("Signal") or "",
                        "data": df.tail(100).to_dict(orient="records"),
                    }
                print(f"Dati aggiornati per {t}")
            except Exception as e:
                print(f"Errore aggiornamento {t}: {e}")
        time.sleep(UPDATE_INTERVAL)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/data/<ticker>")
def get_data(ticker):
    ticker = ticker.upper()
    with LOCK:
        if ticker in DATA and DATA[ticker]:
            return jsonify(DATA[ticker])

    # se non ci sono ancora dati, li scarico subito
    try:
        df = fetch_alpha_vantage(ticker)
        df = generate_signals(df)
        df["Date"] = df.index.strftime("%Y-%m-%d")
        df = clean_dataframe(df)
        last_row = df.iloc[-1].to_dict()
        result = {
            "last_price": round(last_row.get("Close", 0) or 0, 2),
            "last_signal": last_row.get("Signal") or "",
            "data": df.tail(100).to_dict(orient="records"),
        }
        with LOCK:
            DATA[ticker] = result
        print(f"Dati scaricati al volo per {ticker}")
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def start_background_thread():
    thread = threading.Thread(target=update_data, daemon=True)
    thread.start()
    print("Thread di aggiornamento avviato su Render")
    return thread


# Avvio thread anche su Gunicorn
start_background_thread()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

