import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_datasets():
    np.random.seed(42)
    
    # 90 days of historical data up to yesterday
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=90)
    dates = [start_date + timedelta(days=i) for i in range(91)]
    
    inbound_records = []
    inbound_op_records = []
    
    for d in dates:
        day_of_week = d.weekday()
        # Monday=0, Sunday=6
        day_factor = 1.25 if day_of_week in [0, 1] else (1.1 if day_of_week in [2, 3] else (0.95 if day_of_week == 4 else (0.7 if day_of_week == 5 else 0.5)))
        trend = (d - start_date).days * 18
        noise = np.random.normal(0, 350)
        base_inbound = 11500
        inbound_volume = int(max(3000, base_inbound * day_factor + trend + noise))
        
        inbound_records.append({
            "date": d.strftime("%Y-%m-%d"),
            "inbound_stock": inbound_volume
        })
        
        # Operational records
        workers_1 = int(np.clip(inbound_volume / (105 * 8) + np.random.randint(-2, 3), 10, 30))
        proc_rate_1 = round(float(np.random.uniform(98.0, 115.0)), 1)
        shift_hrs_1 = 8.0
        actual_time_1 = round(float(inbound_volume / (workers_1 * proc_rate_1)), 2)
        
        inbound_op_records.append({
            "date": d.strftime("%Y-%m-%d"),
            "shift": "Day",
            "inbound_stock": inbound_volume,
            "workers_assigned": workers_1,
            "processing_rate_per_worker": proc_rate_1,
            "actual_processing_time": actual_time_1,
            "shift_hours": shift_hrs_1,
            "peak_period": 1 if day_of_week in [0, 1] else 0,
            "equipment_available": int(np.random.choice([12, 14, 15, 16], p=[0.1, 0.2, 0.5, 0.2]))
        })

    # Outbound: weekly pattern (higher Thu-Fri dispatch, lower Sun)
    outbound_records = []
    outbound_op_records = []
    
    for d in dates:
        day_of_week = d.weekday()
        day_factor = 1.15 if day_of_week in [2, 3, 4] else (1.05 if day_of_week in [0, 1] else (0.75 if day_of_week == 5 else 0.45))
        trend = (d - start_date).days * 15
        noise = np.random.normal(0, 320)
        base_outbound = 10800
        outbound_volume = int(max(2800, base_outbound * day_factor + trend + noise))
        
        outbound_records.append({
            "date": d.strftime("%Y-%m-%d"),
            "outbound_stock": outbound_volume
        })
        
        # Operational records
        workers_out = int(np.clip(outbound_volume / (110 * 8) + np.random.randint(-2, 3), 10, 28))
        proc_rate_out = round(float(np.random.uniform(102.0, 120.0)), 1)
        shift_hrs_out = 8.0
        actual_time_out = round(float(outbound_volume / (workers_out * proc_rate_out)), 2)
        
        outbound_op_records.append({
            "date": d.strftime("%Y-%m-%d"),
            "shift": "Outbound-Main",
            "outbound_stock": outbound_volume,
            "workers_assigned": workers_out,
            "processing_rate_per_worker": proc_rate_out,
            "actual_processing_time": actual_time_out,
            "shift_hours": shift_hrs_out,
            "peak_period": 1 if day_of_week in [3, 4] else 0,
            "equipment_available": int(np.random.choice([14, 16, 18], p=[0.2, 0.6, 0.2]))
        })

    os.makedirs("data", exist_ok=True)
    pd.DataFrame(inbound_records).to_csv("data/inbound_historical.csv", index=False)
    pd.DataFrame(inbound_op_records).to_csv("data/inbound_operational.csv", index=False)
    pd.DataFrame(outbound_records).to_csv("data/outbound_historical.csv", index=False)
    pd.DataFrame(outbound_op_records).to_csv("data/outbound_operational.csv", index=False)
    print("Generated all CSV demo datasets in data/ successfully.")

if __name__ == "__main__":
    generate_datasets()
