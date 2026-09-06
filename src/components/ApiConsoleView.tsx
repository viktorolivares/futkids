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
    <div className="space-y-6 text-sm">
      {/* Sub Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs flex items-center justify-between overflow-x-auto">
        <nav className="flex space-x-1.5 min-w-max">
          {[
            { id: 'explorer', label: 'API Sandbox & Swagger', icon: Terminal },
            { id: 'sunat', label: 'Inspector SUNAT SOAP Beta', icon: FileCheck },
            { id: 'architecture', label: 'Arquitectura & Aislamiento', icon: Layers },
            { id: 'prisma', label: 'Esquema de Datos (DDL)', icon: Database },
            { id: 'docker', label: 'Despliegue & Contenedores', icon: Server },
            { id: 'tests', label: 'Pruebas Automatizadas (29/29)', icon: CheckCircle2 },
            { id: 'codebase', label: 'Estructura NestJS', icon: FileCode2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sub View Content */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
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
