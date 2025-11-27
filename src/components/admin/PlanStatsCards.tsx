import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Crown, TrendingUp, DollarSign } from "lucide-react";

interface PlanStats {
  totalUsers: number;
  freeUsers: number;
  starterUsers: number;
  professionalUsers: number;
  enterpriseUsers: number;
  totalInvoicesThisMonth: number;
}

interface PlanStatsCardsProps {
  stats: PlanStats;
}

export const PlanStatsCards = ({ stats }: PlanStatsCardsProps) => {
  const cards = [
    {
      title: "Total Utilizatori",
      value: stats.totalUsers,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Planuri Plătite",
      value: stats.starterUsers + stats.professionalUsers + stats.enterpriseUsers,
      icon: Crown,
      color: "text-accent",
      subtitle: `${stats.starterUsers} Starter, ${stats.professionalUsers} Pro, ${stats.enterpriseUsers} Enterprise`,
    },
    {
      title: "Utilizatori Free",
      value: stats.freeUsers,
      icon: Users,
      color: "text-muted-foreground",
    },
    {
      title: "Facturi Luna Asta",
      value: stats.totalInvoicesThisMonth,
      icon: TrendingUp,
      color: "text-success",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
