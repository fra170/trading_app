from flask import Flask, jsonify, render_template
import yfinance as yf
import pandas as pd
import numpy as np
import threading
import time
from datetime import datetime
from signals import generate_signals

app = Flask(__name__)

# Titoli monitorati
TICKERS = ["MSFT", "AAPL", "NVDA"]
DATA = {}
UPDATE_INTERVAL = 300  # 5 minuti

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Pulisce i valori non compatibili per il JSON."""
    df = df.replace([np.nan, np.inf, -np.inf], None)
    return df

def update_data():
    """Aggiorna i dati ciclicamente da Yahoo Finance."""
    global DATA
    while True:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Aggiornamento dati...")
        for t in TICKERS:
            try:
                # Scarica i dati reali da Yahoo Finance
                df = yf.download(t, period="6mo", interval="1d", progress=False)

                # Corregge MultiIndex (alcuni ticker lo usano)
                if isinstance(df.columns, pd.MultiIndex):
                    df.columns = df.columns.get_level_values(0)

                # Controlla che ci siano le colonne minime
                for col in ["Open", "High", "Low", "Close", "Volume"]:
                    if col not in df.columns:
                        raise ValueError(f"Colonna mancante: {col}")

                # Genera segnali tecnici
                df = generate_signals(df)

                # Aggiunge colonna Date per il grafico
                df["Date"] = df.index.strftime("%Y-%m-%d")

                # Pulizia valori NaN
                df = clean_dataframe(df)

                last_row = df.iloc[-1].to_dict()

                # Salva dati in memoria
                DATA[t] = {
                    "last_price": round(last_row.get("Close", 0) or 0, 2),
                    "last_signal": last_row.get("Signal") or "",
                    "data": df.tail(100).to_dict(orient="records"),
                }

                print(f"Dati aggiornati per {t}")

            except Exception as e:
                print(f"❌ Errore aggiornamento {t}: {e}")

        time.sleep(UPDATE_INTERVAL)


@app.route("/")
def index():
    """Pagina principale (dashboard)."""
    return render_template("index.html")


@app.route("/data/<ticker>")
def get_data(ticker):
    """API dati JSON per ogni ticker."""
    ticker = ticker.upper()
    if ticker in DATA:
        return jsonify(DATA[ticker])
    else:
        return jsonify({"error": "Ticker non trovato"}), 404


if __name__ == "__main__":
    threading.Thread(target=update_data, daemon=True).start()
    app.run(host="0.0.0.0", port=5000)


