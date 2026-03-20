import { MessageSquare, Users, FileText, ThumbsUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  totalSessions: number;
  activeUsers: number;
  totalDocuments: number;
  satisfactionRate: number;
}

const stats = [
  {
    key: "sessions",
    label: "Συνομιλίες",
    icon: MessageSquare,
    valueKey: "totalSessions" as const,
  },
  {
    key: "users",
    label: "Ενεργοί Χρήστες",
    icon: Users,
    valueKey: "activeUsers" as const,
  },
  {
    key: "documents",
    label: "Έγγραφα",
    icon: FileText,
    valueKey: "totalDocuments" as const,
  },
  {
    key: "satisfaction",
    label: "Βαθμολογία",
    icon: ThumbsUp,
    valueKey: "satisfactionRate" as const,
    suffix: "%",
  },
];

export function StatsCards(props: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {props[stat.valueKey].toLocaleString("el-GR")}
              {"suffix" in stat ? stat.suffix : ""}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
