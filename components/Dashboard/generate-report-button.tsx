'use client';

import { useState } from 'react';
import { ShinyButton } from '@/components/ui/shiny-button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Função auxiliar para remover Markdown (**)
const cleanText = (text: string | null | undefined) => {
  if (!text) return '';
  return text.replace(/\*\*/g, '').trim();
};

export function GenerateReportButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Coletando dados e gerando relatório...');

    try {
      // 1. Buscar Dados Reais
      const [statsRes, leadsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/leads')
      ]);

      if (!statsRes.ok || !leadsRes.ok) throw new Error('Falha ao buscar dados');

      const stats = await statsRes.json();
      const leads = await leadsRes.json();

      // 2. Configurar PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const today = new Date().toLocaleDateString('pt-BR');

      // --- CABEÇALHO ---
      try {
        // Tenta carregar a logo (deve estar em public/davi_logo.png)
        const logoImg = new Image();
        logoImg.src = '/davi_logo.png';
        await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = () => resolve(null); // Segue mesmo se falhar
        });
        // Adiciona logo se carregou (x: 14, y: 10, w: 20, h: 20)
        doc.addImage(logoImg, 'PNG', 14, 10, 20, 20);
      } catch (e) {
        console.warn("Logo não encontrada ou erro ao carregar");
      }

      doc.setFontSize(22);
      doc.setTextColor(40);
      doc.text('Relatório Executivo Davi.ai', 40, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${today}`, 40, 26);
      doc.text(`Especialista: Davi IA Assistant`, 40, 31);

      // Linha divisória
      doc.setDrawColor(200);
      doc.line(14, 35, pageWidth - 14, 35);

      // --- SEÇÃO 1: RESUMO EXECUTIVO (KPIs) ---
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('1. Resumo Executivo', 14, 45);

      const kpiData = [
        ['Total de Leads', 'Conversão', 'Vendas', 'Agendamentos Pendentes'],
        [
          stats.totalLeads?.toString() || '0', 
          stats.conversao || '0%', 
          stats.vendasRealizadas?.toString() || '0',
          stats.agendamentosPendentes?.toString() || '0'
        ]
      ];

      autoTable(doc, {
        startY: 50,
        head: [kpiData[0]],
        body: [kpiData[1]],
        theme: 'grid',
        headStyles: { fillColor: [41, 37, 36], textColor: 255, fontStyle: 'bold' }, // Cor escura do tema
        styles: { halign: 'center', fontSize: 12 }
      });

      // --- SEÇÃO 2: DETALHAMENTO DE LEADS ---
      let finalY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(14);
      doc.text('2. Detalhamento e Histórico de Conversas', 14, finalY);
      
      // Iterar sobre os leads para criar relatórios individuais
      // Vamos limitar aos últimos 20 para não quebrar o navegador se houver milhares
      const recentLeads = leads.slice(0, 20); 

      recentLeads.forEach((lead: any, index: number) => {
        // Controle de quebra de página manual se necessário
        if (finalY > 250) {
            doc.addPage();
            finalY = 20;
        } else {
            finalY += 10;
        }

        // Título do Lead
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${lead.nome || 'Lead sem nome'}`, 14, finalY);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(`Status: ${lead.status} | Contato: ${lead.contato} | Criado: ${new Date(lead.createdAt).toLocaleDateString('pt-BR')}`, 14, finalY + 5);

        // Tabela de Dados do Lead
        autoTable(doc, {
            startY: finalY + 8,
            head: [['Segmentação', 'Faturamento Est.', 'Produto Interesse', 'Resumo IA']],
            body: [[
                lead.segmentacao || '-',
                lead.faturamentoEstimado || '-',
                lead.produtoDeInteresse || '-',
                cleanText(lead.resumoDaConversa) || 'Sem resumo disponível.'
            ]],
            theme: 'striped',
            headStyles: { fillColor: [240, 240, 240], textColor: 50, fontStyle: 'bold' },
            styles: { fontSize: 8, overflow: 'linebreak' },
            columnStyles: { 3: { cellWidth: 80 } } // Dá mais espaço para o resumo
        });

        // Histórico de Conversa (Formatado)
        let chatY = (doc as any).lastAutoTable.finalY + 5;
        
        if (lead.historicoCompleto && Array.isArray(lead.historicoCompleto) && lead.historicoCompleto.length > 0) {
            doc.setFontSize(9);
            doc.setTextColor(0);
            doc.text('Histórico da Conversa:', 14, chatY);

            const chatRows = lead.historicoCompleto.map((msg: any) => {
                const role = msg.role === 'user' ? 'Cliente' : 'Davi';
                // Remove Markdown da mensagem
                const content = cleanText(msg.content);
                return [role, content];
            });

            autoTable(doc, {
                startY: chatY + 2,
                body: chatRows,
                theme: 'plain',
                styles: { fontSize: 8, cellPadding: 1 },
                columnStyles: {
                    0: { cellWidth: 20, fontStyle: 'bold' }, // Coluna "Role"
                    1: { cellWidth: 'auto' } // Coluna "Mensagem"
                },
                didParseCell: function(data) {
                    // Estilização condicional simples
                    if (data.section === 'body' && data.column.index === 0) {
                        if (data.cell.raw === 'Davi') {
                            data.cell.styles.textColor = [59, 130, 246]; // Azul para Davi
                        } else {
                            data.cell.styles.textColor = [34, 197, 94]; // Verde para Cliente
                        }
                    }
                }
            });
            
            finalY = (doc as any).lastAutoTable.finalY;
        } else {
            finalY = (doc as any).lastAutoTable.finalY;
        }
      });

      // Salvar
      doc.save(`relatorio-completo-davi-${Date.now()}.pdf`);
      toast.success('Relatório PDF gerado com sucesso!', { id: toastId });

    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar relatório. Tente novamente.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ShinyButton 
      onClick={handleGenerateReport} 
      disabled={isLoading}
      icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
    >
      {isLoading ? 'Gerando PDF...' : 'Gerar Relatório IA'}
    </ShinyButton>
  );
}