import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CircleHelp,
  Clock3,
  Filter,
  Gauge,
  Layers3,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/metricas")({
  head: () => ({
    meta: [
      { title: "Métricas Ágeis — Livro em Ação" },
      {
        name: "description",
        content: "Visão corporativa demonstrativa de métricas ágeis, portfólio e equipes.",
      },
    ],
  }),
  component: AgileMetricsDashboard,
});

type Audience = "executivo" | "equipe";
type ProjectStatus = "Saudável" | "Atenção" | "Crítico";

const projects: {
  name: string;
  team: string;
  owner: string;
  progress: number;
  predictability: number;
  status: ProjectStatus;
  sprint: string;
  blockers: number;
}[] = [
  {
    name: "Portal do Cliente",
    team: "Squad Atlas",
    owner: "Mariana Costa",
    progress: 78,
    predictability: 92,
    status: "Saudável",
    sprint: "Sprint 18",
    blockers: 1,
  },
  {
    name: "Modernização de Dados",
    team: "Squad Orion",
    owner: "Rafael Lima",
    progress: 54,
    predictability: 71,
    status: "Atenção",
    sprint: "Sprint 12",
    blockers: 3,
  },
  {
    name: "Jornada de Pagamentos",
    team: "Squad Vega",
    owner: "Camila Souza",
    progress: 36,
    predictability: 58,
    status: "Crítico",
    sprint: "Sprint 09",
    blockers: 5,
  },
  {
    name: "Experiência Mobile",
    team: "Squad Atlas",
    owner: "Pedro Alves",
    progress: 84,
    predictability: 88,
    status: "Saudável",
    sprint: "Sprint 21",
    blockers: 0,
  },
];

const deliveryTrend = [
  { period: "Sem 1", planned: 34, delivered: 30, throughput: 28 },
  { period: "Sem 2", planned: 38, delivered: 35, throughput: 32 },
  { period: "Sem 3", planned: 36, delivered: 31, throughput: 30 },
  { period: "Sem 4", planned: 42, delivered: 39, throughput: 36 },
  { period: "Sem 5", planned: 40, delivered: 37, throughput: 34 },
  { period: "Sem 6", planned: 44, delivered: 41, throughput: 39 },
];

const cycleTime = [
  { period: "Jan", days: 8.4 },
  { period: "Fev", days: 7.8 },
  { period: "Mar", days: 7.1 },
  { period: "Abr", days: 6.9 },
  { period: "Mai", days: 6.2 },
  { period: "Jun", days: 5.6 },
];

const teamVelocity = [
  { team: "Atlas", committed: 42, completed: 39 },
  { team: "Orion", committed: 38, completed: 27 },
  { team: "Vega", committed: 35, completed: 21 },
  { team: "Lumen", committed: 31, completed: 29 },
];

const blockers = [
  { title: "Dependência da API de pagamentos", project: "Jornada de Pagamentos", age: "4 dias", severity: "Alta" },
  { title: "Ambiente de homologação instável", project: "Modernização de Dados", age: "3 dias", severity: "Alta" },
  { title: "Critérios de aceite pendentes", project: "Portal do Cliente", age: "1 dia", severity: "Média" },
];

function StatusBadge({ status }: { status: ProjectStatus }) {
  const classes: Record<ProjectStatus, string> = {
    Saudável: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Atenção: "border-amber-200 bg-amber-50 text-amber-700",
    Crítico: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <Badge variant="outline" className={classes[status]}>
      <span className="mr-1.5 size-1.5 rounded-full bg-current" />
      {status}
    </Badge>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  trend,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  trend?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const iconTone = {
    default: "bg-slate-100 text-slate-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    success: "bg-emerald-100 text-emerald-700",
  }[tone];

  return (
    <article className="card-surface min-w-0 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconTone}`}>
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {trend && (
          <span className={tone === "danger" ? "flex items-center gap-1 font-semibold text-rose-600" : "flex items-center gap-1 font-semibold text-emerald-700"}>
            {tone === "danger" ? <ArrowDownRight className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
            {trend}
          </span>
        )}
        <span>{detail}</span>
      </div>
    </article>
  );
}

function AgileMetricsDashboard() {
  const [audience, setAudience] = useState<Audience>("executivo");
  const [period, setPeriod] = useState("30");
  const [teamFilter, setTeamFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todos");

  const visibleProjects = useMemo(
    () =>
      projects.filter((project) => {
        const teamMatches = teamFilter === "todas" || project.team === teamFilter;
        const statusMatches = statusFilter === "todos" || project.status === statusFilter;
        return teamMatches && statusMatches;
      }),
    [teamFilter, statusFilter],
  );

  const healthyCount = projects.filter((project) => project.status === "Saudável").length;
  const attentionCount = projects.filter((project) => project.status === "Atenção").length;
  const criticalCount = projects.filter((project) => project.status === "Crítico").length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
              <BarChart3 className="mr-1 size-3.5" /> Centro de métricas
            </Badge>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
              <CircleHelp className="size-3.5" /> Ambiente demonstrativo
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Métricas ágeis</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Acompanhe a saúde do portfólio, a previsibilidade das entregas e os impedimentos das equipes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[155px] bg-card">
              <CalendarDays className="mr-2 size-4 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setTeamFilter("todas"); setStatusFilter("todos"); }}>
            <Filter className="mr-2 size-4" /> Limpar filtros
          </Button>
        </div>
      </section>

      <section className="card-surface flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold">Perspectiva do dashboard</p>
          <p className="mt-1 text-xs text-muted-foreground">Alterne entre visão estratégica e acompanhamento operacional.</p>
        </div>
        <div className="inline-flex w-full rounded-xl bg-muted p-1 sm:w-auto">
          <button
            type="button"
            onClick={() => setAudience("executivo")}
            aria-pressed={audience === "executivo"}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition sm:flex-none ${audience === "executivo" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Gauge className="size-4" /> Visão executiva
          </button>
          <button
            type="button"
            onClick={() => setAudience("equipe")}
            aria-pressed={audience === "equipe"}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition sm:flex-none ${audience === "equipe" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Users className="size-4" /> Visão das equipes
          </button>
        </div>
      </section>

      {audience === "executivo" ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Projetos ativos" value="12" detail="em 4 áreas de negócio" icon={Layers3} trend="+2" />
            <MetricCard label="Saúde do portfólio" value="83%" detail="índice demonstrativo" icon={Activity} tone="success" trend="+5,2%" />
            <MetricCard label="Previsibilidade" value="76%" detail="entregas concluídas / planejadas" icon={Target} tone="warning" trend="+3,1%" />
            <MetricCard label="Projetos críticos" value="2" detail="requerem plano de ação" icon={AlertTriangle} tone="danger" trend="+1" />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <article className="card-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">Planejado × entregue</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Itens de trabalho por semana · dados fictícios</p>
                </div>
                <Badge variant="secondary">Últimos {period} dias</Badge>
              </div>
              <div className="mt-5 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={deliveryTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Bar dataKey="planned" name="Planejado" fill="#CBD5E1" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="delivered" name="Entregue" fill="#0F766E" radius={[5, 5, 0, 0]} />
                    <Line type="monotone" dataKey="throughput" name="Throughput" stroke="#D97706" strokeWidth={2.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="card-surface p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">Saúde dos projetos</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Distribuição atual do portfólio</p>
                </div>
                <Activity className="size-5 text-muted-foreground" />
              </div>
              <div className="mt-6 space-y-5">
                {[
                  { label: "Saudável", count: healthyCount, total: projects.length, color: "bg-emerald-500", text: "text-emerald-700" },
                  { label: "Atenção", count: attentionCount, total: projects.length, color: "bg-amber-500", text: "text-amber-700" },
                  { label: "Crítico", count: criticalCount, total: projects.length, color: "bg-rose-500", text: "text-rose-700" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className={`font-semibold ${item.text}`}>{item.count} de {item.total}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.count / item.total) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-7 rounded-xl bg-muted/70 p-4">
                <p className="text-sm font-medium">Ponto de atenção</p>
                <p className="mt-1 text-sm text-muted-foreground">A Jornada de Pagamentos tem 5 impedimentos abertos e previsibilidade abaixo da meta demonstrativa de 70%.</p>
              </div>
            </article>
          </section>
        </>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Velocidade média" value="34 pts" detail="por sprint concluída" icon={Workflow} trend="+4,5%" tone="success" />
            <MetricCard label="Cycle time médio" value="6,2 dias" detail="do início à conclusão" icon={Clock3} trend="-0,8 dia" tone="success" />
            <MetricCard label="Throughput" value="39 itens" detail="na última sprint" icon={BarChart3} trend="+8,3%" tone="success" />
            <MetricCard label="Impedimentos abertos" value="9" detail="3 acima do limite de atenção" icon={AlertTriangle} tone="warning" />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="card-surface p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold">Compromisso × conclusão por squad</h2>
              <p className="mt-1 text-sm text-muted-foreground">Pontos planejados e concluídos por sprint</p>
              <div className="mt-5 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamVelocity} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="team" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Bar dataKey="committed" name="Comprometido" fill="#CBD5E1" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="completed" name="Concluído" fill="#0F766E" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Velocidade é mais útil para observar tendências dentro da mesma equipe, não para comparar produtividade individual.</p>
            </article>

            <article className="card-surface p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold">Tendência de cycle time</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tempo médio de ciclo nos últimos meses</p>
              <div className="mt-5 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cycleTime} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cycleFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0F766E" stopOpacity={0.24} />
                        <stop offset="95%" stopColor="#0F766E" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} unit=" d" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                    <Area type="monotone" dataKey="days" name="Cycle time" stroke="#0F766E" strokeWidth={2.5} fill="url(#cycleFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className="card-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Impedimentos que exigem atenção</h2>
                <p className="mt-1 text-sm text-muted-foreground">Exemplos para demonstrar o acompanhamento operacional</p>
              </div>
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">3 prioritários</Badge>
            </div>
            <div className="mt-4 divide-y divide-border">
              {blockers.map((blocker) => (
                <div key={blocker.title} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                      <AlertTriangle className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{blocker.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{blocker.project} · Aberto há {blocker.age}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={blocker.severity === "Alta" ? "w-fit border-rose-200 bg-rose-50 text-rose-700" : "w-fit border-amber-200 bg-amber-50 text-amber-700"}>{blocker.severity}</Badge>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="card-surface overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <h2 className="font-display text-lg font-semibold">{audience === "executivo" ? "Projetos do portfólio" : "Projetos acompanhados"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Indicadores de exemplo para validar o fluxo e a hierarquia visual.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-[160px] bg-card">
                <SelectValue placeholder="Todas as squads" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as squads</SelectItem>
                <SelectItem value="Squad Atlas">Squad Atlas</SelectItem>
                <SelectItem value="Squad Orion">Squad Orion</SelectItem>
                <SelectItem value="Squad Vega">Squad Vega</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[145px] bg-card">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="Saudável">Saudável</SelectItem>
                <SelectItem value="Atenção">Atenção</SelectItem>
                <SelectItem value="Crítico">Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Projeto / Squad</th>
                <th className="px-5 py-3 font-medium">Responsável</th>
                <th className="px-5 py-3 font-medium">Progresso</th>
                <th className="px-5 py-3 font-medium">Previsibilidade</th>
                <th className="px-5 py-3 font-medium">Impedimentos</th>
                <th className="px-5 py-3 font-medium">Saúde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleProjects.map((project) => (
                <tr key={project.name} className="transition-colors hover:bg-muted/30">
                  <td className="px-5 py-4">
                    <p className="font-semibold">{project.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{project.team} · {project.sprint}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{project.owner}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-teal-700" style={{ width: `${project.progress}%` }} />
                      </div>
                      <span className="text-xs tabular-nums">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium tabular-nums">{project.predictability}%</td>
                  <td className="px-5 py-4">
                    <span className={project.blockers > 2 ? "font-semibold text-rose-600" : "text-muted-foreground"}>{project.blockers}</span>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={project.status} /></td>
                </tr>
              ))}
              {visibleProjects.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum projeto corresponde aos filtros selecionados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3 text-xs text-muted-foreground">
          <span>Exibindo {visibleProjects.length} de {projects.length} projetos demonstrativos</span>
          <span className="inline-flex items-center gap-1"><CircleHelp className="size-3.5" /> Os dados não representam resultados reais</span>
        </div>
      </section>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Nota metodológica: saúde, previsibilidade e metas nesta tela são exemplos para prototipação. Na próxima etapa, definiremos fórmulas, fontes, periodicidade e permissões antes de conectar dados reais.
      </p>
    </div>
  );
}
