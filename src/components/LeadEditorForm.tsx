import React, { useState, useEffect } from "react";
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Save, 
  Trash2,
  Tag,
  CreditCard,
  MessageSquare
} from "lucide-react";
import { Lead } from "../types";

interface LeadEditorFormProps {
  lead: Lead | null;
  onSave: (data: Partial<Lead>) => void;
  onCancel: () => void;
}

const LeadEditorForm: React.FC<LeadEditorFormProps> = ({ lead, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: "",
    region: "",
    phone: "",
    email: "",
    status: "novo",
    notes: "",
    source: "",
    income: 0,
    interest: "SBPE"
  });

  useEffect(() => {
    if (lead) {
      setFormData(lead);
    } else {
      setFormData({
        name: "",
        region: "",
        phone: "",
        email: "",
        status: "novo",
        notes: "",
        source: "",
        income: 0,
        interest: "SBPE"
      });
    }
  }, [lead]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1">
            <User className="w-3 h-3" /> Nome do Lead
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ex: João da Silva"
            className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-bold uppercase"
          />
        </div>

        {/* Região */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Região / Cidade
          </label>
          <input
            type="text"
            name="region"
            value={formData.region}
            onChange={handleChange}
            placeholder="Ex: Zona Norte, SP"
            className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-bold uppercase"
          />
        </div>

        {/* Telefone */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1">
            <Phone className="w-3 h-3" /> WhatsApp / Telefone
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(00) 00000-0000"
            className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-mono font-bold"
          />
        </div>

        {/* E-mail */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1">
            <Mail className="w-3 h-3" /> E-mail
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="joao@exemplo.com"
            className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-bold"
          />
        </div>

        {/* Renda Bruta */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1">
            <CreditCard className="w-3 h-3" /> Renda Familiar Bruta
          </label>
          <input
            type="number"
            name="income"
            value={formData.income}
            onChange={handleChange}
            placeholder="0.00"
            className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-mono font-bold"
          />
        </div>

        {/* Interesse */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Tipo de Crédito / Interesse
          </label>
          <select
            name="interest"
            value={formData.interest}
            onChange={handleChange}
            className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-bold uppercase appearance-none"
          >
            <option value="SBPE">SBPE (Tradicional)</option>
            <option value="MCMV">MCMV (Minha Casa Minha Vida)</option>
            <option value="Pró-Cotista">Pró-Cotista</option>
            <option value="Terreno e Construção">Terreno e Construção</option>
            <option value="FGTS">Uso de FGTS</option>
          </select>
        </div>
      </div>

      {/* Notas / Observações */}
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1">
          <MessageSquare className="w-3 h-3" /> Histórico / Observação Rápida
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Detalhes sobre a conversa ou perfil do cliente..."
          className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-bold uppercase resize-none"
        />
      </div>

      {/* Ações */}
      <div className="pt-4 flex gap-3">
        <button
          type="submit"
          className="flex-1 bg-indigo-600 text-white border-4 border-zinc-950 p-4 rounded-2xl font-black uppercase italic tracking-tighter flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors"
        >
          <Save className="w-5 h-5" />
          {lead ? "Atualizar Ficha" : "Cadastrar Lead"}
        </button>
        {lead && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 border-4 border-zinc-950 p-4 rounded-2xl font-black uppercase text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </form>
  );
};

export default LeadEditorForm;
