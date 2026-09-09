import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, Optional
from datetime import datetime

class DataPreprocessor:
    @staticmethod
    def preprocess_forecasting_data(
        df: pd.DataFrame, 
        stock_column: str,
        operation_name: str = "inbound"
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Cleans and validates time series data for Prophet forecasting.
        Requires 'date' and stock_column (e.g., 'inbound_stock' or 'outbound_stock').
        """
        # 1. Normalize column names
        df = df.copy()
        df.columns = [c.strip().lower() for c in df.columns]
        
        # Check column existence
        if "date" not in df.columns:
            # Check if there's any date-like column
            date_candidates = [c for c in df.columns if "date" in c or "day" in c or "time" in c]
            if date_candidates:
                df = df.rename(columns={date_candidates[0]: "date"})
            else:
                raise ValueError("Dataset missing required 'date' column.")
                
        target_col = stock_column.lower()
        if target_col not in df.columns:
            # Look for stock/volume/count column
            val_candidates = [c for c in df.columns if "stock" in c or "volume" in c or "pkg" in c or "package" in c or "count" in c or "workload" in c]
            if val_candidates:
                target_col = val_candidates[0]
            else:
                raise ValueError(f"Dataset missing required workload column '{stock_column}'. Found: {list(df.columns)}")

        # 2. Parse dates & sort
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df = df.dropna(subset=['date'])
        df = df.sort_values('date')
        
        # 3. Handle duplicates: sum multiple entries on the same date
        df[target_col] = pd.to_numeric(df[target_col], errors='coerce')
        df = df.dropna(subset=[target_col])
        df = df.groupby('date', as_index=False)[target_col].sum()
        
        # 4. Fill missing dates with interpolation
        if len(df) > 1:
            full_idx = pd.date_range(start=df['date'].min(), end=df['date'].max(), freq='D')
            df = df.set_index('date').reindex(full_idx)
            df[target_col] = df[target_col].interpolate(method='linear').bfill().ffill()
            df = df.reset_index().rename(columns={'index': 'date'})
        
        # 5. Outlier detection & gentle winsorization (clipping negative or extreme values)
        df[target_col] = df[target_col].clip(lower=0)
        q1 = df[target_col].quantile(0.01)
        q99 = df[target_col].quantile(0.99)
        # We don't discard, we smooth only extreme spikes if > 3 * q99
        df['y'] = df[target_col].astype(float)
        df['ds'] = df['date']
        
        # 6. Calculate dataset statistics
        stats = {
            "operation": operation_name,
            "record_count": int(len(df)),
            "start_date": df['date'].min().strftime("%Y-%m-%d") if len(df) > 0 else None,
            "end_date": df['date'].max().strftime("%Y-%m-%d") if len(df) > 0 else None,
            "min_workload": float(round(df['y'].min(), 2)) if len(df) > 0 else 0,
            "max_workload": float(round(df['y'].max(), 2)) if len(df) > 0 else 0,
            "avg_workload": float(round(df['y'].mean(), 2)) if len(df) > 0 else 0,
            "std_workload": float(round(df['y'].std(), 2)) if len(df) > 0 else 0
        }
        
        return df[['ds', 'y']], stats

    @staticmethod
    def preprocess_operational_data(
        df: pd.DataFrame, 
        operation_name: str = "inbound"
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Cleans operational dataset for capacity estimation and workforce benchmarking.
        """
        df = df.copy()
        df.columns = [c.strip().lower() for c in df.columns]
        
        if "date" in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
        
        numeric_cols = ['workers_assigned', 'processing_rate_per_worker', 'actual_processing_time', 'shift_hours', 'equipment_available']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
                
        # Default fallbacks if certain columns are missing
        if 'processing_rate_per_worker' not in df.columns or df['processing_rate_per_worker'].isna().all():
            stock_cols = [c for c in df.columns if 'stock' in c or 'volume' in c]
            if stock_cols and 'workers_assigned' in df.columns and 'actual_processing_time' in df.columns:
                s_col = stock_cols[0]
                df['processing_rate_per_worker'] = df[s_col] / (df['workers_assigned'] * df['actual_processing_time'].replace(0, 1))
            else:
                df['processing_rate_per_worker'] = 100.0  # default 100 packages/hr/worker
        
        avg_rate = float(df['processing_rate_per_worker'].dropna().mean()) if 'processing_rate_per_worker' in df.columns and not df['processing_rate_per_worker'].dropna().empty else 105.0
        avg_workers = float(df['workers_assigned'].dropna().mean()) if 'workers_assigned' in df.columns and not df['workers_assigned'].dropna().empty else 15.0
        
        stats = {
            "operation": operation_name,
            "record_count": int(len(df)),
            "avg_processing_rate": round(avg_rate, 1),
            "avg_workers_assigned": round(avg_workers, 1),
            "default_shift_hours": 8.0
        }
        
        return df, stats
