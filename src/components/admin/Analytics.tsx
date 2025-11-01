import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, FileText, Download, CheckCircle, DollarSign } from "lucide-react";

const Analytics = () => {
  const [stats, setStats] = useState({
    totalCVs: 0,
    totalDownloads: 0,
    totalShortlisted: 0,
    totalHired: 0,
    totalRevenue: 0,
    cvsByStatus: [] as any[],
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [cvsResult, shortlistedResult, hiredResult, billingResult] = await Promise.all([
        supabase.from("cv_uploads").select("status", { count: "exact" }),
        supabase.from("cv_uploads").select("*", { count: "exact" }).eq("status", "shortlisted"),
        supabase.from("cv_uploads").select("*", { count: "exact" }).eq("status", "hired"),
        supabase.from("billing").select("hiring_fee"),
      ]);

      const statusCounts = cvsResult.data?.reduce((acc: any, cv) => {
        acc[cv.status] = (acc[cv.status] || 0) + 1;
        return acc;
      }, {});

      const totalRevenue = billingResult.data?.reduce((sum, bill) => sum + Number(bill.hiring_fee), 0) || 0;

      setStats({
        totalCVs: cvsResult.count || 0,
        totalDownloads: 0,
        totalShortlisted: shortlistedResult.count || 0,
        totalHired: hiredResult.count || 0,
        totalRevenue,
        cvsByStatus: Object.entries(statusCounts || {}).map(([status, count]) => ({
          status,
          count,
        })),
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total CVs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCVs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShortlisted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hired</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHired}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CV Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.cvsByStatus.map((item) => (
              <div key={item.status} className="flex justify-between items-center">
                <span className="capitalize">{item.status}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
