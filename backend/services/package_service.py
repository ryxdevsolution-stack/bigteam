"""
Package Service - Business Logic for MLM Activation Packages
Handles CRUD operations for packages with different amounts and commission percentages
"""
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional
from utils.db import get_db_connection, return_db_connection


class PackageService:
    """
    Package Service for managing MLM activation packages

    Each package defines:
    - name: Package name (e.g., "Bronze", "Silver", "Gold")
    - amount: Activation amount in INR
    - commission_percentage: Commission % for uplines (e.g., 15.00 for 15%)
    - description: Optional description
    - is_active: Whether package is available for new activations
    - is_deleted: Soft delete flag (packages with purchases cannot be hard deleted)
    """

    @staticmethod
    def create_package(name: str, amount: float, commission_percentage: float, description: str = None) -> Dict:
        """
        Create a new package

        Args:
            name: Package name (max 100 chars)
            amount: Activation amount (positive number)
            commission_percentage: Commission percentage (0-100)
            description: Optional description

        Returns:
            Created package dict with id
        """
        # Validation
        if not name or len(name.strip()) == 0:
            raise ValueError("Package name is required")
        if len(name) > 100:
            raise ValueError("Package name must be 100 characters or less")
        if amount <= 0:
            raise ValueError("Amount must be a positive number")
        if commission_percentage < 0 or commission_percentage > 100:
            raise ValueError("Commission percentage must be between 0 and 100")

        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO packages (name, amount, commission_percentage, description)
                VALUES (%s, %s, %s, %s)
                RETURNING id, name, amount, commission_percentage, description, is_active, is_deleted, created_at, updated_at
            """, (name.strip(), amount, commission_percentage, description))

            row = cur.fetchone()
            conn.commit()
            cur.close()

            return {
                'id': str(row[0]),
                'name': row[1],
                'amount': float(row[2]),
                'commission_percentage': float(row[3]),
                'description': row[4],
                'is_active': row[5],
                'is_deleted': row[6],
                'created_at': row[7].isoformat() if row[7] else None,
                'updated_at': row[8].isoformat() if row[8] else None
            }
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_all_packages(include_deleted: bool = False) -> List[Dict]:
        """
        Get all packages

        Args:
            include_deleted: If True, includes soft-deleted packages (for admin view)

        Returns:
            List of package dicts
        """
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            if include_deleted:
                cur.execute("""
                    SELECT id, name, amount, commission_percentage, description, is_active, is_deleted, created_at, updated_at
                    FROM packages
                    ORDER BY amount ASC, created_at DESC
                """)
            else:
                cur.execute("""
                    SELECT id, name, amount, commission_percentage, description, is_active, is_deleted, created_at, updated_at
                    FROM packages
                    WHERE is_deleted = false
                    ORDER BY amount ASC, created_at DESC
                """)

            rows = cur.fetchall()
            cur.close()

            packages = []
            for row in rows:
                packages.append({
                    'id': str(row[0]),
                    'name': row[1],
                    'amount': float(row[2]),
                    'commission_percentage': float(row[3]),
                    'description': row[4],
                    'is_active': row[5],
                    'is_deleted': row[6],
                    'created_at': row[7].isoformat() if row[7] else None,
                    'updated_at': row[8].isoformat() if row[8] else None
                })

            return packages
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_active_packages() -> List[Dict]:
        """
        Get only active, non-deleted packages (for user activation selection)

        Returns:
            List of active package dicts
        """
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, name, amount, commission_percentage, description, is_active, is_deleted, created_at, updated_at
                FROM packages
                WHERE is_active = true AND is_deleted = false
                ORDER BY amount ASC
            """)

            rows = cur.fetchall()
            cur.close()

            packages = []
            for row in rows:
                packages.append({
                    'id': str(row[0]),
                    'name': row[1],
                    'amount': float(row[2]),
                    'commission_percentage': float(row[3]),
                    'description': row[4],
                    'is_active': row[5],
                    'is_deleted': row[6],
                    'created_at': row[7].isoformat() if row[7] else None,
                    'updated_at': row[8].isoformat() if row[8] else None
                })

            return packages
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_package_by_id(package_id: str) -> Optional[Dict]:
        """
        Get a package by ID

        Args:
            package_id: UUID of the package

        Returns:
            Package dict or None if not found
        """
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, name, amount, commission_percentage, description, is_active, is_deleted, created_at, updated_at
                FROM packages
                WHERE id = %s
            """, (package_id,))

            row = cur.fetchone()
            cur.close()

            if not row:
                return None

            return {
                'id': str(row[0]),
                'name': row[1],
                'amount': float(row[2]),
                'commission_percentage': float(row[3]),
                'description': row[4],
                'is_active': row[5],
                'is_deleted': row[6],
                'created_at': row[7].isoformat() if row[7] else None,
                'updated_at': row[8].isoformat() if row[8] else None
            }
        finally:
            return_db_connection(conn)

    @staticmethod
    def update_package(package_id: str, data: Dict) -> Optional[Dict]:
        """
        Update a package

        Args:
            package_id: UUID of the package
            data: Dict with fields to update (name, amount, commission_percentage, description)

        Returns:
            Updated package dict or None if not found
        """
        # Validation
        if 'name' in data:
            if not data['name'] or len(data['name'].strip()) == 0:
                raise ValueError("Package name is required")
            if len(data['name']) > 100:
                raise ValueError("Package name must be 100 characters or less")

        if 'amount' in data:
            if data['amount'] <= 0:
                raise ValueError("Amount must be a positive number")

        if 'commission_percentage' in data:
            if data['commission_percentage'] < 0 or data['commission_percentage'] > 100:
                raise ValueError("Commission percentage must be between 0 and 100")

        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Build dynamic update query
            update_fields = []
            values = []

            if 'name' in data:
                update_fields.append("name = %s")
                values.append(data['name'].strip())

            if 'amount' in data:
                update_fields.append("amount = %s")
                values.append(data['amount'])

            if 'commission_percentage' in data:
                update_fields.append("commission_percentage = %s")
                values.append(data['commission_percentage'])

            if 'description' in data:
                update_fields.append("description = %s")
                values.append(data['description'])

            if not update_fields:
                return PackageService.get_package_by_id(package_id)

            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            values.append(package_id)

            query = f"""
                UPDATE packages
                SET {', '.join(update_fields)}
                WHERE id = %s AND is_deleted = false
                RETURNING id, name, amount, commission_percentage, description, is_active, is_deleted, created_at, updated_at
            """

            cur.execute(query, values)
            row = cur.fetchone()
            conn.commit()
            cur.close()

            if not row:
                return None

            return {
                'id': str(row[0]),
                'name': row[1],
                'amount': float(row[2]),
                'commission_percentage': float(row[3]),
                'description': row[4],
                'is_active': row[5],
                'is_deleted': row[6],
                'created_at': row[7].isoformat() if row[7] else None,
                'updated_at': row[8].isoformat() if row[8] else None
            }
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            return_db_connection(conn)

    @staticmethod
    def soft_delete_package(package_id: str) -> bool:
        """
        Soft delete a package (sets is_deleted = true)

        Args:
            package_id: UUID of the package

        Returns:
            True if deleted, False if not found
        """
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                UPDATE packages
                SET is_deleted = true, is_active = false, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND is_deleted = false
                RETURNING id
            """, (package_id,))

            row = cur.fetchone()
            conn.commit()
            cur.close()

            return row is not None
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            return_db_connection(conn)

    @staticmethod
    def toggle_package_status(package_id: str) -> Optional[Dict]:
        """
        Toggle the is_active status of a package

        Args:
            package_id: UUID of the package

        Returns:
            Updated package dict or None if not found
        """
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                UPDATE packages
                SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND is_deleted = false
                RETURNING id, name, amount, commission_percentage, description, is_active, is_deleted, created_at, updated_at
            """, (package_id,))

            row = cur.fetchone()
            conn.commit()
            cur.close()

            if not row:
                return None

            return {
                'id': str(row[0]),
                'name': row[1],
                'amount': float(row[2]),
                'commission_percentage': float(row[3]),
                'description': row[4],
                'is_active': row[5],
                'is_deleted': row[6],
                'created_at': row[7].isoformat() if row[7] else None,
                'updated_at': row[8].isoformat() if row[8] else None
            }
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_package_usage_count(package_id: str) -> int:
        """
        Get the number of purchases associated with a package

        Args:
            package_id: UUID of the package

        Returns:
            Count of purchases using this package
        """
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT COUNT(*) FROM purchases WHERE package_id = %s
            """, (package_id,))

            count = cur.fetchone()[0]
            cur.close()

            return count
        finally:
            return_db_connection(conn)
