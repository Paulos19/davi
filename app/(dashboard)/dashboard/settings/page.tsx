'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; 
import { RAGKnowledgeBase } from './components/rag-knowledge-base';
import { ClassificationRules } from './components/classification-rules';
import { QualificationSettings } from './components/qualification-settings';
import { Settings2, MessageSquare, Tags, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 max-w-5xl animate-in fade-in duration-700 space-y-8">
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-100 to-white dark:from-slate-900 dark:to-background border border-slate-200 dark:border-slate-800">
         <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
               <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
                  <Settings2 className="h-6 w-6" />
               </div>
               Configurações do Davi
            </h2>
            <p className="text-muted-foreground max-w-xl ml-1">
              Personalize o comportamento, a inteligência e as regras de negócio do seu assistente.
            </p>
         </div>
      </div>

      {/* Tabs Principais */}
      <Tabs defaultValue="qualification" className="space-y-8">
        
        <TabsList className="w-full justify-start h-14 bg-background border-b rounded-none p-0 space-x-8">
          <TabsTrigger 
            value="qualification" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none h-full px-2 font-medium text-muted-foreground data-[state=active]:text-blue-600 transition-all gap-2"
          >
            <MessageSquare className="h-4 w-4" /> Perguntas (Qualificação)
          </TabsTrigger>
          <TabsTrigger 
            value="classification" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none h-full px-2 font-medium text-muted-foreground data-[state=active]:text-purple-600 transition-all gap-2"
          >
            <Tags className="h-4 w-4" /> Regras (Classificação)
          </TabsTrigger>
          <TabsTrigger 
            value="knowledge" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none h-full px-2 font-medium text-muted-foreground data-[state=active]:text-emerald-600 transition-all gap-2"
          >
            <BrainCircuit className="h-4 w-4" /> Cérebro (RAG)
          </TabsTrigger>
        </TabsList>
        
        <div className="min-h-[500px]">
          <TabsContent value="qualification" className="m-0 focus-visible:ring-0">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <QualificationSettings />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="classification" className="m-0 focus-visible:ring-0">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <ClassificationRules />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="knowledge" className="m-0 focus-visible:ring-0">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <RAGKnowledgeBase />
            </motion.div>
          </TabsContent>
        </div>

      </Tabs>
    </div>
  );
}