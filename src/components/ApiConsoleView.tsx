import React, { useState } from 'react';
import {
  Terminal,
  Layers,
  Database,
  Server,
  CheckCircle2,
  FileCode2,
  FileCheck,
} from 'lucide-react';
import { DemoUser } from '../types';
import { SwaggerExplorer } from './SwaggerExplorer';
import { ArchitectureView } from './ArchitectureView';
import { PrismaSchemaViewer } from './PrismaSchemaViewer';
import { DockerDeploymentViewer } from './DockerDeploymentViewer';
import { VitestRunner } from './VitestRunner';
import { CodebaseExplorer } from './CodebaseExplorer';
import { SunatTester } from './SunatTester';

interface ApiConsoleViewProps {
  currentUser: DemoUser;
  activeAcademyId: string;
}

export const ApiConsoleView: React.FC<ApiConsoleViewProps> = ({
  currentUser,
  activeAcademyId,
}) => {
  const [subTab, setSubTab] = useState<
    'explorer' | 'sunat' | 'architecture' | 'prisma' | 'docker' | 'tests' | 'codebase'
  >('explorer');

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Sub Navigation Bar */}
      <div className="bg-[#161B22] border border-slate-800 rounded p-2 flex items-center justify-between overflow-x-auto">
        <nav className="flex space-x-1">
          {[
            { id: 'explorer', label: 'Swagger & API Sandbox', icon: Terminal },
            { id: 'sunat', label: 'SUNAT SOAP Beta Inspector', icon: FileCheck },
            { id: 'architecture', label: 'Arquitectura & Multi-Tenancy', icon: Layers },
            { id: 'prisma', label: 'Esquema Prisma & DDL', icon: Database },
            { id: 'docker', label: 'Docker & Compose', icon: Server },
            { id: 'tests', label: 'Pruebas Vitest (29/29)', icon: CheckCircle2 },
            { id: 'codebase', label: 'Archivos NestJS', icon: FileCode2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold uppercase transition whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sub View Content */}
      <div>
        {subTab === 'explorer' && (
          <SwaggerExplorer
            currentUser={currentUser}
            activeAcademyId={activeAcademyId}
          />
        )}
        {subTab === 'sunat' && <SunatTester />}
        {subTab === 'architecture' && (
          <ArchitectureView
            currentUser={currentUser}
            activeAcademyId={activeAcademyId}
          />
        )}
        {subTab === 'prisma' && <PrismaSchemaViewer />}
        {subTab === 'docker' && <DockerDeploymentViewer />}
        {subTab === 'tests' && <VitestRunner />}
        {subTab === 'codebase' && <CodebaseExplorer />}
      </div>
    </div>
  );
};
