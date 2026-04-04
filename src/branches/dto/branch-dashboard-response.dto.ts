export class BranchMetricDto {
  branchId: string;
  branchName: string;
  orders: number;
  revenue: number;
  avgTicket: number;
  completionRate: number;
  onTimeRate: number;
  status: 'excellent' | 'good' | 'warning';
}

export class BranchAlertDto {
  id: string;
  branchId: string;
  branchName: string;
  level: 'info' | 'warn' | 'danger';
  title: string;
  detail: string;
}

export class BranchDashboardResponseDto {
  global: {
    totalBranches: number;
    totalOrders: number;
    totalRevenue: number;
    avgTicket: number;
    bestBranchId: string | null;
    lowestBranchId: string | null;
  };
  branches: BranchMetricDto[];
  alerts: BranchAlertDto[];
}

export class SingleBranchDashboardResponseDto {
  branchId: string;
  branchName: string;
  kpis: {
    ordersToday: number;
    revenueToday: number;
    avgTicket: number;
    activeStaff: number;
    completionRate: number;
    onTimeRate: number;
    cancellationRate: number;
  };
  weeklyTrend: {
    day: string;
    date: string;
    orders: number;
    revenue: number;
  }[];
  recentOrders: {
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
  }[];
}
