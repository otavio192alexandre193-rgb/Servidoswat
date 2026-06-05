import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Calendar, 
  Mail, 
  FileSpreadsheet, 
  FolderOpen, 
  Key, 
  UserCheck, 
  RefreshCw, 
  Send, 
  Plus, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Search, 
  Link2,
  FileCheck2,
  Clock,
  Sparkles,
  Inbox
} from 'lucide-react';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { Lead, Appointment, EmailTemplate, EmailLog, CRMNotification } from '../types';
import { AccessibilitySettings, triggerSensoryFeedback } from '../utils/sensory';

interface GoogleWorkspaceProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  templates: EmailTemplate[];
  emailLogs: EmailLog[];
  setEmailLogs: React.Dispatch<React.SetStateAction<EmailLog[]>>;
  awardXP: (xp: number) => void;
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alarm' | 'ai') => void;
  accSettings: AccessibilitySettings;
}

// In-memory token caching map indexed by firebase UID to support multi-user integrations safely without storage persistence
const tokenCacheByUid: Record<string, string> = {};

export default function GoogleWorkspace({
  leads,
  setLeads,
  appointments,
  setAppointments,
  templates,
  emailLogs,
  setEmailLogs,
  awardXP,
  addNotification,
  accSettings
}: GoogleWorkspaceProps) {
  // Connection states
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  // Active Workspace service view tab
  const [workspaceTab, setWorkspaceTab] = useState<'status' | 'calendar' | 'gmail' | 'drive' | 'sheets'>('status');

  // Service listing states
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [emails, setEmails] = useState<any[]>([]);

  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [fileSearch, setFileSearch] = useState('');

  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [sheetsList, setSheetsList] = useState<any[]>([]);

  // Mutating Action state variables (interactive Forms)
  const [modalType, setModalType] = useState<'calendar' | 'gmail' | 'drive' | 'sheets_import' | 'sheets_export' | null>(null);
  
  // Create Calendar Event Form
  const [apptForm, setApptForm] = useState({
    title: '',
    leadId: '',
    date: new Date().toISOString().substring(0, 10),
    time: '14:00',
    description: '',
    durationMinutes: 60
  });

  // Compose Email Form
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    body: '',
    templateId: ''
  });

  // Export File to Drive Form
  const [exportForm, setExportForm] = useState({
    title: 'Relatório cicloCRED Imobiliário',
    content: ''
  });

  // Sheets import selection
  const [selectedSheetId, setSelectedSheetId] = useState('');
  const [importedLeadsPreview, setImportedLeadsPreview] = useState<Omit<Lead, 'id'>[]>([]);

  // Track state change
  useEffect(() => {
    // Check if user is already signed in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setGoogleUser(user);
        const resolvedToken = tokenCacheByUid[user.uid] || null;
        setToken(resolvedToken);
      } else {
        setGoogleUser(null);
        setToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Run initial data queries when active tabs change
  useEffect(() => {
    if (token) {
      if (workspaceTab === 'calendar') {
        fetchCalendarEvents();
      } else if (workspaceTab === 'gmail') {
        fetchRecentEmails();
      } else if (workspaceTab === 'drive') {
        fetchDriveFiles();
      } else if (workspaceTab === 'sheets') {
        fetchSpreadsheets();
      }
    }
  }, [workspaceTab, token]);

  // OAuth Google Login with correct Scopes
  const handleConnectWorkspace = async () => {
    setIsAuthorizing(true);
    setErrorHeader(null);
    triggerSensoryFeedback('click', accSettings);

    try {
      const provider = new GoogleAuthProvider();
      // Add requested Google Workspace scopes
      provider.addScope('https://www.googleapis.com/auth/drive');
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
      provider.addScope('https://www.googleapis.com/auth/gmail.send');
      provider.addScope('https://www.googleapis.com/auth/calendar');

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Falha ao obter o token de acesso Google Workspace.');
      }

      tokenCacheByUid[result.user.uid] = credential.accessToken;
      setToken(credential.accessToken);
      setGoogleUser(result.user);
      
      triggerSensoryFeedback('success', accSettings);
      addNotification(
        '🌐 GOOGLE WORKSPACE CONECTADO',
        `Conexão estabelecida com sucesso para a conta ${result.user.email}!`,
        'success'
      );
      awardXP(200);
      setWorkspaceTab('status');
    } catch (err: any) {
      console.error('Erro de autorização Workspace:', err);
      setErrorHeader(err.message || 'Falha ao conectar.');
      triggerSensoryFeedback('warning', accSettings);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleDisconnectWorkspace = () => {
    const isConfirmed = window.confirm('Deseja realmente desconectar seu painel cicloCRED do Google Workspace? Seus tokens em memória serão apagados.');
    if (!isConfirmed) return;

    if (googleUser) {
      delete tokenCacheByUid[googleUser.uid];
    }
    setToken(null);
    setGoogleUser(null);
    triggerSensoryFeedback('warning', accSettings);
    addNotification('🔌 WORKSPACE DESCONECTADO', 'Conexão em memória com Google Workspace removida.', 'warning');
  };

  // Google Calendar API queries
  const fetchCalendarEvents = async () => {
    if (!token) return;
    setIsLoadingEvents(true);
    try {
      const timeMin = new Date().toISOString();
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${timeMin}&maxResults=8`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.status === 401) {
        handleTokenExpired();
        return;
      }
      const data = await res.json();
      setEvents(data.items || []);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Create event on calendar
  const handleCreateCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Strict Scope confirmation rule from SKILL.md
    const isConfirmed = window.confirm(
      `Confirma o agendamento de "${apptForm.title}" para o dia ${apptForm.date} às ${apptForm.time}? Essa operação criará um evento oficial na sua agenda Google Calendar real!`
    );
    if (!isConfirmed) return;

    try {
      const calculatedStart = `${apptForm.date}T${apptForm.time}:00`;
      const dateStartObj = new Date(calculatedStart);
      const dateEndObj = new Date(dateStartObj.getTime() + apptForm.durationMinutes * 60000);
      
      const body = {
        summary: `cicloCRED: ${apptForm.title}`,
        description: apptForm.description || `Compromisso agendado via Sistema CRM cicloCRED para atendimento de leads imobiliários.`,
        start: {
          dateTime: dateStartObj.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: dateEndObj.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        throw new Error('Falha ao registrar compromisso na API Google Calendar.');
      }

      const createdEvent = await res.json();

      // Find selected lead name
      const matchedLead = leads.find(l => l.id === apptForm.leadId);
      const leadName = matchedLead ? matchedLead.name : 'Outro / Sem Lead';

      // Insert local appointment in CRM State as well
      const newLocalAppt: Appointment = {
        id: `google-appt-${createdEvent.id}`,
        leadId: apptForm.leadId || 'outro',
        leadName: leadName,
        title: apptForm.title,
        date: apptForm.date,
        time: apptForm.time,
        description: apptForm.description + ` (Link da agenda: ${createdEvent.htmlLink})`,
        status: 'agendado',
        type: 'reuniao'
      };

      setAppointments(prev => [newLocalAppt, ...prev]);
      addNotification(
        '📆 COMPROMISSO INTEGRADO',
        `Evento criado no seu Google Calendar para ${apptForm.date}!`,
        'success'
      );
      awardXP(150);
      triggerSensoryFeedback('success', accSettings);
      
      // Reset Form and close modal
      setApptForm({
        title: '',
        leadId: '',
        date: new Date().toISOString().substring(0, 10),
        time: '14:00',
        description: '',
        durationMinutes: 60
      });
      setModalType(null);
      fetchCalendarEvents();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // Gmail API queries
  const fetchRecentEmails = async () => {
    if (!token) return;
    setIsLoadingEmails(true);
    try {
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (listRes.status === 401) {
        handleTokenExpired();
        return;
      }
      const listData = await listRes.json();
      const messages = listData.messages || [];

      // Fetch details of each message
      const detailedMessages = await Promise.all(
        messages.map(async (msg: any) => {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          return detailRes.json();
        })
      );

      // Map to a more readable format
      const formatted = detailedMessages.map((msg: any) => {
        const headers = msg.payload.headers || [];
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Desconhecido';
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'Sem Assunto';
        const dateRaw = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
        
        return {
          id: msg.id,
          from,
          subject,
          snippet: msg.snippet,
          date: new Date(dateRaw).toLocaleString('pt-BR')
        };
      });

      setEmails(formatted);
    } catch (err) {
      console.error('Error fetching emails:', err);
    } finally {
      setIsLoadingEmails(false);
    }
  };

  // MIME Raw Sender helper
  const makeRawEmailMime = (to: string, subject: string, bodyText: string) => {
    const emailStr = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      bodyText
    ].join('\r\n');
    
    return btoa(unescape(encodeURIComponent(emailStr)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const handleSendGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!emailForm.to.includes('@')) {
      alert('Por favor insira um e-mail de destino válido.');
      return;
    }

    // Explicit confirmation dialg before sending email
    const isConfirmed = window.confirm(
      `Deseja realmente enviar este email para "${emailForm.to}"?\nAssunto: ${emailForm.subject}`
    );
    if (!isConfirmed) return;

    try {
      const rawBody = makeRawEmailMime(emailForm.to, emailForm.subject, emailForm.body);
      
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: rawBody })
      });

      if (!res.ok) {
        throw new Error('Falha no envio de e-mail através da API do Gmail.');
      }

      // Add to CRM email Logs
      const newLog: EmailLog = {
        id: `gmail-sent-${Date.now()}`,
        leadId: 'manual',
        leadName: emailForm.to,
        templateName: emailForm.templateId ? 'GModelo Customizado' : 'Manual Gmail Draft',
        subject: emailForm.subject,
        body: emailForm.body,
        sentAt: new Date().toISOString(),
        status: 'enviado'
      };

      setEmailLogs(prev => [newLog, ...prev]);
      addNotification(
        '📧 E-MAIL ENVIADO VIA GMAIL',
        `E-mail despachado oficialmente para ${emailForm.to}!`,
        'success'
      );
      awardXP(100);
      triggerSensoryFeedback('success', accSettings);

      // Reset
      setEmailForm({ to: '', subject: '', body: '', templateId: '' });
      setModalType(null);
      fetchRecentEmails();
    } catch (err: any) {
      alert(`Falha ao enviar: ${err.message}`);
    }
  };

  // Google Drive API queries
  const fetchDriveFiles = async () => {
    if (!token) return;
    setIsLoadingFiles(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=mimeType != 'application/vnd.google-apps.folder'&pageSize=12&fields=files(id, name, mimeType, webViewLink, modifiedTime)`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.status === 401) {
        handleTokenExpired();
        return;
      }
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err) {
      console.error('Error fetching drive files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Upload simple text file report to Drive
  const handleUploadReportToDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const isConfirmed = window.confirm(
      `Deseja realmente gerar e enviar o arquivo "${exportForm.title}.txt" para a sua pasta do Google Drive?`
    );
    if (!isConfirmed) return;

    try {
      const metadata = {
        name: `${exportForm.title}.txt`,
        mimeType: 'text/plain'
      };

      const boundary = 'ciclocred_boundary';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartBody = 
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/plain\r\n\r\n' +
        exportForm.content +
        closeDelimiter;

      const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: multipartBody
        }
      );

      if (!res.ok) {
        throw new Error('Falha ao enviar arquivo de relatório para o Google Drive.');
      }

      addNotification(
        '💾 RELATÓRIO PRESERVADO',
        `Arquivo "${exportForm.title}.txt" salvo no dispositivo Drive!`,
        'success'
      );
      awardXP(120);
      triggerSensoryFeedback('success', accSettings);

      setExportForm({ title: 'Relatório cicloCRED Imobiliário', content: '' });
      setModalType(null);
      fetchDriveFiles();
    } catch (err: any) {
      alert(`Falha no upload: ${err.message}`);
    }
  };

  // Google Sheets API queries
  const fetchSpreadsheets = async () => {
    if (!token) return;
    setIsLoadingSheets(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=mimeType = 'application/vnd.google-apps.spreadsheet'&pageSize=10&fields=files(id, name, modifiedTime)`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.status === 401) {
        handleTokenExpired();
        return;
      }
      const data = await res.json();
      setSheetsList(data.files || []);
    } catch (err) {
      console.error('Error fetching sheets:', err);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Preview leads import from selected Sheet
  const handlePreviewLeadsFromSheet = async (sheetId: string) => {
    if (!token) return;
    setSelectedSheetId(sheetId);
    setIsLoadingSheets(true);
    setImportedLeadsPreview([]);

    try {
      // Fetch values from range A1:G50
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:G50`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) {
        throw new Error('Impossível ler linhas da planilha. Verifique as permissões de acesso do arquivo.');
      }

      const data = await res.json();
      const rows = data.values || [];

      if (rows.length < 2) {
        alert('Planilha vazia ou sem cabeçalhos válidos. Requer pelo menos 1 cabeçalho e 1 linha de dados.');
        return;
      }

      // Automatically parse assuming column index mappings or header titles match:
      // A: Nome, B: Email, C: Telefone, D: Renda Familiar, E: Valor Pipeline, F: Status, G: Notas
      const headers = rows[0].map((h: string) => h.toLowerCase().trim());
      const rowsPreview: Omit<Lead, 'id'>[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0]) continue; // skip empty lines

        rowsPreview.push({
          name: row[0] || 'Cliente Importado',
          email: row[1] || 'sem@email.com',
          phone: row[2] || '(11) 99999-9999',
          familyIncome: row[3] ? parseFloat(row[3].replace(/[^\d.-]/g, '')) : 4500,
          value: row[4] ? parseFloat(row[4].replace(/[^\d.-]/g, '')) : 120000,
          status: 'novo',
          notes: row[6] || row[5] || 'Originado via importação de planilha Google Sheets.',
          origin: 'Google Sheets',
          createdAt: new Date().toISOString().substring(0, 10)
        });
      }

      setImportedLeadsPreview(rowsPreview);
    } catch (err: any) {
      alert(`Falha no escaneamento da planilha: ${err.message}`);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleConfirmLeadsImport = () => {
    if (importedLeadsPreview.length === 0) return;

    const isConfirmed = window.confirm(
      `Deseja realmente IMPORTAR ${importedLeadsPreview.length} novos Leads de forma de definitiva para o banco cicloCRED CRM?`
    );
    if (!isConfirmed) return;

    // Map and inject lead IDs
    const newInjectableLeads: Lead[] = importedLeadsPreview.map((previewLead, idx) => ({
      id: `sheet-imported-${Date.now()}-${idx}`,
      ...previewLead
    }));

    setLeads(prev => [...newInjectableLeads, ...prev]);
    addNotification(
      '📥 IMPORTAÇÃO CONCLUÍDA',
      `Filtro Google Sheets processado! ${newInjectableLeads.length} novos Leads injetados na carteira.`,
      'success'
    );
    awardXP(250);
    triggerSensoryFeedback('success', accSettings);

    // Reset preview
    setImportedLeadsPreview([]);
    setSelectedSheetId('');
    setModalType(null);
  };

  // Export current active CRM Leads to a brand NEW Google Sheets Spreadsheet
  const handleExportLeadsToNewSheet = async () => {
    if (!token) return;

    const isConfirmed = window.confirm(
      `Deseja criar uma PLANILHA GOOGLE novinha e exportar os seus ${leads.length} leads do funil imobiliário real?`
    );
    if (!isConfirmed) return;

    setIsLoadingSheets(true);
    try {
      // 1. Create the base Spreadsheet
      const title = `Exportação CRM cicloCRED - ${new Date().toLocaleDateString('pt-BR')}`;
      const createRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: { title }
        })
      });

      if (!createRes.ok) {
        throw new Error('Falha ao instanciar arquivo de planilha.');
      }

      const sheetInfo = await createRes.json();
      const spreadsheetId = sheetInfo.spreadsheetId;

      // 2. Prepare spreadsheet row values
      const bodyValues = [
        ['Nome do Lead', 'E-mail', 'Telefone', 'Origem do Funil', 'Renda Familiar', 'Valor de Proposta (R$)', 'Status Atual', 'Notas / Comentários']
      ];

      leads.forEach(lead => {
        bodyValues.push([
          lead.name,
          lead.email,
          lead.phone,
          lead.origin,
          String(lead.familyIncome || 0),
          String(lead.value),
          lead.status,
          lead.notes
        ]);
      });

      // 3. Populate rows in first worksheet (default Range Sheet1!A1)
      const populateRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: bodyValues
          })
        }
      );

      if (!populateRes.ok) {
        throw new Error('Planilha criada, mas falhou ao gravar os registros de Leads.');
      }

      addNotification(
        '📊 PLANILHA EXPORTADA',
        `Nova planilha instalada no Drive com sucesso!`,
        'success'
      );
      awardXP(200);
      triggerSensoryFeedback('success', accSettings);

      const webUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
      window.open(webUrl, '_blank');
      setModalType(null);
    } catch (err: any) {
      alert(`Falha na exportação: ${err.message}`);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleTokenExpired = () => {
    if (googleUser) {
      delete tokenCacheByUid[googleUser.uid];
    }
    setToken(null);
    setGoogleUser(null);
    setErrorHeader('Sua credencial do workspace expirou. Por favor, conecte-se novamente.');
    addNotification('🚨 SESSÃO GOOGLE EXPIRADA', 'Seu login expirou. Conecte-se novamente na aba do Workspace.', 'warning');
    setWorkspaceTab('status');
  };

  const filteredFiles = driveFiles.filter(f => 
    f.name.toLowerCase().includes(fileSearch.toLowerCase())
  );

  return (
    <div className="w-full bg-zinc-900 border-4 border-zinc-950 rounded-3xl p-6.5 text-zinc-100 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] space-y-6">
      
      {/* Tab select headers */}
      <div className="flex border-b-4 border-zinc-950 pb-1.5 overflow-x-auto gap-2">
        <button
          onClick={() => { triggerSensoryFeedback('click', accSettings); setWorkspaceTab('status'); }}
          className={`px-4.5 py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl shrink-0 transition-all flex items-center gap-2 ${
            workspaceTab === 'status' 
              ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' 
              : 'text-zinc-400 hover:text-white bg-zinc-800'
          }`}
        >
          <Cloud className="w-4 h-4 text-indigo-400" />
          <span>Status de Acesso</span>
        </button>

        <button
          disabled={!token}
          onClick={() => { triggerSensoryFeedback('click', accSettings); setWorkspaceTab('calendar'); }}
          className={`px-4.5 py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl shrink-0 transition-all flex items-center gap-2 ${
            !token ? 'opacity-40 cursor-not-allowed' : ''
          } ${
            workspaceTab === 'calendar' 
              ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' 
              : 'text-zinc-400 hover:text-white bg-zinc-800'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Google Calendar</span>
        </button>

        <button
          disabled={!token}
          onClick={() => { triggerSensoryFeedback('click', accSettings); setWorkspaceTab('gmail'); }}
          className={`px-4.5 py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl shrink-0 transition-all flex items-center gap-2 ${
            !token ? 'opacity-40 cursor-not-allowed' : ''
          } ${
            workspaceTab === 'gmail' 
              ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' 
              : 'text-zinc-400 hover:text-white bg-zinc-800'
          }`}
        >
          <Mail className="w-4 h-4 text-rose-400" />
          <span>Gmail Inbox</span>
        </button>

        <button
          disabled={!token}
          onClick={() => { triggerSensoryFeedback('click', accSettings); setWorkspaceTab('drive'); }}
          className={`px-4.5 py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl shrink-0 transition-all flex items-center gap-2 ${
            !token ? 'opacity-40 cursor-not-allowed' : ''
          } ${
            workspaceTab === 'drive' 
              ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' 
              : 'text-zinc-400 hover:text-white bg-zinc-800'
          }`}
        >
          <FolderOpen className="w-4 h-4 text-cyan-400" />
          <span>Google Drive</span>
        </button>

        <button
          disabled={!token}
          onClick={() => { triggerSensoryFeedback('click', accSettings); setWorkspaceTab('sheets'); }}
          className={`px-4.5 py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl shrink-0 transition-all flex items-center gap-2 ${
            !token ? 'opacity-40 cursor-not-allowed' : ''
          } ${
            workspaceTab === 'sheets' 
              ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' 
              : 'text-zinc-400 hover:text-white bg-zinc-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-green-400" />
          <span>Google Sheets</span>
        </button>
      </div>

      {/* VIEWPORT CONTROLLER CONTENT */}
      <div className="space-y-6">
        
        {/* TAB 1: STATUS AND LOGIN CARD */}
        {workspaceTab === 'status' && (
          <div className="space-y-6">
            <div className="bg-zinc-950 border-2 border-zinc-850 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full ${token ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                  <span className="text-xs font-black uppercase tracking-wider font-mono text-zinc-300">
                    Estabilidade de Sincronia
                  </span>
                </div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight font-mono">
                  {token ? 'Conectado de Forma Segura' : 'Aguardando Credencial de Autenticação'}
                </h3>
                <p className="text-xs text-zinc-400 max-w-xl">
                  Sua integração com Google Workspace está {token ? 'totalmente ativa em memória dinâmica' : 'inativa'}. Ao se conectar, você capacita o CRM para carregar e exportar leads em planilhas, agendar visitas comerciais na agenda do Google Calendar e responder e-mails legítimos via Gmail.
                </p>
              </div>

              <div className="shrink-0">
                {token ? (
                  <div className="flex items-center gap-3">
                    {googleUser?.photoURL && (
                      <img 
                        src={googleUser.photoURL} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full border-2 border-zinc-900 shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div>
                      <h4 className="text-xs font-black text-white font-mono">{googleUser?.displayName}</h4>
                      <p className="text-[10px] text-zinc-400 font-mono italic">{googleUser?.email}</p>
                    </div>
                    <button
                      onClick={handleDisconnectWorkspace}
                      className="ml-2 px-3 py-2 bg-rose-950/40 text-rose-400 border border-rose-900 rounded-xl text-[10px] font-bold uppercase font-mono hover:bg-rose-900 hover:text-white transition-all cursor-pointer"
                    >
                      Desconectar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectWorkspace}
                    disabled={isAuthorizing}
                    className="flex items-center gap-2 px-5 py-3.5 bg-white text-zinc-950 hover:bg-zinc-50 border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(30,58,138,1)] text-xs font-black uppercase tracking-wider font-mono rounded-xl hover:translate-y-[-1px] transition-all cursor-pointer"
                  >
                    <Key className="w-4 h-4 text-indigo-600" />
                    <span>{isAuthorizing ? 'Conectando...' : 'Conectar Google Workspace'}</span>
                  </button>
                )}
              </div>
            </div>

            {errorHeader && (
              <div className="p-4 bg-rose-950/40 border-2 border-rose-900 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-sans font-bold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorHeader}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-zinc-950 border border-zinc-850 p-4.5 rounded-2xl space-y-1.5">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <h4 className="text-xs font-black uppercase text-zinc-200 font-mono">Google Calendar</h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                  Liste compromissos operacionais, veja horários vagos e agende visitas imobiliárias que registram diretamente no seu celular.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-850 p-4.5 rounded-2xl space-y-1.5">
                <Mail className="w-5 h-5 text-rose-400" />
                <h4 className="text-xs font-black uppercase text-zinc-200 font-mono">Gmail Real-Time</h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                  Sincronize sua Inbox de leads, envie emails profissionais usando seus templates do CRM cicloCRED e guarde tudo com bipes.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-850 p-4.5 rounded-2xl space-y-1.5">
                <FolderOpen className="w-5 h-5 text-cyan-400" />
                <h4 className="text-xs font-black uppercase text-zinc-200 font-mono">Google Drive</h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                  Salve relatórios estruturados de performance e tabelas de faturamento mensais diretamente no armazenamento em nuvem.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-850 p-4.5 rounded-2xl space-y-1.5">
                <FileSpreadsheet className="w-5 h-5 text-green-400" />
                <h4 className="text-xs font-black uppercase text-zinc-200 font-mono">Google Sheets</h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                  Faça importações massivas de carteiras de leads ou exporte todo o seu funil de clientes cadastrados do banco em 1 clique.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GOOGLE CALENDAR VIEW */}
        {workspaceTab === 'calendar' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <div className="space-y-1">
                <h3 className="text-md font-black uppercase font-mono tracking-tight text-white flex items-center gap-1.5">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <span>Sincronizador de Agenda Real</span>
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase font-mono">
                  ▼ Lista de compromissos oficiais e agendamentos diretos do Google Calendar
                </p>
              </div>
              <button
                onClick={() => { triggerSensoryFeedback('click', accSettings); setModalType('calendar'); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[10px] tracking-wide uppercase font-mono border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agendar com Google</span>
              </button>
            </div>

            {isLoadingEvents ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                <p className="text-xs font-mono font-bold uppercase tracking-widest">Carregando eventos remotos...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-14 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-2">
                <Clock className="w-10 h-10 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-black text-zinc-300 font-mono uppercase">Nenhum evento futuro encontrado</h4>
                <p className="text-[10px] text-zinc-500 max-w-sm mx-auto">
                  Sua agenda oficial do Google Calendar está livre para novas visitas! Use o botão de agendamento acima para programar reuniões.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((evt: any) => {
                  const startStr = evt.start?.dateTime || evt.start?.date || '';
                  const endStr = evt.end?.dateTime || evt.end?.date || '';
                  const formattedStart = startStr ? new Date(startStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Dia todo';
                  
                  return (
                    <div key={evt.id} className="bg-zinc-950 border-2 border-zinc-850 p-4 rounded-xl flex flex-col justify-between hover:border-emerald-600 transition-all space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-mono font-black bg-emerald-950/60 text-emerald-400 border border-emerald-900 rounded px-2 py-0.5 uppercase">
                            Google Event
                          </span>
                          <span className="text-[10px] font-sans text-zinc-400 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            {formattedStart}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white font-mono uppercase tracking-tight truncate">
                          {evt.summary || 'Sem Título'}
                        </h4>
                        {evt.description && (
                          <p className="text-[10px] text-zinc-400 line-clamp-2">
                            {evt.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-zinc-900 flex justify-end">
                        {evt.htmlLink && (
                          <a 
                            href={evt.htmlLink} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[9px] font-extrabold uppercase font-mono text-emerald-400 flex items-center gap-1 hover:underline"
                          >
                            <Link2 className="w-3 h-3" />
                            <span>Ver no Calendar</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GMAIL INBOX */}
        {workspaceTab === 'gmail' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <div className="space-y-1">
                <h3 className="text-md font-black uppercase font-mono tracking-tight text-white flex items-center gap-1.5">
                  <Mail className="w-5 h-5 text-rose-400" />
                  <span>Legítimo Correio Gmail</span>
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase font-mono">
                  ▼ Últimos e-mails recebidos na caixa corporativa do seu Gmail
                </p>
              </div>
              <button
                onClick={() => { triggerSensoryFeedback('click', accSettings); setModalType('gmail'); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-[10px] tracking-wide uppercase font-mono border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Escrever E-mail</span>
              </button>
            </div>

            {isLoadingEmails ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400">
                <RefreshCw className="w-8 h-8 animate-spin text-rose-400" />
                <p className="text-xs font-mono font-bold uppercase tracking-widest">Acessando servidores do Gmail...</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-14 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-2">
                <Inbox className="w-10 h-10 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-black text-zinc-300 font-mono uppercase">Inbox vazia ou sem novos e-mails</h4>
                <p className="text-[10px] text-zinc-500 max-w-sm mx-auto">
                  Sua caixa postal do Gmail está limpa! Quaisquer discussões ou contatos com leads imobiliários podem ser monitorados diretamente aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {emails.map((msg: any) => (
                  <div key={msg.id} className="bg-zinc-950 border-2 border-zinc-850 p-4 rounded-xl flex flex-col justify-between hover:border-rose-600 transition-all space-y-2.5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-[10px] font-mono">
                      <span className="font-sans font-black text-zinc-200 uppercase tracking-tight text-xs truncate max-w-xs block">
                        De: {msg.from}
                      </span>
                      <span className="text-zinc-500 font-bold block shrink-0">{msg.date}</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white font-mono uppercase tracking-tight">
                        {msg.subject || '(Sem assunto)'}
                      </h4>
                      <p className="text-xs text-zinc-400 leading-normal line-clamp-2 italic font-sans">
                        "{msg.snippet}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GOOGLE DRIVE FILES */}
        {workspaceTab === 'drive' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
              <div className="space-y-1">
                <h3 className="text-md font-black uppercase font-mono tracking-tight text-white flex items-center gap-1.5">
                  <FolderOpen className="w-5 h-5 text-cyan-400" />
                  <span>Explorador de Arquivos Drive</span>
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase font-mono">
                  ▼ Envie e gerencie documentos oficiais, relatórios e manuais cicloCRED
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Pesquisar arquivo..."
                    value={fileSearch}
                    onChange={(e) => setFileSearch(e.target.value)}
                    className="bg-zinc-950 border-2 border-zinc-850 rounded-lg py-1.5 pl-8 pr-3 text-xs font-bold text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-zinc-500 absolute left-2.5 top-2.5" />
                </div>

                <button
                  onClick={() => { triggerSensoryFeedback('click', accSettings); setModalType('drive'); }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-lg text-[10px] tracking-wide uppercase font-mono border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Exportar Relatório</span>
                </button>
              </div>
            </div>

            {isLoadingFiles ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                <p className="text-xs font-mono font-bold uppercase tracking-widest">Escaneando volume em nuvem...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-14 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-2">
                <Inbox className="w-10 h-10 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-black text-zinc-300 font-mono uppercase">Nenhum arquivo encontrado</h4>
                <p className="text-[10px] text-zinc-500 max-w-sm mx-auto">
                  Você não enviou ou não possui arquivos em nuvem que combinem com a busca. Exporte um relatório txt acima para começar!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {filteredFiles.map((file: any) => (
                  <div key={file.id} className="bg-zinc-950 border-2 border-zinc-850 p-4 rounded-xl flex flex-col justify-between hover:border-cyan-600 transition-all space-y-3">
                    <div className="space-y-1">
                      <div className="text-[9px] font-mono font-black text-zinc-500 tracking-wider truncate mb-1">
                        MODIFICADO EM: {new Date(file.modifiedTime).toLocaleDateString('pt-BR')}
                      </div>
                      <h4 className="text-xs font-black text-white font-mono uppercase truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono uppercase truncate">
                        {file.mimeType.split('/').pop() || 'Desconhecido'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-900 flex justify-end">
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] font-extrabold uppercase font-mono text-cyan-400 flex items-center gap-1 hover:underline"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Abrir Link</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: GOOGLE SHEETS IMPORT & EXPORT */}
        {workspaceTab === 'sheets' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
              <div className="space-y-1">
                <h3 className="text-md font-black uppercase font-mono tracking-tight text-white flex items-center gap-1.5">
                  <FileSpreadsheet className="w-5 h-5 text-green-400" />
                  <span>Importador & Exportador cicloCRED</span>
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase font-mono">
                  ▼ Transfira suas dezenas de leads entre o banco CRM e planilhas Google Sheets legitimas
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { triggerSensoryFeedback('click', accSettings); setModalType('sheets_import'); }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-black rounded-lg text-[10px] tracking-wide uppercase font-mono border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Importar Planilha</span>
                </button>

                <button
                  onClick={handleExportLeadsToNewSheet}
                  disabled={isLoadingSheets || leads.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-[10px] tracking-wide uppercase font-mono border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Exportar Leads ({leads.length})</span>
                </button>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-400" />
                <h4 className="text-sm font-sans font-black text-green-400 uppercase tracking-tight">Manual de Colunas da Planilha (Importante)</h4>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                Para o importador cicloCRED CRM funcionar perfeitamente, a planilha selecionada deve possuir as colunas preenchidas preferencialmente na primeira linha de cabeçalho, com os dados das linhas em sequência correspondente:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-mono text-zinc-400 uppercase">
                <div className="p-2 border border-zinc-850 bg-zinc-900 rounded">Coluna A: Nome do Lead</div>
                <div className="p-2 border border-zinc-850 bg-zinc-900 rounded">Coluna B: E-mail</div>
                <div className="p-2 border border-zinc-850 bg-zinc-900 rounded">Coluna C: Telefone</div>
                <div className="p-2 border border-zinc-850 bg-zinc-900 rounded">Coluna D: Renda Familiar</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* WORKSPACE OPERATIONS MODAL SUB-BLOCK */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-xs select-none">
          <div className="w-full max-w-lg bg-zinc-900 border-4 border-zinc-950 p-6 rounded-3xl space-y-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-zinc-100">
            
            <div className="flex justify-between items-center border-b-2 border-zinc-950 pb-2">
              <h3 className="text-sm font-black uppercase font-mono text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>
                  {modalType === 'calendar' && 'Agendar Evento no Google Calendar'}
                  {modalType === 'gmail' && 'Escrever e Enviar E-mail Legítimo'}
                  {modalType === 'drive' && 'Exportar Relatório em Nuvem (Drive)'}
                  {modalType === 'sheets_import' && 'Importar Leads do Google Sheets'}
                </span>
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="text-zinc-400 hover:text-white font-black font-mono text-lg"
              >
                ✕
              </button>
            </div>

            {/* A. AGENDAR NO GOOGLE CALENDAR FORM */}
            {modalType === 'calendar' && (
              <form onSubmit={handleCreateCalendarEvent} className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-zinc-400 block">Título do Evento imobiliário</label>
                  <input
                    type="text"
                    required
                    value={apptForm.title}
                    onChange={(e) => setApptForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Visita ao Lote Virgem 5"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-sans font-bold text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-zinc-400 block">Dia do Evento</label>
                    <input
                      type="date"
                      required
                      value={apptForm.date}
                      onChange={(e) => setApptForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-bold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-zinc-400 block">Hora</label>
                    <input
                      type="time"
                      required
                      value={apptForm.time}
                      onChange={(e) => setApptForm(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 animation-flow-styled">
                    <label className="text-[10px] uppercase font-black text-zinc-400 block">Lead Associado</label>
                    <select
                      value={apptForm.leadId}
                      onChange={(e) => setApptForm(prev => ({ ...prev, leadId: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 font-bold focus:outline-none focus:border-indigo-600"
                    >
                      <option value="">-- Selecione o Lead --</option>
                      {leads.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-zinc-400 block">Duração (Minutos)</label>
                    <input
                      type="number"
                      required
                      value={apptForm.durationMinutes}
                      onChange={(e) => setApptForm(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 60 }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-zinc-400 block">Descrição Interna / Observações</label>
                  <textarea
                    value={apptForm.description}
                    onChange={(e) => setApptForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Notas importantes sobre o lote ou portabilidade Caixa..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 h-20 font-sans text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3 font-mono">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 rounded-lg uppercase font-bold text-[10px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg border border-zinc-950 font-bold text-[10px] uppercase"
                  >
                    Confirmar e Agendar
                  </button>
                </div>
              </form>
            )}

            {/* B. ENVIAR E-MAIL COM GMAIL FORM */}
            {modalType === 'gmail' && (
              <form onSubmit={handleSendGmail} className="space-y-4 text-xs font-mono">
                
                {/* Loader do Template selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-zinc-400 block">Carregar Modelo de E-mail</label>
                  <select
                    value={emailForm.templateId}
                    onChange={(e) => {
                      const tId = e.target.value;
                      const selected = templates.find(t => t.id === tId);
                      if (selected) {
                        setEmailForm(prev => ({
                          ...prev,
                          templateId: tId,
                          subject: selected.subject,
                          body: selected.body
                        }));
                      } else {
                        setEmailForm(prev => ({ ...prev, templateId: '' }));
                      }
                    }}
                    className="w-full bg-zinc-950 border border-zinc-880 rounded-lg p-2.5 text-zinc-100 font-bold focus:outline-none"
                  >
                    <option value="">-- Escrever E-mail em Branco --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-zinc-400 block">Para (E-mail de Destino)</label>
                  <input
                    type="email"
                    required
                    value={emailForm.to}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="cliente@email.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-bold text-zinc-100 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-zinc-400 block">Assunto Oficial</label>
                  <input
                    type="text"
                    required
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Ex: Confirmação de Portabilidade cicloCRED"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-bold text-zinc-100 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-zinc-400 block">Mensagem (Corpo do E-mail HTML)</label>
                  <textarea
                    required
                    value={emailForm.body}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Prezado cliente, informamos que as taxas imobiliárias..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 h-32 font-sans text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3 font-mono">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 rounded-lg uppercase font-bold text-[10px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg border border-zinc-950 font-bold text-[10px] uppercase"
                  >
                    Confirmar e Enviar
                  </button>
                </div>
              </form>
            )}

            {/* C. DRIVER EXPORT EXPORT FILES FORM */}
            {modalType === 'drive' && (
              <form onSubmit={handleUploadReportToDrive} className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-zinc-400 block">Título do Relatório (.txt)</label>
                  <input
                    type="text"
                    required
                    value={exportForm.title}
                    onChange={(e) => setExportForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Faturamento cicloCRED Maio"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-bold text-zinc-100 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-zinc-400 block">Conteúdo Escrito / Notas do Faturamento</label>
                  <textarea
                    required
                    value={exportForm.content}
                    onChange={(e) => setExportForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Nesta data de faturamento, obtivemos uma meta concluída com o total de R$ 450.000 em propostas..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 h-44 font-sans text-zinc-100 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 rounded-lg uppercase font-bold text-[10px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg border border-zinc-950 font-bold text-[10px] uppercase"
                  >
                    Enviar para Nuvem
                  </button>
                </div>
              </form>
            )}

            {/* D. SHEETS FILE CHOOSE & COLP REVIEW MODAL */}
            {modalType === 'sheets_import' && (
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-zinc-400 block">Selecione uma Planilha do seu Google Drive</label>
                  {sheetsList.length === 0 ? (
                    <div className="p-4 bg-zinc-950 rounded text-center text-zinc-500 font-mono italic">
                      Não há nenhuma planilha ativa encontrada na raiz da sua conta Google.
                    </div>
                  ) : (
                    <div className="space-y-2 border-2 border-zinc-950 max-h-40 overflow-y-auto p-1 bg-zinc-950 rounded-xl">
                      {sheetsList.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handlePreviewLeadsFromSheet(item.id)}
                          className={`w-full text-left p-2.5 text-[11px] rounded transition-all font-mono uppercase flex justify-between ${
                            selectedSheetId === item.id 
                              ? 'bg-green-950/60 text-green-400 border border-green-900 font-black' 
                              : 'text-zinc-300 hover:bg-zinc-900'
                          }`}
                        >
                          <span>{item.name}</span>
                          <span className="text-[9px] text-zinc-500">
                            {new Date(item.modifiedTime).toLocaleDateString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {importedLeadsPreview.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-zinc-950 p-2.5 border border-zinc-850 rounded">
                      <span className="text-[10px] font-black uppercase text-green-400 flex items-center gap-1">
                        <FileCheck2 className="w-3.5 h-3.5 text-green-400" />
                        <span>Pronto para Injetar: {importedLeadsPreview.length} Leads</span>
                      </span>
                    </div>

                    <div className="max-h-32 overflow-y-auto border border-zinc-850 p-1 rounded space-y-1.5">
                      {importedLeadsPreview.map((lead, idx) => (
                        <div key={idx} className="p-2 border border-zinc-850 bg-zinc-900 text-[10px] flex justify-between rounded">
                          <span className="font-sans font-black text-white">{lead.name}</span>
                          <span className="text-zinc-500 font-sans">{lead.email}</span>
                          <span className="text-green-500 font-bold">R$ {lead.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => { setImportedLeadsPreview([]); setSelectedSheetId(''); }}
                        className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 rounded font-bold uppercase text-[9px]"
                      >
                        Limpar
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmLeadsImport}
                        className="px-4.5 py-1.5 bg-green-600 hover:bg-green-700 text-white border border-zinc-950 rounded font-bold uppercase text-[9px]"
                      >
                        Confirmar Importação Legítima
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export function getWorkspaceToken(): string | null {
  const user = auth.currentUser;
  if (!user) return null;
  return tokenCacheByUid[user.uid] || null;
}

export async function syncCRMMovementToGoogleSheet(action: string, details: string, userName: string = 'Especialista'): Promise<boolean> {
  const token = getWorkspaceToken();
  if (!token) {
    console.warn("No Google Workspace token found for Sheets Real-time Sync.");
    return false;
  }

  try {
    let spreadsheetId = localStorage.getItem('ciclocred_sheets_sync_id');
    
    // If we don't have a spreadsheet yet, create one
    if (!spreadsheetId) {
      const title = `Movimentações Realtime CRM cicloCRED`;
      const createRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: { title }
        })
      });

      if (!createRes.ok) {
        throw new Error('Falha ao instanciar arquivo de planilha para sincronização realtime.');
      }

      const sheetInfo = await createRes.json();
      spreadsheetId = sheetInfo.spreadsheetId;
      localStorage.setItem('ciclocred_sheets_sync_id', spreadsheetId || '');

      // Add Headers initially
      const headers = [['Data e Hora', 'Ação / Movimentação', 'Detalhes da Operação', 'Usuário / Autor']];
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values: headers })
        }
      );
    }

    // Now append the single movement row
    const row = [
      new Date().toLocaleString('pt-BR'),
      action,
      details,
      userName
    ];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [row] })
      }
    );

    return response.ok;
  } catch (err) {
    console.error("Sheets Real-time Sync Error:", err);
    return false;
  }
}

export async function sendGmailMessage(subject: string, body: string, toEmail: string): Promise<boolean> {
  const token = getWorkspaceToken();
  if (!token) {
    console.warn("No Google Workspace token found for Gmail.");
    return false;
  }
  
  try {
    const rawMsg = [
      `To: ${toEmail}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      body
    ].join('\r\n');
    
    const base64SafeMsg = btoa(unescape(encodeURIComponent(rawMsg)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
      
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: base64SafeMsg })
    });
    
    return response.ok;
  } catch (err) {
    console.error("Gmail Send Error:", err);
    return false;
  }
}

export async function createGoogleCalendarEvent(title: string, description: string, date: string, time: string, durationMinutes: number): Promise<boolean> {
  const token = getWorkspaceToken();
  if (!token) {
    console.warn("No Google Workspace token found for Calendar.");
    return false;
  }
  
  try {
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
    
    const event = {
      summary: title,
      description: description,
      start: { dateTime: startDateTime.toISOString() },
      end: { dateTime: endDateTime.toISOString() }
    };
    
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    
    return response.ok;
  } catch (err) {
    console.error("Calendar Create Event Error:", err);
    return false;
  }
}

export async function uploadFileToGoogleDrive(filename: string, content: string, mimeType: string = 'text/plain'): Promise<boolean> {
  const token = getWorkspaceToken();
  if (!token) {
    console.warn("No Google Workspace token found for Drive Upload.");
    return false;
  }
  
  try {
    const metadata = {
      name: filename,
      mimeType: mimeType
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: mimeType }));
    
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });
    
    return response.ok;
  } catch (err) {
    console.error("Drive upload Error:", err);
    return false;
  }
}

