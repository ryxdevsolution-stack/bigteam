import React from 'react';
interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    render?: (value: any, row: any) => React.ReactNode;
}
interface DataTableProps {
    columns: Column[];
    data: any[];
    title?: string;
    actions?: boolean;
    pagination?: boolean;
    itemsPerPage?: number;
}
declare const DataTable: React.FC<DataTableProps>;
export default DataTable;
