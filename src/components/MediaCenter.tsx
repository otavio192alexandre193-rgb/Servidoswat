/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lead, RealEstateProperty, LeadStatus } from '../types';
import { 
  Share2, 
  Smartphone, 
  Glasses, 
  Trash2, 
  CheckCircle, 
  Circle, 
  MessageSquare,
  Facebook, 
  Instagram, 
  Copy, 
  ExternalLink, 
  FileText,
  Download,
  Check,
  Zap,
  Filter,
  Search,
  Plus,
  ArrowUpDown,
  BookOpen,
  Send,
  Sparkles,
  Play,
  Square
} from 'lucide-react';
import { AccessibilitySettings, triggerSensoryFeedback } from '../utils/sensory';

interface MediaTask {
  id: string;
  title: string;
  category: 'WhatsApp' | 'Instagram' | 'Facebook' | 'E-mail' | 'Portal';
  targetDate: string;
  priority: 'alta' | 'media' | 'baixa';
  status: 'pendente' | 'em_andamento' | 'concluido';
  description: string;
}

interface MediaCenterProps {
  leads: Lead[];
  properties: RealEstateProperty[];
  theme: 'claro' | 'escuro' | 'galatico';
  accSettings: AccessibilitySettings;
  awardXP: (amount: number) => void;
  addNotification: (title: string, msg: string, type: 'info' | 'success' | 'warning' | 'alarm' | 'ai') => void;
}

export default function MediaCenter({
  leads,
  properties,
  theme,
  accSettings,
  awardXP,
  addNotification
}: MediaCenterProps) {
  const [activeSubTab, setActiveSubTab] = useState<'publish' | 'computer' | 'tasks'>('publish');
  
  // Refactored State for Property selection and filter
  const [propertySearch, setPropertySearch] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '');

  // States for Wizard steps popup (Assistente Multi-Etapa de Criativos e Disparo)
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardPropertySource, setWizardPropertySource] = useState<'unit' | 'local'>('unit');
  const [wizardSelectedPropertyId, setWizardSelectedPropertyId] = useState<string>(properties[0]?.id || '');
  const [wizardSelectedLocalImageId, setWizardSelectedLocalImageId] = useState<string>('');
  const [wizardIncludeBook, setWizardIncludeBook] = useState<boolean>(false);
  const [wizardIncludePrice, setWizardIncludePrice] = useState<boolean>(true);
  const [wizardCustomText, setWizardCustomText] = useState<string>('');
  const [wizardTemplate, setWizardTemplate] = useState<'mcmv' | 'entrada' | 'premium' | 'personalizado'>('mcmv');
  const [wizardSelectedLeadIds, setWizardSelectedLeadIds] = useState<string[]>([]);
  const [wizardLeadSearch, setWizardLeadSearch] = useState<string>('');
  const [wizardLeadStatusFilter, setWizardLeadStatusFilter] = useState<string>('todos');
  const [wizardLeadGenderFilter, setWizardLeadGenderFilter] = useState<'todos' | 'homens' | 'mulheres'>('todos');

  // Refactored State for Leads search, filters, and multi-selection
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('todos');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Messaging generator custom setups
  const [customMsgTemplate, setCustomMsgTemplate] = useState<'mcmv' | 'entrada' | 'premium' | 'personalizado'>('mcmv');
  const [includeBookLink, setIncludeBookLink] = useState(false);
  const [includePriceInfo, setIncludePriceInfo] = useState(true);
  const [customCaptionText, setCustomCaptionText] = useState('');
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [isSendingStatus, setIsSendingStatus] = useState(false);

  // --- SUB-DELEGATE MULTI-LEAD DISPATCH QUEUE ENGINE (REPLICATING CENTRAL DE DISPAROS LOGIC) ---
  interface QueueItem {
    lead: Lead;
    status: 'idle' | 'sending' | 'waiting' | 'done';
  }

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isQueueRunning, setIsQueueRunning] = useState(false);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(-1);
  const [isAssistedMode, setIsAssistedMode] = useState(true);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const queueCleanupRef = React.useRef<(() => void) | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (queueCleanupRef.current) queueCleanupRef.current();
    };
  }, []);

  // Simulated computer/glasses books state
  const [mediaBooks, setMediaBooks] = useState(() => {
    const saved = localStorage.getItem('ciclocred_media_books');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'book-1', title: 'Apresentação Residencial Cury Zona Leste.pdf', size: '4.8 MB', category: 'Corporativo', url: 'https://cdn.ciclocred.com/docs/apresentacao-2026.pdf' },
      { id: 'book-2', title: 'Tabela de Crédito Habitacional MCMV - Caixa & Cury.xlsx', size: '1.2 MB', category: 'Tabelas', url: 'https://cdn.ciclocred.com/spreadsheets/habitacional-v12.xlsx' },
      { id: 'book-3', title: 'Minipack de Artes Redes Sociais - Lançamentos SP.zip', size: '22 MB', category: 'Imagens', url: 'https://cdn.ciclocred.com/media/pack-artes-sp.zip' }
    ];
  });

  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookCategory, setNewBookCategory] = useState('Imagens');
  const [newBookSize, setNewBookSize] = useState('3.5 MB');
  const [newBookUrl, setNewBookUrl] = useState('');
  const [isAddingBook, setIsAddingBook] = useState(false);

  // Tasks states
  const [tasks, setTasks] = useState<MediaTask[]>(() => {
    const saved = localStorage.getItem('ciclocred_media_tasks');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'media-task-1',
        title: 'Criar criativos no Canva para Residencial Cury',
        category: 'Instagram',
        targetDate: new Date().toISOString().slice(0, 10),
        priority: 'alta',
        status: 'em_andamento',
        description: 'Desenhar carrossel de 4 fotos destacando entrada em até 36x e aprovação facilitada.'
      },
      {
        id: 'media-task-2',
        title: 'Campanha WhatsApp: Estoque MCMV Leste',
        category: 'WhatsApp',
        targetDate: new Date().toISOString().slice(0, 10),
        priority: 'alta',
        status: 'pendente',
        description: 'Disparar simulações prontas cicloCRED para leads em estágio "Novo" com renda até R$ 4.500.'
      }
    ];
  });

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'WhatsApp' | 'Instagram' | 'Facebook' | 'E-mail' | 'Portal'>('WhatsApp');
  const [newTaskPriority, setNewTaskPriority] = useState<'alta' | 'media' | 'baixa'>('media');
  const [newTaskDesc, setNewTaskDesc] = useState('');

  // Local storage synchronization
  useEffect(() => {
    localStorage.setItem('ciclocred_media_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('ciclocred_media_books', JSON.stringify(mediaBooks));
  }, [mediaBooks]);

  const [uploadedImages, setUploadedImages] = useState<{ id: string; title: string; dataUrl: string; date: string }[]>(() => {
    const saved = localStorage.getItem('ciclocred_uploaded_media_images');
    return saved ? JSON.parse(saved) : [
      { id: 'img-1', title: 'Fachada Cury Metropolitana.png', dataUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=400', date: new Date().toLocaleDateString('pt-BR') },
      { id: 'img-2', title: 'Decorado 2 Dormitórios.png', dataUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=400', date: new Date().toLocaleDateString('pt-BR') }
    ];
  });

  const [selectedCampaignImageId, setSelectedCampaignImageId] = useState<string>('img-1');

  useEffect(() => {
    localStorage.setItem('ciclocred_uploaded_media_images', JSON.stringify(uploadedImages));
  }, [uploadedImages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerSensoryFeedback('click', accSettings);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const newImg = {
        id: `img-${Date.now()}`,
        title: file.name,
        dataUrl: base64,
        date: new Date().toLocaleDateString('pt-BR')
      };
      setUploadedImages(prev => [newImg, ...prev]);
      setSelectedCampaignImageId(newImg.id);
      awardXP(40);
      addNotification('📸 IMAGEM IMPORTADA', `Sua imagem "${file.name}" foi carregada no banco de mídias com sucesso.`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerSensoryFeedback('warning', accSettings);
    setUploadedImages(prev => prev.filter(img => img.id !== id));
    if (selectedCampaignImageId === id) {
      setSelectedCampaignImageId('img-1');
    }
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        const shareData: ShareData = {
          title: 'Divulgação CicloCred',
          text: customCaptionText,
        };
        const activeImg = uploadedImages.find(img => img.id === selectedCampaignImageId) || uploadedImages[0];
        if (activeImg && activeImg.dataUrl && activeImg.dataUrl.startsWith('data:')) {
          try {
            const res = await fetch(activeImg.dataUrl);
            const blob = await res.blob();
            const file = new File([blob], activeImg.title, { type: blob.type });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          } catch (err) {
            console.error("Could not add image file to native share", err);
          }
        }
        await navigator.share(shareData);
        addNotification('📱 MÍDIA COMPARTILHADA', 'Compartilhamento nativo ativado com sucesso!', 'success');
        awardXP(50);
      } else {
        navigator.clipboard.writeText(customCaptionText);
        addNotification('📋 COPIADO', 'Caminho de compartilhamento nativo indisponível. Legenda copiada para colar diretamente!', 'info');
      }
    } catch (err) {
      console.warn("Share cancelled or failed", err);
    }
  };

  // Compute selected items
  const selectedProperty = properties.find(p => p.id === selectedPropertyId) || properties[0];

  // Auto compile custom legend copy based on settings
  useEffect(() => {
    if (!selectedProperty) return;

    const formattedPrice = selectedProperty.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    const bookLink = includeBookLink ? `\n\n📖 Baixe o book completo de fotos e plantas do imóvel aqui: https://ciclocred.com/book/${selectedProperty.code}` : '';
    const priceText = includePriceInfo ? `\n💰 Valor Promocional sugerido: ${formattedPrice}` : '';
    
    let baseText = '';
    
    if (customMsgTemplate === 'mcmv') {
      baseText = `🏡✨ OPORTUNIDADE MINHA CASA MINHA VIDA!\n\nConheça o belíssimo *${selectedProperty.title}* no bairro ${selectedProperty.neighborhood}!\nUm empreendimento perfeito com lazer completo, conforto e segurança.\n\n📐 Unidades de de ${selectedProperty.sizeSqm}m² (${selectedProperty.bedrooms} dorms)${priceText}\n🎯 Subsídios facilitados com aprovação de crédito cicloCRED instantânea!\n\nDeixe seu sim para fazer uma simulação de parcelas em menos de 10 minutos!`;
    } else if (customMsgTemplate === 'entrada') {
      baseText = `⚠️ ENTRADA SUPER FACILITADA DAS CHAVES!\n\nO *${selectedProperty.title}* está com parcelamento inovador direto com a construtora.\n\n📍 Localização privilegiada: ${selectedProperty.neighborhood}\n🔑 Atributos: ${selectedProperty.bedrooms} dormitórios e plantas modernas.${priceText}\n\nPeríodo de fluxo de obras flexível em parcelas suaves. Podermos aprovar seu crédito bancário hoje?`;
    } else if (customMsgTemplate === 'premium') {
      baseText = `📈 EXCELENTE LIQUIDEZ PARA INVESTIMENTO IMOBILIÁRIO!\n\nNova captação de alta performance adicionada ao portfólio:\n*${selectedProperty.title}* - Bairro ${selectedProperty.neighborhood}\n\n📐 Área total: ${selectedProperty.sizeSqm}m² com vaga inclusa de garagem.${priceText}\n\nRetorne para receber com prioridade o Book Oficial de Vendas completo!`;
    } else {
      baseText = `Olá! Gostaria de te apresentar uma excelente opção no bairro ${selectedProperty.neighborhood}:\n*${selectedProperty.title}* com ${selectedProperty.bedrooms} dormitórios e alto padrão construtivo.\n\nEntre em contato para agendarmos uma visita!`;
    }

    setCustomCaptionText(`${baseText}${bookLink}`);
  }, [selectedPropertyId, customMsgTemplate, includeBookLink, includePriceInfo]);

  // Auto compile wizard custom legend copy based on wizard settings
  useEffect(() => {
    if (wizardPropertySource === 'unit') {
      const selectedProp = properties.find(p => p.id === wizardSelectedPropertyId) || properties[0];
      if (!selectedProp) return;

      const formattedPrice = selectedProp.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
      const bookLink = wizardIncludeBook ? `\n\n📖 Baixe o book completo de fotos e plantas do imóvel aqui: https://ciclocred.com/book/${selectedProp.code}` : '';
      const priceText = wizardIncludePrice ? `\n💰 Valor Promocional sugerido: ${formattedPrice}` : '';
      
      let baseText = '';
      if (wizardTemplate === 'mcmv') {
        baseText = `🏡✨ OPORTUNIDADE MINHA CASA MINHA VIDA!\n\nConheça o belíssimo *${selectedProp.title}* no bairro ${selectedProp.neighborhood}!\nUm empreendimento perfeito com lazer completo, conforto e segurança.\n\n📐 Unidades de de ${selectedProp.sizeSqm}m² (${selectedProp.bedrooms} dorms)${priceText}\n🎯 Subsídios facilitados com aprovação de crédito cicloCRED instantânea!\n\nDeixe seu sim para fazer uma simulação de parcelas em menos de 10 minutos!`;
      } else if (wizardTemplate === 'entrada') {
        baseText = `⚠️ ENTRADA SUPER FACILITADA DAS CHAVES!\n\nO *${selectedProp.title}* está com parcelamento inovador direto com a construtora.\n\n📍 Localização privilegiada: ${selectedProp.neighborhood}\n🔑 Atributos: ${selectedProp.bedrooms} dormitórios e plantas modernas.${priceText}\n\nPeríodo de fluxo de obras flexível em parcelas suaves. Podermos aprovar seu crédito bancário hoje?`;
      } else if (wizardTemplate === 'premium') {
        baseText = `📈 EXCELENTE LIQUIDEZ PARA INVESTIMENTO IMOBILIÁRIO!\n\nNova captação de alta performance adicionada ao portfólio:\n*${selectedProp.title}* - Bairro ${selectedProp.neighborhood}\n\n📐 Área total: ${selectedProp.sizeSqm}m² com vaga inclusa de garagem.${priceText}\n\nRetorne para receber com prioridade o Book Oficial de Vendas completo!`;
      } else {
        baseText = `Olá! Gostaria de te apresentar uma excelente opção no bairro ${selectedProp.neighborhood}:\n*${selectedProp.title}* com ${selectedProp.bedrooms} dormitórios e alto padrão construtivo.\n\nEntre em contato para agendarmos uma visita!`;
      }
      setWizardCustomText(`${baseText}${bookLink}`);
    } else {
      let baseText = '';
      if (wizardTemplate === 'mcmv') {
        baseText = `🏡✨ PROJETO MINHA CASA MINHA VIDA PERSONALIZADO!\n\nAprovação de crédito cicloCRED garantida com entrada facilitada e FGTS!\n\nAdquirir a casa própria está mais fácil com juros reduzidos e subsídios incríveis de até R$ 55 mil!\n\nDeixe seu sim aqui no WhatsApp ou encaminhe um retorno para simular agora!`;
      } else if (wizardTemplate === 'entrada') {
        baseText = `⚠️ SEU IMÓVEL EM SÃO PAULO SEM BUROCRACIA!\n\nCondições promocionais exclusivas de entrada amplamente facilitada em parcelas suaves que cabem no seu bolso.\n\nFale conosco para receber o book e analisar sua simulação!`;
      } else if (wizardTemplate === 'premium') {
        baseText = `📈 OPORTUNIDADES EXCLUSIVAS DE INVESTIMENTO IMOBILIÁRIO!\n\nAnálise de mercado indica ganho patrimonial extraordinário de valorização em lançamentos estratégicos na grande SP.\n\nEntre em contato para conhecer as tabelas exclusivas para investidores!`;
      } else {
        baseText = `Olá! Tenho mídias exclusivas e books anexados com excelentes oportunidades do mercado imobiliário para você em primeira mão.\n\nPodemos fazer um contato rápido hoje para tirar dúvidas?`;
      }
      setWizardCustomText(baseText);
    }
  }, [wizardSelectedPropertyId, wizardTemplate, wizardIncludeBook, wizardIncludePrice, wizardPropertySource]);

  // Select properties list filtered by search
  const filteredProperties = properties.filter(p => 
    p.title.toLowerCase().includes(propertySearch.toLowerCase()) ||
    p.neighborhood.toLowerCase().includes(propertySearch.toLowerCase()) ||
    p.code.toLowerCase().includes(propertySearch.toLowerCase())
  );

  // Select leads list filtered by search & status
  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
      (l.email && l.email.toLowerCase().includes(leadSearch.toLowerCase())) ||
      (l.phone && l.phone.replace(/\D/g, '').includes(leadSearch.replace(/\D/g, '')));
    
    const matchesStatus = leadStatusFilter === 'todos' || l.status === leadStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Toggle single lead check
  const handleToggleLeadSelection = (leadId: string) => {
    triggerSensoryFeedback('click', accSettings);
    setSelectedLeadIds(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId) 
        : [...prev, leadId]
    );
  };

  // Toggle select all visible
  const handleToggleSelectAllLeads = () => {
    triggerSensoryFeedback('click', accSettings);
    const visibleIds = filteredLeads.map(l => l.id);
    const areAllVisibleSelected = visibleIds.every(id => selectedLeadIds.includes(id));
    
    if (areAllVisibleSelected) {
      // Unselect only those visible
      setSelectedLeadIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all visible
      setSelectedLeadIds(prev => {
        const union = [...prev];
        visibleIds.forEach(id => {
          if (!union.includes(id)) union.push(id);
        });
        return union;
      });
    }
  };

  // Task actions
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    triggerSensoryFeedback('click', accSettings);
    const newTask: MediaTask = {
      id: `media-task-${Date.now()}`,
      title: newTaskTitle,
      category: newTaskCategory,
      targetDate: new Date().toISOString().slice(0, 10),
      priority: newTaskPriority,
      status: 'pendente',
      description: newTaskDesc
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsAddingTask(false);
    awardXP(50);
    addNotification('📝 CENTRAL DE MÍDIA', `Planejamento de publicação "${newTask.title}" adicionado com sucesso.`, 'info');
  };

  const handleToggleTaskStatus = (id: string) => {
    triggerSensoryFeedback('click', accSettings);
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'pendente' ? 'em_andamento' : t.status === 'em_andamento' ? 'concluido' : 'pendente';
        if (nextStatus === 'concluido') {
          awardXP(100);
          addNotification('🏆 CAMPANHA CONCLUÍDA', `Vocé finalizou a tarefa: "${t.title}".`, 'success');
        }
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const handleDeleteTask = (id: string) => {
    triggerSensoryFeedback('warning', accSettings);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Books / PDF links additions
  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim() || !newBookUrl.trim()) return;

    triggerSensoryFeedback('click', accSettings);
    const newB = {
      id: `book-${Date.now()}`,
      title: newBookTitle,
      size: newBookSize,
      category: newBookCategory,
      url: newBookUrl
    };

    setMediaBooks(prev => [newB, ...prev]);
    setNewBookTitle('');
    setNewBookUrl('');
    setIsAddingBook(false);
    awardXP(40);
  };

  const handleDeleteBook = (id: string) => {
    triggerSensoryFeedback('warning', accSettings);
    setMediaBooks(prev => prev.filter(b => b.id !== id));
  };

  // Helper to resolve placeholders like {{nome}} and {{empresa}} in copywriting legends
  const resolvePlaceholders = (text: string, lead: Lead) => {
    if (!text) return '';
    return text
      .replace(/\{\{nome\}\}/gi, lead.name)
      .replace(/\{\{empresa\}\}/gi, lead.company || 'cicloCRED')
      .replace(/\{\{email\}\}/gi, lead.email || 'não informado')
      .replace(/\{\{telefone\}\}/gi, lead.phone || 'não informado');
  };

  // Helper to copy dataUrl image block to clipboard as PNG
  const copyImageToClipboard = async (dataUrl: string): Promise<boolean> => {
    try {
      if (!dataUrl) return false;
      if (!navigator.clipboard || !navigator.clipboard.write) {
        console.warn("Clipboard writing is not supported on this browser.");
        return false;
      }

      // Convert Unsplash URL or relative URL or base64 to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      let pngBlob = blob;
      // Modern Clipboard API strictly requires PNG format
      if (blob.type !== 'image/png') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = dataUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        ctx.drawImage(img, 0, 0);
        
        const converted = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!converted) return false;
        pngBlob = converted;
      }
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob })
      ]);
      return true;
    } catch (e) {
      console.warn("Could not copy image automatically to clipboard:", e);
      return false;
    }
  };

  // Multi-recipient integrated local send (single dispatcher style)
  const handleSendToSelectedLeads = async (channel: 'whatsapp' | 'copy') => {
    triggerSensoryFeedback('click', accSettings);
    if (selectedLeadIds.length === 0) {
      addNotification('⚠️ SELECIONE LEADS', 'Por favor, selecione ao menos um lead para o envio.', 'warning');
      return;
    }

    setIsSendingStatus(true);
    
    const activeImg = uploadedImages.find(img => img.id === selectedCampaignImageId) || uploadedImages[0];
    let imageCopied = false;
    if (activeImg) {
      imageCopied = await copyImageToClipboard(activeImg.dataUrl);
    }

    let dispatchedCount = 0;
    
    selectedLeadIds.forEach(leadId => {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;
      
      const personalizedGreeting = `Olá *${lead.name}*! 👋\n\n`;
      const finalMessage = resolvePlaceholders(`${personalizedGreeting}${customCaptionText}`, lead);

      if (channel === 'whatsapp' && lead.phone) {
        const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
        const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(finalMessage)}`;
        window.open(url, '_blank');
        dispatchedCount++;
      } else {
        dispatchedCount++;
      }
    });

    if (channel === 'copy') {
      const sampleLead = leads.find(l => l.id === selectedLeadIds[0]) || leads[0];
      const finalCopied = resolvePlaceholders(customCaptionText, sampleLead);
      navigator.clipboard.writeText(finalCopied);
      setCopiedStatus(true);
      setTimeout(() => setCopiedStatus(false), 3000);
      
      if (imageCopied) {
        addNotification(
          '🎨 IMAGEM E CAPTION COPIADOS',
          `A imagem real de "${activeImg?.title}" e o roteiro foram copiados no seu clipboard. Cole (Ctrl+V) onde desejar!`,
          'success'
        );
      } else {
        addNotification(
          '📋 COPIADO',
          `Texto copiado com sucesso!`,
          'success'
        );
      }
    } else {
      if (imageCopied) {
        addNotification(
          '📸 IMAGEM E CAPTION COPIADOS',
          `WhatsApp Aberto! A imagem de "${activeImg?.title}" foi copiada na Área de Transferência. Cole (Ctrl+V) no chat de cada contato para enviar diretamente sem links!`,
          'success'
        );
      } else {
        addNotification(
          '💬 DISPARO CONCLUÍDO',
          `Disparados ${dispatchedCount} links personalizados via WhatsApp com sucesso!`,
          'success'
        );
      }
    }

    awardXP(selectedLeadIds.length * 35 + 100);
    setIsSendingStatus(false);
  };

  // --- SUB-DELEGATE QUEUE BROADCAST CONTROLLERS ---
  const stopQueueEngine = () => {
    setIsQueueRunning(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (queueCleanupRef.current) {
      queueCleanupRef.current();
      queueCleanupRef.current = null;
    }
  };

  const handleAddSelectedToQueue = () => {
    const selectedLeads = leads.filter(l => selectedLeadIds.includes(l.id));
    if (selectedLeads.length === 0) {
      addNotification('⚠️ NENHUM SELECIONADO', 'Por favor, marque contatos da lista abaixo para enfileirar.', 'warning');
      return;
    }

    const newQueueItems: QueueItem[] = selectedLeads.map(l => ({
      lead: l,
      status: 'idle'
    }));

    setQueue(prev => [...prev, ...newQueueItems]);
    setSelectedLeadIds([]);
    triggerSensoryFeedback('success', accSettings);
    addNotification('📥 FILA ALIMENTADA', `Adicionados ${selectedLeads.length} contatos na Fila de Transmissão de Mídias.`, 'success');
  };

  const handleClearQueue = () => {
    stopQueueEngine();
    setQueue([]);
    setCurrentQueueIndex(-1);
    setCountdown(0);
    triggerSensoryFeedback('warning', accSettings);
  };

  const handleStartQueue = () => {
    if (queue.length === 0) {
      addNotification('⚠️ FILA VAZIA', 'Sua Fila de Transmissão de Mídias está vazia. Selecione contatos para iniciar.', 'warning');
      return;
    }
    triggerSensoryFeedback('chime', accSettings);
    setIsQueueRunning(true);
    
    let startIndex = queue.findIndex(item => item.status !== 'done');
    if (startIndex === -1) {
      const resetQueue = queue.map(item => ({ ...item, status: 'idle' as const }));
      setQueue(resetQueue);
      startIndex = 0;
    }
    
    setCurrentQueueIndex(startIndex);
  };

  const handleAssistedDispatch = async () => {
    if (currentQueueIndex === -1 || currentQueueIndex >= queue.length) return;
    const item = queue[currentQueueIndex];
    
    const personalizedGreeting = `Olá *${item.lead.name}*! 👋\n\n`;
    const resolvedBody = resolvePlaceholders(`${personalizedGreeting}${customCaptionText}`, item.lead);
    
    // Copy image to clipboard so they can paste it literally
    const activeImg = uploadedImages.find(img => img.id === selectedCampaignImageId) || uploadedImages[0];
    let imageCopied = false;
    if (activeImg) {
      imageCopied = await copyImageToClipboard(activeImg.dataUrl);
    }

    const rawPhone = item.lead.phone.replace(/\D/g, '');
    const cleanPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(resolvedBody)}`;
    
    window.open(waUrl, '_blank');

    if (imageCopied) {
      addNotification(
        '📸 COPIADO!',
        `Texto enviado para ${item.lead.name}! A imagem de "${activeImg.title}" está na Área de Transferência. Pressione [ Ctrl+V ] na janela aberta!`,
        'success'
      );
    } else {
      addNotification(
        '💬 LINK PREPARADO',
        `Texto e saudação disparados p/ WhatsApp de ${item.lead.name}!`,
        'success'
      );
    }

    setQueue(prev => prev.map((q, idx) => idx === currentQueueIndex ? { ...q, status: 'done' } : q));
    triggerSensoryFeedback('chime', accSettings);
    setCurrentQueueIndex(prev => prev + 1);
  };

  // Keyboard shortcut Enter listener for fast assisted queue pacing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isQueueRunning && currentQueueIndex !== -1 && currentQueueIndex < queue.length) {
        e.preventDefault();
        handleAssistedDispatch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQueueRunning, currentQueueIndex, queue, customCaptionText, uploadedImages, selectedCampaignImageId]);

  // Automated Queue dispatch logic
  // Resets countdown to 3 upon new currentQueueIndex, managing tab focus
  useEffect(() => {
    if (!isQueueRunning || currentQueueIndex === -1 || currentQueueIndex >= queue.length) {
      if (isQueueRunning && currentQueueIndex >= queue.length) {
        setIsQueueRunning(false);
        setCurrentQueueIndex(-1);
        triggerSensoryFeedback('success', accSettings);
        addNotification('🏆 CENTRAL DE DISPAROS', 'Sua Fila de Transmissão de Mídias foi concluída com sucesso!', 'success');
        awardXP(queue.length * 30 + 100);
      }
      return;
    }

    // Set status to sending
    setQueue(prev => prev.map((q, idx) => idx === currentQueueIndex ? { ...q, status: 'sending' } : q));
    setCountdown(3); // Reset interactive countdown and wait for user trigger
  }, [isQueueRunning, currentQueueIndex]);

  // Listen for tab return to reset countdown safely
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isQueueRunning && currentQueueIndex !== -1) {
        if (currentQueueIndex < queue.length) {
          const delay = currentQueueIndex === 0 ? 3 : 5;
          setCountdown(delay);
          addNotification('👀 RETORNO DETECTADO', `Foco retomado! Ajustando contagem para ${delay}s de segurança.`, 'info');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isQueueRunning, currentQueueIndex, queue.length]);

  useEffect(() => {
    if (!isQueueRunning || currentQueueIndex === -1 || currentQueueIndex >= queue.length) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          setCountdown(prev => prev - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown reached 0 - automatically dispatch if in auto mode
      if (!isAssistedMode) {
        handleAssistedDispatch();
      }
    }
  }, [isQueueRunning, currentQueueIndex, countdown, isAssistedMode]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Visual Identity Title Banner */}
      <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono font-black text-indigo-600 tracking-wider block">Central de Publicidade Integrada</span>
          <h2 className="text-xl font-black uppercase italic tracking-tight text-zinc-950 flex items-center gap-2">
            <Share2 className="w-6 h-6 text-indigo-600" />
            <span>Central de Mídia & Publicação Automática</span>
          </h2>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Selecione uma unidade disponível, customize roteiros de copywriting dinâmicos com imagens ou links e selecione de forma inteligente sua carteira de leads para envios facilitados.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            type="button"
            onClick={() => {
              triggerSensoryFeedback('click', accSettings);
              setWizardStep(1);
              setShowWizardModal(true);
            }}
            className="px-3 py-2 bg-indigo-650 hover:bg-indigo-700 text-white border-2 border-zinc-950 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Assistente em Etapas (Wizard)</span>
          </button>
          <div className="flex bg-zinc-100 p-1 border-2 border-zinc-950 rounded-xl space-x-1 font-mono font-bold text-[10px] items-center">
            <span className="px-2.5 py-1 bg-zinc-950 text-white rounded shrink-0">CRM SENSORIADO</span>
            <span className="px-2.5 py-1 text-zinc-650 flex items-center gap-1 shrink-0">
              <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Ativo
            </span>
          </div>
        </div>
      </div>

      {/* Navigation sub-categories */}
      <div className="flex flex-col md:flex-row border-4 border-zinc-950 bg-white p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] select-none gap-1.5">
        <button
          onClick={() => { triggerSensoryFeedback('click', accSettings); setActiveSubTab('publish'); }}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl transition flex items-center justify-center gap-2 ${activeSubTab === 'publish' ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-zinc-500 hover:bg-zinc-50'}`}
        >
          🚀 Publicar Unidade & Disparar
        </button>
        <button
          onClick={() => { triggerSensoryFeedback('click', accSettings); setActiveSubTab('computer'); }}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl transition flex items-center justify-center gap-2 ${activeSubTab === 'computer' ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-zinc-500 hover:bg-zinc-50'}`}
        >
          📁 Materiais Digitais & Books
        </button>
        <button
          onClick={() => { triggerSensoryFeedback('click', accSettings); setActiveSubTab('tasks'); }}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl transition flex items-center justify-center gap-2 ${activeSubTab === 'tasks' ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-zinc-500 hover:bg-zinc-50'}`}
        >
          📋 Cronograma de Mídia
        </button>
      </div>

      {/* CONCRETE WORKING VIEWS */}

      {/* VIEW 1: REFACTORED SELECTION & AUTOMATED BROADCAST */}
      {activeSubTab === 'publish' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUMN 1: SELECT UNITS (5/12 width) */}
          <div className="lg:col-span-4 bg-white border-4 border-zinc-950 p-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="border-b pb-2">
              <span className="text-[10px] font-mono font-black text-indigo-600 block uppercase">Passo pioneiro</span>
              <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight">1. Estoque e Books Disponíveis</h3>
            </div>

            {/* Property search bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar unidade, code ou bairro..."
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 py-2 pl-9 pr-4 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>

            {/* Properties Scrollable Inventory */}
            <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
              {/* Option for General Campaign without specific Property Unit */}
              <div 
                onClick={() => {
                  triggerSensoryFeedback('click', accSettings);
                  setSelectedPropertyId("");
                }}
                className={`border-4 rounded-2xl p-3 flex gap-3 cursor-pointer transition-all select-none items-center ${
                  !selectedPropertyId 
                    ? 'border-zinc-950 bg-zinc-100 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]' 
                    : 'border-dashed border-zinc-250 hover:bg-zinc-50 bg-white'
                }`}
              >
                <div className="w-16 h-16 rounded-xl border border-zinc-400 bg-zinc-900 flex items-center justify-center text-amber-400 shrink-0 font-black text-xs font-mono">
                  ★ CAMPA
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black uppercase text-zinc-950 leading-tight">Post Geral (Sem Unidade Vinculada)</h4>
                  <p className="text-[10px] text-zinc-500 font-bold mt-1">Selecione para disparar artes avulsas, informativos de crédito ou imagens locais.</p>
                </div>
              </div>

              {filteredProperties.length === 0 ? (
                <div className="text-center py-10 font-mono text-zinc-400 text-[11px] uppercase border-2 border-dashed rounded-xl">
                  Nenhuma unidade encontrada.
                </div>
              ) : (
                filteredProperties.map(property => {
                  const isSelected = selectedPropertyId === property.id;
                  return (
                    <div 
                      key={property.id}
                      onClick={() => {
                        triggerSensoryFeedback('click', accSettings);
                        setSelectedPropertyId(property.id);
                      }}
                      className={`border-4 rounded-2xl p-3 flex gap-3 cursor-pointer transition-all select-none ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/20 shadow-[2px_2px_0px_0px_rgba(99,102,241,1)]' 
                          : 'border-zinc-950 hover:bg-zinc-50 bg-white'
                      }`}
                    >
                      {/* Photo Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-300 shrink-0">
                        {property.imageUrl ? (
                          <img 
                            src={property.imageUrl} 
                            alt={property.title} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black font-mono text-zinc-400 text-[9px] uppercase">BOOK</div>
                        )}
                      </div>

                      {/* Info details */}
                      <div className="min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="text-[9px] font-mono font-black text-indigo-600 uppercase leading-none">{property.code}</p>
                          <h4 className="text-xs font-black truncate text-zinc-950 uppercase mt-1">{property.title}</h4>
                          <p className="text-[10px] text-zinc-500 font-semibold truncate">{property.neighborhood}</p>
                        </div>
                        <p className="text-[10.5px] font-mono font-black text-zinc-900 leading-none">
                          {property.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected unit highlights */}
            {selectedProperty && (
              <div className="bg-zinc-50 border-2 border-zinc-950 p-3 rounded-2xl text-[11px] font-medium text-zinc-700 space-y-1">
                <span className="font-mono font-black text-zinc-900 block text-[9.5px]">CARACTERÍSTICAS DA PUBLICAÇÃO</span>
                <div>📐 Área Privativa: <strong className="text-zinc-900 font-extrabold">{selectedProperty.sizeSqm}m²</strong></div>
                <div>🛏️ Dormitórios: <strong className="text-zinc-900 font-extrabold">{selectedProperty.bedrooms} suítes</strong></div>
                <div>📖 URL Book Ativo: <strong className="text-indigo-600 font-extrabold break-all font-mono text-[9px]">ciclocred.com/book/{selectedProperty.code}</strong></div>
              </div>
            )}
          </div>

          {/* COLUMN 2: CUSTOMIZE COPY & PREVIEW (4/12 width) */}
          <div className="lg:col-span-4 bg-white border-4 border-zinc-950 p-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="border-b pb-2">
              <span className="text-[10px] font-mono font-black text-indigo-600 block uppercase">Engenho inteligente</span>
              <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight">2. Inteligência de Copy & Legendagem</h3>
            </div>

            {/* Templates grid selectors */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-[10px] uppercase font-mono font-black text-zinc-650">Abordagem de Conversão</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'mcmv', label: '🏡 Minha Casa Minha Vida' },
                  { id: 'entrada', label: '💵 Roteiro Entrada' },
                  { id: 'premium', label: '📈 Investimento SP' },
                  { id: 'personalizado', label: '✏️ Roteiro Neutro' }
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => { 
                      triggerSensoryFeedback('click', accSettings); 
                      setCustomMsgTemplate(tpl.id as any); 
                    }}
                    className={`p-2 border-2 text-[10px] font-black uppercase text-center rounded-xl transition-all cursor-pointer ${
                      customMsgTemplate === tpl.id 
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                        : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-350 text-zinc-500'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Attachable components sliders */}
            <div className="bg-zinc-5 border-2 border-zinc-950 p-3 rounded-2xl grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <input
                  id="include-book"
                  type="checkbox"
                  checked={includeBookLink}
                  onChange={(e) => {
                    triggerSensoryFeedback('click', accSettings);
                    setIncludeBookLink(e.target.checked);
                  }}
                  className="w-4 h-4 rounded text-indigo-600 border-zinc-950 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="include-book" className="font-mono font-black text-[9px] uppercase cursor-pointer text-zinc-700 select-none">Anexar Book</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="include-price"
                  type="checkbox"
                  checked={includePriceInfo}
                  onChange={(e) => {
                    triggerSensoryFeedback('click', accSettings);
                    setIncludePriceInfo(e.target.checked);
                  }}
                  className="w-4 h-4 rounded text-indigo-600 border-zinc-950 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="include-price" className="font-mono font-black text-[9px] uppercase cursor-pointer text-zinc-700 select-none">Exibir Preço</label>
              </div>
            </div>

            {/* Text editor block */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-mono font-black text-zinc-650">Revisar Texto Copywriting</label>
              <textarea
                rows={8}
                value={customCaptionText}
                onChange={(e) => setCustomCaptionText(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 p-3.5 rounded-2xl font-medium font-sans text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Foto e Imagem do Criativo (Mídias) */}
            <div className="space-y-2 border-t pt-2">
              <span className="text-[10px] uppercase font-mono font-black text-zinc-650 block">📸 Fotos & Imagens do Criativo</span>
              
              {/* Drag and Drop / Input Upload file */}
              <div className="relative border-2 border-dashed border-zinc-950 p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100/50 transition text-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Smartphone className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                <p className="text-[10px] font-mono font-black uppercase text-zinc-950">Importar Foto da Galeria</p>
                <p className="text-[8.5px] text-zinc-500 font-medium">Clique ou arraste imagens (PNG, JPG) para carregar no CRM</p>
              </div>

              {/* Uploaded Images Scrollable Grid Grid */}
              <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-[85px] p-1">
                {uploadedImages.map((img) => {
                  const isSelected = selectedCampaignImageId === img.id;
                  return (
                    <div 
                      key={img.id}
                      onClick={() => {
                        triggerSensoryFeedback('click', accSettings);
                        setSelectedCampaignImageId(img.id);
                      }}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer group transition-all ${
                        isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-zinc-950'
                      }`}
                      title={img.title}
                    >
                      <img src={img.dataUrl} alt={img.title} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => handleDeleteImage(img.id, e)}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-rose-500 hover:bg-rose-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Deletar Imagem"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DIRETO PARA REDES SOCIAIS */}
            <div className="bg-zinc-950 p-4 rounded-3xl border-2 border-zinc-950 space-y-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white">
              <span className="text-[9px] font-mono font-black text-indigo-400 block uppercase tracking-wider">🔗 CAMINHO DIRETO: Compartilhar Story & Status</span>
              
              <div className="grid grid-cols-3 gap-1.5 text-[9px] font-mono font-black uppercase">
                {/* WHATSAPP STATUS */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(customCaptionText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    triggerSensoryFeedback('click', accSettings);
                    awardXP(25);
                    addNotification('📲 WHATSAPP STATUS', 'Escolha "Meu Status" ou contatos no WhatsApp.', 'success');
                  }}
                  className="flex flex-col items-center justify-center p-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl border border-zinc-800 text-center transition cursor-pointer text-white hover:text-white"
                >
                  <MessageSquare className="w-4 h-4 mb-1" />
                  <span>Postar Status</span>
                </a>

                {/* INSTAGRAM STORIES */}
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    triggerSensoryFeedback('click', accSettings);
                    navigator.clipboard.writeText(customCaptionText);
                    awardXP(25);
                    addNotification('📸 INSTAGRAM STORIES', 'Copie a legenda, use a foto importada e poste nos Stories!', 'info');
                  }}
                  className="flex flex-col items-center justify-center p-2 bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 hover:opacity-90 rounded-xl border border-zinc-800 text-center transition cursor-pointer text-white hover:text-white"
                >
                  <Instagram className="w-4 h-4 mb-1" />
                  <span>Ir Story 📸</span>
                </a>

                {/* FACEBOOK FEED */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(customCaptionText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    triggerSensoryFeedback('click', accSettings);
                    awardXP(25);
                    addNotification('👥 FACEBOOK POST', 'Redirecionando para compartilhar na sua timeline!', 'success');
                  }}
                  className="flex flex-col items-center justify-center p-2 bg-indigo-700 hover:bg-indigo-650 rounded-xl border border-zinc-800 text-center transition cursor-pointer text-white hover:text-white"
                >
                  <Facebook className="w-4 h-4 mb-1" />
                  <span>Linha Tempo</span>
                </a>
              </div>

              {/* NATIVE INTEGRATED SMART MULTI-SHARE BUTTON */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-2 bg-indigo-650 hover:bg-indigo-500 text-white font-mono font-black text-[9.5px] uppercase rounded-xl border-2 border-white flex items-center justify-center gap-1.5 transition active:scale-95 shadow-[1.5px_1.5px_0px_0px_white] hover:shadow-none"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span>Compatibilidade Total (Native Share) 📱</span>
              </button>
            </div>
          </div>

          {/* COLUMN 3: LEADS SEARCH & DISPATCH TARGETS (3/12 width) */}
          <div className="lg:col-span-4 bg-white border-4 border-zinc-950 p-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="border-b pb-2">
                <span className="text-[10px] font-mono font-black text-indigo-600 block uppercase">Alvo comercial</span>
                <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight">3. Destinatários Leads</h3>
              </div>

              {/* Lead search and filter */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar lead por nome ou cel..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 py-2 pl-9 pr-4 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                {/* Status Filter tags */}
                <div className="flex gap-1 overflow-x-auto pb-1 text-[8.5px] font-black uppercase font-mono select-none">
                  {[
                    { key: 'todos', label: 'todos' },
                    { key: 'novo', label: 'novo' },
                    { key: 'morno', label: 'morno' },
                    { key: 'quente', label: 'quente' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setLeadStatusFilter(tab.key)}
                      className={`px-2 py-1 rounded-md border shrink-0 transition ${
                        leadStatusFilter === tab.key 
                          ? 'bg-zinc-950 text-white border-zinc-950' 
                          : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-500'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiple checkbox list */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {filteredLeads.length === 0 ? (
                  <div className="text-center py-6 font-mono text-zinc-400 text-[10px] uppercase border rounded-xl">
                    Nenhum destinatário.
                  </div>
                ) : (
                  filteredLeads.map(lead => {
                    const isChecked = selectedLeadIds.includes(lead.id);
                    return (
                      <div 
                        key={lead.id}
                        onClick={() => handleToggleLeadSelection(lead.id)}
                        className={`flex items-center gap-3 p-2 border-2 rounded-xl text-xs font-semibold cursor-pointer select-none transition ${
                          isChecked ? 'border-indigo-600 bg-indigo-50/20' : 'border-zinc-200 hover:bg-zinc-50 bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by div click
                          className="w-4 h-4 rounded text-indigo-600 border-zinc-900 cursor-pointer shrink-0 ml-1"
                        />
                        <div className="min-w-0">
                          <p className="font-extrabold text-zinc-900 truncate uppercase text-[11px]">{lead.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono truncate">{lead.phone || 'Sem Celular'}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selector metrics and toggle all */}
              <div className="flex justify-between items-center text-[10px] font-mono font-black text-zinc-500 border-t pt-2 uppercase">
                <span>Selecionados: {selectedLeadIds.length}</span>
                <button
                  onClick={handleToggleSelectAllLeads}
                  className="text-indigo-600 hover:text-indigo-800 underline active:opacity-60"
                >
                  {filteredLeads.every(l => selectedLeadIds.includes(l.id)) ? 'Desmarcar Todos' : 'Marcar Visíveis'}
                </button>
              </div>

              {/* Queue feeding trigger buttons */}
              <button
                type="button"
                onClick={handleAddSelectedToQueue}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-black text-[10px] uppercase rounded-xl border-2 border-zinc-950 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Anexar Selecionados à Fila de Disparo</span>
              </button>
            </div>

            {/* SENDING ACTION HUBS (DISPATCH QUEUE PROCESSOR INTERACTIVE SECTION) */}
            <div className="space-y-4 pt-3 border-t-2 border-dashed border-zinc-200">
              <span className="text-[10px] font-mono font-black text-indigo-600 block uppercase">📡 Fila de Transmissão de Mídias ({queue.length} contatos)</span>
              
              {/* Dispatch Progress Tracking Bar */}
              {queue.length > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono font-black text-zinc-650 uppercase">
                    <span>Progresso Transmissão:</span>
                    <span>
                      {queue.filter(q => q.status === 'done').length}/{queue.length} ({Math.round((queue.filter(q => q.status === 'done').length / queue.length) * 100)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-100 border border-zinc-950 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${(queue.filter(q => q.status === 'done').length / queue.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Assisted vs Automatic control toggle buttons */}
              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono font-black uppercase text-center select-none">
                <button
                  type="button"
                  onClick={() => { setIsAssistedMode(true); }}
                  className={`p-1.5 border-2 rounded-lg transition ${isAssistedMode ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 border-zinc-200 text-zinc-500'}`}
                >
                  Modo Assistido
                </button>
                <button
                  type="button"
                  onClick={() => { setIsAssistedMode(false); }}
                  className={`p-1.5 border-2 rounded-lg transition ${!isAssistedMode ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 border-zinc-200 text-zinc-500'}`}
                >
                  Modo Automático
                </button>
              </div>

              {/* Main Queue Controls */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono font-black uppercase">
                {isQueueRunning ? (
                  <button
                    type="button"
                    onClick={stopQueueEngine}
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-rose-500 hover:bg-rose-600 text-white border-2 border-zinc-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Pausar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartQueue}
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-zinc-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Iniciar Fila</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClearQueue}
                  className="p-2.5 bg-white hover:bg-zinc-100 text-zinc-950 border-2 border-zinc-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition"
                >
                  <span>Limpar Fila</span>
                </button>
              </div>

              {/* Assisted Command Instruction Card or Blocking Alert */}
              {isQueueRunning && (
                <div className="p-4 bg-zinc-950 text-white rounded-xl border-2 border-indigo-500/50 space-y-3 select-none animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[9px] uppercase font-mono text-indigo-400 font-black block">🔥 FILA DE TRANSMISSÃO ATIVA</span>
                    </div>
                    {countdown > 0 ? (
                      <span className="text-xs font-mono text-indigo-300 font-bold">Aguardando {countdown}s...</span>
                    ) : (
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 font-bold animate-pulse">PRONTO PARA DISPARO</span>
                    )}
                  </div>

                  {currentQueueIndex !== -1 && currentQueueIndex < queue.length && (() => {
                    const activeItem = queue[currentQueueIndex];
                    return (
                      <div className="space-y-3">
                        <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 space-y-1">
                          <div className="text-[11px] font-black text-white">{activeItem.lead.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{activeItem.lead.phone} | {activeItem.lead.origin}</div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAssistedDispatch}
                          className={`w-full py-3 font-mono font-black text-xs uppercase rounded-xl border-2 tracking-wide flex items-center justify-center gap-2 transition active:scale-95 duration-200 ${
                            countdown > 0
                              ? 'bg-amber-500 border-amber-400 text-zinc-950 hover:bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                              : 'bg-emerald-500 border-emerald-400 text-white hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse'
                          }`}
                        >
                          <Send className="w-4 h-4" />
                          <span>{countdown > 0 ? `Disparar Cedo (${countdown}s)` : 'DISPARAR WHATSAPP (ENTER ⏎)'}</span>
                        </button>
                        <p className="text-[8.5px] text-zinc-500 text-center font-medium leading-normal">
                          ⚠️ Clique no botão ou pressione [ Enter ] para abrir a conversa. Navegadores exigem cliques reais para habilitar o desvio sem bloqueadores.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Quick queue scrollable contents list representation */}
              {queue.length > 0 && (
                <div className="border border-zinc-250 rounded-xl overflow-hidden max-h-[140px] overflow-y-auto">
                  <div className="bg-zinc-50 border-b p-1.5 text-[9px] font-bold text-zinc-500 uppercase font-mono flex justify-between select-none">
                    <span>Destinatário Enfileirado</span>
                    <span>Status</span>
                  </div>
                  <div className="divide-y text-[10.5px] font-semibold text-zinc-700">
                    {queue.map((item, idx) => {
                      const isCurrent = idx === currentQueueIndex;
                      return (
                        <div 
                          key={`${item.lead.id}-${idx}`}
                          className={`p-1.5 flex justify-between items-center ${isCurrent ? 'bg-indigo-50/45 border-l-4 border-indigo-600' : 'bg-white'}`}
                        >
                          <span className="truncate max-w-[170px] uppercase font-mono text-[10px]">{item.lead.name}</span>
                          <div>
                            {item.status === 'idle' && (
                              <span className="text-[9px] uppercase font-mono font-black text-zinc-450">Aguardando</span>
                            )}
                            {item.status === 'sending' && (
                              <span className="text-[9px] uppercase font-mono font-black text-indigo-600 animate-pulse">Disparando...</span>
                            )}
                            {item.status === 'waiting' && (
                              <span className="text-[9px] uppercase font-mono font-black text-amber-500 animate-pulse">Próximo...</span>
                            )}
                            {item.status === 'done' && (
                              <span className="text-[9px] uppercase font-mono font-black text-emerald-500">Concluído ✓</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Holographic specs alerts details */}
              <div className="bg-zinc-950 p-2.5 rounded-xl text-[9px] font-mono text-zinc-450 border border-zinc-850 flex items-center justify-between select-none">
                <span>CICLOCRED BROADCASTER ACTIVES</span>
                <span className="text-emerald-400 font-bold">LIVE-LINKING READY ✓</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 2: MATERIAL DIGITAL REGISTER & BOOKS */}
      {activeSubTab === 'computer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          {/* Virtual File Manager */}
          <div className="lg:col-span-7 bg-zinc-950 border-4 border-zinc-950 rounded-2xl p-6 text-white space-y-5 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full filter blur-[100px] pointer-events-none" />
            
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 font-mono">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <span className="text-xs uppercase font-black text-indigo-400">DISPOSITIVO SINCRO: MEU_COMPUTADOR</span>
              </div>
              <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-950 border border-emerald-900 px-2 py-0.5 rounded-full">
                Conectado ✓
              </span>
            </div>

            {/* Glasses assistant mock */}
            <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300">
                <Glasses className="w-5 h-5 text-violet-400" />
                <h4 className="text-xs font-black uppercase font-mono tracking-wider">Assistente Holográfico Proativo cicloCRED</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Compartilhe fotos de fachadas e diagramas com leads usando o QR Code ou enviando de modo síncrono pelo WhatsApp local.
              </p>
            </div>

            {/* Simulated Desktop list */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs uppercase font-black font-mono tracking-wider text-zinc-300">Listagem de Books e Lançamentos Cadastrados</h4>
                <button
                  onClick={() => setIsAddingBook(!isAddingBook)}
                  className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-950 rounded font-mono font-black text-[9px] uppercase border cursor-pointer"
                >
                  {isAddingBook ? 'Fechar ✕' : '+ Cadastrar Material'}
                </button>
              </div>

              {isAddingBook && (
                <form onSubmit={handleAddBook} className="bg-zinc-900 p-4 rounded-xl border border-zinc-700 space-y-3 text-xs text-zinc-300 animate-scaleIn">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase font-mono text-zinc-450 mb-1">Título do Material</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Folder de Apartamento Platinum.pdf"
                        value={newBookTitle}
                        onChange={(e) => setNewBookTitle(e.target.value)}
                        className="w-full bg-zinc-850 border border-zinc-755 rounded p-1.5 focus:outline-none focus:border-indigo-400 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-mono text-zinc-450 mb-1">Link URL Externo do File</label>
                      <input
                        type="url"
                        required
                        placeholder="Ex: https://files.com/book.pdf"
                        value={newBookUrl}
                        onChange={(e) => setNewBookUrl(e.target.value)}
                        className="w-full bg-zinc-850 border border-zinc-755 rounded p-1.5 focus:outline-none focus:border-indigo-400 text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase font-mono text-zinc-450 mb-1">Categoria</label>
                      <select
                        value={newBookCategory}
                        onChange={(e) => setNewBookCategory(e.target.value)}
                        className="w-full bg-zinc-850 border border-zinc-755 rounded p-1.5 focus:outline-none text-white font-mono"
                      >
                        <option value="Corporativo">Corporativo</option>
                        <option value="Tabelas">Tabelas</option>
                        <option value="Imagens">Imagens</option>
                        <option value="Apresentações">Apresentações</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-mono text-zinc-450 mb-1">Tamanho do Arquivo</label>
                      <input
                        type="text"
                        placeholder="Ex: 5.5 MB"
                        value={newBookSize}
                        onChange={(e) => setNewBookSize(e.target.value)}
                        className="w-full bg-zinc-850 border border-zinc-755 rounded p-1.5 focus:outline-none text-white font-mono"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase rounded border border-zinc-950 font-mono shadow cursor-pointer text-center"
                      >
                        Salvar Material
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {mediaBooks.map((book) => (
                  <div key={book.id} className="flex justify-between items-center p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl group transition">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-5 h-5 text-indigo-400" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono leading-tight truncate text-white uppercase font-black">{book.title}</p>
                        <p className="text-[8.5px] font-mono text-zinc-500 mt-0.5">{book.category} · {book.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={book.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-zinc-850 hover:bg-zinc-750 text-zinc-350 hover:text-white rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDeleteBook(book.id)}
                        className="p-1.5 bg-zinc-850 hover:bg-rose-950 text-zinc-400 hover:text-red-400 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick tips panel */}
          <div className="lg:col-span-5 bg-white border-4 border-zinc-950 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <span className="text-[10px] uppercase font-mono font-black text-rose-600 block">Capacitação cicloCRED</span>
            <h3 className="text-md font-black italic text-zinc-950 uppercase">Roteiros e Disparos Recomendados</h3>
            
            <div className="space-y-4 text-xs">
              <div className="border-l-4 border-emerald-500 pl-3 py-1">
                <span className="font-extrabold text-emerald-800 font-mono text-[9px] uppercase tracking-wider block">Estoque Cury Metropolitana</span>
                <p className="text-zinc-500 leading-tight font-medium mt-1">Combine captações prontas com as fotos e folhetos armazenados em sua máquina para alimentar as publicações rapidamente.</p>
              </div>

              <div className="border-l-4 border-rose-500 pl-3 py-1">
                <span className="font-extrabold text-rose-800 font-mono text-[9px] uppercase tracking-wider block">MCMV & SBPE</span>
                <p className="text-zinc-500 leading-tight font-medium mt-1">Conecte links dos books de simulação simplificada com as conversas iniciadas de modo a reduzir taxas de evasão.</p>
              </div>
            </div>

            <button
              onClick={() => { triggerSensoryFeedback('click', accSettings); setActiveSubTab('publish'); }}
              className="w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-zinc-950 font-mono text-[10px] font-black uppercase rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition active:translate-y-0.5"
            >
              💬 Voltar às Unidades & Envio
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: TAREFAS DE MÍDIA CRONOGRAMA */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-6">
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950 italic">
                  <span>Administração e Planejamento Comercial</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Gerencie prazos, agendas de carrosséis e posts de divulgação do estoque cicloCRED.</p>
              </div>
              <button
                onClick={() => { triggerSensoryFeedback('click', accSettings); setIsAddingTask(!isAddingTask); }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-black text-[10px] uppercase rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingTask ? 'Fechar Formulário' : 'Nova Tarefa de Mídia'}</span>
              </button>
            </div>

            {isAddingTask && (
              <form onSubmit={handleAddNewTask} className="bg-zinc-50 border-2 border-zinc-950 p-5 rounded-2xl space-y-4 animate-scaleIn text-xs text-zinc-800">
                <div className="font-mono font-black uppercase text-indigo-700 tracking-wider text-[10px] border-b pb-1">Novo Cronograma Comercial</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9.5px] uppercase font-mono font-black text-zinc-650 mb-1">Título/Campanha</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carrossel Instagram: Minha Casa Minha Vida"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full bg-white border-2 border-zinc-950 rounded-lg p-2 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[9.5px] uppercase font-mono font-black text-zinc-650 mb-1">Canal de Mídia</label>
                    <select
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value as any)}
                      className="w-full bg-white border-2 border-zinc-950 rounded-lg p-2 font-extrabold text-zinc-800 outline-none"
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook Ads</option>
                      <option value="E-mail">E-mail</option>
                      <option value="Portal">Portal Imobiliário</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9.5px] uppercase font-mono font-black text-zinc-650 mb-1">Urguência</label>
                    <div className="flex items-center gap-1.5 mt-1">
                      {['alta', 'media', 'baixa'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewTaskPriority(p as any)}
                          className={`flex-1 py-1.5 rounded font-mono font-black text-[9px] uppercase border transition-all cursor-pointer ${newTaskPriority === p ? 'bg-zinc-950 text-white border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-zinc-500 border-zinc-350 hover:bg-zinc-100'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[9.5px] uppercase font-mono font-black text-zinc-650 mb-1">Observações da postagem</label>
                  <textarea
                    rows={3}
                    placeholder="Hashtags, links de planilhas de precificação e fotos recomendadas..."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="w-full bg-white border-2 border-zinc-950 rounded-lg p-3 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-950 text-white font-mono font-black text-[10px] uppercase rounded-xl border border-zinc-950 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
                  >
                    Confirmar e Gravar Nova Campanha / Roteiro
                  </button>
                </div>
              </form>
            )}

            {/* List and grid tasks rendering */}
            <div className="pt-2">
              {tasks.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-zinc-200 text-zinc-400 uppercase font-mono font-bold text-xs">
                  Nenhuma campanha cadastrada.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.map((task) => {
                    const priorityColor = task.priority === 'alta' ? 'bg-red-100 border-red-500 text-red-700' : task.priority === 'media' ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-zinc-100 border-zinc-500 text-zinc-600';
                    const isDone = task.status === 'concluido';
                    return (
                      <div 
                        key={task.id} 
                        className={`bg-white border-4 border-zinc-950 p-4 rounded-2xl flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition hover:-translate-y-0.5 ${isDone ? 'opacity-70 bg-zinc-50 border-zinc-400' : ''}`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-1.5">
                            <span className="text-[9px] font-mono font-black bg-indigo-100 border border-indigo-400 px-2.5 py-0.5 rounded-full uppercase text-indigo-800">
                              {task.category}
                            </span>
                            <span className={`text-[8px] font-mono font-black border px-2 py-0.5 rounded-full uppercase ${priorityColor}`}>
                              {task.priority}
                            </span>
                          </div>

                          <h4 className={`text-xs font-black uppercase text-zinc-950 tracking-tight font-mono ${isDone ? 'line-through text-zinc-400' : ''}`}>
                            {task.title}
                          </h4>
                          <p className="text-[10.5px] text-zinc-500 font-semibold leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        <div className="flex justify-between items-end border-t border-zinc-100 mt-4 pt-2 flex-wrap gap-2 text-[10px] font-mono font-bold">
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(task.id)}
                            className="flex items-center gap-1.5 uppercase font-black text-zinc-700 hover:text-indigo-600"
                          >
                            {isDone ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="text-emerald-700">CONCLUÍDO</span>
                              </>
                            ) : task.status === 'em_andamento' ? (
                              <>
                                <span className="relative flex h-2.5 w-2.5 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-bounce"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                                </span>
                                <span className="text-indigo-600">EM EM PROGRESSO</span>
                              </>
                            ) : (
                              <>
                                <Circle className="w-4 h-4 text-zinc-400 shrink-0" />
                                <span className="text-zinc-500">PENDENTE</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 px-2 border border-rose-300 rounded hover:border-rose-600 text-rose-600 hover:bg-rose-50 font-mono text-[9px] uppercase font-black cursor-pointer"
                          >
                            DELETAR
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP-BY-STEP CAMPAIGN CREATION WIZARD (MODAL WIDGET) */}
      {/* ========================================================= */}
      {showWizardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border-4 border-zinc-950 w-full max-w-2xl rounded-3xl shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-indigo-600 text-white p-5 border-b-4 border-zinc-950 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
                <div>
                  <h3 className="font-mono font-black text-sm uppercase leading-none">ASSISTENTE DE CAMPANHAS EM ETAPAS</h3>
                  <p className="text-[10px] font-mono text-indigo-200 mt-0.5">Definição rápida de criativos, copywriting e envio direcionado</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWizardModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-950/20 border-2 border-white/30 hover:border-white text-white flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stepper Progress bar */}
            <div className="bg-zinc-50 border-b-2 border-zinc-950 px-5 py-3 flex items-center justify-between font-mono text-[9px] font-black uppercase text-zinc-500 shrink-0 select-none">
              <div className="flex items-center gap-4">
                <span className={`px-2 py-0.5 rounded ${wizardStep === 1 ? 'bg-indigo-600 text-white' : 'bg-zinc-200 text-zinc-650'}`}>1. CRIATIVO & ORIGEM</span>
                <span className="text-zinc-350">➔</span>
                <span className={`px-2 py-0.5 rounded ${wizardStep === 2 ? 'bg-indigo-600 text-white' : 'bg-zinc-200 text-zinc-650'}`}>2. COPYWRITING</span>
                <span className="text-zinc-350">➔</span>
                <span className={`px-2 py-0.5 rounded ${wizardStep === 3 ? 'bg-indigo-600 text-white' : 'bg-zinc-200 text-zinc-650'}`}>3. DESTINATÁRIOS</span>
              </div>
              <span>Etapa {wizardStep} de 3</span>
            </div>

            {/* Scrollable Step Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-zinc-800 flex-1">
              
              {/* STEP 1: SELECT ORIGINAL CONTENT */}
              {wizardStep === 1 && (
                <div className="space-y-4 animate-scaleIn">
                  <div className="space-y-1">
                    <h4 className="font-mono font-black uppercase text-zinc-950 text-xs">Qual a origem das mídias da campanha?</h4>
                    <p className="text-zinc-550 leading-tight">Escolha se gostaria de usar as fotos de uma Unidade do Estoque ou mídias e books locais avulsos.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setWizardPropertySource('unit')}
                      className={`border-4 rounded-2xl p-4 text-left transition select-none flex flex-col justify-between cursor-pointer ${
                        wizardPropertySource === 'unit' 
                          ? 'border-indigo-650 bg-indigo-50/20 shadow-[3px_3px_0px_0px_rgba(99,102,241,1)]' 
                          : 'border-zinc-950 bg-white hover:bg-zinc-50'
                      }`}
                    >
                      <span className="text-xl">🏢</span>
                      <div className="mt-2 text-zinc-950 font-black uppercase font-mono text-[11px]">Unidade do CRM</div>
                      <span className="text-[10px] text-zinc-500 mt-1">Carregar as fotos, metragens, link do site e tabela de preços de um imóvel do estoque.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWizardPropertySource('local')}
                      className={`border-4 rounded-2xl p-4 text-left transition select-none flex flex-col justify-between cursor-pointer ${
                        wizardPropertySource === 'local' 
                          ? 'border-indigo-650 bg-indigo-50/20 shadow-[3px_3px_0px_0px_rgba(99,102,241,1)]' 
                          : 'border-zinc-950 bg-white hover:bg-zinc-50'
                      }`}
                    >
                      <span className="text-xl">📁</span>
                      <div className="mt-2 text-zinc-950 font-black uppercase font-mono text-[11px]">Mídias/Arquivos Locais</div>
                      <span className="text-[10px] text-zinc-500 mt-1">Carregar imagens da sua máquina e definir legendas avulsas (Ideal para stories/posts gerais).</span>
                    </button>
                  </div>

                  {/* Sub-Selection blocks */}
                  {wizardPropertySource === 'unit' ? (
                    <div className="space-y-3 p-3 bg-zinc-50 border-2 border-zinc-950 rounded-2xl">
                      <label className="block font-mono font-black uppercase text-zinc-700 text-[10px]">🏢 Selecione a Unidade do Estoque:</label>
                      <select
                        value={wizardSelectedPropertyId}
                        onChange={(e) => setWizardSelectedPropertyId(e.target.value)}
                        className="w-full bg-white border-2 border-zinc-950 rounded-xl p-2.5 font-bold uppercase outline-none text-xs text-zinc-950"
                      >
                        {properties.map(p => (
                          <option key={p.id} value={p.id}>{p.code} - {p.title} ({p.neighborhood})</option>
                        ))}
                      </select>
                      {(() => {
                        const prop = properties.find(p => p.id === wizardSelectedPropertyId);
                        if (!prop) return null;
                        return (
                          <div className="flex gap-3 items-center bg-white p-2.5 rounded-xl border border-zinc-200">
                            <img src={prop.imageUrl} className="w-12 h-12 object-cover rounded-lg border border-zinc-300" referrerPolicy="no-referrer" />
                            <div>
                              <p className="font-black text-zinc-950 uppercase">{prop.title}</p>
                              <p className="text-[10px] text-zinc-500 font-mono">VALOR SUGERIDO: {prop.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-3 p-3 bg-zinc-50 border-2 border-zinc-950 rounded-2xl">
                      <label className="block font-mono font-black uppercase text-zinc-700 text-[10px]">📷 Selecione Imagens e Galeria Local:</label>
                      
                      <div className="bg-white border-2 border-dashed border-zinc-300 hover:border-zinc-950 transition rounded-xl p-4 text-center relative cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <Smartphone className="w-5 h-5 mx-auto text-indigo-600 mb-1" />
                        <p className="font-mono font-black text-[10px] uppercase text-zinc-950">Fazer Upload de Foto Comercial</p>
                        <p className="text-[9px] text-zinc-500">Imagens carregarão no estoque de mídia local do app.</p>
                      </div>

                      {uploadedImages.length > 0 && (
                        <div className="space-y-1">
                          <label className="block text-[8.5px] uppercase font-mono font-black text-zinc-400">Artes e Fotos Disponíveis:</label>
                          <div className="grid grid-cols-5 gap-2">
                            {uploadedImages.map(img => (
                              <div
                                key={img.id}
                                onClick={() => setWizardSelectedLocalImageId(img.id)}
                                className={`relative aspect-square border-2 rounded-lg overflow-hidden cursor-pointer ${
                                  wizardSelectedLocalImageId === img.id ? 'border-indigo-650 ring-2 ring-indigo-500/20 bg-indigo-50' : 'border-zinc-900 hover:opacity-90'
                                }`}
                              >
                                <img src={img.dataUrl} className="w-full h-full object-cover" />
                                {wizardSelectedLocalImageId === img.id && (
                                  <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center font-bold text-[10px] text-white">✓</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: COPYWRITING & ROTEAR LEGENDAS */}
              {wizardStep === 2 && (
                <div className="space-y-4 animate-scaleIn">
                  <div className="space-y-1">
                    <h4 className="font-mono font-black uppercase text-zinc-950 text-xs">Opções de Copywriting e Legendagem</h4>
                    <p className="text-zinc-550 leading-tight">Escolha o gatilho emocional para formatar a legenda com as tags dinâmicas do CRM.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'mcmv', label: '🏡 Roteiro MCMV / FGTS' },
                      { id: 'entrada', label: '💵 Entrada Facilitada' },
                      { id: 'premium', label: '📈 Investimento Rentabilidade' },
                      { id: 'personalizado', label: '✏️ Roteiro Neutro/Geral' }
                    ].map(tpl => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setWizardTemplate(tpl.id as any)}
                        className={`p-2 border-2 text-[10px] font-black uppercase text-center rounded-xl transition cursor-pointer ${
                          wizardTemplate === tpl.id 
                            ? 'bg-zinc-950 text-white border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                            : 'bg-zinc-100 hover:bg-zinc-205 border-zinc-300 text-zinc-500'
                        }`}
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>

                  {wizardPropertySource === 'unit' && (
                    <div className="grid grid-cols-2 gap-3 p-2.5 bg-zinc-50 border-2 border-zinc-950 rounded-xl">
                      <div className="flex items-center gap-2 col-span-1">
                        <input
                          id="w-book"
                          type="checkbox"
                          checked={wizardIncludeBook}
                          onChange={(e) => setWizardIncludeBook(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-zinc-950 focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="w-book" className="font-mono font-black font-extrabold text-[9px] uppercase cursor-pointer text-zinc-700">Incluir Link de Book</label>
                      </div>
                      <div className="flex items-center gap-2 col-span-1">
                        <input
                          id="w-price"
                          type="checkbox"
                          checked={wizardIncludePrice}
                          onChange={(e) => setWizardIncludePrice(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-zinc-950 focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="w-price" className="font-mono font-black font-extrabold text-[9px] uppercase cursor-pointer text-zinc-700">Exibir Preço do CRM</label>
                      </div>
                    </div>
                  )}

                  {/* Caption Editor Preview */}
                  <div className="space-y-1">
                    <label className="block text-[9.5px] uppercase font-mono font-black text-zinc-650">Edição e Revisão Completa da Captação:</label>
                    <textarea
                      rows={6}
                      value={wizardCustomText}
                      onChange={(e) => setWizardCustomText(e.target.value)}
                      className="w-full bg-zinc-50 border-2 border-zinc-950 p-3 rounded-2xl font-medium font-sans text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: ASSOCIAÇÃO DE LEADS E DISPARO */}
              {wizardStep === 3 && (
                <div className="space-y-4 animate-scaleIn">
                  <div className="space-y-1">
                    <h4 className="font-mono font-black uppercase text-zinc-950 text-xs">Selecione os Alvos da Campanha</h4>
                    <p className="text-zinc-550 leading-tight">Vincule essa nova cópia + mídias com os seus leads para transmissão assistida ou automática imediata.</p>
                  </div>

                  {/* Wizard Lead Search bar */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative col-span-2 sm:col-span-1">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Pesquisar por nome..."
                        value={wizardLeadSearch}
                        onChange={(e) => setWizardLeadSearch(e.target.value)}
                        className="w-full bg-zinc-50 border-2 border-zinc-950 py-1.5 pl-8 pr-3 rounded-lg text-[11px] font-semibold focus:outline-none"
                      />
                    </div>

                    {/* Status filters */}
                    <select
                      value={wizardLeadStatusFilter}
                      onChange={(e) => setWizardLeadStatusFilter(e.target.value)}
                      className="bg-white text-zinc-800 border-2 border-zinc-950 px-2 rounded-lg text-[10px] font-black uppercase outline-none"
                    >
                      <option value="todos">Status: Todos</option>
                      <option value="novo">Novo</option>
                      <option value="morno">Morno</option>
                      <option value="quente">Quente</option>
                    </select>
                  </div>

                  {/* Gender filter for wizard selection */}
                  <div className="flex gap-2 items-center text-[10px] font-mono font-black select-none uppercase">
                    <span className="text-zinc-550">Gênero:</span>
                    {(['todos', 'homens', 'mulheres'] as const).map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setWizardLeadGenderFilter(g)}
                        className={`px-2 py-0.5 rounded border transition cursor-pointer ${
                          wizardLeadGenderFilter === g ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-white text-zinc-500 border-zinc-200'
                        }`}
                      >
                        {g === 'todos' ? 'Todos' : g === 'homens' ? 'Masc ♂' : 'Fem ♀'}
                      </button>
                    ))}
                  </div>

                  {/* Render list of targets (leads) with checkboxes */}
                  <div className="max-h-[160px] overflow-y-auto border-2 border-zinc-950 rounded-2xl bg-zinc-50 p-2 space-y-1.5 font-sans">
                    {(() => {
                      const wizardLeads = leads.filter(l => {
                        const matchesSearch = l.name.toLowerCase().includes(wizardLeadSearch.toLowerCase());
                        const matchesStatus = wizardLeadStatusFilter === 'todos' || l.status === wizardLeadStatusFilter;
                        
                        // Name gender inference helper
                        const first = l.name.trim().split(' ')[0].toLowerCase();
                        const isFemale = first.endsWith('a') || first.endsWith('is') || first === 'maria' || first === 'ana' || first === 'beatriz' || first === 'rachel' || first === 'ruth' || first === 'alice' || first === 'sofia' || first === 'laura' || first === 'luiza' || first === 'yasmin' || first.endsWith('elle') || first.endsWith('ily') || first.endsWith('ine');
                        const isMale = !isFemale;
                        const leadGender = (isMale || ['luca', 'joshua', 'sasha', 'andrea', 'mustafa'].includes(first)) ? 'M' : 'F';
                        const matchesGender = wizardLeadGenderFilter === 'todos' ||
                          (wizardLeadGenderFilter === 'homens' && leadGender === 'M') ||
                          (wizardLeadGenderFilter === 'mulheres' && leadGender === 'F');

                        return matchesSearch && matchesStatus && matchesGender;
                      });

                      if (wizardLeads.length === 0) {
                        return (
                          <p className="text-center py-6 text-zinc-400 font-mono uppercase text-[9px]">Nenhum lead correspondente.</p>
                        );
                      }

                      return (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-mono font-black text-zinc-650 uppercase border-b border-dashed pb-1 mb-1.5">
                            <span>Exibindo {wizardLeads.length} leads</span>
                            <button
                              type="button"
                              onClick={() => {
                                const allVisibleIds = wizardLeads.map(l => l.id);
                                const someUnchecked = allVisibleIds.some(id => !wizardSelectedLeadIds.includes(id));
                                if (someUnchecked) {
                                  setWizardSelectedLeadIds(prev => Array.from(new Set([...prev, ...allVisibleIds])));
                                } else {
                                  setWizardSelectedLeadIds(prev => prev.filter(id => !allVisibleIds.includes(id)));
                                }
                              }}
                              className="text-indigo-600 underline cursor-pointer"
                            >
                              Inverter Seleção
                            </button>
                          </div>
                          {wizardLeads.map(l => {
                            const isChecked = wizardSelectedLeadIds.includes(l.id);
                            return (
                              <div
                                key={l.id}
                                onClick={() => {
                                  setWizardSelectedLeadIds(prev => 
                                    prev.includes(l.id) ? prev.filter(id => id !== l.id) : [...prev, l.id]
                                  );
                                }}
                                className={`flex items-center gap-2 p-1.5 rounded-lg border-2 cursor-pointer transition text-[11px] ${
                                  isChecked ? 'bg-indigo-50/20 border-indigo-650' : 'bg-white border-zinc-200'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // handled by click container
                                  className="w-3.5 h-3.5 text-indigo-600 cursor-pointer"
                                />
                                <div className="min-w-0">
                                  <p className="font-extrabold text-zinc-950 uppercase leading-tight truncate">{l.name}</p>
                                  <p className="text-[9px] text-zinc-500 font-mono truncate">{l.phone || 'Sem celular'}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Summary copy metrics */}
                  <div className="text-[10px] font-mono font-black text-indigo-700 uppercase flex justify-between bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl">
                    <span>Selecionados: {wizardSelectedLeadIds.length} Contatos</span>
                    <span>Origem: {wizardPropertySource === 'unit' ? '🏢 Imóvel do Estoque' : '📁 Arquivos Locais'}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Sticky Actions Footer */}
            <div className="bg-zinc-50 p-4 border-t-4 border-zinc-950 flex justify-between gap-3 shrink-0 select-none">
              <button
                type="button"
                disabled={wizardStep === 1}
                onClick={() => setWizardStep(prev => prev - 1)}
                className="px-4 py-2 bg-white text-zinc-950 hover:bg-zinc-100 border-2 border-zinc-950 rounded-xl font-mono text-[10px] font-black uppercase transition-all disabled:opacity-50 cursor-pointer"
              >
                ◀ Voltar
              </button>

              <div className="flex gap-2">
                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      triggerSensoryFeedback('click', accSettings);
                      setWizardStep(prev => prev + 1);
                    }}
                    className="px-5 py-2 bg-zinc-900 text-white hover:bg-zinc-950 border-2 border-zinc-950 rounded-xl font-mono text-[10px] font-black uppercase transition shadow-[1.5px_1.5px_0px_0px_rgba(24,24,27,1)] hover:shadow-none cursor-pointer"
                  >
                    Avançar ▶
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={wizardSelectedLeadIds.length === 0}
                    onClick={() => {
                      triggerSensoryFeedback('success', accSettings);
                      // Compile into dispatch queue
                      const preparedQueueItems = wizardSelectedLeadIds.map(leadId => {
                        const targetLead = leads.find(l => l.id === leadId);
                        return {
                          lead: targetLead!,
                          status: 'idle' as const
                        };
                      }).filter(q => !!q.lead);

                      // Propagate text & properties
                      if (wizardPropertySource === 'unit') {
                        setSelectedPropertyId(wizardSelectedPropertyId);
                      } else {
                        setSelectedPropertyId("");
                        if (wizardSelectedLocalImageId) {
                          setSelectedCampaignImageId(wizardSelectedLocalImageId);
                        }
                      }
                      
                      setCustomCaptionText(wizardCustomText);
                      setQueue(preparedQueueItems);
                      setShowWizardModal(false);
                      setActiveSubTab('publish');
                      alert(`Assistente concluído! ${preparedQueueItems.length} leads foram enfileirados com sucesso na Fila de Transmissão.`);
                    }}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-zinc-950 rounded-xl font-mono text-[10px] font-black uppercase transition shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] hover:shadow-none disabled:opacity-50 cursor-pointer"
                  >
                    🚀 Enfileirar e Disparar
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
