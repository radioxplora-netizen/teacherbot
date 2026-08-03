import { useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Filter,
  GraduationCap,
  MessageCircle,
  MoreVertical,
  Search,
  Send,
  Users,
  XCircle,
  BrainCircuit,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, eachDayOfInterval, isWeekend } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// --- K-12 Mock Data ---

const TEACHERS = [
  { id: "t1", name: "Lic. María González", subject: "Matemáticas", level: "Primaria" },
  { id: "t2", name: "Prof. Carlos Ruiz", subject: "Lengua y Literatura", level: "Secundaria" },
  { id: "t3", name: "Lic. Ana Torres", subject: "Ciencias Naturales", level: "Primaria" },
  { id: "t4", name: "Ing. Pedro Méndez", subject: "Física", level: "Secundaria" },
  { id: "t5", name: "Lic. Sofia Paz", subject: "Historia", level: "Secundaria" },
  { id: "t6", name: "Prof. Luis Vega", subject: "Educación Física", level: "Todos" },
];

const SECTIONS = ["Primaria (4-12 años)", "Secundaria (12-18 años)"];
const GRADES_PRIMARIA = ["4to EGB", "5to EGB", "6to EGB", "7mo EGB"];
const GRADES_SECUNDARIA = ["8vo EGB", "9no EGB", "10mo EGB", "1ro BGU", "2do BGU", "3ro BGU"];

// --- Heatmap Simulators ---

// Days to show in heatmap (last 30 days)
const HEATMAP_DAYS = eachDayOfInterval({
  start: subDays(new Date(), 29),
  end: new Date(),
});

// --- KPI Data Details ---

type KPIDetail = {
  id: string;
  title: string;
  value: string;
  trend: string;
  icon: React.ElementType;
  className: string;
  details: {
    analysis: string;
    causes: string[];
    effects: string[];
    aiAction: string;
  };
};

const KPI_DATA: KPIDetail[] = [
  {
    id: "sent",
    title: "Tareas Enviadas",
    value: "1,245",
    trend: "+12% vs mes anterior",
    icon: Send,
    className: "bg-gradient-to-br from-orange-500/20 to-transparent border border-orange-500/30 text-orange-400",
    details: {
      analysis: "El volumen de tareas ha aumentado consistentemente, indicando una mayor adopción de la plataforma por parte de los docentes de Secundaria.",
      causes: ["Implementación del nuevo reglamento de evaluación continua.", "Capacitación docente en herramientas digitales (módulo 2)."],
      effects: ["Mayor carga de trabajo para los estudiantes (posible saturación).", "Incremento en la generación de datos para análisis de aprendizaje."],
      aiAction: "Analizar distribución de carga por grado para evitar saturación.",
    },
  },
  {
    id: "delivery",
    title: "Tasa de Entrega",
    value: "94.8%",
    trend: "1,180 entregadas",
    icon: CheckCircle2,
    className: "bg-card border border-emerald-500/30 text-emerald-400",
    details: {
      analysis: "La tasa de cumplimiento es excelente, superando el objetivo del 90%. Sin embargo, se detecta una ligera caída en 3ro de Bachillerato.",
      causes: ["Alta motivación en niveles inferiores.", "Facilidad de uso de la app móvil para entregas."],
      effects: ["Mejores promedios generales.", "Reducción de alertas a padres de familia."],
      aiAction: "Generar reporte de incentivos para los cursos con mejor cumplimiento.",
    },
  },
  {
    id: "ai_correction",
    title: "Corregidas por IA",
    value: "850",
    trend: "~68% del total",
    icon: BrainCircuit,
    className: "bg-card border border-fuchsia-500/30 text-fuchsia-400",
    details: {
      analysis: "La IA está gestionando la mayor parte de la carga correccional en tareas objetivas y ensayos cortos, liberando tiempo docente.",
      causes: ["Confianza creciente en la precisión del feedback.", "Configuración exitosa de rúbricas automáticas."],
      effects: ["Retroalimentación inmediata para el estudiante (tiempo real).", "Estandarización de criterios de calificación."],
      aiAction: "Auditar calidad de feedback en muestras aleatorias (5%).",
    },
  },
  {
    id: "saved_time",
    title: "Ahorro Tiempo",
    value: "120h",
    trend: "Gestión administrativa",
    icon: Clock,
    className: "bg-card border border-blue-500/30 text-blue-400",
    details: {
      analysis: "Se han ahorrado 120 horas hombre en procesos de revisión simple y digitación de notas.",
      causes: ["Automatización de feedback nivel 1.", "Sincronización automática de notas al sistema académico."],
      effects: ["Docentes dedican más tiempo a tutorías personalizadas.", "Reducción de estrés laboral docente."],
      aiAction: "Proponer proyecto de investigación educativa con el tiempo liberado.",
    },
  },
  {
    id: "teacher_mgmt",
    title: "Gestión Docente",
    value: "4.8/5",
    trend: "Alta adherencia al plan",
    icon: Users,
    className: "bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30 text-amber-400",
    details: {
      analysis: "El cuerpo docente está cumpliendo con los cronogramas de planificación y subida de recursos de manera ejemplar.",
      causes: ["Liderazgo efectivo de coordinadores de área.", "Alertas preventivas de WhatsApp funcionando."],
      effects: ["Contenido disponible a tiempo para estudiantes.", "Mejor organización del año escolar."],
      aiAction: "Diseñar programa de reconocimiento al mérito docente.",
    },
  },
];

function generateTeacherHeatmap(teacherId: string) {
  return HEATMAP_DAYS.map((day) => {
    const isWknd = isWeekend(day);
    // Random status: 0=Missing, 1=Uploaded, 2=LookingGood
    // Weekend = -1 (Gray)
    if (isWknd) return { date: day, status: -1 };

    const rand = Math.random();
    let status = 1; // Default OK
    if (rand > 0.85) status = 0; // Missing (Red)
    if (rand > 0.95) status = 2; // Extra/Excelent (Dark Green)

    // Simulate "t4" (Physics) being lazy
    if (teacherId === "t4" && rand > 0.6) status = 0;

    return { date: day, status };
  });
}

function generateStudentSubmissions(grade: string) {
  // Mock students for the selected grade
  const students = Array.from({ length: 8 }, (_, i) => ({
    id: `s-${grade}-${i}`,
    name: `Estudiante ${i + 1} (${grade})`,
    homeworks: Array.from({ length: 10 }, (_, j) => {
      const rand = Math.random();
      // 0=Missing, 1=Submitted, 2=Late
      let status = 1;
      if (rand > 0.8) status = 0;
      if (rand > 0.9) status = 2;
      return { id: `hw-${j}`, title: `Tarea ${j + 1}`, status };
    })
  }));
  return students;
}

export default function ViceDashboard() {
  const [selectedSection, setSelectedSection] = useState("Secundaria (12-18 años)");
  const [selectedGrade, setSelectedGrade] = useState("1ro BGU");

  // KPI Detail State
  const [selectedKPI, setSelectedKPI] = useState<KPIDetail | null>(null);

  // WhatsApp Dialog State
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState<{ name: string, type: 'docente' | 'padre', issue: string } | null>(null);
  const [whatsAppMessage, setWhatsAppMessage] = useState("");

  const filteredTeachers = useMemo(() => {
    return TEACHERS.filter(t =>
      t.level === "Todos" || selectedSection.includes(t.level)
    );
  }, [selectedSection]);

  const teacherHeatmaps = useMemo(() => {
    return filteredTeachers.map(t => ({
      ...t,
      activity: generateTeacherHeatmap(t.id)
    }));
  }, [filteredTeachers]);

  const studentData = useMemo(() => generateStudentSubmissions(selectedGrade), [selectedGrade]);

  const handleOpenWhatsApp = (name: string, type: 'docente' | 'padre', issue: string) => {
    setWhatsAppTarget({ name, type, issue });
    // Template generation
    let text = "";
    if (type === 'docente') {
      text = `Estimado colega ${name}, notamos que faltan subir planificaciones/recursos en la plataforma Moodle (${issue}). Por favor regularizar para evitar inconvenientes. Saludos, Vicerrectorado.`;
    } else {
      text = `Estimado representante de ${name}, le informamos que el estudiante tiene tareas pendientes en la plataforma (${issue}). Solicitamos su apoyo en casa. Atte. Unidad Educativa Oxford.`;
    }
    setWhatsAppMessage(text);
    setWhatsAppOpen(true);
  };

  const handleSendWhatsApp = () => {
    toast.success(`Mensaje enviado a ${whatsAppTarget?.name}`, {
      description: "Se ha abierto WhatsApp Web (simulado)",
      icon: <MessageCircle className="text-green-500" />
    });
    setWhatsAppOpen(false);
    // In real app: window.open(`https://wa.me/?text=${encodeURIComponent(whatsAppMessage)}`)
  };

  const handleGenerateAIPlan = () => {
    if (!selectedKPI) return;

    toast.promise(
      new Promise<void>((resolve, reject) => {
        try {
          const doc = new jsPDF();
          const pageWidth = doc.internal.pageSize.getWidth();

          // Header
          doc.setFillColor(15, 64, 85); // Brand Dark Teal
          doc.rect(0, 0, pageWidth, 20, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(14);
          doc.text("Unidad Educativa Oxford - Plan de Acción IA", 14, 13);

          // Title & KPI Info
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(18);
          doc.text(`Plan de Acción: ${selectedKPI.title}`, 14, 35);

          doc.setFontSize(11);
          doc.setTextColor(100);
          doc.text(`Valor Actual: ${selectedKPI.value}`, 14, 42);
          doc.text(`Tendencia: ${selectedKPI.trend}`, 14, 48);
          doc.text(`Fecha Generación: ${format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}`, 14, 54);

          // Analysis Section
          doc.setFontSize(12);
          doc.setTextColor(0);
          doc.text("1. Análisis Estratégico (IA)", 14, 65);

          doc.setFontSize(10);
          doc.setTextColor(60);
          const splitAnalysis = doc.splitTextToSize(selectedKPI.details.analysis, pageWidth - 28);
          doc.text(splitAnalysis, 14, 72);

          let yPos = 72 + (splitAnalysis.length * 5);

          // Root Causes Table
          yPos += 10;
          doc.setFontSize(12);
          doc.setTextColor(0);
          doc.text("2. Diagnóstico de Causas Raíz", 14, yPos);

          autoTable(doc, {
            startY: yPos + 4,
            head: [['Causas Identificadas']],
            body: selectedKPI.details.causes.map(c => [c]),
            theme: 'grid',
            headStyles: { fillColor: [220, 53, 69] }, // Red for causes
            styles: { fontSize: 10 }
          });

          // @ts-ignore
          yPos = doc.lastAutoTable.finalY + 10;

          // Effects Table
          doc.setFontSize(12);
          doc.setTextColor(0);
          doc.text("3. Impacto Proyectado", 14, yPos);

          autoTable(doc, {
            startY: yPos + 4,
            head: [['Efectos Potenciales']],
            body: selectedKPI.details.effects.map(e => [e]),
            theme: 'grid',
            headStyles: { fillColor: [40, 167, 69] }, // Green for effects
            styles: { fontSize: 10 }
          });

          // @ts-ignore
          yPos = doc.lastAutoTable.finalY + 15;

          // Action Plan
          doc.setFillColor(240, 248, 255);
          doc.rect(14, yPos, pageWidth - 28, 25, 'F');
          doc.setDrawColor(15, 64, 85);
          doc.rect(14, yPos, pageWidth - 28, 25, 'S');

          doc.setFontSize(12);
          doc.setTextColor(15, 64, 85);
          doc.text("4. Acción Recomendada por IA", 20, yPos + 8);

          doc.setFontSize(10);
          doc.setTextColor(0);
          doc.text(selectedKPI.details.aiAction, 20, yPos + 16);
          doc.text("(Este plan debe ser revisado por el comité académico)", 20, yPos + 22);

          // Footer
          const pageHeight = doc.internal.pageSize.getHeight();
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text("Generado por TeacherIA - Sistema de Gestión Educativa Oxford", pageWidth / 2, pageHeight - 10, { align: 'center' });

          doc.save(`plan_accion_${selectedKPI.id}.pdf`);
          resolve();
        } catch (e) {
          console.error(e);
          reject(e);
        }
      }),
      {
        loading: 'Generando y analizando reporte PDF...',
        success: 'Plan descargado exitosamente.',
        error: 'Error al generar el PDF.'
      }
    );
    setSelectedKPI(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-brand">Dashboard Académico Oxford</h1>
          <p className="text-muted-foreground">
            Gestión de cumplimiento y alertas tempranas (K-12).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <CalendarCheck className="mr-2 size-4" /> Ciclo 2025-2026
          </Button>
          <Button variant="hero" size="sm">
            <Send className="mr-2 size-4" /> Reporte Semanal
          </Button>
        </div>
      </div>

      {/* KPI Section - Interactive */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        {KPI_DATA.map((kpi) => (
          <Card
            key={kpi.id}
            className={`${kpi.className} shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer`}
            onClick={() => setSelectedKPI(kpi)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground/80">{kpi.title}</CardTitle>
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-current opacity-20" />
                <kpi.icon className="size-8 relative animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs opacity-70">{kpi.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-muted/30">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="grid gap-2">
            <Label>Nivel Educativo</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Grado / Curso</Label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(selectedSection.includes("Primaria") ? GRADES_PRIMARIA : GRADES_SECUNDARIA).map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Buscar Docente/Estudiante</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input placeholder="Nombre..." className="pl-8 w-[250px] bg-background" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="teachers" className="space-y-4">
        <TabsList className="flex w-full gap-8 lg:w-[600px]">
          <TabsTrigger value="teachers">Gestión Docente (Planificación)</TabsTrigger>
          <TabsTrigger value="students">Seguimiento Estudiantil (Tareas)</TabsTrigger>
        </TabsList>

        {/* TEACHERS TAB */}
        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="size-5 text-brand" />
                Cumplimiento de Planificación y Recursos
              </CardTitle>
              <CardDescription>
                Actividad diaria de subida de contenido en Moodle (últimos 30 días).
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1"><div className="size-3 bg-emerald-500 rounded-sm"></div> Subido a tiempo</span>
                  <span className="flex items-center gap-1"><div className="size-3 bg-red-500 rounded-sm"></div> No subido / Atraso</span>
                  <span className="flex items-center gap-1"><div className="size-3 bg-muted rounded-sm"></div> Fin de semana</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {teacherHeatmaps.map((teacher) => {
                  const missingCount = teacher.activity.filter(d => d.status === 0).length;
                  const isRisky = missingCount > 3;

                  return (
                    <div key={teacher.id} className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                      <div className="w-[200px] shrink-0">
                        <div className="font-medium text-sm">{teacher.name}</div>
                        <div className="text-xs text-muted-foreground">{teacher.subject}</div>
                        {isRisky && (
                          <Badge variant="destructive" className="mt-1 text-[10px]">
                            {missingCount} faltas este mes
                          </Badge>
                        )}
                      </div>

                      {/* Heatmap Grid */}
                      <div className="flex-1 overflow-x-auto pb-2">
                        <div className="flex gap-[2px]">
                          {teacher.activity.map((day, i) => (
                            <div
                              key={i}
                              className={`size-4 rounded-[2px] transition-colors hover:ring-2 hover:ring-offset-1 hover:ring-ring cursor-help
                                ${day.status === -1 ? 'bg-muted/50' :
                                  day.status === 0 ? 'bg-red-500' :
                                    day.status === 2 ? 'bg-emerald-600' : 'bg-emerald-400'
                                }`}
                              title={`${format(day.date, 'dd MMM', { locale: es })}: ${day.status === 0 ? 'Falta' : day.status === -1 ? 'FDS' : 'Cumplido'}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <Button
                          variant={isRisky ? "destructive" : "outline"}
                          size="sm"
                          className="w-full md:w-auto"
                          onClick={() => handleOpenWhatsApp(teacher.name, 'docente', `${missingCount} planificaciones faltantes`)}
                        >
                          <MessageCircle className="mr-2 size-4" />
                          {isRisky ? "Reclamar (Alertar)" : "Recordar"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STUDENTS TAB */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="size-5 text-brand" />
                Entrega de Tareas - {selectedGrade}
              </CardTitle>
              <CardDescription>
                Estado de las últimas 10 tareas asignadas.
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1"><div className="size-3 bg-emerald-500 rounded-sm"></div> Entregado</span>
                  <span className="flex items-center gap-1"><div className="size-3 bg-red-500 rounded-sm"></div> No entregado</span>
                  <span className="flex items-center gap-1"><div className="size-3 bg-amber-400 rounded-sm"></div> Atrasado</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {studentData.map(student => {
                  const missing = student.homeworks.filter(h => h.status === 0).length;
                  const isRisky = missing > 2;

                  return (
                    <div key={student.id} className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                      <div className="w-[200px] shrink-0">
                        <div className="font-medium text-sm">{student.name}</div>
                        <div className="text-xs text-muted-foreground">{missing} tareas sin entregar</div>
                      </div>

                      {/* Student Heatmap (Homeworks) */}
                      <div className="flex-1 overflow-x-auto pb-2">
                        <div className="flex gap-1">
                          {student.homeworks.map((hw, i) => (
                            <div
                              key={hw.id}
                              className={`h-6 w-8 rounded-sm flex items-center justify-center text-[10px] font-bold text-white
                                   ${hw.status === 0 ? 'bg-red-500' : hw.status === 1 ? 'bg-emerald-500' : 'bg-amber-400'}
                                 `}
                              title={`${hw.title}: ${hw.status === 0 ? 'No entregó' : 'Entregó'}`}
                            >
                              T{i + 1}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <Button
                          size="sm"
                          variant={isRisky ? "destructive" : "outline"}
                          onClick={() => handleOpenWhatsApp(student.name, 'padre', `${missing} tareas no entregadas en ${selectedSection}`)}
                        >
                          <MessageCircle className="mr-2 size-4" />
                          Contactar Rep.
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* KPI Detail Dialog */}
      <Dialog open={!!selectedKPI} onOpenChange={(open) => !open && setSelectedKPI(null)}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl text-brand">
              {selectedKPI?.icon && <selectedKPI.icon className="size-6" />}
              {selectedKPI?.title}
            </DialogTitle>
            <DialogDescription>
              Valor actual: <span className="font-bold text-foreground">{selectedKPI?.value}</span> · {selectedKPI?.trend}
            </DialogDescription>
          </DialogHeader>

          {selectedKPI && (
            <div className="space-y-6 py-4">
              <div className="rounded-lg bg-muted/50 p-4 border border-brand/10">
                <h4 className="flex items-center gap-2 font-semibold text-brand mb-2">
                  <BrainCircuit className="size-4" /> Análisis de IA
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {selectedKPI.details.analysis}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-destructive flex items-center gap-2">
                    <AlertCircle className="size-4" /> Posibles Causas
                  </h5>
                  <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                    {selectedKPI.details.causes.map((cause, i) => (
                      <li key={i}>{cause}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-blue-600 flex items-center gap-2">
                    <Filter className="size-4" /> Efectos / Impacto
                  </h5>
                  <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                    {selectedKPI.details.effects.map((effect, i) => (
                      <li key={i}>{effect}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between gap-2 border-t pt-4">
            <div className="text-xs text-muted-foreground flex items-center">
              <BrainCircuit className="size-3 mr-1" /> Análisis generado automáticamente hace 5 min
            </div>
            <Button className="w-full sm:w-auto bg-brand text-brand-foreground hover:opacity-90 shadow-glow" onClick={handleGenerateAIPlan}>
              <Download className="size-4 mr-2" />
              Descargar Plan de Acción (PDF)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={whatsAppOpen} onOpenChange={setWhatsAppOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="size-5 text-green-600" />
              Generar Alerta WhatsApp
            </DialogTitle>
            <DialogDescription>
              Personalice el mensaje antes de enviar. Se abrirá WhatsApp Web.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Destinatario</Label>
              <Input value={whatsAppTarget?.name || ""} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Mensaje (Plantilla Automática)</Label>
              <Textarea
                value={whatsAppMessage}
                onChange={(e) => setWhatsAppMessage(e.target.value)}
                className="h-[120px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWhatsAppOpen(false)}>Cancelar</Button>
            <Button onClick={handleSendWhatsApp} className="bg-[#25D366] hover:bg-[#128C7E] text-white">
              <Send className="mr-2 size-4" /> Enviar por WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
