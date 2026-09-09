from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import pandas as pd
import io
import os
import shutil
import math

from services.preprocessor import DataPreprocessor
from services.forecaster import ProphetForecastingPipeline
from services.workforce_planner import WorkforcePlanner
from services.optimizer import ResourceOptimizer
from services.scenario_engine import ScenarioEngine
from services.ml_capacity import MLCapacityEstimator
from services.sub_process_analyzer import SubProcessAnalyzer

app = FastAPI(
    title="UPS Predictive Logistics & Workforce Optimization API",
    version="1.0.0",
    description="Operational workforce forecasting and capacity optimization engine"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

# Shared in-memory pipelines
inbound_pipeline = ProphetForecastingPipeline(operation_name="inbound")
outbound_pipeline = ProphetForecastingPipeline(operation_name="outbound")
ml_capacity_inbound = MLCapacityEstimator()
ml_capacity_outbound = MLCapacityEstimator()


# Request / Response Schemas
class ForecastRequest(BaseModel):
    horizon_days: int = Field(default=14, ge=3, le=90, description="Forecast horizon in days")
    test_split_days: int = Field(default=14, ge=3, le=30, description="Days for historical backtesting evaluation")

class WorkforcePlanRequest(BaseModel):
    horizon_days: int = Field(default=14, ge=3, le=90)
    inbound_available_workers: int = Field(default=15, ge=1)
    outbound_available_workers: int = Field(default=14, ge=1)
    inbound_processing_rate: float = Field(default=105.0, ge=10.0)
    outbound_processing_rate: float = Field(default=110.0, ge=10.0)
    target_shift_hours: float = Field(default=8.0, ge=1.0)

class ScenarioRequest(BaseModel):
    forecasted_workload: float = Field(default=14500.0, ge=100.0)
    base_workers: int = Field(default=15, ge=1)
    processing_rate_per_worker: float = Field(default=105.0, ge=10.0)
    target_shift_hours: float = Field(default=8.0, ge=1.0)
    is_peak_period: bool = Field(default=False)
    worker_deltas: List[int] = Field(default=[-4, -2, 0, 2, 4, 6, 8, 10])

class SubProcessRequest(BaseModel):
    operation: str = Field(default="inbound", description="Operation type: 'inbound' or 'outbound'")
    total_volume: float = Field(default=14500.0, ge=100.0)
    total_workers: int = Field(default=15, ge=1)
    target_shift_hours: float = Field(default=8.0, ge=1.0)
    benchmark_target_pct: float = Field(default=60.0, ge=10.0, le=100.0)


def load_dataset(filename: str) -> pd.DataFrame:
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        # Trigger generator if missing
        import generate_demo_data
        generate_demo_data.generate_datasets()
    return pd.read_csv(filepath)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "UPS Predictive Logistics Engine",
        "version": "1.0.0"
    }


@app.get("/api/demo-data/stats")
def get_datasets_stats():
    """Returns statistics for all available operational and historical datasets."""
    try:
        in_hist = load_dataset("inbound_historical.csv")
        out_hist = load_dataset("outbound_historical.csv")
        
        _, in_stats = DataPreprocessor.preprocess_forecasting_data(in_hist, "inbound_stock", "Inbound")
        _, out_stats = DataPreprocessor.preprocess_forecasting_data(out_hist, "outbound_stock", "Outbound")
        
        return {
            "inbound_historical": in_stats,
            "outbound_historical": out_stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload/{dataset_type}")
async def upload_dataset(dataset_type: str, file: UploadFile = File(...)):
    """
    Accepts CSV upload for:
    - inbound_historical
    - outbound_historical
    - inbound_operational
    - outbound_operational
    """
    valid_types = ["inbound_historical", "outbound_historical", "inbound_operational", "outbound_operational"]
    if dataset_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid dataset type. Choose from: {valid_types}")
        
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        if dataset_type == "inbound_historical":
            df_clean, stats = DataPreprocessor.preprocess_forecasting_data(df, "inbound_stock", "Inbound")
            df.to_csv(os.path.join(DATA_DIR, "inbound_historical.csv"), index=False)
            return {"status": "success", "message": "Inbound historical data updated successfully.", "stats": stats}
            
        elif dataset_type == "outbound_historical":
            df_clean, stats = DataPreprocessor.preprocess_forecasting_data(df, "outbound_stock", "Outbound")
            df.to_csv(os.path.join(DATA_DIR, "outbound_historical.csv"), index=False)
            return {"status": "success", "message": "Outbound historical data updated successfully.", "stats": stats}
            
        elif dataset_type == "inbound_operational":
            df_clean, stats = DataPreprocessor.preprocess_operational_data(df, "Inbound Operations")
            df.to_csv(os.path.join(DATA_DIR, "inbound_operational.csv"), index=False)
            ml_capacity_inbound.train_from_operational_data(df_clean)
            return {"status": "success", "message": "Inbound operational data updated.", "stats": stats}
            
        elif dataset_type == "outbound_operational":
            df_clean, stats = DataPreprocessor.preprocess_operational_data(df, "Outbound Operations")
            df.to_csv(os.path.join(DATA_DIR, "outbound_operational.csv"), index=False)
            ml_capacity_outbound.train_from_operational_data(df_clean)
            return {"status": "success", "message": "Outbound operational data updated.", "stats": stats}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV file: {str(e)}")


@app.post("/api/forecast/inbound")
def forecast_inbound(req: ForecastRequest):
    """
    Module 1: Independent Inbound Prophet Forecasting Pipeline.
    """
    try:
        df_raw = load_dataset("inbound_historical.csv")
        df_clean, stats = DataPreprocessor.preprocess_forecasting_data(df_raw, "inbound_stock", "Inbound")
        
        metrics = inbound_pipeline.fit_and_evaluate(df_clean, test_days=req.test_split_days)
        forecast_records = inbound_pipeline.predict_future(df_clean, horizon_days=req.horizon_days)
        
        return {
            "operation": "Inbound",
            "horizon_days": req.horizon_days,
            "metrics": metrics,
            "dataset_stats": stats,
            "forecast": forecast_records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inbound forecasting error: {str(e)}")


@app.post("/api/forecast/outbound")
def forecast_outbound(req: ForecastRequest):
    """
    Module 2: Independent Outbound Prophet Forecasting Pipeline.
    """
    try:
        df_raw = load_dataset("outbound_historical.csv")
        df_clean, stats = DataPreprocessor.preprocess_forecasting_data(df_raw, "outbound_stock", "Outbound")
        
        metrics = outbound_pipeline.fit_and_evaluate(df_clean, test_days=req.test_split_days)
        forecast_records = outbound_pipeline.predict_future(df_clean, horizon_days=req.horizon_days)
        
        return {
            "operation": "Outbound",
            "horizon_days": req.horizon_days,
            "metrics": metrics,
            "dataset_stats": stats,
            "forecast": forecast_records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Outbound forecasting error: {str(e)}")


@app.post("/api/workforce/plan")
def calculate_workforce_plan(req: WorkforcePlanRequest):
    """
    Modules 3, 4, 5: Inbound & Outbound Workforce and Capacity Planning.
    """
    try:
        # Inbound
        df_in = load_dataset("inbound_historical.csv")
        df_clean_in, _ = DataPreprocessor.preprocess_forecasting_data(df_in, "inbound_stock", "Inbound")
        inbound_pipeline.fit_and_evaluate(df_clean_in, test_days=14)
        in_forecast = inbound_pipeline.predict_future(df_clean_in, horizon_days=req.horizon_days)
        in_plan = WorkforcePlanner.generate_timeline_workforce_plan(
            in_forecast,
            operation_name="inbound",
            available_workers=req.inbound_available_workers,
            processing_rate=req.inbound_processing_rate,
            target_shift_hours=req.target_shift_hours
        )
        
        # Outbound
        df_out = load_dataset("outbound_historical.csv")
        df_clean_out, _ = DataPreprocessor.preprocess_forecasting_data(df_out, "outbound_stock", "Outbound")
        outbound_pipeline.fit_and_evaluate(df_clean_out, test_days=14)
        out_forecast = outbound_pipeline.predict_future(df_clean_out, horizon_days=req.horizon_days)
        out_plan = WorkforcePlanner.generate_timeline_workforce_plan(
            out_forecast,
            operation_name="outbound",
            available_workers=req.outbound_available_workers,
            processing_rate=req.outbound_processing_rate,
            target_shift_hours=req.target_shift_hours
        )
        
        return {
            "inbound_plan": in_plan,
            "outbound_plan": out_plan,
            "parameters": req.model_dump()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workforce planning error: {str(e)}")


@app.post("/api/optimize")
def optimize_resources(req: WorkforcePlanRequest):
    """
    Module 6: Resource Optimization & Cross-Dock Balancing.
    """
    try:
        # Generate plans
        workforce_data = calculate_workforce_plan(req)
        in_plan = workforce_data["inbound_plan"]
        out_plan = workforce_data["outbound_plan"]
        
        optimization_result = ResourceOptimizer.optimize_cross_dock(in_plan, out_plan)
        return optimization_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization error: {str(e)}")


@app.post("/api/scenario")
def run_scenario(req: ScenarioRequest):
    """
    Module 7: What-If / Scenario Planning.
    """
    try:
        res = ScenarioEngine.simulate_what_if(
            forecasted_workload=req.forecasted_workload,
            base_workers=req.base_workers,
            processing_rate_per_worker=req.processing_rate_per_worker,
            target_shift_hours=req.target_shift_hours,
            is_peak_period=req.is_peak_period,
            worker_deltas=req.worker_deltas
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scenario error: {str(e)}")


@app.post("/api/subprocesses/analyze")
def analyze_sub_processes(req: SubProcessRequest):
    """
    Sub-Process Stage Efficiency & Executive Benchmark Analyzer.
    """
    try:
        res = SubProcessAnalyzer.analyze_stages(
            operation=req.operation,
            total_volume=req.total_volume,
            total_workers=req.total_workers,
            target_shift_hours=req.target_shift_hours,
            benchmark_target_pct=req.benchmark_target_pct
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sub-process analysis error: {str(e)}")


@app.get("/api/dashboard/summary")
def get_dashboard_summary(
    horizon_days: int = 14,
    in_workers: int = 15,
    out_workers: int = 14,
    in_rate: float = 105.0,
    out_rate: float = 110.0,
    shift_hours: float = 8.0
):
    """
    Module 8: Complete Operations Dashboard payload.
    """
    try:
        horizon_days = int(getattr(horizon_days, "default", horizon_days))
        in_workers = int(getattr(in_workers, "default", in_workers))
        out_workers = int(getattr(out_workers, "default", out_workers))
        in_rate = float(getattr(in_rate, "default", in_rate))
        out_rate = float(getattr(out_rate, "default", out_rate))
        shift_hours = float(getattr(shift_hours, "default", shift_hours))
        # 1. Inbound Forecast
        df_in = load_dataset("inbound_historical.csv")
        df_clean_in, in_stats = DataPreprocessor.preprocess_forecasting_data(df_in, "inbound_stock", "Inbound")
        in_metrics = inbound_pipeline.fit_and_evaluate(df_clean_in, test_days=14)
        in_forecast = inbound_pipeline.predict_future(df_clean_in, horizon_days=horizon_days)
        in_plan = WorkforcePlanner.generate_timeline_workforce_plan(
            in_forecast, "inbound", in_workers, in_rate, shift_hours
        )
        
        # 2. Outbound Forecast
        df_out = load_dataset("outbound_historical.csv")
        df_clean_out, out_stats = DataPreprocessor.preprocess_forecasting_data(df_out, "outbound_stock", "Outbound")
        out_metrics = outbound_pipeline.fit_and_evaluate(df_clean_out, test_days=14)
        out_forecast = outbound_pipeline.predict_future(df_clean_out, horizon_days=horizon_days)
        out_plan = WorkforcePlanner.generate_timeline_workforce_plan(
            out_forecast, "outbound", out_workers, out_rate, shift_hours
        )
        
        # 3. Cross-dock Optimization
        optimization = ResourceOptimizer.optimize_cross_dock(in_plan, out_plan)
        
        # 4. Aggregate High-Level KPIs for next 7 days / future horizon
        total_future_in_stock = sum(p['forecasted_stock'] for p in in_plan)
        total_future_out_stock = sum(p['forecasted_stock'] for p in out_plan)
        avg_daily_in_stock = int(total_future_in_stock / max(1, len(in_plan)))
        avg_daily_out_stock = int(total_future_out_stock / max(1, len(out_plan)))
        
        avg_in_req_workers = round(sum(p['required_workers'] for p in in_plan) / max(1, len(in_plan)), 1)
        avg_out_req_workers = round(sum(p['required_workers'] for p in out_plan) / max(1, len(out_plan)), 1)
        total_required_workers = math.ceil(avg_in_req_workers + avg_out_req_workers)
        total_available_workers = in_workers + out_workers
        overall_gap = total_required_workers - total_available_workers
        
        avg_in_util = round(sum(p['capacity_utilization_pct'] for p in in_plan) / max(1, len(in_plan)), 1)
        avg_out_util = round(sum(p['capacity_utilization_pct'] for p in out_plan) / max(1, len(out_plan)), 1)
        overall_util = round((avg_in_util + avg_out_util) / 2.0, 1)
        
        avg_in_time = round(sum(p['expected_processing_time_hours'] for p in in_plan) / max(1, len(in_plan)), 2)
        avg_out_time = round(sum(p['expected_processing_time_hours'] for p in out_plan) / max(1, len(out_plan)), 2)

        # ML capacity status
        try:
            op_in = load_dataset("inbound_operational.csv")
            ml_status = ml_capacity_inbound.train_from_operational_data(op_in)
        except Exception:
            ml_status = {"status": "default_capacity_model"}

        # Sub-process stage benchmark analyses
        in_subprocess = SubProcessAnalyzer.analyze_stages(
            operation="inbound",
            total_volume=avg_daily_in_stock,
            total_workers=in_workers,
            target_shift_hours=shift_hours,
            benchmark_target_pct=60.0
        )
        out_subprocess = SubProcessAnalyzer.analyze_stages(
            operation="outbound",
            total_volume=avg_daily_out_stock,
            total_workers=out_workers,
            target_shift_hours=shift_hours,
            benchmark_target_pct=60.0
        )

        return {
            "kpis": {
                "avg_daily_inbound_volume": avg_daily_in_stock,
                "avg_daily_outbound_volume": avg_daily_out_stock,
                "total_required_workers": total_required_workers,
                "total_available_workers": total_available_workers,
                "overall_workforce_gap": overall_gap,
                "overall_utilization_pct": overall_util,
                "inbound_utilization_pct": avg_in_util,
                "outbound_utilization_pct": avg_out_util,
                "avg_inbound_processing_time": avg_in_time,
                "avg_outbound_processing_time": avg_out_time,
                "target_shift_hours": shift_hours,
                "status": "Critical" if overall_gap >= 4 else ("Warning" if overall_gap > 0 else "Optimal")
            },
            "inbound": {
                "metrics": in_metrics,
                "stats": in_stats,
                "forecast": in_forecast,
                "workforce_plan": in_plan
            },
            "outbound": {
                "metrics": out_metrics,
                "stats": out_stats,
                "forecast": out_forecast,
                "workforce_plan": out_plan
            },
            "subprocesses": {
                "inbound": in_subprocess,
                "outbound": out_subprocess
            },
            "optimization": optimization,
            "ml_capacity_model": ml_status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard summary error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
