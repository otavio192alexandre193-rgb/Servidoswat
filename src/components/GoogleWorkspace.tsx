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
  Inbox,
  Video,
  Users,
  Contact,
  UserPlus,
  BookOpen
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
  const [workspaceTab, setWorkspaceTab] = useState<'status' | 'calendar' | 'gmail' | 'drive' | 'sheets' | 'contacts'>('status');

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

  // Contacts States
  const [googleContacts, setGoogleContacts] = useState<any[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [isSyncingContacts, setIsSyncingContacts] = useState(false);
  const [contactsSubTab, setContactsSubTab] = useState<'google' | 'export_crm'>('google');

  // Instant Meet States
  const [instantMeetUrl, setInstantMeetUrl] = useState<string | null>(null);
  const [isCreatingInstantMeet, setIsCreatingInstantMeet] = useState(false);

  // Mutating Action state variables (interactive Forms)
  const [modalType, setModalType] = useState<'calendar' | 'gmail' | 'drive' | 'sheets_import' | 'sheets_export' | null>(null);
  
  // Hybrid database sync states
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(() => localStorage.getItem('ciclocred_sheets_autosync_enabled') === 'true');
  const [syncSpreadsheetId, setSyncSpreadsheetId] = useState(() => localStorage.getItem('ciclocred_workspace_db_sheet_id') || '');
  const [isPerformingSync, setIsPerformingSync] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  
  // Create Calendar Event Form
  const [apptForm, setApptForm] = useState({
    title: '',
    leadId: '',
    date: new Date().toISOString().substring(0, 10),
    time: '14:00',
    description: '',
    durationMinutes: 60,
    createMeet: true
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
        let resolvedToken = tokenCacheByUid[user.uid] || null;
        if (!resolvedToken) {
          resolvedToken = localStorage.getItem(`ciclocred_workspace_token_${user.uid}`);
          if (resolvedToken) {
            tokenCacheByUid[user.uid] = resolvedToken;
          }
        }
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
      } else if (workspaceTab === 'contacts') {
        fetchGoogleContacts();
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
      provider.addScope('https://www.googleapis.com/auth/contacts');
      provider.addScope('https://www.googleapis.com/auth/meetings.space.created');

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Falha ao obter o token de acesso Google Workspace.');
      }

      tokenCacheByUid[result.user.uid] = credential.accessToken;
      localStorage.setItem(`ciclocred_workspace_token_${result.user.uid}`, credential.accessToken);
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
      localStorage.removeItem(`ciclocred_workspace_token_${googleUser.uid}`);
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
      
      const conferenceData = apptForm.createMeet ? {
        createRequest: {
          requestId: `meet-request-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      } : undefined;

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
        },
        conferenceData: conferenceData
      };

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events` + (apptForm.createMeet ? `?conferenceDataVersion=1` : '');

      const res = await fetch(url, {
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

      let meetLink = '';
      if (createdEvent.conferenceData && createdEvent.conferenceData.entryPoints) {
        const videoEntryPoint = createdEvent.conferenceData.entryPoints.find(
          (ep: any) => ep.entryPointType === 'video'
        );
        if (videoEntryPoint) {
          meetLink = videoEntryPoint.uri;
        }
      }

      // Find selected lead name
      const matchedLead = leads.find(l => l.id === apptForm.leadId);
      const leadName = matchedLead ? matchedLead.name : 'Outro / Sem Lead';

      // Insert local appointment in CRM State as well
      const descWithMeet = (apptForm.description || '') + 
        (meetLink ? `\n\n🎥 LINK DO MEET NOVO: ${meetLink}` : '') + 
        ` (Link da agenda: ${createdEvent.htmlLink})`;

      const newLocalAppt: Appointment = {
        id: `google-appt-${createdEvent.id}`,
        leadId: apptForm.leadId || 'outro',
        leadName: leadName,
        title: apptForm.title,
        date: apptForm.date,
        time: apptForm.time,
        description: descWithMeet,
        status: 'agendado',
        type: 'reuniao'
      };

      setAppointments(prev => [newLocalAppt, ...prev]);
      addNotification(
        '📆 COMPROMISSO INTEGRADO',
        `Evento criado no seu Google Calendar para ${apptForm.date}!${meetLink ? ' Sala de vídeo Google Meet gerada!' : ''}`,
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
        durationMinutes: 60,
        createMeet: true
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

  // Fetch connections contacts
  const fetchGoogleContacts = async () => {
    if (!token) return;
    setIsLoadingContacts(true);
    try {
      const res = await fetch(
        `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=100`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.status === 401) {
        handleTokenExpired();
        return;
      }
      const data = await res.json();
      const connections = data.connections || [];
      const formatted = connections.map((conn: any) => {
        const nameObj = conn.names?.[0] || {};
        const emailObj = conn.emailAddresses?.[0] || {};
        const phoneObj = conn.phoneNumbers?.[0] || {};
        return {
          resourceName: conn.resourceName,
          name: nameObj.displayName || 'Sem Nome',
          email: emailObj.value || '',
          phone: phoneObj.value || ''
        };
      });
      setGoogleContacts(formatted);
    } catch (err) {
      console.error('Error fetching google contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Export single CRM Lead to Google Contacts (People API)
  const handleExportLeadToContacts = async (lead: Lead) => {
    if (!token) return;
    triggerSensoryFeedback('click', accSettings);

    const isConfirmed = window.confirm(
      `Deseja realmente cadastrar o Lead "${lead.name}" (${lead.phone || 'Sem telefone'}) nos Contatos de sua Conta Google?`
    );
    if (!isConfirmed) return;

    try {
      const body = {
        names: [{ givenName: lead.name }],
        emailAddresses: lead.email ? [{ value: lead.email }] : [],
        phoneNumbers: lead.phone ? [{ value: lead.phone, type: 'mobile' }] : [],
        biographies: [{ value: `Lead CRM cicloCRED. Origem: ${lead.origin}. Renda: R$ ${lead.familyIncome || 0}. Status: ${lead.status.toUpperCase()}. Notas: ${lead.notes || ''}` }]
      };

      const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        throw new Error('Falha ao registrar novo contato na API Google People.');
      }

      addNotification(
        '👤 LEAD SALVO NO TELEFONE via Google',
        `Lead "${lead.name}" agora é um contato seguro do seu Google Contacts!`,
        'success'
      );
      awardXP(80);
      triggerSensoryFeedback('success', accSettings);
      fetchGoogleContacts();
    } catch (err: any) {
      alert(`Falha ao exportar contato: ${err.message}`);
    }
  };

  // Import Google Contact as Lead in CRM
  const handleImportContactAsLead = (contact: any) => {
    // Check if phone or email is already registered
    const isDuplicate = leads.some(
      l => (contact.phone && l.phone === contact.phone) || (contact.email && l.email === contact.email)
    );

    if (isDuplicate) {
      const proceed = window.confirm(
        `Aviso: O contato "${contact.name}" possui e-mail ou telefone idêntico a um Lead existente no seu CRM. Deseja importá-lo mesmo assim?`
      );
      if (!proceed) return;
    }

    const newLead: Lead = {
      id: `google-contact-${Date.now()}`,
      name: contact.name,
      email: contact.email || 'sem@email.com',
      phone: contact.phone || '(11) 99999-9999',
      familyIncome: 4500,
      value: 120000,
      status: 'novo',
      notes: `Importado diretamente do Google Contacts pessoal do usuário.`,
      origin: 'Google Contacts',
      createdAt: new Date().toISOString().substring(0, 10)
    };

    setLeads(prev => [newLead, ...prev]);
    addNotification(
      '📥 CONTATO IMPORTADO',
      `${contact.name} foi adicionado à sua lista de Leads CRM!`,
      'success'
    );
    awardXP(100);
    triggerSensoryFeedback('success', accSettings);
  };

  // Create instant Meet meeting link
  const handleCreateInstantGoogleMeet = async () => {
    if (!token) return;
    setIsCreatingInstantMeet(true);
    triggerSensoryFeedback('click', accSettings);
    try {
      const now = new Date();
      const calculatedStart = now.toISOString();
      const dateEndObj = new Date(now.getTime() + 60 * 60000); // 1 hour duration
      const calculatedEnd = dateEndObj.toISOString();

      const body = {
        summary: `Reunião Instantânea cicloCRED`,
        description: `Sala de videoconferência instantânea criada via CRM cicloCRED.`,
        start: {
          dateTime: calculatedStart,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: calculatedEnd,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        conferenceData: {
          createRequest: {
            requestId: `meet-instant-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      };

      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        throw new Error('Falha ao instanciar o link no Google Calendar.');
      }

      const createdEvent = await res.json();
      let meetLink = '';
      if (createdEvent.conferenceData && createdEvent.conferenceData.entryPoints) {
        const videoEntryPoint = createdEvent.conferenceData.entryPoints.find(
          (ep: any) => ep.entryPointType === 'video'
        );
        if (videoEntryPoint) {
          meetLink = videoEntryPoint.uri;
        }
      }

      if (meetLink) {
        setInstantMeetUrl(meetLink);
        addNotification(
          '🎥 SALA GOOGLE MEET GERADA',
          'Sua sala de videoconferência instantânea está ativa e pronta!',
          'success'
        );
        awardXP(100);
        triggerSensoryFeedback('success', accSettings);
      } else {
        throw new Error('A API retornou sucesso mas não gerou o link do Meet.');
      }
    } catch (err: any) {
      alert(`Falha ao gerar reunião instantânea: ${err.message}`);
    } finally {
      setIsCreatingInstantMeet(false);
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

  const addSyncLog = (msg: string) => {
    setSyncLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 25)]);
  };

  // Create Hybrid Workspace Database
  const handleCreateSyncSpreadsheet = async (): Promise<string | null> => {
    if (!token) return null;
    try {
      const title = `cicloCRED CRM - Banco de Dados Híbrido Sincronizado`;
      addSyncLog('Enviando solicitação ao Google Sheets para criar banco híbrido...');
      const createRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: { title },
          sheets: [
            { properties: { title: 'Leads' } },
            { properties: { title: 'Agenda' } },
            { properties: { title: 'Atividades' } },
            { properties: { title: 'Simulacoes' } }
          ]
        })
      });

      if (!createRes.ok) {
        throw new Error('Falha ao instanciar o arquivo no Google Sheets via REST API.');
      }

      const sheetInfo = await createRes.json();
      const spreadsheetId = sheetInfo.spreadsheetId;
      localStorage.setItem('ciclocred_workspace_db_sheet_id', spreadsheetId || '');
      setSyncSpreadsheetId(spreadsheetId || '');
      addSyncLog(`Nova planilha de Sincronia gerada com sucesso! ID: ${spreadsheetId}`);
      return spreadsheetId;
    } catch (e: any) {
      console.error("Error creating synced database spreadsheet:", e);
      addSyncLog(`❌ Erro criando Planilha: ${e.message}`);
      return null;
    }
  };

  // Upload database to Sheets
  const forceCompleteUploadToSheets = async () => {
    if (!token) return;
    triggerSensoryFeedback('click', accSettings);
    
    let activeSheetId = syncSpreadsheetId;
    setIsPerformingSync(true);
    addSyncLog('Iniciando exportação de emergência ao banco de planilhas...');

    try {
      if (!activeSheetId) {
        activeSheetId = await handleCreateSyncSpreadsheet() || '';
        if (!activeSheetId) throw new Error("Não foi possível gerar a planilha de sincronia.");
      }

      addSyncLog('Planilha conectada: ' + activeSheetId);

      // --- LEADS ---
      addSyncLog('Sincronizando Leads...');
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${activeSheetId}/values/Leads!A1:K1000:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const leadsValues = [
        ['ID', 'Nome', 'E-mail', 'Telefone', 'Empresa', 'Valor Pipeline', 'Status', 'Origem', 'Data Criação', 'Último Contato', 'Notas']
      ];
      leads.forEach(l => {
        leadsValues.push([
          l.id,
          l.name,
          l.email || '',
          l.phone || '',
          l.company || '',
          String(l.value || 0),
          l.status || 'novo',
          l.origin || '',
          l.createdAt || '',
          l.lastContactAt || '',
          l.notes || ''
        ]);
      });
      const leadsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${activeSheetId}/values/Leads!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ range: 'Leads!A1', majorDimension: 'ROWS', values: leadsValues })
      });
      if (!leadsRes.ok) throw new Error("Falha ao sincronizar aba Leads.");

      // --- AGENDA ---
      addSyncLog('Sincronizando Agenda...');
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${activeSheetId}/values/Agenda!A1:I1000:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const apptsValues = [
        ['ID', 'Título', 'Data', 'Hora', 'Lead ID', 'Lead Nome', 'Descrição', 'Status', 'Tipo']
      ];
      appointments.forEach(a => {
        apptsValues.push([
          a.id,
          a.title,
          a.date,
          a.time,
          a.leadId || '',
          a.leadName || '',
          a.description || '',
          a.status || 'agendado',
          a.type || 'outro'
        ]);
      });
      const apptsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${activeSheetId}/values/Agenda!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ range: 'Agenda!A1', majorDimension: 'ROWS', values: apptsValues })
      });
      if (!apptsRes.ok) throw new Error("Falha ao sincronizar aba Agenda.");

      // --- ATIVIDADES ---
      addSyncLog('Sincronizando Atividades e Históricos...');
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${activeSheetId}/values/Atividades!A1:G1000:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const logsValues = [
        ['ID', 'Lead ID', 'Lead Nome', 'Assunto', 'Mensagem', 'Data Disparo', 'Status']
      ];
      emailLogs.forEach(g => {
        logsValues.push([
          g.id,
          g.leadId || '',
          g.leadName || '',
          g.templateName || '',
          g.body || '',
          g.sentAt || '',
          g.status || 'enviado'
        ]);
      });
      const logsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${activeSheetId}/values/Atividades!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ range: 'Atividades!A1', majorDimension: 'ROWS', values: logsValues })
      });
      if (!logsRes.ok) throw new Error("Falha ao sincronizar aba Atividades.");

      addSyncLog('Replicação e failover gerados com sucesso!');
      addNotification('🗄️ REPLICAÇÃO GOOGLE SUITE', 'Banco sincronizado com sucesso na planilha de backplane.', 'success');
      awardXP(200);
      triggerSensoryFeedback('success', accSettings);
    } catch (err: any) {
      addSyncLog('❌ ERRO: ' + err.message);
      alert(`Falha na exportação: ${err.message}`);
    } finally {
      setIsPerformingSync(false);
    }
  };

  // Download database from Sheets
  const forceCompleteDownloadFromSheets = async () => {
    if (!token) return;
    if (!syncSpreadsheetId) {
      alert("Por favor configure ou gere uma Planilha de Sincronia antes de carregar.");
      return;
    }
    const isConfirmed = window.confirm(
      "Isso vai SUBSTITUIR todos os seus Leads, Agenda e Atividades locais pelos registros importados da Planilha de Sincronia! Deseja continuar?"
    );
    if (!isConfirmed) return;

    triggerSensoryFeedback('click', accSettings);
    setIsPerformingSync(true);
    addSyncLog('Carregando contingência do Google Sheets...');

    try {
      // 1. Fetch Leads
      addSyncLog('Buscando Leads...');
      const leadsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${syncSpreadsheetId}/values/Leads!A2:K1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!leadsRes.ok) throw new Error("Aba 'Leads' não encontrada na planilha ativa.");
      const leadsData = await leadsRes.json();
      const leadsRows = leadsData.values || [];
      const parsedLeads: Lead[] = leadsRows.map((row: any, idx: number) => ({
        id: row[0] || `lead-sync-${Date.now()}-${idx}`,
        name: row[1] || 'Lead Sem Nome',
        email: row[2] || '',
        phone: row[3] || '',
        company: row[4] || '',
        value: row[5] ? parseFloat(row[5]) || 0 : 0,
        status: (row[6] || 'novo') as any,
        origin: row[7] || 'Planilha Sincronizada',
        createdAt: row[8] || new Date().toISOString().slice(0, 10),
        lastContactAt: row[9] || '',
        notes: row[10] || ''
      }));

      // 2. Fetch Appointments
      addSyncLog('Buscando compromissos da Agenda...');
      const apptsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${syncSpreadsheetId}/values/Agenda!A2:I1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!apptsRes.ok) throw new Error("Aba 'Agenda' não encontrada.");
      const apptsData = await apptsRes.json();
      const apptsRows = apptsData.values || [];
      const parsedAppts: Appointment[] = apptsRows.map((row: any, idx: number) => ({
        id: row[0] || `appt-sync-${Date.now()}-${idx}`,
        title: row[1] || 'Compromisso Importado',
        date: row[2] || new Date().toISOString().slice(0, 10),
        time: row[3] || '14:00',
        leadId: row[4] || '',
        leadName: row[5] || 'Lead',
        description: row[6] || '',
        status: (row[7] || 'agendado') as any,
        type: (row[8] || 'outro') as any
      }));

      // 3. Fetch Atividades
      addSyncLog('Buscando Histórico de Atividades...');
      const logsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${syncSpreadsheetId}/values/Atividades!A2:G1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!logsRes.ok) throw new Error("Aba 'Atividades' não encontrada.");
      const logsData = await logsRes.json();
      const logsRows = logsData.values || [];
      const parsedLogs: EmailLog[] = logsRows.map((row: any, idx: number) => ({
        id: row[0] || `log-sync-${Date.now()}-${idx}`,
        leadId: row[1] || '',
        leadName: row[2] || 'Lead',
        templateName: row[3] || 'Ação Sincronizada',
        subject: row[3] || 'Ação Sincronizada',
        body: row[4] || '',
        sentAt: row[5] || new Date().toISOString(),
        status: (row[6] || 'enviado') as any
      }));

      // Update states
      setLeads(parsedLeads);
      setAppointments(parsedAppts);
      setEmailLogs(parsedLogs);

      addSyncLog(`Contingência instalada! ${parsedLeads.length} Leads, ${parsedAppts.length} Compromissos, ${parsedLogs.length} Atividades restaurados!`);
      addNotification('🔄 CONTINGÊNCIA REESTABELECIDA', 'Banco recarregado com sucesso com os dados offline da planilha Google.', 'success');
      awardXP(250);
      triggerSensoryFeedback('success', accSettings);
    } catch (err: any) {
      addSyncLog('❌ ERRO NO RECUPERAMENTO: ' + err.message);
      alert(`Falha ao recuperar do Sheets: ${err.message}`);
    } finally {
      setIsPerformingSync(false);
    }
  };

  // Export entire CRM Lead list directly to Google Contacts folder
  const handleBatchExportLeadsToContacts = async () => {
    if (!token) return;
    const isConfirmed = window.confirm(`Deseja realmente arquivar todas as suas dezenas de leads (${leads.length}) diretamente na sua Conta do Google Contatos?`);
    if (!isConfirmed) return;

    triggerSensoryFeedback('click', accSettings);
    setIsSyncingContacts(true);
    let successCount = 0;
    try {
      for (const lead of leads) {
        try {
          const body = {
            names: [{ givenName: lead.name }],
            emailAddresses: lead.email ? [{ value: lead.email }] : [],
            phoneNumbers: lead.phone ? [{ value: lead.phone, type: 'mobile' }] : [],
            biographies: [{ value: `Lead CRM cicloCRED. Origem: ${lead.origin}. Renda: R$ ${lead.familyIncome || 0}. Status: ${lead.status.toUpperCase()}. Notas: ${lead.notes || ''}` }]
          };

          const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });
          if (res.ok) successCount++;
        } catch (e) {
          console.error("Erro exportando lead para contatos do G-Suite:", lead, e);
        }
      }
      addNotification('👥 CARTEIRA SALVA', `${successCount} Leads arquivados com sucesso em sua conta própria do Google Contatos!`, 'success');
      awardXP(150);
      triggerSensoryFeedback('success', accSettings);
      fetchGoogleContacts();
    } catch (err: any) {
      alert(`Falha ao arquivar carteira de contatos: ${err.message}`);
    } finally {
      setIsSyncingContacts(false);
    }
  };

  // Import all Google Contacts to CRM avoiding duplicates
  const handleImportAllContactsToCRM = () => {
    if (googleContacts.length === 0) {
      alert("Aviso: Nenhum contato do Google disponível para importação. Tente recarregar a lista.");
      return;
    }

    const isConfirmed = window.confirm(
      `Confirma a importação automática de todos os contatos do Google (${googleContacts.length}) para o seu CRM? O sistema verificará se já existem duplicatas comparando telefone ou e-mail.`
    );
    if (!isConfirmed) return;

    triggerSensoryFeedback('click', accSettings);
    let importedCount = 0;
    let duplicateCount = 0;
    const newLeadsToAdd: Lead[] = [];

    const normalizePhone = (p: string) => p ? p.replace(/[^\d]/g, '') : '';

    googleContacts.forEach(contact => {
      const emailLower = contact.email ? contact.email.toLowerCase().trim() : '';
      const phoneNorm = contact.phone ? normalizePhone(contact.phone) : '';

      // Check duplicate against current CRM leads
      const existsInCRM = leads.some(l => {
        const leadEmail = l.email ? l.email.toLowerCase().trim() : '';
        const leadPhone = l.phone ? normalizePhone(l.phone) : '';
        const emailMatch = emailLower && leadEmail && emailLower === leadEmail;
        const phoneMatch = phoneNorm && leadPhone && phoneNorm === leadPhone;
        return emailMatch || phoneMatch;
      });

      // Check if duplicate is already prepared inside this batch
      const existsInNew = newLeadsToAdd.some(l => {
        const leadEmail = l.email ? l.email.toLowerCase().trim() : '';
        const leadPhone = l.phone ? normalizePhone(l.phone) : '';
        const emailMatch = emailLower && leadEmail && emailLower === leadEmail;
        const phoneMatch = phoneNorm && leadPhone && phoneNorm === leadPhone;
        return emailMatch || phoneMatch;
      });

      if (existsInCRM || existsInNew) {
        duplicateCount++;
      } else {
        newLeadsToAdd.push({
          id: `google-contact-${Date.now()}-${importedCount}`,
          name: contact.name,
          email: contact.email || 'sem@email.com',
          phone: contact.phone || '(11) 99999-9999',
          familyIncome: 4500,
          value: 120000,
          status: 'novo',
          notes: `Importado em bloco do Google Contacts pessoal do usuário de forma segura.`,
          origin: 'Google Contacts',
          createdAt: new Date().toISOString().substring(0, 10)
        });
        importedCount++;
      }
    });

    if (newLeadsToAdd.length > 0) {
      setLeads(prev => [...newLeadsToAdd, ...prev]);
    }

    addNotification(
      '📥 CARGA COMPLETA',
      `Sincronia importadora concluída! ${importedCount} contatos imobiliários novos injetados, ${duplicateCount} duplicatas de e-mail/celular protegidas e ignoradas.`,
      'success'
    );
    
    alert(`Importação em massa finalizada!\nImportados com sucesso: ${importedCount}\nDuplicados pulados (Já cadastrados): ${duplicateCount}`);
    awardXP(100 + importedCount * 12);
    triggerSensoryFeedback('success', accSettings);
  };

  // Export all CRM Leads to Google Contacts avoiding duplicates
  const handleExportAllCRMLeadsToGoogle = async () => {
    if (leads.length === 0) {
      alert("Nenhum lead disponível para exportação.");
      return;
    }

    const isConfirmed = window.confirm(
      `Deseja exportar de forma inteligente todos os seus leads (${leads.length}) para sua conta de Contatos do Google? O sistema fará a checagem prévia com os contatos atuais do Google para não gerar nenhuma duplicata.`
    );
    if (!isConfirmed) return;

    triggerSensoryFeedback('click', accSettings);
    setIsSyncingContacts(true);
    let successCount = 0;
    let skippedCount = 0;

    const normalizePhone = (p: string) => p ? p.replace(/[^\d]/g, '') : '';

    try {
      // First, get freshest contacts directly from Google connection to verify duplicates
      let googleContactsCurrent = [...googleContacts];
      try {
        const res = await fetch(
          `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=1000`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (res.ok) {
          const data = await res.json();
          const connections = data.connections || [];
          googleContactsCurrent = connections.map((conn: any) => {
            const nameObj = conn.names?.[0] || {};
            const emailObj = conn.emailAddresses?.[0] || {};
            const phoneObj = conn.phoneNumbers?.[0] || {};
            return {
              name: nameObj.displayName || 'Sem Nome',
              email: emailObj.value || '',
              phone: phoneObj.value || ''
            };
          });
          setGoogleContacts(googleContactsCurrent);
        }
      } catch (err) {
        console.warn("Could not retrieve freshest contacts list, using cached list.", err);
      }

      for (const lead of leads) {
        const leadEmailLower = lead.email ? lead.email.toLowerCase().trim() : '';
        const leadPhoneNorm = lead.phone ? normalizePhone(lead.phone) : '';

        // Check if lead matches any contact in Google Contacts currently
        const existsInGoogle = googleContactsCurrent.some(c => {
          const contactEmailLower = c.email ? c.email.toLowerCase().trim() : '';
          const contactPhoneNorm = c.phone ? normalizePhone(c.phone) : '';
          const emailMatch = leadEmailLower && contactEmailLower && leadEmailLower === contactEmailLower;
          const phoneMatch = leadPhoneNorm && contactPhoneNorm && leadPhoneNorm === contactPhoneNorm;
          return emailMatch || phoneMatch;
        });

        if (existsInGoogle) {
          skippedCount++;
          continue;
        }

        try {
          const body = {
            names: [{ givenName: lead.name }],
            emailAddresses: lead.email ? [{ value: lead.email }] : [],
            phoneNumbers: lead.phone ? [{ value: lead.phone, type: 'mobile' }] : [],
            biographies: [{ value: `Lead CRM cicloCRED. Origem: ${lead.origin}. Renda: R$ ${lead.familyIncome || 0}. Status: ${lead.status.toUpperCase()}. Notas: ${lead.notes || ''}` }]
          };

          const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });
          if (res.ok) {
            successCount++;
          }
        } catch (e) {
          console.error("Erro ao registrar lead no Google:", lead, e);
        }
      }

      addNotification(
        '👥 EXPORTAÇÃO COMPLETA',
        `Sincronia exportadora concluída! ${successCount} Leads adicionados à sua lista de Contatos Google. ${skippedCount} duplicatas ignoradas de forma responsável.`,
        'success'
      );
      awardXP(150 + successCount * 15);
      triggerSensoryFeedback('success', accSettings);
      
      alert(`Sincronização Finalizada!\nExportados com sucesso: ${successCount}\nContatos ignorados (Já existentes no Google / Duplicados): ${skippedCount}`);
      fetchGoogleContacts();
    } catch (err: any) {
      alert(`Falha na exportação em lote: ${err.message}`);
    } finally {
      setIsSyncingContacts(false);
    }
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

        <button
          disabled={!token}
          onClick={() => { triggerSensoryFeedback('click', accSettings); setWorkspaceTab('contacts'); }}
          className={`px-4.5 py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl shrink-0 transition-all flex items-center gap-2 ${
            !token ? 'opacity-40 cursor-not-allowed' : ''
          } ${
            workspaceTab === 'contacts' 
              ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' 
              : 'text-zinc-400 hover:text-white bg-zinc-800'
          }`}
        >
          <Contact className="w-4 h-4 text-amber-400" />
          <span>Contatos & WhatsApp</span>
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

            {token && (
              <div className="bg-zinc-950 border-2 border-indigo-950 p-6 rounded-2xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 col-span-2">
                    <h3 className="text-sm font-black uppercase text-indigo-400 font-mono tracking-tight flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                      <span>Banco de Dados Híbrido & Contingência (G-Suite Backplane)</span>
                    </h3>
                    <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                      Transforme suas planilhas Google Sheets em um banco de dados espelho em tempo real. Divida e reduza o peso de processamento do Firebase, mantendo um failover completo pronto para contingências!
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <label className="text-[10px] font-black uppercase font-mono tracking-wider text-zinc-400">Sincronia Automática:</label>
                    <button
                      onClick={() => {
                        const next = !isAutoSyncEnabled;
                        setIsAutoSyncEnabled(next);
                        localStorage.setItem('ciclocred_sheets_autosync_enabled', String(next));
                        addSyncLog(`Sincronia em tempo real ${next ? 'ativada' : 'desativada'}.`);
                        triggerSensoryFeedback('click', accSettings);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isAutoSyncEnabled ? 'bg-indigo-600' : 'bg-zinc-800'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAutoSyncEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-zinc-900">
                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black font-mono uppercase text-zinc-400">Planilha de Sincronia Estável</span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-black ${syncSpreadsheetId ? 'bg-green-950 text-green-400' : 'bg-amber-950 text-amber-400'}`}>
                          {syncSpreadsheetId ? 'CONECTADA' : 'NÃO CONFIGURADA'}
                        </span>
                      </div>
                      <div className="text-xs text-white break-all font-mono bg-zinc-950 p-2 border border-zinc-850 rounded-lg">
                        {syncSpreadsheetId || 'Nenhum backplane híbrido instanciado ainda.'}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={handleCreateSyncSpreadsheet}
                          disabled={isPerformingSync}
                          className="px-3 py-2 bg-zinc-850 hover:bg-zinc-800 text-white border border-zinc-750 hover:border-zinc-700 rounded-lg text-[9px] font-black uppercase font-mono tracking-wider cursor-pointer transition-all duration-150"
                        >
                          {syncSpreadsheetId ? 'Regerar Planilha do Banco' : 'Gerar Nova Planilha do Banco'}
                        </button>
                        
                        {syncSpreadsheetId && (
                          <button
                            onClick={() => {
                              window.open(`https://docs.google.com/spreadsheets/d/${syncSpreadsheetId}/edit`, '_blank');
                            }}
                            className="px-3 py-2 bg-indigo-950/40 text-indigo-400 border border-indigo-900 hover:bg-indigo-900 hover:text-white rounded-lg text-[9px] font-black uppercase font-mono tracking-wider flex items-center gap-1.5 cursor-pointer transition-all duration-150"
                          >
                            <span>Vizualizar Arquivo</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={forceCompleteUploadToSheets}
                        disabled={isPerformingSync}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-green-700 hover:bg-green-800 text-white font-black rounded-xl text-[10px] tracking-wide uppercase font-mono border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-0 transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Replicar CRM → Sheets</span>
                      </button>

                      <button
                        onClick={forceCompleteDownloadFromSheets}
                        disabled={isPerformingSync || !syncSpreadsheetId}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-[10px] tracking-wide uppercase font-mono border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-0 transition-all cursor-pointer disabled:opacity-40"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Puxar GSheets → CRM</span>
                      </button>
                    </div>

                    <button
                      onClick={handleBatchExportLeadsToContacts}
                      disabled={isSyncingContacts || leads.length === 0}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-[10px] tracking-wide uppercase font-mono border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-0 transition-all cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Arquivar Carteira no Google Contatos ({leads.length} Leads)</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase font-mono text-zinc-400">Terminal de Transações Híbridas:</h4>
                    <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl min-h-[225px] max-h-[225px] overflow-y-auto space-y-1.5 font-mono text-[9px] text-zinc-400">
                      {syncLogs.length === 0 ? (
                        <div className="text-zinc-600 italic">Pronto para processar backups e restaurações...</div>
                      ) : (
                        syncLogs.map((log, i) => (
                          <div key={i} className="leading-normal">{log}</div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
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

        {/* TAB 6: GOOGLE CONTACTS IMPORT & EXPORT */}
        {workspaceTab === 'contacts' && (
          <div className="space-y-6">
            {/* Meet Box */}
            <div className="bg-zinc-950 border-2 border-indigo-950 p-6 rounded-2xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase text-indigo-400 font-mono flex items-center gap-2">
                    <Video className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <span>Videoconferência Instantânea Google Meet</span>
                  </h4>
                  <p className="text-[11px] text-zinc-300 font-bold uppercase font-mono">
                    ▼ Crie uma sala de vídeochat real no Google Meet para receber assessores e clientes imediatamente!
                  </p>
                </div>

                <button
                  onClick={handleCreateInstantGoogleMeet}
                  disabled={isCreatingInstantMeet}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase font-mono rounded-lg border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-all cursor-pointer shrink-0"
                >
                  {isCreatingInstantMeet ? 'Gerando Link...' : 'Criar Sala Instantânea'}
                </button>
              </div>

              {instantMeetUrl && (
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between gap-3 font-mono text-zinc-100">
                  <div className="overflow-hidden min-w-0 flex-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Sua Sala Está Ativa:</span>
                    <a
                      href={instantMeetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-black text-indigo-400 break-all underline hover:text-indigo-300"
                    >
                      {instantMeetUrl}
                    </a>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(instantMeetUrl);
                      addNotification('📋 COPIADO', 'Link da videoconferência copiado para a área de transferência!', 'success');
                      triggerSensoryFeedback('success', accSettings);
                    }}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 font-bold uppercase text-[9px] rounded-lg cursor-pointer"
                  >
                    Copiar Link
                  </button>
                </div>
              )}
            </div>

            {/* Contacts & Sync Master Layout */}
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
                <div className="space-y-1">
                  <h3 className="text-md font-black uppercase font-mono tracking-tight text-white flex items-center gap-1.5">
                    <Contact className="w-5 h-5 text-amber-400" />
                    <span>Gerenciador de Contatos Google</span>
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase font-mono">
                    ▼ Sincronize contatos para que fiquem salvos em seu dispositivo móvel e no WhatsApp para comunicação imediata!
                  </p>
                </div>

                <div className="flex bg-zinc-950 p-1 border border-zinc-850 rounded-xl text-[10px] uppercase font-mono gap-1 shrink-0">
                  <button
                    onClick={() => { triggerSensoryFeedback('click', accSettings); setContactsSubTab('google'); }}
                    className={`px-3 py-1.5 rounded-lg font-black transition cursor-pointer ${
                      contactsSubTab === 'google' ? 'bg-amber-600 text-white font-bold shadow' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    Importar do Google ({googleContacts.length})
                  </button>
                  <button
                    onClick={() => { triggerSensoryFeedback('click', accSettings); setContactsSubTab('export_crm'); }}
                    className={`px-3 py-1.5 rounded-lg font-black transition cursor-pointer ${
                      contactsSubTab === 'export_crm' ? 'bg-amber-600 text-white font-bold shadow' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    Exportar Leads CRM ({leads.length})
                  </button>
                </div>
              </div>

              {contactsSubTab === 'google' ? (
                <div className="space-y-4">
                  {/* Search and Batch Import button side by side */}
                  <div className="flex flex-col lg:flex-row gap-3.5">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-zinc-550" />
                      </div>
                      <input
                        type="text"
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        placeholder="Filtrar contatos da sua Conta Google real..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs font-mono text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:border-amber-600 font-bold uppercase"
                      />
                    </div>
                    <button
                      onClick={handleImportAllContactsToCRM}
                      disabled={googleContacts.length === 0}
                      className="flex items-center justify-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-45 disabled:cursor-not-allowed text-white font-black text-xs uppercase font-mono rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-all cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-4 h-4 text-zinc-100 animate-pulse" />
                      <span>Importar Todo o Google ({googleContacts.length} Contatos sem duplicar)</span>
                    </button>
                  </div>

                  {isLoadingContacts ? (
                    <div className="text-center py-12 text-zinc-500 font-mono text-xs uppercase animate-pulse">
                      Carregando contatos existentes na sua conta Google...
                    </div>
                  ) : googleContacts.length === 0 ? (
                    <div className="bg-zinc-950 border border-zinc-850 p-10 rounded-2xl text-center space-y-3">
                      <Users className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="text-zinc-400 font-mono text-xs uppercase">Nenhum contato encontrado em sua Conta Google.</p>
                      <button
                        onClick={fetchGoogleContacts}
                        className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 uppercase font-black font-mono text-[10px] rounded border border-zinc-800 cursor-pointer"
                      >
                        Recarregar
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {googleContacts
                        .filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.email.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone.includes(contactSearch))
                        .map((c, idx) => {
                          const isAlreadyLead = leads.some(l => (c.phone && l.phone === c.phone) || (c.email && l.email === c.email));
                          return (
                            <div key={idx} className="bg-zinc-950 border border-zinc-852 p-4 rounded-xl flex items-center justify-between gap-4 font-mono transition hover:border-amber-900/40">
                              <div className="space-y-1 overflow-hidden min-w-0">
                                <span className="font-bold font-sans text-zinc-100 text-xs block truncate uppercase">{c.name}</span>
                                <div className="text-[9.5px] text-zinc-500 space-y-0.5 truncate uppercase">
                                  {c.phone && <p className="truncate">📞 {c.phone}</p>}
                                  {c.email && <p className="truncate">✉️ {c.email}</p>}
                                </div>
                              </div>

                              <button
                                onClick={() => handleImportContactAsLead(c)}
                                disabled={isAlreadyLead}
                                className={`px-3 py-1.5 font-bold uppercase text-[9px] rounded-lg border tracking-wide cursor-pointer transition shrink-0 ${
                                  isAlreadyLead
                                    ? 'bg-zinc-900 border-zinc-850 text-zinc-600 cursor-not-allowed'
                                    : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-amber-400'
                                }`}
                              >
                                {isAlreadyLead ? 'Cadastrado' : 'Importar CRM'}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-xs leading-relaxed text-zinc-300">
                    <p className="font-bold text-amber-400 uppercase font-mono mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>Sincronização com Celular & WhatsApp</span>
                    </p>
                    Para que seus leads aparecem instantaneamente no seu celular com os nomes corretos e se associem perfeitamente no seu aplicativo de WhatsApp integrado, salve-os nos Contatos do Google com o botão abaixo:
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4.5 bg-zinc-950 border-2 border-zinc-850 rounded-2xl">
                    <div className="text-xs text-zinc-400 font-mono">
                      <span className="font-bold text-white uppercase block mb-0.5">Sincronização Coletiva Inteligente</span>
                      Seja produtivo, exporte todos de uma vez. O robô rejeitará backups redundantes de emails/números correspondentes.
                    </div>
                    <button
                      onClick={handleExportAllCRMLeadsToGoogle}
                      disabled={leads.length === 0 || isSyncingContacts}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-45 disabled:cursor-not-allowed text-white font-black text-xs uppercase font-mono rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-all cursor-pointer shrink-0"
                    >
                      <Upload className="w-4 h-4 text-zinc-100" />
                      <span>{isSyncingContacts ? 'Sincronizando...' : `Exportar Todos para o Google (${leads.length} Leads sem duplicar)`}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {leads.map(lead => {
                      return (
                        <div key={lead.id} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex items-center justify-between gap-4 font-mono transition hover:border-zinc-800">
                          <div className="space-y-1 overflow-hidden min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold font-sans text-zinc-100 text-xs truncate uppercase">{lead.name}</span>
                              <span className="text-[8px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase rounded-full shrink-0">
                                {lead.status}
                              </span>
                            </div>
                            <div className="text-[9.5px] text-zinc-500 space-y-0.5 truncate uppercase">
                              <p className="truncate">📞 {lead.phone || 'Sem Telefone'}</p>
                              {lead.email && <p className="truncate">✉️ {lead.email}</p>}
                            </div>
                          </div>

                          <button
                            onClick={() => handleExportLeadToContacts(lead)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase text-[9px] rounded-lg tracking-wide border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition shrink-0 cursor-pointer"
                          >
                            Salvar Google
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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

                <div className="flex items-center gap-2.5 bg-zinc-950 p-3 border border-zinc-800 rounded-xl">
                  <input
                    type="checkbox"
                    id="createMeetCheckbox"
                    checked={apptForm.createMeet}
                    onChange={(e) => setApptForm(prev => ({ ...prev, createMeet: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-650 cursor-pointer rounded"
                  />
                  <label htmlFor="createMeetCheckbox" className="text-[9.5px] uppercase font-black text-zinc-300 cursor-pointer flex items-center gap-1.5 select-none">
                    <Video className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    <span>Gerar sala de videoconferência no Google Meet</span>
                  </label>
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
  
  let t = tokenCacheByUid[user.uid] || null;
  if (!t) {
    t = localStorage.getItem(`ciclocred_workspace_token_${user.uid}`);
    if (t) {
      tokenCacheByUid[user.uid] = t;
    }
  }
  return t;
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

export async function createGoogleCalendarEvent(
  title: string, 
  description: string, 
  date: string, 
  time: string, 
  durationMinutes: number,
  createMeet: boolean = true
): Promise<boolean> {
  const token = getWorkspaceToken();
  if (!token) {
    console.warn("No Google Workspace token found for Calendar.");
    return false;
  }
  
  try {
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
    
    const conferenceData = createMeet ? {
      createRequest: {
        requestId: `meet-request-lead-${Date.now()}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet'
        }
      }
    } : undefined;

    const event = {
      summary: title,
      description: description,
      start: { 
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: { 
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      conferenceData
    };
    
    const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events' + (createMeet ? '?conferenceDataVersion=1' : '');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    
    if (response.ok && createMeet) {
      try {
        const created = await response.json();
        let meetLink = '';
        if (created.conferenceData && created.conferenceData.entryPoints) {
          const videoEntryPoint = created.conferenceData.entryPoints.find(
            (ep: any) => ep.entryPointType === 'video'
          );
          if (videoEntryPoint) {
            meetLink = videoEntryPoint.uri;
            // Patch event description with the active Meet link
            const updateBody = {
              ...event,
              description: `${description}\n\n🎥 SALA GOOGLE MEET GERADA: ${meetLink}\n(Link da agenda: ${created.htmlLink})`
            };
            await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${created.id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(updateBody)
            });
          }
        }
      } catch (e) {
        console.warn("Could not patch description with Meet link:", e);
      }
    }
    
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

export async function autoSyncWorkspaceDatabase(
  leads: Lead[],
  appointments: Appointment[],
  emailLogs: EmailLog[]
): Promise<boolean> {
  const token = getWorkspaceToken();
  const autosync = localStorage.getItem('ciclocred_sheets_autosync_enabled') === 'true';
  const spreadsheetId = localStorage.getItem('ciclocred_workspace_db_sheet_id');
  
  if (!token || !autosync || !spreadsheetId) {
    return false;
  }
  
  try {
    // Sync Leads
    const leadsValues = [
      ['ID', 'Nome', 'E-mail', 'Telefone', 'Empresa', 'Valor Pipeline', 'Status', 'Origem', 'Data Criação', 'Último Contato', 'Notas']
    ];
    leads.forEach(l => {
      leadsValues.push([
        l.id,
        l.name,
        l.email || '',
        l.phone || '',
        l.company || '',
        String(l.value || 0),
        l.status || 'novo',
        l.origin || '',
        l.createdAt || '',
        l.lastContactAt || '',
        l.notes || ''
      ]);
    });
    
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leads!A1?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ range: 'Leads!A1', majorDimension: 'ROWS', values: leadsValues })
    });
    
    // Sync Appointments
    const apptsValues = [
      ['ID', 'Título', 'Data', 'Hora', 'Lead ID', 'Lead Nome', 'Descrição', 'Status', 'Tipo']
    ];
    appointments.forEach(a => {
      apptsValues.push([
        a.id,
        a.title,
        a.date,
        a.time,
        a.leadId || '',
        a.leadName || '',
        a.description || '',
        a.status || 'agendado',
        a.type || 'outro'
      ]);
    });
    
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Agenda!A1?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ range: 'Agenda!A1', majorDimension: 'ROWS', values: apptsValues })
    });
    
    // Sync Activities
    const logsValues = [
      ['ID', 'Lead ID', 'Lead Nome', 'Assunto', 'Mensagem', 'Data Disparo', 'Status']
    ];
    emailLogs.forEach(g => {
      logsValues.push([
        g.id,
        g.leadId || '',
        g.leadName || '',
        g.templateName || '',
        g.body || '',
        g.sentAt || '',
        g.status || 'enviado'
      ]);
    });
    
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Atividades!A1?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ range: 'Atividades!A1', majorDimension: 'ROWS', values: logsValues })
    });
    
    return true;
  } catch (err) {
    console.warn("Background workspace sync failed silently:", err);
    return false;
  }
}


