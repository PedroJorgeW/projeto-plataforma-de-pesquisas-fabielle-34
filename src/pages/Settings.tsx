import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Lock, Save, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import * as bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
const Settings = () => {
  const {
    toast
  } = useToast();
  const {
    adminUser,
    user,
    updateAdminUser
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Load admin user data when component mounts
  useEffect(() => {
    if (adminUser) {
      setFormData(prev => ({
        ...prev,
        name: adminUser.nome,
        email: user?.email || ""
      }));
    }
  }, [adminUser, user]);
  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };
  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      // Update admin user data
      const updateData: any = {
        nome: formData.name.trim(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('admin_users').update(updateData).eq('user_id', user?.id);
      if (error) {
        console.error('Error updating admin profile:', error);
        toast({
          title: "Erro",
          description: "Falha ao atualizar perfil. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Update frontend state
      updateAdminUser({
        nome: formData.name.trim()
      });

      toast({
        title: "Perfil atualizado",
        description: "Nome atualizado com sucesso."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!formData.newPassword.trim()) {
      toast({
        title: "Erro",
        description: "Nova senha é obrigatória.",
        variant: "destructive"
      });
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "A nova senha e confirmação não coincidem.",
        variant: "destructive"
      });
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update password in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (authError) {
        console.error('Error updating password:', authError);
        toast({
          title: "Erro",
          description: "Falha ao alterar senha. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Also update the hash in admin_users table for consistency
      const senhaHash = await bcrypt.hash(formData.newPassword, 10);
      const { error: dbError } = await supabase
        .from('admin_users')
        .update({ 
          senha_hash: senhaHash,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (dbError) {
        console.error('Error updating admin user hash:', dbError);
        // Don't return error here since auth password was updated successfully
      }

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso."
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupData = async () => {
    setIsLoading(true);
    try {
      // Get admin user ID first
      if (!adminUser?.id) {
        throw new Error('Usuário admin não encontrado');
      }

      // Fetch all user data
      const [formsResponse, responsesResponse, questionsResponse, answersResponse] = await Promise.all([
        supabase
          .from('forms')
          .select('*')
          .eq('admin_user_id', adminUser.id),
        supabase
          .from('responses')
          .select(`
            *,
            forms (
              title,
              description
            )
          `),
        supabase
          .from('questions')
          .select('*'),
        supabase
          .from('response_answers')
          .select(`
            *,
            questions (
              question_text,
              question_type
            )
          `)
      ]);

      if (formsResponse.error) {
        throw new Error('Erro ao buscar formulários: ' + formsResponse.error.message);
      }

      if (responsesResponse.error) {
        throw new Error('Erro ao buscar respostas: ' + responsesResponse.error.message);
      }

      if (questionsResponse.error) {
        throw new Error('Erro ao buscar questões: ' + questionsResponse.error.message);
      }

      if (answersResponse.error) {
        throw new Error('Erro ao buscar respostas das questões: ' + answersResponse.error.message);
      }

      const forms = formsResponse.data || [];
      const responses = responsesResponse.data || [];
      const questions = questionsResponse.data || [];
      const answers = answersResponse.data || [];

      // Filter only responses from user's forms
      const userFormIds = forms.map(form => form.id);
      const userResponses = responses.filter(response => userFormIds.includes(response.form_id));

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Create forms sheet
      const formsData = forms.map(form => ({
        'ID': form.id,
        'Título': form.title,
        'Descrição': form.description || 'N/A',
        'Status': form.status,
        'Data de Término': form.end_date ? new Date(form.end_date).toLocaleString('pt-BR') : 'N/A',
        'Criado em': new Date(form.created_at).toLocaleString('pt-BR')
      }));

      const formsSheet = XLSX.utils.json_to_sheet(formsData);
      XLSX.utils.book_append_sheet(workbook, formsSheet, 'Formulários');

      // Create questions sheet
      const userQuestions = questions.filter(q => {
        return forms.some(form => form.id === q.form_id);
      });

      const questionsData = userQuestions.map(question => ({
        'ID': question.id,
        'ID do Formulário': question.form_id,
        'Pergunta': question.question_text,
        'Tipo': question.question_type,
        'Ordem': question.ordem || 'N/A',
        'Criado em': new Date(question.created_at).toLocaleString('pt-BR')
      }));

      const questionsSheet = XLSX.utils.json_to_sheet(questionsData);
      XLSX.utils.book_append_sheet(workbook, questionsSheet, 'Perguntas');

      // Create responses sheet
      const responsesData = userResponses.map(response => ({
        'ID': response.id,
        'Formulário': response.forms?.title || 'N/A',
        'ID do Formulário': response.form_id,
        'Respondido em': new Date(response.created_at).toLocaleString('pt-BR')
      }));

      const responsesSheet = XLSX.utils.json_to_sheet(responsesData);
      XLSX.utils.book_append_sheet(workbook, responsesSheet, 'Respostas');

      // Create answers sheet
      const userResponseIds = userResponses.map(r => r.id);
      const userAnswers = answers.filter(answer => userResponseIds.includes(answer.response_id));

      const answersData = userAnswers.map(answer => ({
        'ID': answer.id,
        'ID da Resposta': answer.response_id,
        'ID da Pergunta': answer.question_id,
        'Pergunta': answer.questions?.question_text || 'N/A',
        'Tipo de Pergunta': answer.questions?.question_type || 'N/A',
        'Resposta': answer.resposta || 'N/A',
        'Respondido em': new Date(answer.created_at).toLocaleString('pt-BR')
      }));

      const answersSheet = XLSX.utils.json_to_sheet(answersData);
      XLSX.utils.book_append_sheet(workbook, answersSheet, 'Respostas Detalhadas');

      // Create summary sheet
      const summaryData = [
        { 'Métrica': 'Total de Formulários', 'Valor': forms.length },
        { 'Métrica': 'Total de Perguntas', 'Valor': userQuestions.length },
        { 'Métrica': 'Total de Respostas', 'Valor': userResponses.length },
        { 'Métrica': 'Total de Respostas Detalhadas', 'Valor': userAnswers.length },
        { 'Métrica': 'Usuário', 'Valor': adminUser?.nome || 'N/A' },
        { 'Métrica': 'Email', 'Valor': user?.email || 'N/A' },
        { 'Métrica': 'Data do Backup', 'Valor': new Date().toLocaleString('pt-BR') }
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

      // Generate and download file
      const fileName = `backup_formularios_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Backup Concluído",
        description: `Arquivo ${fileName} foi baixado com sucesso.`
      });

    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: "Erro no Backup",
        description: error instanceof Error ? error.message : "Erro interno. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações da Conta</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais e configurações de segurança</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" type="text" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} placeholder="Digite seu nome completo" />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" value={formData.email} placeholder="Email (não pode ser alterado)" className="pl-10" disabled />
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Alterar Senha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input id="new-password" type="password" value={formData.newPassword} onChange={e => handleInputChange("newPassword", e.target.value)} placeholder="Digite sua nova senha (deixe vazio para manter a atual)" />
            </div>
            
            <div>
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input id="confirm-password" type="password" value={formData.confirmPassword} onChange={e => handleInputChange("confirmPassword", e.target.value)} placeholder="Confirme sua nova senha" />
            </div>

            <div className="text-sm text-muted-foreground">
              
              <p>• A senha deve ter pelo menos 6 caracteres</p>
            </div>

            <Button onClick={handleChangePassword} disabled={isLoading || !formData.newPassword.trim()} className="w-full">
              <Lock className="h-4 w-4 mr-2" />
              {isLoading ? "Alterando Senha..." : "Alterar Senha"}
            </Button>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-2">Backup de Dados</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Baixe uma cópia de todos os seus dados e formulários.
              </p>
              <Button variant="outline" size="sm" onClick={handleBackupData} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? "Gerando Backup..." : "Solicitar Backup"}
              </Button>
            </div>
            
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Settings;