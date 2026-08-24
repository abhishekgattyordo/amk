import React from "react";
import AppClient from "../AppClient";
import { ModuleType } from "../../types";

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return [
    { tab: 'dashboard' },
    { tab: 'inventory_categories' },
    { tab: 'inventory_suppliers' },
    { tab: 'inventory_warehouses' },
    { tab: 'inventory_transactions' },
    { tab: 'inventory_stock' },
    { tab: 'procurement' },
    { tab: 'procurement_dashboard' },
    { tab: 'procurement_rfq' },
    { tab: 'procurement_quotes' },
    { tab: 'procurement_po' },
    { tab: 'procurement_gate_entry' },
    { tab: 'procurement_reel_inward' },
    { tab: 'procurement_inward' },
    { tab: 'procurement_qc' },
    { tab: 'production' },
    { tab: 'sales' },
    { tab: 'accounts' },
    { tab: 'reports' },
    { tab: 'settings' },
    { tab: 'user_management' },
    { tab: 'recycle_bin' },
  ];
}

interface PageProps {
  params: Promise<{ tab: string }>;
}

export default async function TabPage({ params }: PageProps) {
  const resolvedParams = await params;
  const rawTab = (resolvedParams?.tab || 'dashboard') as ModuleType;

  return <AppClient initialModule={rawTab} />;
}


