import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, doc, setDoc, getDocs, getDoc, setLogLevel, deleteDoc } from "firebase/firestore";

dotenv.config();

// Mute internal Firestore SDK warnings/logs on the server to prevent console error pollution upon quota failures
setLogLevel('silent');

// Default Configuration values for the dynamic AI Server
const DEFAULT_AI_CONFIG = {
  active: true,
  model_name: "gemini-3.5-flash",
  system_instruction: `Você é o Assistente Virtual Inteligente oficial de atendimento e vendas.
Sua missão é responder mensagens de clientes enviadas via aplicativos de mensagens (como WhatsApp ou outros informados pela variável 'app').

Suas diretrizes obrigatórias de comunicação:
1. Seja extremamente ágil, empático, educado e focado no atendimento consultivo e comercial.
2. Seu tom é profissional e humano, livre de jargões robóticos ou clichês de IA. Nunca diga que é um modelo de linguagem ou IA.
3. Mantenha a resposta concisa e direta (máximo 3-4 parágrafos pequenos), com espaçamentos que facilitem a leitura em telas de celular.
4. Use emojis moderadamente para manter a mensagem amigável (como 📲, 🏠, 📈, 👋, ✅).
5. Se o cliente perguntar sobre financiamentos ou simulações, mencione que facilitamos aprovações de crédito com todos os grandes bancos (Caixa Econômica Federal com as menores taxas do Minha Casa Minha Vida, Itaú, Bradesco, Santander, Banco do Brasil, etc.) e simula as melhores opções de subsídios de forma 100% gratuita.
6. Sempre convide o cliente a fazer uma Simulação Habitacional Completa ou falar com o especialista humano.`,
  temperature: 0.7,
  whatsapp_enabled: true,
  leads_auto_creation_enabled: true,
  autoresponder_url: ""
};

// Initialize Firebase for CRM Data Sync
let db: any = null;
let isServerQuotaExceeded = false;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const fbApp = initializeApp(firebaseConfig);
    db = initializeFirestore(fbApp, {
      experimentalForceLongPolling: true
    }, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase initialized successfully on server.ts");
  } else {
    console.warn("firebase-applet-config.json not found on server root");
  }
} catch (err) {
  console.error("Failed to initialize Firebase on server", err);
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // In-memory queue of raw webhook debug logs for real-time diagnostics (up to 50 logs)
  const webhookDebugLogs: any[] = [];
  const addWebhookDebugLog = async (log: any) => {
    const logId = `wh-log-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const enrichedLog = {
      id: log.id || logId,
      ...log
    };
    webhookDebugLogs.unshift(enrichedLog);
    if (webhookDebugLogs.length > 50) {
      webhookDebugLogs.pop();
    }
    if (db && !isServerQuotaExceeded) {
      try {
        await setDoc(doc(db, "webhook_debug_logs", enrichedLog.id), enrichedLog);
        console.log(`[DEBUG LOG] Webhook debug log salvo no Firestore: ${enrichedLog.id}`);
      } catch (e: any) {
        console.error("Erro ao persistir log de webhook no Firestore:", e);
        const errMsg = e?.message || String(e);
        if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
          isServerQuotaExceeded = true;
          console.warn("⚠️ Servidor detectou fim da cota do Firestore. Ativando Modo Seguro Offline.");
        }
      }
    }
  };

  // API Route for AI Lead Pitch Generation
  app.post("/api/ai/generate-pitch", async (req, res) => {
    try {
      const { leadName, budget, income, creci, role, agency, notes, propertyInterest, agentName } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ 
          error: "A chave API do Gemini (GEMINI_API_KEY) não está configurada nas variáveis de ambiente. Por favor, certifique-se de adicioná-la no painel correspondente." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Você é o melhor assistente preditivo de vendas imobiliárias e crédito da '${agency || 'nossa assessoria'}'.
      O corretor gestor se chama '${agentName || 'seu corretor de confiança'}' (${role || 'Consultor de Imóveis Sênior'}), registrado sob o '${creci || 'CRECI Ativo'}'.

Gere uma estratégia de vendas altamente personalizada, profissional e livre de 'papo furado' de IA para o seguinte lead real:
- Nome do Lead: ${leadName}
- Renda Familiar Declarada: R$ ${income ? Number(income).toLocaleString('pt-BR') : 'Não cadastrada'}
- Valor de Crédito Estimado: R$ ${budget ? Number(budget).toLocaleString('pt-BR') : 'Não informado'}
- Interesse em Lotes / Empreendimento: ${propertyInterest || 'Terrenos e Portfólio Geral Cury/Minha Casa Minha Vida'}
- Histórico / Notas anotadas pelo corretor: ${notes || 'Cliente cadastrado no funil ativo.'}

Por favor, produza um texto estruturado de forma elegante em português contendo:

1. 📱 **MENSAGEM DE IMPACTO PARA WHATSAPP**
   - Um script direto, caloroso e cativante para envio imediato por celular.
   - Use quebras de linha para leitura em dispositivos móveis.
   - Apresente um gancho forte relacionado com a faixa de renda (MCMV subsídios ou SBPE facilidades de entrada) e convide para simulação ou agendamento de visita imobiliária.
   - SEM hashtags ou jargões artificiais.

2. 💡 **ROTEIRO DE CONTORNO DE OBJEÇÕES E ARGUMENTOS**
   - 3 argumentos práticos e específicos que o corretor humano pode usar para convencer este perfil (ex: dependendo da renda, mencionar as taxas do MCMV ampliado ou fluxo de obras da construtora).
   - Dica do assistente sobre como abordar a dor do cliente listada nas notas.

Apresente tudo em formato Markdown direto e elegante com formatação impecável.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Erro na geração de Pitch com Gemini", error);
      res.status(500).json({ error: error?.message || "Erro de processamento na API do Gemini. Verifique a chave de acesso." });
    }
  });

  // API Route for AI Campaign Planning & Metric calculation based on Lead volume
  app.post("/api/ai/plan-campaign", async (req, res) => {
    try {
      const { leadCount, origin, averageValue, customNiches } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ 
          error: "A chave API do Gemini (GEMINI_API_KEY) não está configurada nas variáveis de ambiente. Por favor, certifique-se de adicioná-la no painel correspondente." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Você é um Diretor de Inteligência Comercial e Growth Marketing altamente qualificado.
Um corretor acaba de importar uma lista de ${leadCount || 10} novos leads com origem em '${origin || 'Planilha Comercial'}' com valor médio de investimento de R$ ${averageValue ? Number(averageValue).toLocaleString('pt-BR') : '250.000'}.
Observações adicionais do nicho: ${customNiches || 'Público interessado em subsídios MCMV ou SBPE médio padrão.'}.

Gere um Plano de Engajamento Comercial Estruturado e Direto contendo:
1. 📈 METAS E MÉTRICAS DE CONVERSÃO REALISTAS calculadas com base nesses ${leadCount} contatos, demonstrando o funil prático: Abordagens (WhatsApp/Ligação) recomendadas, simulações habitacionais estimadas, visitas agendas requeridas e fechamentos de venda correspondentes no funil ativo de 2 a 3%.
2. 🗓️ CRONOGRAMA DE ENGAJAMENTO DOS LEADS dia-a-dia sugerido para o corretor organizar e converter essa base fria em ativos faturáveis.
3. 💬 SCRIPT DE COPYWRITING EXCLUSIVO E ALTAMENTE PERSUASIVO em português para WhatsApp ou Email para a abordagem desse lote de leads, usando ganchos de facilidades de crédito e subsídios.

Apresente um formato Markdown direto, elegante com formatação de títulos e listas profissional.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Erro no planejamento de campanha com Gemini", error);
      res.status(500).json({ error: error?.message || "Erro no planejamento de campanha com Gemini" });
    }
  });

  // Whatauto Webhook Dynamics & Intelligent Automated Replies Handler
  const processWhatauto = async (req: express.Request, res: express.Response) => {
    const startTime = Date.now();
    let rawRequestLog: any = null;
    try {
      // If it is a GET, OPTIONS or HEAD request, return a healthy status JSON with "reply"
      // to immediately satisfy any browser check, pings, or Whatauto diagnostic tools.
      if (req.method === "GET" || req.method === "OPTIONS" || req.method === "HEAD") {
        return res.json({
          status: "ok",
          message: "Whatauto webhook is active and fully functional!",
          reply: "Olá! O canal de inteligência artificial está ativo e pronto para responder no WhatsApp! 🚀"
        });
      }

      // Safe normalization of all input fields supporting standard AutoResponder & Whatauto JSON payloads
      const isNestedQuery = req.body && req.body.query;
      const queryObj = isNestedQuery ? req.body.query : (req.body || {});

      const messengerPackageName = req.body.messengerPackageName || "";
      const messageApp = req.body.app 
        ? String(req.body.app).trim() 
        : (messengerPackageName.includes("whatsapp") ? "WhatsApp" : "AutoResponder");

      const sender = queryObj.sender ? String(queryObj.sender).trim() : "";
      const message = queryObj.message ? String(queryObj.message).trim() : "";
      const isGroup = typeof queryObj.isGroup === "boolean" ? queryObj.isGroup : false;
      const groupParticipant = queryObj.groupParticipant ? String(queryObj.groupParticipant).trim() : "";
      
      const group_name = isGroup 
        ? (groupParticipant ? `Grupo-Part (${groupParticipant})` : "Grupo de Mensagens")
        : (req.body.group_name ? String(req.body.group_name).trim() : "Conversa direta");

      const phone = queryObj.phone 
        ? String(queryObj.phone).trim() 
        : (req.body.phone ? String(req.body.phone).trim() : "");

      // If they sent an empty payload or diagnostic check, respond and log as a simple test ping
      if (!message && !phone) {
        const textStr = "Olá! O assistente inteligente está online e operando com sucesso! 📲 Como posso te ajudar hoje?";
        const responsePayload = {
          reply: textStr,
          replies: [{ message: textStr }]
        };

        await addWebhookDebugLog({
          timestamp: new Date().toISOString(),
          direction: "incoming",
          endpoint: "/api/whatauto",
          method: req.method,
          headers: req.headers,
          rawPayload: req.body,
          isValid: true,
          validationErrors: [],
          responseStatus: 200,
          responsePayload
        });

        return res.json(responsePayload);
      }

      // CAMADA DE VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
      const validationErrors: string[] = [];
      const cleanSender = sender.trim();
      const cleanPhone = phone.trim();
      const cleanMessage = message.trim();

      if (!cleanSender || cleanSender.toLowerCase() === "undefined" || cleanSender.toLowerCase() === "null") {
        validationErrors.push("O campo 'sender' (Nome do Cliente) é obrigatório e está ausente ou inválido.");
      } else if (cleanSender.length < 2) {
        validationErrors.push("O campo 'sender' (Nome do Cliente) deve conter pelo menos 2 caracteres.");
      }

      const numericPhone = cleanPhone.replace(/\D/g, "");
      if (!cleanPhone || cleanPhone.toLowerCase() === "undefined" || cleanPhone.toLowerCase() === "null") {
        validationErrors.push("O campo 'phone' (Telefone/WhatsApp) é obrigatório.");
      } else if (numericPhone.length < 8) {
        validationErrors.push("O campo 'phone' (Telefone/WhatsApp) deve ser um número válido com no mínimo 8 dígitos.");
      }

      if (!cleanMessage) {
        validationErrors.push("O campo 'message' (Parâmetro de Conteúdo) é obrigatório e não pode estar em branco.");
      }

      const isValid = validationErrors.length === 0;

      // Initialize the raw request logging entity representing this hook event
      rawRequestLog = {
        timestamp: new Date().toISOString(),
        direction: "incoming",
        endpoint: "/api/whatauto",
        method: req.method,
        headers: req.headers,
        rawPayload: req.body,
        isValid,
        validationErrors,
        responseStatus: isValid ? 200 : 400,
        responsePayload: null
      };

      // Block execution and reject if validation failed
      if (!isValid) {
        const errorResponse = {
          status: "validation_error",
          error: "Falha na Validação de Campos Obrigatórios",
          validation_errors: validationErrors,
          reply: `⚠️ Mensagem ignorada pelo servidor da assessoria devido a dados incompletos ou inválidos: ${validationErrors.join(" ")}`,
          replies: [
            { message: `⚠️ Mensagem rejeitada: Dados de contato incompletos.` }
          ]
        };
        rawRequestLog.responsePayload = errorResponse;
        await addWebhookDebugLog(rawRequestLog);

        return res.status(400).json(errorResponse);
      }

      // Load Dynamic Config from Firestore or fall back to DEFAULT_AI_CONFIG
      let currentConfig = { ...DEFAULT_AI_CONFIG };
      if (db && !isServerQuotaExceeded) {
        try {
          const configDocRef = doc(db, "settings", "ai_config");
          const configSnap = await getDoc(configDocRef);
          if (configSnap.exists()) {
            currentConfig = { ...currentConfig, ...configSnap.data() };
            console.log("Configuração dinâmica da IA carregada com sucesso.");
          }
        } catch (e: any) {
          console.error("Erro ao carregar configuração dinâmica do Firebase, rodando com padrão", e);
          const errMsg = e?.message || String(e);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
            isServerQuotaExceeded = true;
            console.warn("⚠️ Servidor detectou fim da cota do Firestore ao carregar ai_config. Ativando Modo Seguro Offline.");
          }
        }
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        const textStr = "Olá! No momento, nossa inteligência artificial está terminando de ser configurada pelo nosso gestor. Por favor, deixe sua dúvida que responderemos em breve!";
        const responsePayload = { 
          reply: textStr,
          replies: [{ message: textStr }]
        };
        rawRequestLog.responsePayload = responsePayload;
        await addWebhookDebugLog(rawRequestLog);
        return res.json(responsePayload);
      }

      // Check if AI replies are active on settings
      if (!currentConfig.active || !currentConfig.whatsapp_enabled) {
        const textStr = "Olá! No momento nosso assistente virtual está indisponível ou passando por manutenção técnica. Por favor, aguarde que um consultor imobiliário humano responderá em breve! 👋";
        const responsePayload = {
          reply: textStr,
          replies: [{ message: textStr }]
        };
        rawRequestLog.responsePayload = responsePayload;
        await addWebhookDebugLog(rawRequestLog);
        return res.json(responsePayload);
      }

      // Search for Lead with matching phone or sender name digits in Firestore to prevent duplicates
      let foundLead: any = null;
      if (db && !isServerQuotaExceeded) {
        try {
          const cleanedPhone = phone ? phone.replace(/\D/g, "") : "";
          const cleanedSenderName = sender ? sender.trim().toLowerCase() : "";
          const leadsSnap = await getDocs(collection(db, "leads"));
          
          leadsSnap.forEach((docSnap) => {
            if (foundLead) return; // Stop if already matched

            const data = docSnap.data();
            const leadPhone = data.phone ? String(data.phone).replace(/\D/g, "") : "";
            const leadName = data.name ? String(data.name).trim().toLowerCase() : "";

            // Case A: Clean phone numbers match exactly or ends with each other (last 8-9 digits)
            if (cleanedPhone && leadPhone) {
              if (leadPhone === cleanedPhone || 
                  (leadPhone.length >= 8 && cleanedPhone.endsWith(leadPhone)) || 
                  (cleanedPhone.length >= 8 && leadPhone.endsWith(cleanedPhone))) {
                foundLead = { id: docSnap.id, ...data };
                return;
              }
            }

            // Case B: Sender's string is exactly equal to Lead's name
            if (cleanedSenderName && leadName && leadName === cleanedSenderName) {
              foundLead = { id: docSnap.id, ...data };
              return;
            }

            // Case C: If sender itself contains the phone digits (when name is unsaved on phone)
            const senderDigits = cleanedSenderName.replace(/\D/g, "");
            if (senderDigits && senderDigits.length >= 8 && leadPhone) {
              if (leadPhone.endsWith(senderDigits) || senderDigits.endsWith(leadPhone)) {
                foundLead = { id: docSnap.id, ...data };
                return;
              }
            }
          });
        } catch (e: any) {
          console.error("Erro ao buscar leads para Whatauto", e);
          const errMsg = e?.message || String(e);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
            isServerQuotaExceeded = true;
            console.warn("⚠️ Servidor detectou fim da cota do Firestore ao recuperar leads. Ativando Modo Seguro Offline.");
          }
        }
      }

      // If not found and auto-creation is authorized, automatically register new lead on CRM
      if (db && !isServerQuotaExceeded && !foundLead && currentConfig.leads_auto_creation_enabled) {
        try {
          const newLeadId = `lead-${Date.now()}`;
          
          // Generate a valid phone number if missing from whatauto query
          let resolvedPhone = phone || "";
          if (!resolvedPhone) {
            // Check if sender name is actually a phone number, else generate a placeholder
            const senderNoSpace = sender ? sender.replace(/\s+/g, "") : "";
            const onlyDigits = senderNoSpace.replace(/\D/g, "");
            if (onlyDigits.length >= 8) {
              resolvedPhone = onlyDigits;
            } else {
              resolvedPhone = `+55 (11) 99999-${Math.floor(1000 + Math.random() * 9000)}`;
            }
          }

          foundLead = {
            id: newLeadId,
            name: sender || `Contato WhatsApp`,
            email: `${(sender || "whatsapp").toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now().toString().slice(-4)}@leads-contatos.com.br`,
            phone: resolvedPhone,
            value: 0,
            status: "novo",
            notes: `Criado automaticamente do WhatsApp em ${new Date().toLocaleDateString('pt-BR')}. Mensagem recebida: "${message || ''}"`,
            origin: "WhatsApp Webhook",
            createdAt: new Date().toISOString(),
            lastContactAt: new Date().toISOString(),
            familyIncome: 0
          };
          await setDoc(doc(db, "leads", newLeadId), foundLead);
          console.log("Novo lead inserido dinamicamente por Whatsapp Whatauto:", newLeadId);
        } catch (e: any) {
          console.error("Erro ao inserir novo lead por Whatauto/Autoresponder", e);
          const errMsg = e?.message || String(e);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
            isServerQuotaExceeded = true;
          }
        }
      } else if (db && !isServerQuotaExceeded && foundLead) {
        try {
          // If already exist, transition to 'em_contato' from 'novo' and update last contact
          const updatedLead = {
            ...foundLead,
            status: foundLead.status === "novo" ? "em_contato" : foundLead.status,
            lastContactAt: new Date().toISOString()
          };
          await setDoc(doc(db, "leads", foundLead.id), updatedLead);
          console.log("Lead existente sincronizado por Whatauto:", foundLead.id);
        } catch (e: any) {
          console.error("Erro ao atualizar lead por Whatauto/Autoresponder", e);
          const errMsg = e?.message || String(e);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
            isServerQuotaExceeded = true;
          }
        }
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const personaInstruction = `${currentConfig.system_instruction || DEFAULT_AI_CONFIG.system_instruction}

Dados da Mensagem Recebida do Cliente em Tempo Real:
- Aplicativo de Origem: ${messageApp}
- Nome do Remetente: ${sender}
- Telefone do Remetente: ${phone || 'Não informado'}
- Grupo (se houver): ${group_name}
- Mensagem do Cliente: "${message || 'Oi, gostaria de mais informações'}"

Escreva uma resposta comercial de impacto em português, respondendo especificamente e amigavelmente com base nas diretrizes. Use o nome do cliente "${sender || 'amigo(a)'}" para responder de forma personalizada.`;

      const aiResponse = await ai.models.generateContent({
        model: currentConfig.model_name || "gemini-3.5-flash",
        contents: personaInstruction,
        config: {
          temperature: typeof currentConfig.temperature === 'number' ? currentConfig.temperature : 0.7
        }
      });

      const replyText = aiResponse.text || "Olá! Recebemos sua mensagem. Um de nossos especialistas em crédito imobiliário entrará em contato em instantes para lhe dar todo o suporte necessário! 👋";

      // Save follow-up interaction log inside CRM 'followups' collection
      if (db && !isServerQuotaExceeded && foundLead) {
        try {
          const followupId = `fup-${Date.now()}`;
          const newFollowup = {
            id: followupId,
            leadId: foundLead.id,
            leadName: foundLead.name,
            date: new Date().toISOString().split("T")[0],
            time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            type: "whatsapp",
            notes: `[WHATSAPP RECEBIDO]:\n"${message || ''}"\n\n[RESPOSTA AUTOMÁTICA DA IA]:\n"${replyText}"`,
            userEmail: "ia.resposta@crm-sincronizado.com.br"
          };
          await setDoc(doc(db, "followups", followupId), newFollowup);
          console.log("Interação de followup salva para o lead:", foundLead.id);
        } catch (e: any) {
          console.error("Erro ao salvar followup por Whatauto", e);
          const errMsg = e?.message || String(e);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
            isServerQuotaExceeded = true;
          }
        }
      }

      // Save real-time processing log in dedicated "ai_logs" collection for Admin Dashboard view
      if (db && !isServerQuotaExceeded) {
        try {
          const logId = `log-${Date.now()}`;
          await setDoc(doc(db, "ai_logs", logId), {
            id: logId,
            timestamp: new Date().toISOString(),
            phone: phone || "WhatsApp",
            sender: sender || "Cliente",
            message: message || "Mensagem Vazia",
            reply: replyText,
            status: "sucesso",
            model_used: currentConfig.model_name || "gemini-3.5-flash",
            latency_ms: Date.now() - startTime
          });
        } catch (logErr: any) {
          console.error("Erro ao salvar log de IA no Firestore", logErr);
          const errMsg = logErr?.message || String(logErr);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
            isServerQuotaExceeded = true;
          }
        }
      }

      const responsePayload = { 
        reply: replyText,
        replies: [
          { message: replyText }
        ]
      };

      rawRequestLog.responseStatus = 200;
      rawRequestLog.responsePayload = responsePayload;
      await addWebhookDebugLog(rawRequestLog);

      res.json(responsePayload);
    } catch (error: any) {
      console.error("Erro no processamento da mensagem do Whatauto", error);
      const replyText = "Recebemos sua mensagem! Um especialista humano entrará em contato com você o mais breve possível para te auxiliar na sua simulação e aprovação de crédito imobiliário! 👋";
      
      const errorResponsePayload = {
        reply: replyText,
        replies: [
          { message: replyText }
        ],
        error: error?.message || String(error)
      };

      // Ensure rawRequestLog exists or instantiate if crashed early
      const errLog = (typeof rawRequestLog !== 'undefined' && rawRequestLog) ? rawRequestLog : {
        timestamp: new Date().toISOString(),
        direction: "incoming",
        endpoint: "/api/whatauto",
        method: req.method,
        headers: req.headers,
        rawPayload: req.body,
        isValid: false,
        validationErrors: [error?.message || String(error)],
        responseStatus: 500,
        responsePayload: errorResponsePayload
      };

      errLog.responseStatus = 500;
      errLog.responsePayload = errorResponsePayload;
      await addWebhookDebugLog(errLog);

      if (db && !isServerQuotaExceeded) {
        try {
          const logId = `log-${Date.now()}`;
          await setDoc(doc(db, "ai_logs", logId), {
            id: logId,
            timestamp: new Date().toISOString(),
            phone: req.body?.phone || "WhatsApp",
            sender: req.body?.sender || "Cliente",
            message: req.body?.message || "Mensagem Vazia",
            reply: replyText,
            status: "erro",
            error_message: error?.message || String(error),
            model_used: "gemini-3.5-flash",
            latency_ms: Date.now() - startTime
          });
        } catch (logErr: any) {
          console.error("Erro ao postar log de erro no Firestore", logErr);
          const errMsg = logErr?.message || String(logErr);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
            isServerQuotaExceeded = true;
          }
        }
      }
      res.json(errorResponsePayload);
    }
  };

  // Bind handles to multiple request types and routes for complete coverage
  app.all("/api/whatauto", processWhatauto);
  app.all("/whatauto", processWhatauto);
  app.post("/", processWhatauto);

  // REST API Endpoints for Admin and Configure Server AI Controls
  app.get("/api/server/status", async (req, res) => {
    if (db && !isServerQuotaExceeded) {
      try {
        await setDoc(doc(db, "test-cycles-conn", "probe-write"), {
          testedAt: new Date().toISOString(),
          platform: "server"
        });
      } catch (e: any) {
        const errMsg = e?.message || String(e);
        if (
          errMsg.toLowerCase().includes('quota') ||
          errMsg.toLowerCase().includes('exhausted') ||
          errMsg.toLowerCase().includes('resource-exhausted')
        ) {
          isServerQuotaExceeded = true;
          console.warn("⚠️ Server detected Firestore quota is exhausted during status probe.");
        }
      }
    }
    res.json({
      dbConnected: !!db,
      isQuotaExceeded: isServerQuotaExceeded
    });
  });

  app.get("/api/server/config", async (req, res) => {
    try {
      let currentConfig = { ...DEFAULT_AI_CONFIG };
      if (db && !isServerQuotaExceeded) {
        const configDocRef = doc(db, "settings", "ai_config");
        const configSnap = await getDoc(configDocRef);
        if (configSnap.exists()) {
          currentConfig = { ...currentConfig, ...configSnap.data() };
        }
      }
      res.json(currentConfig);
    } catch (e: any) {
      console.error("Erro ao carregar configurações", e);
      const errMsg = e?.message || String(e);
      if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
        isServerQuotaExceeded = true;
      }
      res.status(500).json({ error: e?.message || "Erro ao carregar configurações" });
    }
  });

  app.post("/api/server/config", async (req, res) => {
    try {
      const newConfig = req.body;
      if (db && !isServerQuotaExceeded) {
        await setDoc(doc(db, "settings", "ai_config"), {
          active: typeof newConfig.active === 'boolean' ? newConfig.active : true,
          model_name: newConfig.model_name || "gemini-3.5-flash",
          system_instruction: newConfig.system_instruction || DEFAULT_AI_CONFIG.system_instruction,
          temperature: typeof newConfig.temperature === 'number' ? newConfig.temperature : 0.7,
          whatsapp_enabled: typeof newConfig.whatsapp_enabled === 'boolean' ? newConfig.whatsapp_enabled : true,
          leads_auto_creation_enabled: typeof newConfig.leads_auto_creation_enabled === 'boolean' ? newConfig.leads_auto_creation_enabled : true,
          autoresponder_url: newConfig.autoresponder_url || "",
          updatedAt: new Date().toISOString()
        });
        res.json({ status: "success", message: "Configuração atualizada com sucesso!" });
      } else {
        res.status(400).json({ error: isServerQuotaExceeded ? "A cota do banco de dados Firestore está esgotada para hoje." : "Banco de dados Firestore não conectado no servidor." });
      }
    } catch (e: any) {
      console.error("Erro ao salvar configurações", e);
      const errMsg = e?.message || String(e);
      if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
        isServerQuotaExceeded = true;
        return res.status(403).json({
          error: "A cota diária gratuita do Firestore foi excedida (Limite do Spark Plan). Não é possível salvar configurações no Firebase hoje. As alterações podem falhar até a cota reiniciar à meia-noite PST ou até que o plano seja atualizado."
        });
      }
      res.status(500).json({ error: e?.message || "Erro ao salvar configurações" });
    }
  });

  app.get("/api/server/logs", async (req, res) => {
    try {
      const logsList: any[] = [];
      if (db && !isServerQuotaExceeded) {
        const logsSnap = await getDocs(collection(db, "ai_logs"));
        logsSnap.forEach((docSnap) => {
          logsList.push({ id: docSnap.id, ...docSnap.data() });
        });
        logsList.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
      res.json(logsList.slice(0, 50));
    } catch (e: any) {
      console.error("Erro ao ler logs", e);
      const errMsg = e?.message || String(e);
      if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
        isServerQuotaExceeded = true;
        return res.json([
          {
            id: "quota-limit-log",
            timestamp: new Date().toISOString(),
            phone: "+55 (11) 99999-9999",
            sender: "Sistema de Auditoria",
            message: "Verificação de Logs de Auditoria",
            reply: "⚠️ Atenção: A cota diária gratuita do Firestore (Spark Plan) foi excedida para leitura/gravação. Os logs reais estão temporariamente inalcançáveis até a meia-noite PST ou upgrade de plano. Funcionalidade offline operante.",
            status: "erro",
            model_used: "Aviso de Cota do Firebase",
            latency_ms: 0
          }
        ]);
      }
      res.status(500).json({ error: e?.message || "Erro ao ler logs de processamento" });
    }
  });

  app.delete("/api/server/logs/:id", async (req, res) => {
    try {
      if (db && !isServerQuotaExceeded) {
        await deleteDoc(doc(db, "ai_logs", req.params.id));
        res.json({ success: true, message: "Log excluído com sucesso" });
      } else {
        res.status(400).json({ error: "Banco de dados indisponível ou limite de saldo atingido" });
      }
    } catch (e: any) {
      console.error("Erro ao excluir log", e);
      res.status(500).json({ error: e?.message || "Erro ao excluir log" });
    }
  });

  app.post("/api/server/send-custom-whatsapp", async (req, res) => {
    try {
      const { phone, sender, message, responseType } = req.body;
      if (!message || !phone) {
        return res.status(400).json({ error: "Faltando telefone ou corpo de mensagem." });
      }

      console.log(`[CRM OUTBOUND] Enviando mensagem manual para ${sender} (${phone}): "${message}"`);

      // 1. Log transaction inside Firestore "ai_logs" so it updates the WhatsApp dashboard in real-time
      if (db && !isServerQuotaExceeded) {
        try {
          const logId = `log-${Date.now()}`;
          await setDoc(doc(db, "ai_logs", logId), {
            id: logId,
            timestamp: new Date().toISOString(),
            phone: phone,
            sender: sender || "Cliente",
            message: responseType === 'ai' ? `[SOLICITAÇÃO DE RETORNO IA]` : `[CORRETOR DIGITOU]`,
            reply: message,
            status: "sucesso", // status standard
            model_used: responseType === 'ai' ? "gemini-3.5-flash (Auxílio)" : "Agente Humano (Manoel)",
            latency_ms: 10
          });
        } catch (logErr: any) {
          console.error("Erro ao salvar log no Firestore por custom outbound", logErr);
          const errMsg = logErr?.message || String(logErr);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
            isServerQuotaExceeded = true;
          }
        }

        // 2. Find corresponding lead to insert in their followup timeline
        let matchedLeadId = "";
        try {
          const cleanedPhone = phone.replace(/\D/g, "");
          const leadsSnap = await getDocs(collection(db, "leads"));
          leadsSnap.forEach((docSnap) => {
            if (matchedLeadId) return;
            const data = docSnap.data();
            const leadPhone = data.phone ? String(data.phone).replace(/\D/g, "") : "";
            if (leadPhone && (leadPhone === cleanedPhone || cleanedPhone.endsWith(leadPhone) || leadPhone.endsWith(cleanedPhone))) {
              matchedLeadId = docSnap.id;
            }
          });

          if (matchedLeadId) {
            const followupId = `fup-${Date.now()}`;
            await setDoc(doc(db, "followups", followupId), {
              id: followupId,
              leadId: matchedLeadId,
              leadName: sender || "Cliente WhatsApp",
              date: new Date().toISOString().split("T")[0],
              time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
              type: "whatsapp",
              notes: responseType === 'ai' 
                ? `[WHATSAPP ENVIADO - SUGESTÃO DA IA]:\n"${message}"` 
                : `[WHATSAPP ENVIADO MANUALMENTE]:\n"${message}"`,
              userEmail: "corretor.ativo@crm.com"
            });
            console.log(`Timeline followup updated for lead ${matchedLeadId}`);
          }
        } catch (crmErr: any) {
          console.error("Erro ao sincronizar timeline do CRM com mensagem outbound", crmErr);
          const errMsg = crmErr?.message || String(crmErr);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
            isServerQuotaExceeded = true;
          }
        }
      }

      // 3. RETRIEVE AUTORESPONDER TARGET URL & DISPATCH DIRECTLY TO CLIENT DEVICE (CELULAR DO WHATSAPP DO CORRETOR)
      let activeTargetUrl = "http://localhost:3000/api/mock-autoresponder-receiver";
      if (db && !isServerQuotaExceeded) {
        try {
          const configDocRef = doc(db, "settings", "ai_config");
          const configSnap = await getDoc(configDocRef);
          if (configSnap.exists()) {
            const configData = configSnap.data();
            if (configData.autoresponder_url) {
              activeTargetUrl = configData.autoresponder_url;
            }
          }
        } catch (e: any) {
          console.error("Erro ao carregar URL do Autoresponder para outbound", e);
        }
      }

      const autoresponderOutputPayload = {
        replies: [{ message: message }],
        reply: message,
        status: "dispatched_from_crm_custom",
        sender_phone: phone,
        recipient_name: sender || "Cliente",
        timestamp: new Date().toISOString()
      };

      let postStatus = 0;
      let postResponsePayload: any = null;
      let postSuccess = false;

      try {
        console.log(`[CRM MANUEL DISPATCH] Enviando payload ao Autoresponder em ${activeTargetUrl}...`);
        const fetchRes = await fetch(activeTargetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(autoresponderOutputPayload)
        });
        
        postStatus = fetchRes.status;
        const resText = await fetchRes.text();
        try {
          postResponsePayload = JSON.parse(resText);
        } catch {
          postResponsePayload = resText;
        }
        postSuccess = fetchRes.ok;
      } catch (fetchErr: any) {
        console.warn("[MENSAGEM CRM] Dispositivo de celular do autoresponder offline ou inacessível:", fetchErr.message);
        postResponsePayload = { error: `[AUTORESPONDER OFFLINE/INACESSÍVEL]: ${fetchErr.message}` };
        postStatus = 503;
      }

      // 4. Save to raw webhook logs as outbound custom dispatch
      const outgoingCustomLog = {
        id: `wh-log-dispatch-${Date.now()}`,
        timestamp: new Date().toISOString(),
        direction: "outgoing_custom_crm",
        endpoint: activeTargetUrl,
        method: "POST",
        isValid: true,
        validationErrors: [] as string[],
        rawPayload: autoresponderOutputPayload,
        responseStatus: postStatus,
        responsePayload: postResponsePayload,
        delivery_success: postSuccess,
        latency_ms: 10
      };
      await addWebhookDebugLog(outgoingCustomLog);

      res.json({ 
        status: "success", 
        message: "Mensagem encaminhada para fila do aparelho WhatsApp com sucesso!", 
        autoresponder_target_url: activeTargetUrl,
        autoresponder_success: postSuccess,
        autoresponder_status: postStatus,
        autoresponder_response: postResponsePayload
      });
    } catch (e: any) {
      console.error("Erro ao simular envio de WhatsApp de saída", e);
      res.status(500).json({ error: e?.message || "Erro interno ao agendar envio de whatsapp." });
    }
  });

  app.post("/api/server/test-ai", async (req, res) => {
    try {
      const { message, custom_prompt, model_name, temperature } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "A chave API do Gemini (GEMINI_API_KEY) não está configurada." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const startTime = Date.now();
      const combinedPrompt = `${custom_prompt || DEFAULT_AI_CONFIG.system_instruction}

Dados do teste:
- Mensagem de Teste do Usuário: "${message || 'Oi, gostaria de uma simulação'}"

Por favor, escreva uma resposta de atendimento comercial simulado em português, seguindo à risca as instruções acima.`;
      
      const response = await ai.models.generateContent({
        model: model_name || "gemini-3.5-flash",
        contents: combinedPrompt,
        config: {
          temperature: typeof temperature === 'number' ? temperature : 0.7
        }
      });

      const duration = Date.now() - startTime;
      res.json({ reply: response.text, latency_ms: duration, timestamp: new Date().toISOString() });
    } catch (e: any) {
      console.error("Erro ao testar o agente Gemini", e);
      res.status(500).json({ error: e?.message || "Erro ao gerar resposta de teste no Gemini" });
    }
  });

  // GET route to retrieve real-time webhook raw debugging logs
  app.get("/api/server/webhook-debug-logs", async (req, res) => {
    try {
      const logsList: any[] = [];
      if (db && !isServerQuotaExceeded) {
        try {
          const debugSnap = await getDocs(collection(db, "webhook_debug_logs"));
          debugSnap.forEach((docSnap) => {
            logsList.push(docSnap.data());
          });
          // Sort by timestamp descending
          logsList.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          // Merge with in-memory cache in case some aren't indexed yet
          const existingIds = new Set(logsList.map(l => l.id));
          webhookDebugLogs.forEach(localLog => {
            if (localLog.id && !existingIds.has(localLog.id)) {
              logsList.push(localLog);
            }
          });
          logsList.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          return res.json(logsList.slice(0, 50));
        } catch (fbErr: any) {
          console.warn("Recorrendo aos logs locais em memória devido a limite de cota do Firestore:", fbErr.message);
          const errMsg = fbErr?.message || String(fbErr);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
            isServerQuotaExceeded = true;
          }
        }
      }
      res.json(webhookDebugLogs);
    } catch (err: any) {
      console.error("Erro ao recolher logs reais do webhook:", err);
      res.status(500).json({ error: err.message || "Erro ao coletar logs de webhook." });
    }
  });

  // Mock receiver endpoint acting as the phone's autoresponder receiver
  app.post("/api/mock-autoresponder-receiver", (req, res) => {
    console.log("[MOCK PHONE RECEIVER] Pacote HTTP completo recebido:", req.body);
    res.json({
      success: true,
      status: "delivered_to_device",
      timestamp: new Date().toISOString(),
      agent_tag: "CicloCred Mock Android Whatauto v1.0",
      received_payload: req.body
    });
  });

  // POST route to dispatch a server-driven direct test ending on the autoresponder
  app.post("/api/server/test-webhook-to-autoresponder", async (req, res) => {
    const startTime = Date.now();
    try {
      const { sender, phone, message, targetUrl, isGroup, groupParticipant, ruleId, isTestMessage } = req.body;

      // 1. Camada de Validação
      const validationErrors: string[] = [];
      const cleanSender = (sender || "").trim();
      const cleanPhone = (phone || "").trim();
      const cleanMessage = (message || "").trim();

      if (!cleanSender || cleanSender.toLowerCase() === "undefined" || cleanSender.toLowerCase() === "null") {
        validationErrors.push("O campo 'sender' (Nome do Cliente) é obrigatório e está ausente ou inválido.");
      } else if (cleanSender.length < 2) {
        validationErrors.push("O campo 'sender' (Nome do Cliente) deve conter pelo menos 2 caracteres.");
      }

      const numericPhone = cleanPhone.replace(/\D/g, "");
      if (!cleanPhone || cleanPhone.toLowerCase() === "undefined" || cleanPhone.toLowerCase() === "null") {
        validationErrors.push("O campo 'phone' (Telefone/WhatsApp) é obrigatório.");
      } else if (numericPhone.length < 8) {
        validationErrors.push("O campo 'phone' (Telefone/WhatsApp) deve ser um número válido com no mínimo 8 dígitos.");
      }

      if (!cleanMessage) {
        validationErrors.push("O campo 'message' (Conteúdo da Mensagem) é obrigatório e não pode estar em branco.");
      }

      const isValid = validationErrors.length === 0;

      const logId = `wh-log-test-${Date.now()}`;
      const simulateIncomingLog = {
        id: logId,
        timestamp: new Date().toISOString(),
        direction: "incoming_simulation",
        endpoint: "/api/server/test-webhook-to-autoresponder",
        method: "POST",
        headers: req.headers,
        rawPayload: req.body,
        isValid,
        validationErrors,
        responseStatus: isValid ? 200 : 400,
        responsePayload: null as any
      };

      if (!isValid) {
        const errorResponse = {
          status: "validation_error",
          error: "Falha na Validação de Campos Obrigatórios",
          validation_errors: validationErrors,
          reply: `⚠️ Simulação cancelada: ${validationErrors.join(" ")}`,
          replies: [{ message: `⚠️ Erros: ${validationErrors.join(" ")}` }]
        };
        simulateIncomingLog.responsePayload = errorResponse;
        await addWebhookDebugLog(simulateIncomingLog);
        return res.status(400).json(errorResponse);
      }

      // 2. Load dynamic configurations
      let currentConfig = { ...DEFAULT_AI_CONFIG };
      if (db && !isServerQuotaExceeded) {
        try {
          const configDocRef = doc(db, "settings", "ai_config");
          const configSnap = await getDoc(configDocRef);
          if (configSnap.exists()) {
            currentConfig = { ...currentConfig, ...configSnap.data() };
          }
        } catch (e: any) {
          console.error("Erro ao carregar configurações", e);
          const errMsg = e?.message || String(e);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
            isServerQuotaExceeded = true;
          }
        }
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "A chave API do Gemini não está configurada no servidor." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      // 3. Process the messages prompt with Gemini
      const group_name = isGroup ? (groupParticipant ? `Grupo-Part (${groupParticipant})` : "Grupo de Mensagens") : "Conversa direta";
      const personaInstruction = `${currentConfig.system_instruction || DEFAULT_AI_CONFIG.system_instruction}
 
Dados da Mensagem Recebida do Cliente em Tempo Real:
- Aplicativo de Origem: WhatsApp (Simulador de Teste Direto)
- Nome do Remetente: ${cleanSender}
- Telefone do Remetente: ${cleanPhone}
- Grupo (se houver): ${group_name}
- Mensagem do Cliente: "${cleanMessage}"
 
Escreva uma resposta comercial de impacto em português com base nas diretrizes. Use o nome do cliente "${cleanSender}" para responder de forma personalizada.`;

      const aiResponse = await ai.models.generateContent({
        model: currentConfig.model_name || "gemini-3.5-flash",
        contents: personaInstruction,
        config: {
          temperature: typeof currentConfig.temperature === 'number' ? currentConfig.temperature : 0.7
        }
      });

      const replyText = aiResponse.text || "Olá! Recebemos sua solicitação de simulação. Em instantes um de nossos representantes especialistas entrará em contato para lhe dar todo o apoio!";

      const autoresponderOutputPayload = {
        replies: [{ message: replyText }],
        reply: replyText,
        status: "dispatched_from_server_test",
        sender_phone: cleanPhone,
        recipient_name: cleanSender,
        timestamp: new Date().toISOString()
      };

      // Update incoming log response payload
      simulateIncomingLog.responsePayload = autoresponderOutputPayload;
      await addWebhookDebugLog(simulateIncomingLog);

      // 4. FIRE DIRECT FETCH HTTP REQUEST TO AUTORESPONDER WEB DEVICE!
      const activeTargetUrl = targetUrl || "http://localhost:3000/api/mock-autoresponder-receiver";
      let postStatus = 0;
      let postResponsePayload: any = null;
      let postSuccess = false;

      try {
        console.log(`[TESTE WEBHOOK DIRETO] Enviando payload ao Autoresponder em ${activeTargetUrl}...`);
        const fetchRes = await fetch(activeTargetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(autoresponderOutputPayload)
        });
        
        postStatus = fetchRes.status;
        const resText = await fetchRes.text();
        try {
          postResponsePayload = JSON.parse(resText);
        } catch {
          postResponsePayload = resText;
        }
        postSuccess = fetchRes.ok;
      } catch (fetchErr: any) {
        postResponsePayload = { error: `[ERRO DE CONEXÃO AO AUTORESPONDER]: ${fetchErr.message}` };
        postStatus = 503;
      }

      // 5. Save the outgoing raw dispatch log
      const outgoingLog = {
        id: `wh-log-dispatch-${Date.now()}`,
        timestamp: new Date().toISOString(),
        direction: "outgoing_test",
        endpoint: activeTargetUrl,
        method: "POST",
        isValid: true,
        validationErrors: [] as string[],
        rawPayload: autoresponderOutputPayload,
        responseStatus: postStatus,
        responsePayload: postResponsePayload,
        delivery_success: postSuccess,
        latency_ms: Date.now() - startTime
      };
      await addWebhookDebugLog(outgoingLog);

      // 6. Also index under standard CRM leads & timeline of activity logs for visual synchronizaton
      if (db && !isServerQuotaExceeded) {
        try {
          // Check if lead already exists by looking up clean numbers
          let foundLeadId = `lead-test-${Date.now()}`;
          const leadsSnap = await getDocs(collection(db, "leads"));
          let existingData: any = null;
          
          leadsSnap.forEach(snap => {
            const snapData = snap.data();
            const snapPhone = snapData.phone ? snapData.phone.replace(/\D/g, "") : "";
            if (snapPhone && snapPhone === numericPhone) {
              existingData = snapData;
              foundLeadId = snap.id;
            }
          });

          if (!existingData) {
            await setDoc(doc(db, "leads", foundLeadId), {
              id: foundLeadId,
              name: cleanSender,
              email: `${cleanSender.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now().toString().slice(-4)}@leads-test-webhook.com.br`,
              phone: cleanPhone,
              value: 0,
              status: "novo",
              notes: `Criado automaticamente via Teste Direto de Webhook do Servidor em ${new Date().toLocaleDateString('pt-BR')}.`,
              origin: "Simulador de Webhook (Servidor)",
              createdAt: new Date().toISOString(),
              lastContactAt: new Date().toISOString(),
              familyIncome: 0
            });
          }

          // Register followup timeline entry
          const fupId = `fup-test-${Date.now()}`;
          await setDoc(doc(db, "followups", fupId), {
            id: fupId,
            leadId: foundLeadId,
            leadName: cleanSender,
            date: new Date().toISOString().split("T")[0],
            time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            type: "whatsapp",
            notes: `[DISPAROU TESTE DIRETO DE WEBHOOK]:\n"${cleanMessage}"\n\n[RESPOSTA ENVIADA AO AUTORESPONDER]\n🔗 Destino: ${activeTargetUrl}\n💬 Mensagem: "${replyText}"`,
            userEmail: "ia.resposta@crm-sincronizado.com.br"
          });

          // Log transaction standard
          const testLogId = `log-${Date.now()}`;
          await setDoc(doc(db, "ai_logs", testLogId), {
            id: testLogId,
            timestamp: new Date().toISOString(),
            phone: cleanPhone,
            sender: cleanSender,
            message: cleanMessage,
            reply: replyText,
            status: "sucesso",
            model_used: currentConfig.model_name || "gemini-3.5-flash",
            latency_ms: Date.now() - startTime
          });
        } catch (dbErr: any) {
          console.error("Erro ao registrar estatísticas de teste de webhook no Firestore:", dbErr);
          const errMsg = dbErr?.message || String(dbErr);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
            isServerQuotaExceeded = true;
          }
        }
      }

      res.json({
        success: true,
        reply: replyText,
        autoresponder_target_url: activeTargetUrl,
        autoresponder_status: postStatus,
        autoresponder_response: postResponsePayload,
        autoresponder_success: postSuccess,
        latency_ms: Date.now() - startTime
      });

    } catch (e: any) {
      console.error("Erro ao disparar teste direto do webhook", e);
      res.status(500).json({ error: e.message || "Erro de processamento do teste direto no servidor." });
    }
  });

  // Bind handles to multiple request types and routes for complete coverage
  app.all("/api/whatauto", processWhatauto);
  app.all("/whatauto", processWhatauto);
  app.post("/", processWhatauto);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
