from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.store.api.permissions import IsStoreStaff
from apps.store.services.report_service import (
    branch_sales_report,
    inventory_report,
    low_stock_report,
    order_report,
    product_statistics,
    sales_report,
)
from apps.store.utils.csv_export import to_csv_response

SALES_CSV = "sales-report.csv"
ORDERS_CSV = "orders-report.csv"
PRODUCTS_CSV = "products-report.csv"
INVENTORY_CSV = "inventory-report.csv"
LOW_STOCK_CSV = "low-stock-report.csv"
BRANCH_SALES_CSV = "branch-sales-report.csv"


class AdminProductStatisticsView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]

    def get(self, request, *args, **kwargs):
        data = product_statistics()
        if request.query_params.get("export") == "csv":
            rows = []
            for cat in data["by_category"]:
                rows.append({
                    "category": cat["name"],
                    "total": cat["total_products"],
                    "active": cat["active_products"],
                    "archived": cat["archived_products"],
                })
            return to_csv_response(rows, PRODUCTS_CSV)
        return Response(data)


class AdminInventoryReportView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]

    def get(self, request, *args, **kwargs):
        branch_id = request.query_params.get("branch_id")
        data = inventory_report(branch_id=branch_id)
        if request.query_params.get("export") == "csv":
            return to_csv_response(data, INVENTORY_CSV)
        return Response(data)


class AdminLowStockReportView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]

    def get(self, request, *args, **kwargs):
        data = low_stock_report()
        if request.query_params.get("export") == "csv":
            return to_csv_response(data, LOW_STOCK_CSV)
        return Response(data)


class AdminSalesReportView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]

    def get(self, request, *args, **kwargs):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        branch_id = request.query_params.get("branch_id")
        group_by = request.query_params.get("group_by", "day")
        data = sales_report(
            start_date=start_date,
            end_date=end_date,
            branch_id=branch_id,
            group_by=group_by,
        )
        if request.query_params.get("export") == "csv":
            return to_csv_response(data, SALES_CSV)
        return Response(data)


class AdminOrderReportView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]

    def get(self, request, *args, **kwargs):
        status = request.query_params.get("status")
        branch_id = request.query_params.get("branch_id")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        group_by = request.query_params.get("group_by", "day")
        data = order_report(
            status=status,
            branch_id=branch_id,
            start_date=start_date,
            end_date=end_date,
            group_by=group_by,
        )
        if request.query_params.get("export") == "csv":
            return to_csv_response(data, ORDERS_CSV)
        return Response(data)


class AdminBranchSalesReportView(generics.GenericAPIView):
    permission_classes = [IsStoreStaff]

    def get(self, request, *args, **kwargs):
        branch_id = request.query_params.get("branch_id")
        group_by = request.query_params.get("group_by", "month")
        data = branch_sales_report(
            branch_id=branch_id,
            group_by=group_by,
        )
        if request.query_params.get("export") == "csv":
            return to_csv_response(data, BRANCH_SALES_CSV)
        return Response(data)
