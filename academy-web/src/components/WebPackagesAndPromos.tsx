import React, { useState } from 'react';
import {
  Ticket,
  Tag,
  Plus,
  Percent,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Search,
  Check,
  X,
  ArrowRight,
} from 'lucide-react';
import { WebPackage, WebPackageCredit, WebPromotion, WebStudent } from '../types';

interface WebPackagesAndPromosProps {
  packages: WebPackage[];
  packageCredits: WebPackageCredit[];
  promotions: WebPromotion[];
  students: WebStudent[];
  onAddPackageCredit: (packageCredit: WebPackageCredit) => void;
  onConsumePackageCredit: (studentId: string) => void;
  onAddPackage: (newPackage: WebPackage) => void;
  onAddPromotion: (newPromo: WebPromotion) => void;
  onSelectPackageForSale?: (pkg: WebPackage, studentId: string) => void;
}

export const WebPackagesAndPromos: React.FC<WebPackagesAndPromosProps> = ({
  packages,
  packageCredits,
  promotions,
  students,
  onAddPackageCredit,
  onConsumePackageCredit,
  onAddPackage,
  onAddPromotion,
  onSelectPackageForSale,
}) => {
  const [filterText, setFilterText] = useState('');
  const [showNewPackageModal, setShowNewPackageModal] = useState(false);
  const [showNewPromoModal, setShowNewPromoModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form states for new package
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgSport, setNewPkgSport] = useState('Fútbol Formativo');
  const [newPkgClasses, setNewPkgClasses] = useState(10);
  const [newPkgBonus, setNewPkgBonus] = useState(1);
  const [newPkgPrice, setNewPkgPrice] = useState(220);
  const [newPkgValidity, setNewPkgValidity] = useState(60);

  // Form states for new promotion
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoName, setNewPromoName] = useState('');
  const [discountType, setDiscountType] = useState<'PCT' | 'FIXED'>('PCT');
  const [discountVal, setDiscountVal] = useState(15);
  const [promoBonusClasses, setPromoBonusClasses] = useState(0);

  const activeCredits = packageCredits.filter((p) => p.status === 'ACTIVE');
  const totalClassesUsed = packageCredits.reduce((acc, p) => acc + p.usedClasses, 0);

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName) return;

    const created: WebPackage = {
      id: `pkg-${Date.now()}`,
      academyId: 'acad-alianza-01',
      name: newPkgName,
      sport: newPkgSport,
      classCount: Number(newPkgClasses),
      bonusClasses: Number(newPkgBonus),
      price: Number(newPkgPrice),
      validityDays: Number(newPkgValidity),
      isActive: true,
      description: `${newPkgClasses} clases + ${newPkgBonus} bonus para ${newPkgSport}`,
    };

    onAddPackage(created);
    setShowNewPackageModal(false);
    setToastMsg(`Paquete "${created.name}" configurado con éxito.`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode || !newPromoName) return;

    const created: WebPromotion = {
      id: `promo-${Date.now()}`,
      academyId: 'acad-alianza-01',
      code: newPromoCode.toUpperCase().trim(),
      name: newPromoName,
      discountPct: discountType === 'PCT' ? Number(discountVal) : undefined,
      discountFixed: discountType === 'FIXED' ? Number(discountVal) : undefined,
      bonusClasses: Number(promoBonusClasses),
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      isActive: true,
      usageCount: 0,
    };

    onAddPromotion(created);
    setShowNewPromoModal(false);
    setToastMsg(`Código promocional "${created.code}" activado.`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const filteredCredits = packageCredits.filter(
    (p) =>
      p.studentName.toLowerCase().includes(filterText.toLowerCase()) ||
      p.packageName.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Tiqueteras Activas</span>
            <Ticket className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400 mt-1">
            {activeCredits.length}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Alumnos con paquetes de clases vigentes
          </div>
        </div>

        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Clases Consumidas</span>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-400 mt-1">
            {totalClassesUsed}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Asistencias descontadas de paquetes
          </div>
        </div>

        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Paquetes en Venta</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {packages.filter((p) => p.isActive).length}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Opciones de tiqueteras configuradas
          </div>
        </div>

        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Promociones Activas</span>
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {promotions.filter((p) => p.isActive).length}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Códigos de descuento para campañas
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded flex items-center gap-2 text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Grid: Left Tiqueteras Activas (7 cols) / Right Packages & Promos Catalog (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Tiqueteras Vendidas y Control de Clases */}
        <div className="lg:col-span-7 bg-[#0F1219] border border-slate-800 rounded p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
            <span className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-purple-400" />
              <span>Control de Tiqueteras por Alumno ({packageCredits.length})</span>
            </span>

            <div className="relative">
              <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
              <input
                type="text"
                placeholder="Buscar alumno, paquete..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="bg-[#161B22] border border-slate-800 rounded pl-6 pr-2 py-1 text-[10px] text-slate-300 w-44"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredCredits.map((pc) => {
              const remaining = pc.totalClasses - pc.usedClasses;
              const pct = Math.round((pc.usedClasses / pc.totalClasses) * 100);
              const isExhausted = remaining <= 0 || pc.status === 'EXHAUSTED';

              return (
                <div
                  key={pc.id}
                  className={`p-3 rounded border transition space-y-2 ${
                    isExhausted
                      ? 'bg-[#161B22]/50 border-slate-800 text-slate-500'
                      : 'bg-[#161B22] border-purple-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          {pc.studentName}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            isExhausted
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {isExhausted ? 'AGOTADO' : 'ACTIVO'}
                        </span>
                      </div>
                      <div className="text-[10px] text-purple-300 font-semibold mt-0.5">
                        {pc.packageName}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-white">
                        {pc.usedClasses} / {pc.totalClasses} clases
                      </div>
                      <div className="text-[9px] text-emerald-400 font-bold">
                        {remaining > 0 ? `${remaining} restantes` : '0 disponibles'}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isExhausted ? 'bg-slate-600' : 'bg-purple-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span>Vence: {pc.expiresAt}</span>

                    {!isExhausted && (
                      <button
                        onClick={() => {
                          onConsumePackageCredit(pc.studentId);
                          setToastMsg(`1 clase descontada de la tiquetera de ${pc.studentName}.`);
                          setTimeout(() => setToastMsg(null), 3000);
                        }}
                        className="px-2 py-0.5 bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-200 rounded font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Clock className="w-2.5 h-2.5" />
                        <span>Descontar 1 Asistencia</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Catalog of Packages & Active Promotions */}
        <div className="lg:col-span-5 space-y-4">
          {/* Packages Catalog */}
          <div className="bg-[#0F1219] border border-slate-800 rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Catálogo de Tiqueteras</span>
              </span>
              <button
                onClick={() => setShowNewPackageModal(true)}
                className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-[10px] flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Nuevo Paquete</span>
              </button>
            </div>

            <div className="space-y-2">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-2.5 bg-[#161B22] border border-slate-800 rounded hover:border-slate-700 transition space-y-1.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{pkg.name}</div>
                      <div className="text-[9px] text-slate-400">
                        {pkg.sport || 'Multidisciplina'} • Validez {pkg.validityDays} días
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400">
                        S/ {pkg.price.toFixed(2)}
                      </div>
                      <div className="text-[9px] text-amber-300 font-semibold">
                        {pkg.classCount} + {pkg.bonusClasses} bonus
                      </div>
                    </div>
                  </div>

                  {pkg.description && (
                    <p className="text-[9px] text-slate-400 bg-[#0F1219] p-1.5 rounded border border-slate-800">
                      {pkg.description}
                    </p>
                  )}

                  {onSelectPackageForSale && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => onSelectPackageForSale(pkg, students[0]?.id || '')}
                        className="text-[10px] font-bold text-amber-400 hover:text-white flex items-center gap-1 bg-amber-950/40 hover:bg-amber-900/50 px-2 py-0.5 rounded border border-amber-500/40 transition"
                      >
                        <span>Cobrar en Caja</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Promotions & Coupons */}
          <div className="bg-[#0F1219] border border-slate-800 rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Códigos Promocionales</span>
              </span>
              <button
                onClick={() => setShowNewPromoModal(true)}
                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded text-[10px] flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Nuevo Cupón</span>
              </button>
            </div>

            <div className="space-y-2">
              {promotions.map((promo) => (
                <div
                  key={promo.id}
                  className="p-2.5 bg-[#161B22] border border-slate-800 rounded space-y-1"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.2 rounded text-[10px]">
                          {promo.code}
                        </span>
                        <span className="font-bold text-white text-xs">{promo.name}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        {promo.description}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-300">
                        {promo.discountPct
                          ? `-${promo.discountPct}%`
                          : promo.discountFixed
                          ? `-S/ ${promo.discountFixed.toFixed(2)}`
                          : `+${promo.bonusClasses} clase`}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {promo.usageCount} canjes
                      </div>
                    </div>
                  </div>
                  <div className="text-[8px] text-slate-500 flex justify-between pt-1 border-t border-slate-800/60">
                    <span>Vigencia hasta: {promo.endDate}</span>
                    <span className="text-emerald-400 font-bold">Activo</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nuevo Paquete */}
      {showNewPackageModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#161B22] border border-slate-700 rounded-lg max-w-md w-full p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase">Crear Tiquetera de Clases</h3>
              </div>
              <button
                onClick={() => setShowNewPackageModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Nombre de la Tiquetera
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pack 10 Clases Fútbol Formativo"
                  value={newPkgName}
                  onChange={(e) => setNewPkgName(e.target.value)}
                  className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Disciplina
                  </label>
                  <select
                    value={newPkgSport}
                    onChange={(e) => setNewPkgSport(e.target.value)}
                    className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-white text-xs"
                  >
                    <option value="Fútbol Formativo">Fútbol Formativo</option>
                    <option value="Vóley Formativo">Vóley Formativo</option>
                    <option value="Multideporte">Multideporte</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Precio Total (PEN)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPkgPrice}
                    onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                    className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-emerald-400 font-bold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    N° Clases
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPkgClasses}
                    onChange={(e) => setNewPkgClasses(Number(e.target.value))}
                    className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Bonus Clases
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newPkgBonus}
                    onChange={(e) => setNewPkgBonus(Number(e.target.value))}
                    className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-amber-300 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Vigencia (Días)
                  </label>
                  <input
                    type="number"
                    min="15"
                    value={newPkgValidity}
                    onChange={(e) => setNewPkgValidity(Number(e.target.value))}
                    className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewPackageModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Guardar Paquete</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Cupón */}
      {showNewPromoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#161B22] border border-slate-700 rounded-lg max-w-md w-full p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase">Crear Código Promocional</h3>
              </div>
              <button
                onClick={() => setShowNewPromoModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Código (Cupón en Mayúsculas)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: MARZO2026"
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-emerald-400 font-bold uppercase text-xs tracking-wider"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Nombre de Campaña
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Descuento Regreso a Clases"
                  value={newPromoName}
                  onChange={(e) => setNewPromoName(e.target.value)}
                  className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Tipo de Descuento
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-white text-xs"
                  >
                    <option value="PCT">Porcentaje (%)</option>
                    <option value="FIXED">Monto Fijo (S/.)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Valor del Descuento
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={discountVal}
                    onChange={(e) => setDiscountVal(Number(e.target.value))}
                    className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Clases Bonus Adicionales (Opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={promoBonusClasses}
                  onChange={(e) => setPromoBonusClasses(Number(e.target.value))}
                  className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewPromoModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded text-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Activar Cupón</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
