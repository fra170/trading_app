# app.py
from flask import Flask, jsonify, render_template
import yfinance as yf
import threading
import time
from datetime import datetime
import pandas as pd
import numpy as np
from signals import generate_signals

app = Flask(__name__)

# Tickers monitorati
TICKERS = ["MSFT", "AAPL", "NVDA"]
DATA = {}
UPDATE_INTERVAL = 300  # 5 minuti


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Sostituisce NaN, inf, -inf con None per JSON compatibile."""
    df = df.replace([np.nan, np.inf, -np.inf], None)
    return df


def update_data():
    """Aggiorna ciclicamente i dati dei titoli."""
    global DATA
    while True:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Aggiornamento dati...")
        for t in TICKERS:
            try:
                # Scarica i dati da Yahoo Finance
                df = yf.download(t, period="6mo", interval="1d", progress=False)

                # Correzione per MultiIndex
                if isinstance(df.columns, pd.MultiIndex):
                    df.columns = df.columns.get_level_values(0)

                # Calcolo indicatori e segnali
                df = generate_signals(df)

                # Aggiunge la colonna della data come stringa
                df["Date"] = df.index.strftime("%Y-%m-%d")

                # ✅ Pulizia completa dei NaN prima della conversione
                df = clean_dataframe(df)

                last_row = df.iloc[-1].to_dict()

                # Salvataggio dei dati
                DATA[t] = {
                    "last_price": round(last_row.get("Close", 0) or 0, 2),
                    "last_signal": last_row.get("Signal") or "",
                    "data": df.tail(100).to_dict(orient="records"),
                }

            except Exception as e:
                print(f"Errore aggiornamento {t}: {e}")

        # Attende prima del prossimo aggiornamento
        time.sleep(UPDATE_INTERVAL)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/data/<ticker>")
def get_data(ticker):
    ticker = ticker.upper()
    if ticker in DATA:
        # 🔧 Conversione extra per sicurezza JSON
        import json
        safe_json = json.loads(pd.Series(DATA[ticker]).to_json())
        return jsonify(safe_json)
    else:
        return jsonify({"error": "Ticker non trovato"}), 404


if __name__ == "__main__":
    threading.Thread(target=update_data, daemon=True).start()
    app.run(host="0.0.0.0", port=5000)
