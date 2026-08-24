import { RFQItem, Supplier } from '../../types';

export const procurementService = {
  async createRfq(rfqData: any, rfqItems: RFQItem[]) {
    const res = await fetch('/api/rfqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...rfqData, items: rfqItems })
    });
    return res.json();
  },
  async getPurchaseOrders() {
    const res = await fetch('/api/purchase-orders');
    return res.json();
  },
  async createPurchaseOrder(poData: any) {
    const res = await fetch('/api/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(poData)
    });
    return res.json();
  },
  async getRfqs() {
    const res = await fetch('/api/rfqs');
    return res.json();
  },
  async getGateEntries() {
    const res = await fetch('/api/gate-entries');
    return res.json();
  },
  async getReelInwards(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const url = `/api/reel-inwards${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url);
    return res.json();
  },
  async getReelInwardById(id: string) {
    const res = await fetch(`/api/reel-inwards?id=${id}`);
    return res.json();
  },
  async createReelInward(data: any) {
    const res = await fetch('/api/reel-inwards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async updateReelInward(id: string, data: any) {
    const res = await fetch(`/api/reel-inwards?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async deleteReelInward(id: string) {
    const res = await fetch(`/api/reel-inwards?id=${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },
  async getQualityChecks() {
    const res = await fetch('/api/quality-checks');
    return res.json();
  },
  async createQualityCheck(qcData: any) {
    const res = await fetch('/api/quality-checks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qcData)
    });
    return res.json();
  }
};
