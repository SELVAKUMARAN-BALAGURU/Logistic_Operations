from typing import Dict, Any, List

class ResourceOptimizer:
    @staticmethod
    def optimize_cross_dock(
        inbound_plans: List[Dict[str, Any]],
        outbound_plans: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Cross-optimizes workforce allocation between Inbound sortation and Outbound dispatch.
        """
        # Index plans by date
        inbound_by_date = {p['date']: p for p in inbound_plans}
        outbound_by_date = {p['date']: p for p in outbound_plans}
        
        all_dates = sorted(list(set(inbound_by_date.keys()) | set(outbound_by_date.keys())))
        
        daily_optimizations = []
        overall_recommendations = []
        critical_alert_count = 0
        warning_alert_count = 0
        
        for d in all_dates:
            in_p = inbound_by_date.get(d)
            out_p = outbound_by_date.get(d)
            
            if not in_p or not out_p:
                continue
                
            in_req = in_p['required_workers']
            in_avail = in_p['available_workers']
            in_gap = in_p['workforce_gap'] # > 0 means shortage
            
            out_req = out_p['required_workers']
            out_avail = out_p['available_workers']
            out_gap = out_p['workforce_gap']
            
            total_req = in_req + out_req
            total_avail = in_avail + out_avail
            net_gap = total_req - total_avail
            
            # Cross-dock reallocation calculation
            rebalance_action = "Maintain current allocations"
            rebalance_workers = 0
            transfer_from = None
            transfer_to = None
            
            # Case 1: Inbound shortage, Outbound surplus
            if in_gap > 0 and out_gap < 0:
                available_surplus = abs(out_gap)
                transfer = min(in_gap, available_surplus)
                rebalance_workers = transfer
                transfer_from = "Outbound"
                transfer_to = "Inbound"
                rebalance_action = f"Transfer {transfer} worker{'s' if transfer > 1 else ''} from Outbound to Inbound"
            
            # Case 2: Outbound shortage, Inbound surplus
            elif out_gap > 0 and in_gap < 0:
                available_surplus = abs(in_gap)
                transfer = min(out_gap, available_surplus)
                rebalance_workers = transfer
                transfer_from = "Inbound"
                transfer_to = "Outbound"
                rebalance_action = f"Transfer {transfer} worker{'s' if transfer > 1 else ''} from Inbound to Outbound"
                
            # Post-rebalance effective gaps
            post_in_avail = in_avail + (rebalance_workers if transfer_to == "Inbound" else (-rebalance_workers if transfer_from == "Inbound" else 0))
            post_out_avail = out_avail + (rebalance_workers if transfer_to == "Outbound" else (-rebalance_workers if transfer_from == "Outbound" else 0))
            
            post_in_time = round(in_p['forecasted_stock'] / (post_in_avail * in_p['processing_rate_per_worker']), 2) if post_in_avail > 0 else 999.0
            post_out_time = round(out_p['forecasted_stock'] / (post_out_avail * out_p['processing_rate_per_worker']), 2) if post_out_avail > 0 else 999.0
            
            # Status
            if net_gap >= 5 or in_p['status'] == "Critical" or out_p['status'] == "Critical":
                day_status = "Critical"
                critical_alert_count += 1
            elif net_gap > 0 or in_p['status'] == "Warning" or out_p['status'] == "Warning":
                day_status = "Warning"
                warning_alert_count += 1
            else:
                day_status = "Optimal"
                
            daily_optimizations.append({
                "date": d,
                "inbound_stock": in_p['forecasted_stock'],
                "outbound_stock": out_p['forecasted_stock'],
                "inbound_required": in_req,
                "inbound_available": in_avail,
                "inbound_gap": in_gap,
                "outbound_required": out_req,
                "outbound_available": out_avail,
                "outbound_gap": out_gap,
                "total_required": total_req,
                "total_available": total_avail,
                "net_gap": net_gap,
                "status": day_status,
                "rebalance_action": rebalance_action,
                "transfer_from": transfer_from,
                "transfer_to": transfer_to,
                "transfer_workers": rebalance_workers,
                "post_inbound_time": post_in_time,
                "post_outbound_time": post_out_time,
                "target_shift_hours": in_p['target_shift_hours']
            })
            
        # Synthesize top actionable recommendations
        if daily_optimizations:
            # 1. Look for peak shortage days
            max_shortage_day = max(daily_optimizations, key=lambda x: x['net_gap'])
            if max_shortage_day['net_gap'] > 0:
                overall_recommendations.append({
                    "severity": "Critical" if max_shortage_day['net_gap'] >= 4 else "Warning",
                    "title": f"Hub Workforce Shortage on {max_shortage_day['date']}",
                    "message": f"Projected workload exceeds total facility capacity by {max_shortage_day['net_gap']} workers. Expected combined volume is {max_shortage_day['inbound_stock'] + max_shortage_day['outbound_stock']:,} packages.",
                    "action": f"Call in {max_shortage_day['net_gap']} flexible/on-call staff or approve 1.5h overtime for scheduled shifts."
                })
            
            # 2. Check for rebalancing opportunities
            rebalance_days = [d for d in daily_optimizations if d['transfer_workers'] > 0]
            if rebalance_days:
                sample_day = rebalance_days[0]
                overall_recommendations.append({
                    "severity": "Warning",
                    "title": f"Cross-Dock Labor Redistribution Opportunity ({len(rebalance_days)} days)",
                    "message": f"Cross-functional balancing can resolve bottlenecks on {sample_day['date']} without additional hiring.",
                    "action": f"{sample_day['rebalance_action']} to optimize throughput across shifts."
                })
            else:
                overall_recommendations.append({
                    "severity": "Normal",
                    "title": "Facility Load Balance Stable",
                    "message": "Inbound and Outbound shift allocations are well-synchronized with forecasted package volumes.",
                    "action": "Maintain standard shift roster."
                })
                
            # 3. Workload trend observation
            avg_in = sum(d['inbound_stock'] for d in daily_optimizations) / len(daily_optimizations)
            avg_out = sum(d['outbound_stock'] for d in daily_optimizations) / len(daily_optimizations)
            overall_recommendations.append({
                "severity": "Normal",
                "title": "Multi-Day Volume Projection",
                "message": f"Average daily projection is {int(avg_in):,} Inbound packages and {int(avg_out):,} Outbound packages.",
                "action": "Review dock bay staging for high-volume delivery cycles."
            })
            
        return {
            "daily_optimizations": daily_optimizations,
            "overall_recommendations": overall_recommendations,
            "summary": {
                "total_future_days": len(daily_optimizations),
                "critical_days": critical_alert_count,
                "warning_days": warning_alert_count,
                "optimal_days": len(daily_optimizations) - critical_alert_count - warning_alert_count
            }
        }
