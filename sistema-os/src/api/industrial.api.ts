import { api } from "@/lib/api";

export const industrialApi = {
  async dashboard() {
    const response = await api.get("/industrial/dashboard");
    return response.data?.data ?? response.data;
  },

  async serviceOrders() {
    const response = await api.get("/industrial/service-orders");
    return response.data?.data ?? response.data;
  },

  async stock() {
    const response = await api.get("/industrial/stock");
    return response.data?.data ?? response.data;
  },

  async pcpPlans() {
    const response = await api.get("/industrial/pcp/plans");
    return response.data?.data ?? response.data;
  },

  async moduleRows(moduleKey: string) {
    const response = await api.get(`/industrial/modules/${moduleKey}`);
    return response.data?.data ?? response.data;
  },

  async moveOrder(orderId: number, sector: string) {
    const response = await api.patch(`/industrial/service-orders/${orderId}/sector`, { sector });
    return response.data?.data ?? response.data;
  },
};
