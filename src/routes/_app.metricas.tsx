import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, CheckCircle2, Clock3, Gauge, Layers3, RefreshCw, Target, TrendingUp, Zap } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_app/metricas")({
  head: () => ({ meta: [{ title: "Métricas Ágeis — Livro em Ação" }, { name: "description", content: "Visão executiva de fluxo, previsibilidade, qualidade e eficiência dos projetos ágeis." }] }),
  component: MetricasDashboard,
});

type Period = "30" | "90" | "180";
const flowData = [
  { week: "Sem 1", lead: 8.2, cycle: 5.1 }, { week: "Sem 2", lead: 7.6, cycle: 4.8 },
  { week: "Sem 3", lead: 8.8, cycle: 5.4 }, { week: "Sem 4", lead: 7.1, cycle: 4.6 },
  { week: "Sem 5", lead: 6.8, cycle: 4.3 }, { week: "Sem 6", lead: 6.4, cycle: 4.1 },
  { week: "Sem 7", lead: 5.9, cycle: 3.8 }, { week: "Sem 8", lead: 6.2, cycle: 3.9 },
];
const throughputData = [
  { week: "Sem 1", done: 18, planned: 20 }, { week: "Sem 2", done: 22, planned: 21 },
  { week: "Sem 3", done: 19, planned: 22 }, { week: "Sem 4", done: 24, planned: 23 },
  { week: "Sem 5", done: 25, planned: 24 }, { week: "Sem 6", done: 23, planned: 25 },
  { week: "Sem 7", done: 28, planned: 26 }, { week: "Sem 8", done: 27, planned: 27 },
];
const burndownData = [
  { day: "D1", ideal: 100, actual: 100 }, { day: "D3", ideal: 80, actual: 88 },
  { day: "D5", ideal: 60, actual: 68 }, { day: "D7", ideal: 40, actual: 46 },
  { day: "D9", ideal: 20, actual: 24 }, { day: "D10", ideal: 0, actual: 8 },
];
const projects = ["Todos os projetos", "Plataforma Digital", "Portal do Cliente", "App Mobile"];

function MetricasDashboard() {
  const [period, setPeriod] = useState<Period>("90");
  const [project, setProject] = useState("Todos os projetos");
  const factor = project === "Todos os projetos" ? 1 : project === "Plataforma Digital" ? 0.92 : project === "Portal do Cliente" ? 1.08 : 0.86;
  const scopedFlow = useMemo(() => {
    const rows = period === "30" ? flowData.slice(-4) : period === "90" ? flowData.slice(-6) : flowData;
    return rows.map((row) => ({ ...row, lead: Number((row.lead * factor).toFixed(1)), cycle: Number((row.cycle * factor).toFixed(1)) }));
  }, [period, factor]);
  const scopedThroughput = useMemo(() => {
    const rows = period === "30" ? throughputData.slice(-4) : period === "90" ? throughputData.slice(-6) : throughputData;
    return rows.map((row) => ({ ...row, done: Math.round(row.done * factor), planned: Math.round(row.planned * factor) }));
  }, [period, factor]);
  const scopeLabel = project === "Todos os projetos" ? "portfólio" : project;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50"><BarChart3 className="size-4" /></span>
            Centro de performance
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Métricas ágeis</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">Uma visão clara do fluxo de entrega, previsibilidade e qualidade do seu {scopeLabel}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm">
            <Layers3 className="size-4 text-slate-400" />
            <select aria-label="Filtrar projeto" value={project} onChange={(event) => setProject(event.target.value)} className="max-w-44 bg-transparent outline-none">
              {projects.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm">
            <CalendarDays className="size-4 text-slate-400" />
            <select aria-label="Filtrar período" value={period} onChange={(event) => setPeriod(event.target.value as Period)} className="bg-transparent outline-none">
              <option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="180">Últimos 6 meses</option>
            </select>
          </label>
          <button type="button" onClick={() => { setPeriod("90"); setProject("Todos os projetos"); }} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
            <RefreshCw className="size-4" /> Redefinir
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900">
        <span className="inline-flex items-center gap-2 font-semibold"><Activity className="size-4" /> Ambiente demonstrativo</span>
        <span className="text-blue-800/80">Indicadores fictícios para validar o layout. Ainda não representam dados reais dos projetos.</span>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Lead Time médio" value="6,2" unit="dias" change="-12,4%" note="tempo até a entrega" icon={Clock3} accent="blue" />
        <KpiCard title="Cycle Time médio" value="3,9" unit="dias" change="-8,1%" note="tempo em execução" icon={Zap} accent="indigo" />
        <KpiCard title="Throughput" value={project === "Todos os projetos" ? "27" : "24"} unit="itens/semana" change="+9,6%" note="itens concluídos" icon={TrendingUp} accent="cyan" />
        <KpiCard title="Taxa de sucesso" value="92,8" unit="%" change="+2,3 p.p." note="entregas conforme planejado" icon={Target} accent="violet" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <Panel title="Lead Time × Cycle Time" subtitle="Evolução do tempo de entrega · dias" icon={Clock3} action="Últimas semanas">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scopedFlow} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#e9eef5" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "#8491a5", fontSize: 11 }} dy={10} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#8491a5", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", boxShadow: "0 8px 24px #0f172a10" }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 12, paddingBottom: 18 }} />
                <Line type="monotone" dataKey="lead" name="Lead Time" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="cycle" name="Cycle Time" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3, fill: "#06b6d4", strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span>Lead Time: <strong className="text-slate-800">6,2 dias</strong></span><span>Cycle Time: <strong className="text-slate-800">3,9 dias</strong></span><span className="inline-flex items-center gap-1 text-emerald-700"><ArrowDownRight className="size-3.5" /> Tendência de redução</span>
          </div>
        </Panel>

        <Panel title="Saúde do fluxo" subtitle="Distribuição dos itens em andamento" icon={Gauge}>
          <div className="space-y-5 pt-2">
            <FlowHealth title="Fluxo saudável" value={78} color="bg-emerald-500" icon={<CheckCircle2 className="size-6" />} tone="bg-emerald-50 text-emerald-700" detail="Itens fluindo dentro do esperado" />
            <FlowHealth title="Itens bloqueados" value={14} color="bg-amber-400" icon={<AlertTriangle className="size-6" />} tone="bg-amber-50 text-amber-700" detail="Precisam de acompanhamento" />
            <FlowHealth title="Fora do SLA" value={8} color="bg-rose-400" icon={<AlertTriangle className="size-6" />} tone="bg-rose-50 text-rose-700" detail="Acima do limite acordado" />
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-600"><strong className="text-slate-800">Leitura rápida:</strong> priorize a análise dos bloqueios antes de aumentar o volume de trabalho em andamento.</div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Throughput por semana" subtitle="Itens concluídos versus planejados" icon={BarChart3}>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scopedThroughput} margin={{ top: 12, right: 8, left: -18, bottom: 0 }} barGap={5}>
                <CartesianGrid stroke="#e9eef5" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "#8491a5", fontSize: 11 }} dy={10} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#8491a5", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }} /><Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 12, paddingBottom: 18 }} />
                <Bar dataKey="done" name="Concluídos" fill="#2563eb" radius={[5, 5, 0, 0]} maxBarSize={24} /><Bar dataKey="planned" name="Planejados" fill="#cbd5e1" radius={[5, 5, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Burndown da sprint" subtitle="Trabalho restante ao longo da sprint atual" icon={TrendingUp} action="Sprint 24">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={burndownData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                <defs><linearGradient id="burndownFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.18} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0.01} /></linearGradient></defs>
                <CartesianGrid stroke="#e9eef5" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#8491a5", fontSize: 11 }} dy={10} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#8491a5", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }} /><Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 12, paddingBottom: 18 }} />
                <Area type="monotone" dataKey="actual" name="Real" stroke="#2563eb" strokeWidth={2.5} fill="url(#burndownFill)" /><Line type="monotone" dataKey="ideal" name="Ideal" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InsightCard icon={Target} title="Velocity média" value="42 pts" detail="por sprint nos últimos 3 ciclos" tone="blue" />
        <InsightCard icon={AlertTriangle} title="Taxa de defeitos" value="3,4%" detail="abaixo da meta de 5%" tone="green" />
        <InsightCard icon={Activity} title="WIP médio" value="18 itens" detail="limite recomendado: 20 itens" tone="violet" />
      </section>
      <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>Dashboard de demonstração · Métricas ilustrativas, não conectadas a dados operacionais</span><span>Atualize os filtros para explorar diferentes recortes</span>
      </div>
    </div>
  );
}

function KpiCard({ title, value, unit, change, note, icon: Icon, accent }: {
  title: string; value: string; unit: string; change: string; note: string; icon: typeof Clock3; accent: "blue" | "indigo" | "cyan" | "violet";
}) {
  const iconStyles = { blue: "bg-blue-50 text-blue-700", indigo: "bg-indigo-50 text-indigo-700", cyan: "bg-cyan-50 text-cyan-700", violet: "bg-violet-50 text-violet-700" };
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{title}</p><div className="mt-3 flex items-baseline gap-1.5"><span className="text-3xl font-semibold tracking-tight text-slate-900">{value}</span><span className="text-xs font-medium text-slate-400">{unit}</span></div></div><span className={"flex size-11 items-center justify-center rounded-xl " + iconStyles[accent]}><Icon className="size-5" /></span></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3"><span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><ArrowDownRight className="size-3.5" />{change}</span><span className="text-right text-xs text-slate-400">{note}</span></div>
    </div>
  );
}

function Panel({ title, subtitle, icon: Icon, action, children }: {
  title: string; subtitle: string; icon: typeof Clock3; action?: string; children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-blue-700"><Icon className="size-4" /></span><div><h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div></div>{action ? <span className="whitespace-nowrap rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-500">{action}</span> : null}</div>
      {children}
    </section>
  );
}

function FlowHealth({ title, value, color, icon, tone, detail }: { title: string; value: number; color: string; icon: ReactNode; tone: string; detail: string }) {
  return (
    <div className="flex items-center gap-4"><div className={"flex size-14 shrink-0 items-center justify-center rounded-2xl " + tone}>{icon}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium text-slate-700">{title}</span><strong className="text-sm text-slate-900">{value}%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={"h-full rounded-full " + color} style={{ width: value + "%" }} /></div><p className="mt-1.5 text-xs text-slate-500">{detail}</p></div></div>
  );
}

function InsightCard({ icon: Icon, title, value, detail, tone }: { icon: typeof Clock3; title: string; value: string; detail: string; tone: "blue" | "green" | "violet" }) {
  const tones = { blue: "bg-blue-50 text-blue-700", green: "bg-emerald-50 text-emerald-700", violet: "bg-violet-50 text-violet-700" };
  return <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)]"><span className={"flex size-11 shrink-0 items-center justify-center rounded-xl " + tones[tone]}><Icon className="size-5" /></span><div className="min-w-0"><p className="text-sm font-medium text-slate-500">{title}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div></div>;
}
