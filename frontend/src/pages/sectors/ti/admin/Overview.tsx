import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from "recharts";

function Metric({
  label,
  value,
  sub,
  variant,
}: {
  label: string;
  value: string;
  sub?: string;
  variant: "orange" | "blue" | "green" | "purple";
}) {
  return (
    <div className="metric-card" data-variant={variant}>
      <div className="text-xs/5 opacity-90">{label}</div>
      <div className="text-2xl font-extrabold mt-1 leading-none">{value}</div>
      {sub && <div className="text-[11px] opacity-85 mt-1">{sub}</div>}
    </div>
  );
}

const daily = Array.from({ length: 7 }).map((_, i) => ({
  day: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][i],
  abertos: Math.floor(Math.random() * 10) + 2,
}));
const weekly = Array.from({ length: 4 }).map((_, i) => ({
  semana: `S${i + 1}`,
  chamados: Math.floor(Math.random() * 40) + 10,
}));
const pieData = [
  { name: "Dentro SLA", value: 82 },
  { name: "Fora SLA", value: 18 },
];
const COLORS = ["#fa6400", "#334155"];

export default function Overview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric
          label="Chamados hoje"
          value="18"
          sub="(+12% vs ontem)"
          variant="orange"
        />
        <Metric
          label="Tempo médio de resposta"
          value="32 min"
          sub="Últimas 24h"
          variant="blue"
        />
        <Metric
          label="SLA (30h)"
          value="82%"
          sub="Dentro do acordo"
          variant="green"
        />
        <Metric
          label="Abertos agora"
          value="7"
          sub="em andamento"
          variant="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-surface rounded-xl p-4">
          <div className="font-semibold mb-2">Chamados por dia</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={daily}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="abertos"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card-surface rounded-xl p-4">
          <div className="font-semibold mb-2">Chamados por semana</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weekly}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis dataKey="semana" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Bar dataKey="chamados" fill="hsl(var(--primary))" radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-surface rounded-xl p-4">
          <div className="font-semibold mb-2">SLA</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={6}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card-surface rounded-xl p-4">
          <div className="font-semibold mb-2">Desempenho (mês)</div>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>
              Tempo médio de resolução:{" "}
              <span className="text-foreground font-medium">6h 12m</span>
            </li>
            <li>
              Primeira resposta:{" "}
              <span className="text-foreground font-medium">28m</span>
            </li>
            <li>
              Reaberturas:{" "}
              <span className="text-foreground font-medium">3%</span>
            </li>
            <li>
              Backlog: <span className="text-foreground font-medium">14</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
