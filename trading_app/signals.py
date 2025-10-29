# signals.py
import pandas as pd
import ta

def compute_indicators(df: pd.DataFrame) -> pd.DataFrame:
    # Calcola indicatori
    df["SMA_20"] = ta.trend.SMAIndicator(df["Close"], window=20).sma_indicator()
    df["SMA_50"] = ta.trend.SMAIndicator(df["Close"], window=50).sma_indicator()
    df["SMA_200"] = ta.trend.SMAIndicator(df["Close"], window=200).sma_indicator()

    df["RSI"] = ta.momentum.RSIIndicator(df["Close"], window=14).rsi()
    macd = ta.trend.MACD(df["Close"])
    df["MACD"] = macd.macd()
    df["MACD_SIGNAL"] = macd.macd_signal()

    boll = ta.volatility.BollingerBands(df["Close"])
    df["BOLL_UP"] = boll.bollinger_hband()
    df["BOLL_DOWN"] = boll.bollinger_lband()
    return df


def generate_signals(df: pd.DataFrame) -> pd.DataFrame:
    df = compute_indicators(df.copy())

    df["Signal"] = ""
    for i in range(1, len(df)):
        prev = df.iloc[i - 1]
        cur = df.iloc[i]

        # --- Segnale di ACQUISTO ---
        if (
            prev["Close"] < prev["SMA_20"]
            and cur["Close"] > cur["SMA_20"]
            and cur["Close"] > cur["SMA_50"]
        ):
            df.at[df.index[i], "Signal"] = "BUY"

        # --- Segnale di VENDITA ---
        elif (
            prev["Close"] > prev["SMA_20"]
            and cur["Close"] < cur["SMA_20"]
            and cur["Close"] < cur["SMA_50"]
        ):
            df.at[df.index[i], "Signal"] = "SELL"

        # Segnali aggiuntivi RSI
        elif cur["RSI"] > 70:
            df.at[df.index[i], "Signal"] = "RSI_OVERBOUGHT"
        elif cur["RSI"] < 30:
            df.at[df.index[i], "Signal"] = "RSI_OVERSOLD"

    return df
