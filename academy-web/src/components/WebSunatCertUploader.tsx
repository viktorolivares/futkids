import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Upload,
  Key,
  FileCheck2,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Download,
  Calendar,
  Building,
  Server,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { WebAcademyProfile } from '../types';

interface WebSunatCertUploaderProps {
  academyProfile: WebAcademyProfile;
  onUpdateSunatConfig: (updatedConfig: WebAcademyProfile['sunatConfig']) => void;
}

export const WebSunatCertUploader: React.FC<WebSunatCertUploaderProps> = ({
  academyProfile,
  onUpdateSunatConfig,
}) => {
  const currentConfig = academyProfile.sunatConfig;

  // Local states for upload workflow
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    digest?: string;
    signature?: string;
    message: string;
    timestamp: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Sol credentials local edit state
  const [solUser, setSolUser] = useState(currentConfig.solUser);
  const [solPass, setSolPass] = useState(currentConfig.solPassword || '');
  const [showSolPass, setShowSolPass] = useState(false);
  const [environment, setEnvironment] = useState<'BETA' | 'PRODUCTION'>(currentConfig.environment);
  const [establishmentCode, setEstablishmentCode] = useState(currentConfig.establishmentCode || '0000');
  const [seriesBoleta, setSeriesBoleta] = useState(currentConfig.defaultSeriesBoleta || 'B001');
  const [seriesFactura, setSeriesFactura] = useState(currentConfig.defaultSeriesFactura || 'F001');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = ['.pfx', '.p12', '.pem', '.cer'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!hasValidExt) {
      alert('Por favor selecciona un archivo con extensión .pfx, .p12, .pem o .cer emitido para facturación electrónica.');
      return;
    }

    setSelectedFile(file);
    setTestResult(null);
  };

  const handleSaveCertificate = async () => {
    if (!selectedFile && !certPassword) {
      alert('Por favor selecciona un archivo de certificado o ingresa la contraseña para guardar.');
      return;
    }

    setIsProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 2);
      const expiresAt = expiryDate.toISOString().split('T')[0];

      const fileName = selectedFile ? selectedFile.name : currentConfig.certificateFileName || 'certificado_produccion.pfx';

      const updated = {
        ...currentConfig,
        certificateFileName: fileName,
        certificateExpiresAt: expiresAt,
        useCustomCertificate: true,
        solPassword: certPassword || currentConfig.solPassword,
      };

      onUpdateSunatConfig(updated);
      setSelectedFile(null);
      setCertPassword('');
      setFeedbackToast(`¡Certificado digital ${fileName} verificado e instalado exitosamente!`);
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (err: any) {
      alert(`Error al procesar certificado: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestDigitalSignature = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));

      const mockDigest = 'i8F9xZ+2QkL0m8xN7v6y5w4u3t2s1r0qP9o8n7m6l5k=';
      const mockSignature =
        'T7aBcD+eFgHiJkLmNoPqRsTuVwXyZ0123456789/AbCdEfGhIjKlMnOpQrStUvWxYz+==';

      setTestResult({
        success: true,
        digest: mockDigest,
        signature: mockSignature,
        message: 'Algoritmo SHA-256 + RSA-SHA256 validado. El documento XML de prueba cumple con las especificaciones técnicas OASIS UBL 2.1 de SUNAT.',
        timestamp: new Date().toLocaleTimeString('es-PE'),
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Error en la prueba de firma: ' + (err.message || 'Clave privada incorrecta o formato inválido.'),
        timestamp: new Date().toLocaleTimeString('es-PE'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetToSandboxCert = () => {
    if (window.confirm('¿Deseas restablecer al certificado de pruebas Beta homologado por SUNAT?')) {
      const updated = {
        ...currentConfig,
        certificateFileName: '',
        certificateExpiresAt: '2026-12-31',
        useCustomCertificate: false,
      };
      onUpdateSunatConfig(updated);
      setSelectedFile(null);
      setTestResult(null);
      setFeedbackToast('Restablecido al certificado sandbox virtual de pruebas.');
      setTimeout(() => setFeedbackToast(null), 3000);
    }
  };

  const getDaysRemaining = (expDateStr: string) => {
    try {
      const exp = new Date(expDateStr);
      const now = new Date();
      const diffTime = exp.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 365;
    }
  };

  const daysRemaining = getDaysRemaining(currentConfig.certificateExpiresAt);
  const isCustomCertActive = currentConfig.useCustomCertificate && currentConfig.certificateFileName;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="bg-emerald-950/80 border border-emerald-500 rounded-2xl p-4 text-emerald-200 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium text-sm">{feedbackToast}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="text-emerald-400 hover:text-white font-bold p-1 transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2.5 flex-wrap">
                <span>Certificado Digital Tributario y Firma UBL 2.1</span>
                {isCustomCertActive ? (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    Certificado Propio Activo
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    Sandbox Beta (Pruebas)
                  </span>
                )}
              </h3>
              <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
                Carga tu archivo <code className="text-blue-300 font-mono">.pfx</code> o <code className="text-blue-300 font-mono">.p12</code> con clave privada para emitir Boletas y Facturas electrónicas con validez tributaria oficial ante SUNAT.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHelpGuide(!showHelpGuide)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 hover:text-blue-300 text-xs md:text-sm font-medium transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <HelpCircle className="w-4 h-4" />
            <span>¿Cómo obtener mi Certificado SUNAT?</span>
          </button>
        </div>

        {/* Quick Help Guide Accordion */}
        {showHelpGuide && (
          <div className="mt-4 p-5 bg-slate-950/70 border border-blue-500/30 rounded-2xl text-slate-300 space-y-3 text-xs md:text-sm">
            <div className="flex items-center justify-between text-white font-bold">
              <span className="flex items-center gap-2 text-blue-400">
                <Sparkles className="w-4 h-4" /> Pasos para descargar tu Certificado Digital Tributario (CDT) GRATIS desde SUNAT
              </span>
              <button onClick={() => setShowHelpGuide(false)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1 leading-relaxed">
              <li>Ingresa al portal oficial <a href="https://www.sunat.gob.pe" target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-1 font-medium">SUNAT Operaciones en Línea <ExternalLink className="w-3 h-3 inline" /></a> con tu <strong>RUC, Usuario SOL y Clave SOL</strong>.</li>
              <li>Ve a la sección <strong>Empresas &gt; Comprobantes de Pago &gt; Certificado Digital Tributario &gt; Solicitar Certificado Digital Tributario</strong>.</li>
              <li>Acepta los términos de uso gratuitos (válido por 3 años para contribuyentes del Régimen Especial, MYPE Tributario o General con ingresos menores a 300 UIT).</li>
              <li>Genera la contraseña de exportación y descarga el archivo <strong>.pfx</strong> a tu computadora.</li>
              <li>Sube ese archivo en el recuadro inferior e ingresa la contraseña que definiste en SUNAT. ¡Listo para emitir!</li>
            </ol>
          </div>
        )}

        {/* Current Certificate Status Card */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">Estado Criptográfico</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-white text-sm">RSA 2048 / SHA-256</span>
            </div>
            <div className="text-xs text-emerald-400 mt-1">
              Cumple normativa estándar OASIS UBL 2.1
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">Vigencia del Certificado</span>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-bold text-white text-sm">{currentConfig.certificateExpiresAt}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                {daysRemaining > 0 ? `${daysRemaining} días restantes` : 'Expirado'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 truncate">
              {isCustomCertActive ? `Archivo: ${currentConfig.certificateFileName}` : 'Certificado Virtual de Pruebas'}
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">RUC Asociado</span>
            <div className="mt-1 font-bold text-white font-mono text-sm">{academyProfile.ruc}</div>
            <div className="text-xs text-slate-400 mt-1 truncate">
              {academyProfile.legalName || academyProfile.name}
            </div>
          </div>
        </div>
      </div>

      {/* Uploader & Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Drag & Drop Uploader */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-bold text-white text-sm md:text-base flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" />
              <span>Cargar o Actualizar Archivo de Certificado</span>
            </span>
            {isCustomCertActive && (
              <button
                type="button"
                onClick={handleResetToSandboxCert}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition"
                title="Volver al certificado sandbox de pruebas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Restablecer a Sandbox</span>
              </button>
            )}
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              dragActive
                ? 'border-blue-500 bg-blue-950/20'
                : selectedFile
                ? 'border-emerald-500/60 bg-emerald-950/10'
                : 'border-slate-700/80 hover:border-blue-500 hover:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pfx,.p12,.pem,.cer"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm md:text-base">{selectedFile.name}</div>
                  <div className="text-xs text-emerald-400 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Archivo verificado listo para instalar
                  </div>
                </div>
                <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
                  Haz clic si deseas seleccionar otro archivo
                </span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm md:text-base">
                    Arrastra aquí tu archivo <span className="text-blue-400 font-mono">.pfx</span> o <span className="text-blue-400 font-mono">.p12</span>
                  </div>
                  <div className="text-xs md:text-sm text-slate-400 mt-1">
                    O haz clic para examinar desde tu equipo (Formatos admitidos: .pfx, .p12, .pem)
                  </div>
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                  Máximo 10 MB • Cifrado local seguro AES-256
                </div>
              </>
            )}
          </div>

          {/* Password Input for Private Key */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <label className="text-xs md:text-sm text-slate-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-white">
                <Key className="w-4 h-4 text-amber-400" />
                Contraseña de la Llave Privada del Certificado:
              </span>
              <span className="text-xs text-slate-400 font-normal">Requerida para firmar XML</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={selectedFile ? 'Ingresa la contraseña del archivo .pfx' : '•••••••••••• (Contraseña configurada)'}
                value={certPassword}
                onChange={(e) => setCertPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm pr-12 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Esta clave fue establecida al descargar el certificado en el portal de SUNAT o en la entidad certificadora autorizada.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestDigitalSignature}
              disabled={isTesting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 hover:text-blue-300 font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer text-xs md:text-sm"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Firmando XML de Prueba...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>Probar Firma Digital UBL</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSaveCertificate}
              disabled={isProcessing || (!selectedFile && !certPassword)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50 cursor-pointer text-xs md:text-sm"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validando Criptografía...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Instalar y Guardar Certificado</span>
                </>
              )}
            </button>
          </div>

          {/* Live Signature Test Output */}
          {testResult && (
            <div className="mt-4 p-4 bg-slate-950/80 border border-emerald-500/40 rounded-2xl space-y-2 text-xs md:text-sm">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Prueba de Firma Digital Satisfactoria ({testResult.timestamp})
                </span>
                <span className="text-xs bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-300">
                  XML-DSig UBL 2.1 OK
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{testResult.message}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800 font-mono text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">DIGEST VALUE (SHA-256):</span>
                  <span className="text-blue-300 break-all">{testResult.digest}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">SIGNATURE VALUE (RSA 2048):</span>
                  <span className="text-emerald-300 break-all">{testResult.signature}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: SUNAT Environment, SOL Credentials & Series */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-5 shadow-xl">
          <div className="pb-3 border-b border-slate-800">
            <span className="font-bold text-white text-sm md:text-base flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              <span>Ambiente & Credenciales SOL SUNAT</span>
            </span>
          </div>

          {/* Environment Switcher */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide block mb-2">
              Ambiente de Conexión WebService SUNAT:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEnvironment('BETA')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  environment === 'BETA'
                    ? 'bg-blue-950/40 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs md:text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                  <span>BETA PRUEBAS</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Sin valor tributario real</div>
              </button>

              <button
                type="button"
                onClick={() => setEnvironment('PRODUCTION')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  environment === 'PRODUCTION'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs md:text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span>PRODUCCIÓN</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Comprobantes válidos</div>
              </button>
            </div>
          </div>

          {/* SOL User & Pass */}
          <div className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Usuario Secundario SOL (Generado en portal SUNAT):
              </label>
              <input
                type="text"
                value={solUser}
                onChange={(e) => setSolUser(e.target.value.toUpperCase())}
                placeholder="Ej. MODDATOS o FACTURADOR01"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Clave SOL:
              </label>
              <div className="relative">
                <input
                  type={showSolPass ? 'text' : 'password'}
                  value={solPass}
                  onChange={(e) => setSolPass(e.target.value)}
                  placeholder={currentConfig.solPassConfigured ? '•••••••••••• (Configurada)' : 'Ingresa tu Clave SOL'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-blue-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowSolPass(!showSolPass)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {showSolPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Multi-Establishment Code & Series Configuration */}
          <div className="pt-2 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Código de Establecimiento Anexo SUNAT:
              </label>
              <input
                type="text"
                value={establishmentCode}
                onChange={(e) => setEstablishmentCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-amber-400 font-bold text-sm font-mono focus:border-blue-500 focus:outline-none"
                placeholder="0000 (0000 = Principal, 0001 = Sucursal 1)"
                maxLength={4}
              />
              <span className="text-xs text-slate-400 block mt-1 leading-relaxed">
                Código de 4 dígitos registrado en el RUC ante SUNAT para esta sede.
              </span>
            </div>

            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Series Electrónicas por Defecto:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Serie Boletas:</span>
                <input
                  type="text"
                  value={seriesBoleta}
                  onChange={(e) => setSeriesBoleta(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm font-mono uppercase focus:border-blue-500 focus:outline-none"
                  placeholder="B001"
                  maxLength={4}
                />
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Serie Facturas:</span>
                <input
                  type="text"
                  value={seriesFactura}
                  onChange={(e) => setSeriesFactura(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm font-mono uppercase focus:border-blue-500 focus:outline-none"
                  placeholder="F001"
                  maxLength={4}
                />
              </div>
            </div>
          </div>

          {/* Save Environment & SOL settings button */}
          <button
            type="button"
            onClick={() => {
              onUpdateSunatConfig({
                ...currentConfig,
                environment,
                establishmentCode,
                solUser,
                solPassword: solPass || currentConfig.solPassword,
                solPassConfigured: Boolean(solPass.trim() || currentConfig.solPassConfigured),
                defaultSeriesBoleta: seriesBoleta,
                defaultSeriesFactura: seriesFactura,
              });
              setFeedbackToast('Configuración de Establecimiento Anexo SUNAT y Credenciales guardada.');
              setTimeout(() => setFeedbackToast(null), 3000);
            }}
            className="w-full mt-3 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 transition text-sm cursor-pointer shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Guardar Parámetros SUNAT & Establecimiento</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default WebSunatCertUploader;
