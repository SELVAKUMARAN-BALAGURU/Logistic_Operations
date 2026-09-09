import math
from typing import Dict, Any, List, Optional

class WorkforcePlanner:
    @staticmethod
    def calculate_shift_plan(
        forecasted_stock: float,
        available_workers: int = 15,
        processing_rate_per_worker: float = 105.0, # packages/hour/worker
        target_shift_hours: float = 8.0,
        is_peak_period: bool = False
    ) -> Dict[str, Any]:
        """
        Calculates exact deterministic operational requirements for a single workload volume.
        """
        # Effective rate may adjust slightly during peak periods (e.g. congestion penalty 5%)
        eff_rate = processing_rate_per_worker * (0.95 if is_peak_period else 1.0)
        
        # Max capacity in a standard shift with 1 worker = eff_rate * target_shift_hours
        worker_shift_capacity = eff_rate * target_shift_hours
        
        if worker_shift_capacity <= 0:
            required_workers = 1
        else:
            required_workers = math.ceil(forecasted_stock / worker_shift_capacity)
            
        # Ensure at least 1 worker if workload > 0
        if forecasted_stock > 0 and required_workers == 0:
            required_workers = 1
            
        # Expected processing time with available workers
        if available_workers <= 0:
            expected_processing_time = 999.0
            utilization_pct = 999.0
        else:
            total_hourly_rate = available_workers * eff_rate
            expected_processing_time = round(forecasted_stock / total_hourly_rate, 2)
            total_shift_capacity = available_workers * worker_shift_capacity
            utilization_pct = round((forecasted_stock / total_shift_capacity) * 100.0, 1) if total_shift_capacity > 0 else 100.0

        workforce_gap = required_workers - available_workers # positive = shortage, negative = surplus
        
        # Status determination
        if workforce_gap >= 3 or expected_processing_time > (target_shift_hours * 1.2) or utilization_pct > 120.0:
            status = "Critical"
            status_color = "red"
            status_message = f"Severe shortage ({workforce_gap} workers needed). Processing will exceed shift limit by {round(expected_processing_time - target_shift_hours, 1)}h."
        elif workforce_gap > 0 or expected_processing_time > target_shift_hours or utilization_pct > 100.0:
            status = "Warning"
            status_color = "amber"
            status_message = f"Moderate capacity gap (+{workforce_gap} workers needed to finish within {target_shift_hours}h)."
        elif utilization_pct < 65.0 and workforce_gap <= -3:
            status = "Surplus"
            status_color = "blue"
            status_message = f"Surplus capacity (utilization {utilization_pct}%). {abs(workforce_gap)} workers could be reallocated."
        else:
            status = "Optimal"
            status_color = "green"
            status_message = f"Operations on track. Projected completion in {expected_processing_time}h ({utilization_pct}% capacity)."

        return {
            "forecasted_stock": int(forecasted_stock),
            "required_workers": int(required_workers),
            "available_workers": int(available_workers),
            "workforce_gap": int(workforce_gap),
            "gap_type": "shortage" if workforce_gap > 0 else ("surplus" if workforce_gap < 0 else "balanced"),
            "expected_processing_time_hours": expected_processing_time,
            "target_shift_hours": target_shift_hours,
            "processing_rate_per_worker": round(eff_rate, 1),
            "capacity_utilization_pct": utilization_pct,
            "status": status,
            "status_color": status_color,
            "status_message": status_message,
            "is_peak": is_peak_period
        }

    @staticmethod
    def generate_timeline_workforce_plan(
        forecast_records: List[Dict[str, Any]],
        operation_name: str,
        available_workers: int = 15,
        processing_rate: float = 105.0,
        target_shift_hours: float = 8.0
    ) -> List[Dict[str, Any]]:
        """
        Maps future forecasted records to daily workforce requirement objects.
        """
        future_plans = []
        for rec in forecast_records:
            if not rec.get("is_future", False):
                continue
                
            workload = rec.get("forecasted_workload", 0)
            # Flag weekend / early week peak
            date_str = rec.get("date")
            plan = WorkforcePlanner.calculate_shift_plan(
                forecasted_stock=workload,
                available_workers=available_workers,
                processing_rate_per_worker=processing_rate,
                target_shift_hours=target_shift_hours
            )
            plan["date"] = date_str
            plan["operation"] = operation_name.capitalize()
            plan["confidence_lower"] = rec.get("confidence_lower")
            plan["confidence_upper"] = rec.get("confidence_upper")
            future_plans.append(plan)
            
        return future_plans
