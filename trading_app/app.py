from flask import Flask, jsonify, render_template
import yfinance as yf
import pandas as pd
import numpy as np
import threading
import time
from datetime import datetime
from signals import generate_signals

app = Flask(__name__)

TICKERS = ["MSFT", "AAPL", "NVDA"]
DATA = {}
UPDATE_INTERVAL = 300  # ogni 5 minuti


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Rimuove valori non compatibili per JSON."""
    return df.replace([np.nan, np.inf, -np.inf], None)


def fetch_ticker_data(ticker):
    """Scarica i dati e genera i segnali per un singolo titolo."""
    df = yf.download(ticker, period="6mo", interval="1d", progress=False)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    for col in ["Open", "High", "Low", "Close", "Volume"]:
        if col not in df.columns:
            raise ValueError(f"Colonna mancante: {col}")
    df = generate_signals(df)
    df["Date"] = df.index.strftime("%Y-%m-%d")
    df = clean_dataframe(df)
    last_row = df.iloc[-1].to_dict()
    return {
        "last_price": round(last_row.get("Close", 0) or 0, 2),
        "last_signal": last_row.get("Signal") or "",
        "data": df.tail(100).to_dict(orient="records"),
    }


def update_data():
    """Aggiorna ciclicamente tutti i titoli."""
    global DATA
    while True:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Aggiornamento dati...")
        for t in TICKERS:
            try:
                DATA[t] = fetch_ticker_data(t)
                print(f"Dati aggiornati per {t}")
            except Exception as e:
                print(f"❌ Errore aggiornamento {t}: {e}")
        time.sleep(UPDATE_INTERVAL)


@app.route("/")
def index():
    """Pagina principale."""
    global DATA
    if not DATA:
        for t in TICKERS:
            try:
                DATA[t] = fetch_ticker_data(t)
            except Exception as e:
                print(f"❌ Errore iniziale {t}: {e}")
    return render_template("index.html")


@app.route("/data/<ticker>")
def get_data(ticker):
    """Restituisce dati JSON per il ticker richiesto."""
    ticker = ticker.upper()
    if ticker in DATA:
        return jsonify(DATA[ticker])
    try:
        DATA[ticker] = fetch_ticker_data(ticker)
        return jsonify(DATA[ticker])
    except Exception as e:
        return jsonify({"error": str(e)}), 404


@app.route("/tickers", methods=["GET"])
def get_tickers():
    """Restituisce l'elenco corrente dei titoli monitorati."""
    return jsonify(TICKERS)


@app.route("/tickers/add/<ticker>", methods=["POST"])
def add_ticker(ticker):
    """Aggiunge un nuovo titolo alla lista."""
    ticker = ticker.upper()
    if ticker not in TICKERS:
        TICKERS.append(ticker)
        try:
            DATA[ticker] = fetch_ticker_data(ticker)
        except Exception as e:
            print(f"❌ Errore caricamento {ticker}: {e}")
    return jsonify({"tickers": TICKERS})


if __name__ == "__main__":
    threading.Thread(target=update_data, daemon=True).start()
    app.run(host="0.0.0.0", port=5000)
