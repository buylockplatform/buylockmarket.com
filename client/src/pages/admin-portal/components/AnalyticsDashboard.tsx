import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  BarChart3, 
  LineChart, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export default function AnalyticsDashboard() {
  const [filterPeriod, setFilterPeriod] = useState("month");

  const analyticsData = {
    growth: {
      userGrowth: { value: 12.5, trend: "up" },
      vendorGrowth: { value: 8.3, trend: "up" },
      revenueGrowth: { value: 15.7, trend: "up" },
      orderGrowth: { value: -2.1, trend: "down" }
    },
    engagement: {
      dailyActiveUsers: 3421,
      avgSessionDuration: "8.5 min",
      returnRate: 67,
      bounceRate: 23.5
    },
    revenue: {
      averageOrderValue: 32500,
      platformFee: 2293500,
      conversionRate: 3.2,
      totalTransactions: 8743
    },
    topCategories: [
      { name: "Electronics", revenue: 16054500, percentage: 35, color: "bg-blue-500" },
      { name: "Fashion", revenue: 12843600, percentage: 28, color: "bg-green-500" },
      { name: "Services", revenue: 10091400, percentage: 22, color: "bg-yellow-500" },
      { name: "Home & Kitchen", revenue: 6871500, percentage: 15, color: "bg-purple-500" }
    ]
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    return trend === "up" ? (
      <ArrowUpRight className="w-4 h-4 text-green-500" />
    ) : (
      <ArrowDownRight className="w-4 h-4 text-red-500" />
    );
  };

  const TrendText = ({ value, trend }: { value: number; trend: string }) => {
    const textColor = trend === "up" ? "text-green-600" : "text-red-600";
    const sign = trend === "up" ? "+" : "";
    return (
      <span className={`font-bold ${textColor} flex items-center`}>
        <TrendIcon trend={trend} />
        {sign}{value}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Platform Analytics</h3>
          <p className="text-gray-600">Detailed insights and performance metrics</p>
        </div>
        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Growth Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">User Growth</span>
                <TrendText value={analyticsData.growth.userGrowth.value} trend={analyticsData.growth.userGrowth.trend} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Vendor Growth</span>
                <TrendText value={analyticsData.growth.vendorGrowth.value} trend={analyticsData.growth.vendorGrowth.trend} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue Growth</span>
                <TrendText value={analyticsData.growth.revenueGrowth.value} trend={analyticsData.growth.revenueGrowth.trend} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order Growth</span>
                <TrendText value={Math.abs(analyticsData.growth.orderGrowth.value)} trend={analyticsData.growth.orderGrowth.trend} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              User Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Daily Active Users</span>
                <span className="font-semibold">{analyticsData.engagement.dailyActiveUsers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Session Duration</span>
                <span className="font-semibold">{analyticsData.engagement.avgSessionDuration}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Return Rate</span>
                <span className="font-semibold">{analyticsData.engagement.returnRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bounce Rate</span>
                <span className="font-semibold">{analyticsData.engagement.bounceRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Revenue Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Order Value</span>
                <span className="font-semibold">₦{analyticsData.revenue.averageOrderValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-semibold">₦{analyticsData.revenue.platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-semibold">{analyticsData.revenue.conversionRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Transactions</span>
                <span className="font-semibold">{analyticsData.revenue.totalTransactions.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="w-5 h-5 mr-2" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <LineChart className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <p className="text-gray-500 font-medium">Revenue Trend Chart</p>
                <p className="text-sm text-gray-400 mt-1">Interactive chart showing revenue over time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              User Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <p className="text-gray-500 font-medium">User Activity Chart</p>
                <p className="text-sm text-gray-400 mt-1">Daily and monthly user activity patterns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Revenue by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              {analyticsData.topCategories.map((category, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 ${category.color} rounded mr-3`}></div>
                    <span className="text-gray-600">{category.name} ({category.percentage}%)</span>
                  </div>
                  <span className="font-semibold">₦{category.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <div className="h-64 bg-gradient-to-br from-purple-50 to-pink-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                <p className="text-gray-500 font-medium">Category Distribution</p>
                <p className="text-sm text-gray-400 mt-1">Revenue breakdown by product categories</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Top Performing Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-green-700">Electronics category showing 35% revenue share</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-green-700">User growth rate increased by 12.5% this month</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-green-700">Return rate improved to 67% indicating user satisfaction</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-yellow-700">Order growth declined by 2.1% - investigate causes</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-yellow-700">Bounce rate at 23.5% - optimize landing pages</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-yellow-700">Conversion rate could be improved from current 3.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}