import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

class MLCapacityEstimator:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=50, max_depth=6, random_state=42)
        self.is_trained = False
        self.feature_names = ['stock', 'workers', 'shift_hours', 'peak_period', 'equipment', 'day_of_week']
        self.metrics = {}

    def train_from_operational_data(self, df_op: pd.DataFrame) -> Dict[str, Any]:
        """
        Trains a lightweight Random Forest regressor to predict processing time from operational features.
        """
        df = df_op.copy()
        df.columns = [c.strip().lower() for c in df.columns]
        
        # Identify stock column
        stock_col = next((c for c in df.columns if 'stock' in c or 'volume' in c), None)
        target_col = next((c for c in df.columns if 'actual_processing_time' in c or 'time' in c), None)
        
        if not stock_col or not target_col or len(df) < 10:
            return {"status": "insufficient_data", "message": "Using mathematical capacity model."}
            
        df['date'] = pd.to_datetime(df.get('date', pd.Series(pd.date_range(start='2026-01-01', periods=len(df)))))
        df['day_of_week'] = df['date'].dt.weekday
        
        X = pd.DataFrame({
            'stock': pd.to_numeric(df[stock_col], errors='coerce').fillna(10000),
            'workers': pd.to_numeric(df.get('workers_assigned', 15), errors='coerce').fillna(15),
            'shift_hours': pd.to_numeric(df.get('shift_hours', 8.0), errors='coerce').fillna(8.0),
            'peak_period': pd.to_numeric(df.get('peak_period', 0), errors='coerce').fillna(0),
            'equipment': pd.to_numeric(df.get('equipment_available', 15), errors='coerce').fillna(15),
            'day_of_week': df['day_of_week']
        })
        
        y = pd.to_numeric(df[target_col], errors='coerce').fillna(8.0)
        
        # Train
        self.model.fit(X, y)
        self.is_trained = True
        
        preds = self.model.predict(X)
        mae = float(mean_absolute_error(y, preds))
        r2 = float(r2_score(y, preds))
        
        importances = dict(zip(self.feature_names, [round(float(v), 3) for v in self.model.feature_importances_]))
        
        self.metrics = {
            "status": "trained",
            "model_type": "Random Forest Regressor",
            "samples_trained": len(df),
            "mae_hours": round(mae, 2),
            "r2_score": round(max(0.0, r2), 3),
            "feature_importances": importances
        }
        return self.metrics

    def predict_processing_time(
        self,
        stock: float,
        workers: int,
        shift_hours: float = 8.0,
        is_peak: bool = False,
        equipment: int = 15,
        day_of_week: int = 0
    ) -> float:
        if not self.is_trained:
            # Fallback direct formula: stock / (workers * 105)
            return round(stock / (max(1, workers) * 105.0), 2)
            
        X = pd.DataFrame([{
            'stock': stock,
            'workers': workers,
            'shift_hours': shift_hours,
            'peak_period': 1 if is_peak else 0,
            'equipment': equipment,
            'day_of_week': day_of_week
        }])
        pred = self.model.predict(X)[0]
        return round(float(pred), 2)
