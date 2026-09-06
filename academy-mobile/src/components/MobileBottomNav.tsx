import React from 'react';
import {
  CheckCircle,
  QrCode,
  CalendarDays,
  CreditCard,
  UserCheck,
  Radio,
} from 'lucide-react';
import { MobileTab } from '../types';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  pendingAttendanceCount?: number;
  criticalDebtCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onChangeTab,
  pendingAttendanceCount = 0,
  criticalDebtCount = 0,
}) => {
  const tabs = [
    {
      id: 'gate' as MobileTab,
      label: 'Puerta',
      sublabel: 'Filtro & Deuda',
      icon: QrCode,
      badge: criticalDebtCount > 0 ? `${criticalDebtCount}` : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'attendance' as MobileTab,
      label: 'Asistencia',
      sublabel: 'Pase 30s',
      icon: UserCheck,
      badge: pendingAttendanceCount > 0 ? `${pendingAttendanceCount}` : undefined,
      badgeColor: 'bg-sky-500 text-black',
    },
    {
      id: 'sessions' as MobileTab,
      label: 'Clases',
      sublabel: 'Suspender/Avisos',
      icon: CalendarDays,
    },
    {
      id: 'cashier' as MobileTab,
      label: 'Cobro',
      sublabel: 'Yape / Caja',
      icon: CreditCard,
      highlight: true,
    },
  ];

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-400 fixed bottom-0 left-0 right-0 z-40 px-2 py-1.5 shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition duration-150 cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-emerald-400 font-bold'
                  : 'hover:text-white hover:bg-slate-800/40 text-slate-400'
              }`}
            >
              {tab.badge && (
                <span
                  className={`absolute top-0.5 right-2 text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full ${tab.badgeColor}`}
                >
                  {tab.badge}
                </span>
              )}

              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-[11px] leading-tight mt-0.5">{tab.label}</span>
              <span className="text-[8px] font-mono text-slate-500 leading-none">{tab.sublabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
export default MobileBottomNav;
