"""
Activation History Service - JSONB-based activation history analytics
Provides methods to query and analyze user activation patterns
"""
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from utils.db import get_db_connection, return_db_connection


class ActivationHistoryService:
    """Service for querying activation history stored in JSONB"""

    @staticmethod
    def get_user_activation_history(user_id: str) -> Dict:
        """
        Get complete activation history for a user

        Returns:
        {
            "activations": [...],
            "statistics": {...},
            "current_status": {...}
        }
        """
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Get user with activation history
            cur.execute("""
                SELECT
                    u.username,
                    u.email,
                    u.is_mlm_active,
                    u.commission_received_count,
                    u.activation_date,
                    u.sponsored_by,
                    u.total_earnings,
                    u.activation_history,
                    mc.position as current_position
                FROM users u
                LEFT JOIN mlm_chain mc ON u.id = mc.user_id AND mc.is_active = true
                WHERE u.id = %s
            """, (user_id,))

            row = cur.fetchone()
            cur.close()

            if not row:
                return {"error": "User not found"}

            username, email, is_active, commission_count, activation_date, sponsored_by, total_earnings, activation_history, current_position = row

            # Parse JSONB activation history
            history = activation_history or {"activations": [], "statistics": {}}

            return {
                "user": {
                    "username": username,
                    "email": email,
                    "is_active": is_active,
                    "commission_count": commission_count,
                    "current_position": current_position,
                    "total_earnings": float(total_earnings) if total_earnings else 0,
                    "activation_date": activation_date.isoformat() if activation_date else None,
                    "sponsored_by": str(sponsored_by) if sponsored_by else None
                },
                "activation_history": history.get("activations", []),
                "statistics": history.get("statistics", {}),
                "summary": {
                    "total_activations": len(history.get("activations", [])) + (1 if is_active else 0),
                    "currently_active": is_active,
                    "lifetime_earnings": float(total_earnings) if total_earnings else 0
                }
            }

        except Exception as e:
            print(f"[ERROR] Failed to get activation history: {e}")
            import traceback
            traceback.print_exc()
            return {"error": "Failed to fetch activation history"}
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_reactivation_stats() -> Dict:
        """
        Get platform-wide reactivation statistics

        Returns counts of users by activation frequency
        """
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Get reactivation statistics
            cur.execute("""
                SELECT
                    jsonb_array_length(activation_history->'activations') + 1 as activation_count,
                    COUNT(*) as user_count
                FROM users
                WHERE activation_history IS NOT NULL
                AND jsonb_array_length(activation_history->'activations') >= 0
                GROUP BY activation_count
                ORDER BY activation_count
            """)

            rows = cur.fetchall()

            # Get users who reactivated most
            cur.execute("""
                SELECT
                    u.username,
                    u.email,
                    jsonb_array_length(u.activation_history->'activations') + 1 as total_activations,
                    u.total_earnings
                FROM users u
                WHERE u.activation_history IS NOT NULL
                AND jsonb_array_length(u.activation_history->'activations') > 0
                ORDER BY total_activations DESC
                LIMIT 10
            """)

            top_reactivators = cur.fetchall()

            # Get average days active
            cur.execute("""
                SELECT
                    AVG((elem->>'days_active')::integer) as avg_days_active,
                    SUM((elem->>'days_active')::integer) as total_days_active,
                    COUNT(*) as total_periods
                FROM users,
                     jsonb_array_elements(activation_history->'activations') as elem
                WHERE activation_history IS NOT NULL
            """)

            avg_row = cur.fetchone()

            cur.close()

            return {
                "activation_distribution": [
                    {
                        "activation_count": row[0],
                        "user_count": row[1]
                    }
                    for row in rows
                ],
                "top_reactivators": [
                    {
                        "username": row[0],
                        "email": row[1],
                        "total_activations": row[2],
                        "total_earnings": float(row[3]) if row[3] else 0
                    }
                    for row in top_reactivators
                ],
                "average_stats": {
                    "avg_days_active": round(float(avg_row[0]), 2) if avg_row[0] else 0,
                    "total_days_active": avg_row[1] if avg_row[1] else 0,
                    "total_activation_periods": avg_row[2] if avg_row[2] else 0
                }
            }

        except Exception as e:
            print(f"[ERROR] Failed to get reactivation stats: {e}")
            import traceback
            traceback.print_exc()
            return {"error": "Failed to fetch statistics"}
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_package_popularity() -> List[Dict]:
        """
        Get popularity of packages based on activation history
        """
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Count package usage from activation history
            cur.execute("""
                SELECT
                    elem->'package'->>'name' as package_name,
                    COUNT(*) as usage_count,
                    AVG((elem->'package'->>'amount')::numeric) as avg_amount
                FROM users,
                     jsonb_array_elements(activation_history->'activations') as elem
                WHERE activation_history IS NOT NULL
                AND elem->'package'->>'name' IS NOT NULL
                GROUP BY package_name
                ORDER BY usage_count DESC
            """)

            rows = cur.fetchall()
            cur.close()

            return [
                {
                    "package_name": row[0],
                    "usage_count": row[1],
                    "avg_amount": float(row[2]) if row[2] else 0
                }
                for row in rows
            ]

        except Exception as e:
            print(f"[ERROR] Failed to get package popularity: {e}")
            return []
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_activation_timeline(days: int = 30) -> List[Dict]:
        """
        Get activation timeline for the past N days
        """
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Validate days parameter to prevent SQL injection
            try:
                days = int(days)  # Ensure it's an integer
                if days < 1 or days > 365:
                    days = 30  # Default to 30 if out of range
            except (ValueError, TypeError):
                days = 30  # Safe fallback if conversion fails

            # Get activations from purchases table grouped by date
            # FIXED: Use date arithmetic instead of INTERVAL interpolation
            from datetime import timedelta
            cutoff_date = datetime.now() - timedelta(days=days)

            cur.execute("""
                SELECT
                    DATE(created_at) as activation_date,
                    COUNT(*) as activation_count,
                    SUM(CASE WHEN purchase_type = 'reactivation' THEN 1 ELSE 0 END) as reactivation_count,
                    SUM(amount) as total_amount
                FROM purchases
                WHERE purchase_type IN ('activation', 'reactivation')
                AND status = 'completed'
                AND created_at >= %s
                GROUP BY DATE(created_at)
                ORDER BY activation_date DESC
            """, (cutoff_date,))

            rows = cur.fetchall()
            cur.close()

            return [
                {
                    "date": row[0].isoformat() if row[0] else None,
                    "total_activations": row[1],
                    "reactivations": row[2],
                    "new_activations": row[1] - row[2],
                    "total_amount": float(row[3]) if row[3] else 0
                }
                for row in rows
            ]

        except Exception as e:
            print(f"[ERROR] Failed to get activation timeline: {e}")
            return []
        finally:
            return_db_connection(conn)
