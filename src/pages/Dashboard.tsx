import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, TrendingUp, BarChart, Loader2 } from "lucide-react";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Form {
  id: string;
  title: string;
  description: string | null;
  status: string;
  end_date: string | null;
  created_at: string;
  responses: { count: number }[];
}

interface DashboardStats {
  totalForms: number;
  totalResponses: number;
  activeForms: number;
  participationRate: string;
}

const Dashboard = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalForms: 0,
    totalResponses: 0,
    activeForms: 0,
    participationRate: "0%"
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchDashboardData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Buscar formulários com perguntas e respostas para calcular SOMENTE completas
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select(`
          *,
          questions(id),
          responses(
            id,
            response_answers(id, question_id, resposta)
          )
        `)
        .order('created_at', { ascending: false });

      if (formsError) {
        console.error('Error fetching forms:', formsError);
        return;
      }

      // Calcular contagem de respostas COMPLETAS por formulário (1 resposta válida por pergunta)
      const formsWithResponseCounts = (formsData || []).map((form: any) => {
        const questionsCount = form.questions?.length || 0;
        const completeCount = (form.responses || []).filter((resp: any) => {
          const answers = resp.response_answers || [];
          const uniqueAnswered = new Set(
            answers
              .filter((a: any) => a && a.question_id && typeof a.resposta !== 'undefined' && String(a.resposta).trim() !== '')
              .map((a: any) => a.question_id)
          );
          return questionsCount > 0 && uniqueAnswered.size === questionsCount;
        }).length;
        // Manter formato esperado pelo restante do componente
        return { ...form, responses: [{ count: completeCount }] };
      });

      setForms(formsWithResponseCounts as any);

      // Calcular estatísticas
      const totalForms = formsWithResponseCounts.length;
      const totalResponses = formsWithResponseCounts.reduce((acc, form) => 
        acc + (form.responses?.[0]?.count || 0), 0
      );
      const activeForms = formsWithResponseCounts.filter(form => 
        form.status === 'ativo' && (!form.end_date || new Date(form.end_date) > new Date())
      ).length;

      // Taxa de participação simples (pode ser refinada baseada em lógica específica)  
      const participationRate = totalForms > 0 ? 
        Math.round((totalResponses / (totalForms * 10)) * 100) + "%" : "0%";

      setStats({
        totalForms,
        totalResponses,
        activeForms,
        participationRate
      });

      console.log('📊 Dashboard stats:', {
        totalForms,
        totalResponses,
        activeForms,
        participationRate
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Atualizar dados a cada 30 segundos para mostrar novas respostas
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const getChartData = () => {
    return forms
      .filter(form => form.responses?.[0]?.count > 0)
      .map(form => ({
        name: form.title.length > 20 ? form.title.substring(0, 20) + '...' : form.title,
        respostas: form.responses?.[0]?.count || 0
      }))
      .slice(0, 6); // Mostrar apenas os 6 formulários com mais respostas
  };

  const statsCards = [
    {
      title: "Formulários Criados",
      value: stats.totalForms.toString(),
      icon: FileText,
      color: "text-primary"
    },
    {
      title: "Total de Respostas", 
      value: stats.totalResponses.toLocaleString(),
      icon: Users,
      color: "text-success"
    },
    {
      title: "Taxa de Participação",
      value: stats.participationRate,
      icon: TrendingUp,
      color: "text-warning"
    },
    {
      title: "Formulários Ativos",
      value: stats.activeForms.toString(),
      icon: BarChart,
      color: "text-primary"
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral das pesquisas de clima organizacional</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Respostas</CardTitle>
        </CardHeader>
        <CardContent>
          {getChartData().length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs fill-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis className="text-xs fill-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar 
                    dataKey="respostas" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p>Nenhum formulário com respostas encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;