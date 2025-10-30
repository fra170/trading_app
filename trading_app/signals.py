import pandas as pd
import ta  # libreria "technical analysis"

def generate_signals(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calcola gli indicatori tecnici principali (SMA20, SMA50, RSI, MACD)
    e genera i segnali operativi BUY/SELL.
    """

    # --- 1. Medie mobili semplici ---
    df['SMA_20'] = ta.trend.SMAIndicator(close=df['Close'], window=20).sma_indicator()
    df['SMA_50'] = ta.trend.SMAIndicator(close=df['Close'], window=50).sma_indicator()

    # --- 2. RSI (Relative Strength Index) ---
    df['RSI'] = ta.momentum.RSIIndicator(close=df['Close'], window=14).rsi()

    # --- 3. MACD (Moving Average Convergence Divergence) ---
    macd = ta.trend.MACD(close=df['Close'])
    df['MACD'] = macd.macd()
    df['MACD_Signal'] = macd.macd_signal()
    df['MACD_Hist'] = macd.macd_diff()

    # --- 4. Generazione segnali BUY/SELL in base all'incrocio delle medie mobili ---
    df['Signal'] = ''
    for i in range(1, len(df)):
        if (
            df['SMA_20'].iloc[i] > df['SMA_50'].iloc[i]
            and df['SMA_20'].iloc[i - 1] <= df['SMA_50'].iloc[i - 1]
        ):
            df.loc[df.index[i], 'Signal'] = 'BUY'
        elif (
            df['SMA_20'].iloc[i] < df['SMA_50'].iloc[i]
            and df['SMA_20'].iloc[i - 1] >= df['SMA_50'].iloc[i - 1]
        ):
            df.loc[df.index[i], 'Signal'] = 'SELL'

    # --- 5. Pulizia dati (evita NaN o infiniti) ---
    df = df.replace([float('inf'), float('-inf')], None)
    df = df.fillna(method='bfill').fillna(method='ffill')

    return df


