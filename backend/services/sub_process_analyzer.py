from typing import Dict, Any, List

class SubProcessAnalyzer:
    INBOUND_STAGES = [
        {
            "id": "in_1",
            "name": "Trailer Unloading & De-stuffing",
            "description": "Rapid offloading from feeder trailers onto telescopic dock conveyors",
            "workload_share": 0.15,
            "standard_rate": 120.0, # pkgs/hr/worker
            "icon": "truck"
        },
        {
            "id": "in_2",
            "name": "Primary Scan, DWS & Induction",
            "description": "High-speed barcode scanning, dimensioning & weight verification (DWS)",
            "workload_share": 0.20,
            "standard_rate": 140.0,
            "icon": "scan"
        },
        {
            "id": "in_3",
            "name": "Automated Conveyor Sortation",
            "description": "Cross-belt/shoe sortation routing parcels to designated facility chutes",
            "workload_share": 0.25,
            "standard_rate": 160.0,
            "icon": "layers"
        },
        {
            "id": "in_4",
            "name": "Exception QA & Remediation",
            "description": "Handling damaged barcodes, non-conveyable shapes and missorted parcels",
            "workload_share": 0.10,
            "standard_rate": 60.0,
            "icon": "alert-circle"
        },
        {
            "id": "in_5",
            "name": "Palletizing & Cross-Dock Staging",
            "description": "Consolidating parcels into palletized lots and cages for internal transfer",
            "workload_share": 0.20,
            "standard_rate": 110.0,
            "icon": "package"
        },
        {
            "id": "in_6",
            "name": "Bay Release & Putaway",
            "description": "Final container staging release and handover to outbound dock staging",
            "workload_share": 0.10,
            "standard_rate": 130.0,
            "icon": "check-circle"
        }
    ]

    OUTBOUND_STAGES = [
        {
            "id": "out_1",
            "name": "Manifest Verification & Linefeed Batching",
            "description": "Validating shipment manifests and scheduling dock bay distribution",
            "workload_share": 0.10,
            "standard_rate": 150.0,
            "icon": "file-text"
        },
        {
            "id": "out_2",
            "name": "Secondary Chute Sortation & Consolidation",
            "description": "Routing high-volume parcels into outbound route-specific sorting bins",
            "workload_share": 0.20,
            "standard_rate": 140.0,
            "icon": "layers"
        },
        {
            "id": "out_3",
            "name": "Scan-to-Container & Tote Packing",
            "description": "Scanning packages into air/ground gaylord containers and carts",
            "workload_share": 0.25,
            "standard_rate": 130.0,
            "icon": "scan"
        },
        {
            "id": "out_4",
            "name": "Heavy & Irregular Freight Handling",
            "description": "Manual handling for non-conveyable, oversize, or hazardous shipments",
            "workload_share": 0.15,
            "standard_rate": 55.0,
            "icon": "alert-circle"
        },
        {
            "id": "out_5",
            "name": "Feeder Trailer Cube Loading & Stacking",
            "description": "High-density wall stacking inside linehaul trailers to maximize cube space",
            "workload_share": 0.20,
            "standard_rate": 115.0,
            "icon": "truck"
        },
        {
            "id": "out_6",
            "name": "Door Seal, Weight QA & Dispatch Release",
            "description": "Final door security seal, axle weight check, and bill of lading sign-off",
            "workload_share": 0.10,
            "standard_rate": 160.0,
            "icon": "shield-check"
        }
    ]

    @classmethod
    def analyze_stages(
        cls,
        operation: str = "inbound",
        total_volume: float = 14500.0,
        total_workers: int = 15,
        target_shift_hours: float = 8.0,
        benchmark_target_pct: float = 60.0
    ) -> Dict[str, Any]:
        """
        Breaks down operation into 6 micro-stages, calculates predicted duration & efficiency,
        and compares against executive benchmark target.
        """
        stages_def = cls.INBOUND_STAGES if operation.lower() == "inbound" else cls.OUTBOUND_STAGES
        
        # Distribute available workers across stages proportionally (at least 1 per stage)
        raw_worker_dist = [max(1, round(total_workers * s["workload_share"])) for s in stages_def]
        # Normalize sum to match total_workers
        diff = total_workers - sum(raw_worker_dist)
        if diff != 0:
            # Add or subtract from the largest stage
            max_idx = raw_worker_dist.index(max(raw_worker_dist))
            raw_worker_dist[max_idx] = max(1, raw_worker_dist[max_idx] + diff)

        stage_results = []
        bottleneck_count = 0
        total_predicted_time = 0.0

        for i, s in enumerate(stages_def):
            share = s["workload_share"]
            stage_vol = int(total_volume * share)
            assigned_workers = raw_worker_dist[i]
            std_rate = s["standard_rate"]
            
            # Predicted stage time = stage_volume / (assigned_workers * standard_rate)
            pred_time = round(stage_vol / (assigned_workers * std_rate), 2)
            total_predicted_time += pred_time
            
            # Target allowable time for this stage within the shift
            stage_benchmark_time = round(target_shift_hours * share, 2)
            
            # Efficiency % = (Benchmark Target Time / Predicted Time) * 100
            # Higher is faster / better
            efficiency_pct = round((stage_benchmark_time / max(0.01, pred_time)) * 100.0, 1) if pred_time > 0 else 100.0
            
            # Benchmark Comparison (Executive Benchmark, e.g. 60%)
            # If efficiency_pct >= benchmark_target_pct * 1.25 -> "Above Benchmark"
            # If efficiency_pct >= benchmark_target_pct -> "Meets Benchmark"
            # If efficiency_pct < benchmark_target_pct -> "Below Benchmark (Bottleneck)"
            is_bottleneck = efficiency_pct < benchmark_target_pct
            
            if is_bottleneck:
                bottleneck_count += 1
                status = "Below Benchmark"
                status_color = "red"
                action_tip = f"Stage is operating at {efficiency_pct}% vs {benchmark_target_pct}% target. Add +1 worker or streamline stage."
            elif efficiency_pct >= (benchmark_target_pct + 15.0):
                status = "Above Benchmark"
                status_color = "green"
                action_tip = f"Stage exceeds benchmark ({efficiency_pct}%). Surplus capacity available."
            else:
                status = "Meets Benchmark"
                status_color = "amber"
                action_tip = f"Stage is on track at {efficiency_pct}% efficiency."

            stage_results.append({
                "id": s["id"],
                "name": s["name"],
                "description": s["description"],
                "workload_share_pct": int(share * 100),
                "stage_volume": stage_vol,
                "assigned_workers": assigned_workers,
                "standard_rate_per_worker": std_rate,
                "predicted_duration_hours": pred_time,
                "benchmark_target_hours": stage_benchmark_time,
                "efficiency_pct": efficiency_pct,
                "benchmark_target_pct": benchmark_target_pct,
                "status": status,
                "status_color": status_color,
                "is_bottleneck": is_bottleneck,
                "action_tip": action_tip,
                "icon": s["icon"]
            })

        # Overall composite efficiency
        avg_efficiency = round(sum(s["efficiency_pct"] for s in stage_results) / len(stage_results), 1)
        
        # Synthesize targeted stage rebalance advice
        rebalance_suggestions = []
        bottlenecks = [s for s in stage_results if s["is_bottleneck"]]
        surpluses = [s for s in stage_results if s["status"] == "Above Benchmark" and s["assigned_workers"] > 1]
        
        if bottlenecks and surpluses:
            donor = surpluses[0]
            target = bottlenecks[0]
            rebalance_suggestions.append({
                "type": "intra_stage_rebalance",
                "message": f"Transfer 1 worker from '{donor['name']}' ({donor['efficiency_pct']}% eff) to '{target['name']}' ({target['efficiency_pct']}% eff).",
                "impact": f"Brings '{target['name']}' above the {benchmark_target_pct}% executive benchmark."
            })
        elif bottlenecks:
            rebalance_suggestions.append({
                "type": "add_capacity",
                "message": f"Sub-process '{bottlenecks[0]['name']}' requires 1 additional worker to meet the {benchmark_target_pct}% SLA benchmark.",
                "impact": "Eliminates downstream dock queuing delays."
            })
        else:
            rebalance_suggestions.append({
                "type": "balanced",
                "message": f"All 6 {operation.capitalize()} operational stages meet or exceed the {benchmark_target_pct}% benchmark target.",
                "impact": "Optimal shift synchronization."
            })

        return {
            "operation": operation.capitalize(),
            "total_volume": int(total_volume),
            "total_workers": total_workers,
            "target_shift_hours": target_shift_hours,
            "benchmark_target_pct": benchmark_target_pct,
            "composite_efficiency_pct": avg_efficiency,
            "bottlenecks_detected": bottleneck_count,
            "stages": stage_results,
            "rebalance_suggestions": rebalance_suggestions
        }
