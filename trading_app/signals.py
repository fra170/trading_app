import pandas as pd
import numpy as np
import ta  # libreria 'technical analysis'

def generate_signals(df: pd.DataFrame) -> pd.DataFrame:
    """Genera segnali BUY e SELL in base a incrocio medie mobili e RSI."""

    # --- Calcolo indicatori tecnici ---
    df["SMA_20"] = ta.trend.SMAIndicator(df["Close"], window=20).sma_indicator()
    df["SMA_50"] = ta.trend.SMAIndicator(df["Close"], window=50).sma_indicator()
    df["RSI"] = ta.momentum.RSIIndicator(df["Close"], window=14).rsi()
    macd = ta.trend.MACD(df["Close"])
    df["MACD"] = macd.macd()
    df["MACD_Signal"] = macd.macd_signal()
    df["MACD_Hist"] = macd.macd_diff()

    # --- Inizializza la colonna dei segnali ---
    df["Signal"] = ""

    # --- Ciclo di generazione segnali ---
    for i in range(1, len(df)):
        prev_fast = df["SMA_20"].iloc[i-1]
        prev_slow = df["SMA_50"].iloc[i-1]
        curr_fast = df["SMA_20"].iloc[i]
        curr_slow = df["SMA_50"].iloc[i]
        curr_rsi = df["RSI"].iloc[i]

        # BUY: incrocio verso l'alto e RSI < 70
        if prev_fast < prev_slow and curr_fast > curr_slow and curr_rsi < 70:
            df.at[df.index[i], "Signal"] = "BUY"

        # SELL: incrocio verso il basso e RSI > 30
        elif prev_fast > prev_slow and curr_fast < curr_slow and curr_rsi > 30:
            df.at[df.index[i], "Signal"] = "SELL"

    # --- Riempie eventuali valori mancanti ---
    df = df.fillna(method='bfill').fillna(method='ffill')
    return df



