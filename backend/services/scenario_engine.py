from typing import Dict, Any, List
import math

class ScenarioEngine:
    @staticmethod
    def simulate_what_if(
        forecasted_workload: float = 14500,
        base_workers: int = 15,
        processing_rate_per_worker: float = 105.0,
        target_shift_hours: float = 8.0,
        is_peak_period: bool = False,
        worker_deltas: List[int] = [-4, -2, 0, 2, 4, 6, 8, 10]
    ) -> Dict[str, Any]:
        """
        Simulates multiple staffing and workload scenarios for interactive sandbox exploration.
        """
        eff_rate = processing_rate_per_worker * (0.95 if is_peak_period else 1.0)
        required_workers = math.ceil(forecasted_workload / (eff_rate * target_shift_hours)) if eff_rate > 0 else 1
        
        simulations = []
        for delta in sorted(worker_deltas):
            w_count = max(1, base_workers + delta)
            time_hrs = round(forecasted_workload / (w_count * eff_rate), 2)
            shift_cap = w_count * eff_rate * target_shift_hours
            util_pct = round((forecasted_workload / shift_cap) * 100.0, 1) if shift_cap > 0 else 100.0
            
            is_within_shift = time_hrs <= target_shift_hours
            gap = required_workers - w_count
            
            simulations.append({
                "worker_delta": delta,
                "total_workers": w_count,
                "expected_processing_time_hours": time_hrs,
                "target_shift_hours": target_shift_hours,
                "time_difference_hours": round(time_hrs - target_shift_hours, 2),
                "is_within_shift": is_within_shift,
                "capacity_utilization_pct": util_pct,
                "workforce_gap": gap,
                "status": "Critical" if time_hrs > target_shift_hours * 1.2 else ("Warning" if time_hrs > target_shift_hours else "Optimal")
            })
            
        # Current base state
        base_time = round(forecasted_workload / (max(1, base_workers) * eff_rate), 2)
        base_gap = required_workers - base_workers
        
        return {
            "parameters": {
                "forecasted_workload": int(forecasted_workload),
                "base_workers": int(base_workers),
                "processing_rate": round(eff_rate, 1),
                "target_shift_hours": target_shift_hours,
                "is_peak": is_peak_period,
                "required_workers": required_workers
            },
            "base_case": {
                "workers": base_workers,
                "expected_time": base_time,
                "workforce_gap": base_gap,
                "is_within_shift": base_time <= target_shift_hours
            },
            "simulations": simulations
        }
