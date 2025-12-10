"""
Package Routes - Admin endpoints for managing MLM activation packages
All admin endpoints require admin authentication
"""
from flask import Blueprint, request, jsonify
from services.package_service import PackageService
from utils.auth import token_required, admin_required
from utils.validators import validate_uuid
from utils.rate_limiter import limiter

package_bp = Blueprint('package', __name__, url_prefix='/api')


# ==================== ADMIN ENDPOINTS ====================

@package_bp.route('/admin/packages', methods=['GET'])
@token_required
@admin_required
def get_all_packages():
    """
    Get all packages (admin view - includes deleted packages)
    Query params: include_deleted (bool, default: false)
    """
    try:
        include_deleted = request.args.get('include_deleted', 'false').lower() == 'true'
        packages = PackageService.get_all_packages(include_deleted=include_deleted)

        return jsonify({
            'success': True,
            'data': packages,
            'count': len(packages)
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch packages'}), 500


@package_bp.route('/admin/packages/active', methods=['GET'])
@token_required
@admin_required
def get_active_packages_admin():
    """Get only active, non-deleted packages (admin view)"""
    try:
        packages = PackageService.get_active_packages()

        return jsonify({
            'success': True,
            'data': packages,
            'count': len(packages)
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch packages'}), 500


@package_bp.route('/admin/packages', methods=['POST'])
@limiter.limit("10 per minute")
@token_required
@admin_required
def create_package():
    """
    Create a new package

    Body:
    {
        "name": "Gold Package",
        "amount": 2500,
        "commission_percentage": 18,
        "description": "Premium package with higher commission"
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body required'}), 400

        # Required fields
        name = data.get('name')
        amount = data.get('amount')
        commission_percentage = data.get('commission_percentage')

        if not name:
            return jsonify({'error': 'Package name is required'}), 400
        if amount is None:
            return jsonify({'error': 'Amount is required'}), 400
        if commission_percentage is None:
            return jsonify({'error': 'Commission percentage is required'}), 400

        # Validate types
        try:
            amount = float(amount)
        except (ValueError, TypeError):
            return jsonify({'error': 'Amount must be a number'}), 400

        try:
            commission_percentage = float(commission_percentage)
        except (ValueError, TypeError):
            return jsonify({'error': 'Commission percentage must be a number'}), 400

        # Optional field
        description = data.get('description')

        # Create package
        package = PackageService.create_package(
            name=name,
            amount=amount,
            commission_percentage=commission_percentage,
            description=description
        )

        return jsonify({
            'success': True,
            'message': 'Package created successfully',
            'data': package
        }), 201

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to create package'}), 500


@package_bp.route('/admin/packages/<package_id>', methods=['GET'])
@token_required
@admin_required
def get_package(package_id):
    """Get a single package by ID"""
    try:
        is_valid, error = validate_uuid(package_id)
        if not is_valid:
            return jsonify({'error': error}), 400

        package = PackageService.get_package_by_id(package_id)

        if not package:
            return jsonify({'error': 'Package not found'}), 404

        # Get usage count
        usage_count = PackageService.get_package_usage_count(package_id)
        package['usage_count'] = usage_count

        return jsonify({
            'success': True,
            'data': package
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch package'}), 500


@package_bp.route('/admin/packages/<package_id>', methods=['PUT'])
@limiter.limit("10 per minute")
@token_required
@admin_required
def update_package(package_id):
    """
    Update a package

    Body (all fields optional):
    {
        "name": "Updated Name",
        "amount": 3000,
        "commission_percentage": 20,
        "description": "Updated description"
    }
    """
    try:
        is_valid, error = validate_uuid(package_id)
        if not is_valid:
            return jsonify({'error': error}), 400

        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body required'}), 400

        # Build update dict
        update_data = {}

        if 'name' in data:
            update_data['name'] = data['name']

        if 'amount' in data:
            try:
                update_data['amount'] = float(data['amount'])
            except (ValueError, TypeError):
                return jsonify({'error': 'Amount must be a number'}), 400

        if 'commission_percentage' in data:
            try:
                update_data['commission_percentage'] = float(data['commission_percentage'])
            except (ValueError, TypeError):
                return jsonify({'error': 'Commission percentage must be a number'}), 400

        if 'description' in data:
            update_data['description'] = data['description']

        if not update_data:
            return jsonify({'error': 'No fields to update'}), 400

        # Update package
        package = PackageService.update_package(package_id, update_data)

        if not package:
            return jsonify({'error': 'Package not found or deleted'}), 404

        return jsonify({
            'success': True,
            'message': 'Package updated successfully',
            'data': package
        }), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to update package'}), 500


@package_bp.route('/admin/packages/<package_id>', methods=['DELETE'])
@limiter.limit("5 per minute")
@token_required
@admin_required
def delete_package(package_id):
    """Soft delete a package (sets is_deleted = true)"""
    try:
        is_valid, error = validate_uuid(package_id)
        if not is_valid:
            return jsonify({'error': error}), 400

        success = PackageService.soft_delete_package(package_id)

        if not success:
            return jsonify({'error': 'Package not found or already deleted'}), 404

        return jsonify({
            'success': True,
            'message': 'Package deleted successfully'
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to delete package'}), 500


@package_bp.route('/admin/packages/<package_id>/toggle', methods=['PATCH'])
@limiter.limit("10 per minute")
@token_required
@admin_required
def toggle_package_status(package_id):
    """Toggle the is_active status of a package"""
    try:
        is_valid, error = validate_uuid(package_id)
        if not is_valid:
            return jsonify({'error': error}), 400

        package = PackageService.toggle_package_status(package_id)

        if not package:
            return jsonify({'error': 'Package not found or deleted'}), 404

        status = 'activated' if package['is_active'] else 'deactivated'

        return jsonify({
            'success': True,
            'message': f'Package {status} successfully',
            'data': package
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to toggle package status'}), 500


# ==================== PUBLIC/USER ENDPOINTS ====================

@package_bp.route('/packages', methods=['GET'])
@token_required
def get_packages_for_user():
    """Get active packages for user activation selection"""
    try:
        packages = PackageService.get_active_packages()

        return jsonify({
            'success': True,
            'data': packages,
            'count': len(packages)
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch packages'}), 500
