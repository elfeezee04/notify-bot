import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Send, Clock, CheckCircle } from "lucide-react";

interface StatsProps {
  total: number;
  sent: number;
  pending: number;
  failed: number;
}

export default function DashboardStats({ total, sent, pending, failed }: StatsProps) {
  const stats = [
    {
      title: "Total Results",
      value: total,
      icon: FileText,
      gradient: "from-blue-500 to-purple-600",
    },
    {
      title: "Sent",
      value: sent,
      icon: CheckCircle,
      gradient: "from-green-500 to-emerald-600",
    },
    {
      title: "Pending",
      value: pending,
      icon: Clock,
      gradient: "from-amber-500 to-orange-600",
    },
    {
      title: "Failed",
      value: failed,
      icon: Send,
      gradient: "from-red-500 to-pink-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden transition-all hover:shadow-lg">
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
