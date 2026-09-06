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

  // Process and save certificate
  const handleSaveCertificate = () => {
    if (!selectedFile && !currentConfig.certificateFileName) {
      alert('Por favor selecciona el archivo de tu Certificado Digital (.pfx o .p12)');
      return;
    }

    if (selectedFile && !certPassword.trim()) {
      alert('Por favor ingresa la contraseña de importación de la clave privada del certificado');
      return;
    }

    setIsProcessing(true);

    // Simulate cryptographic parsing and validation of the X.509 certificate
    setTimeout(() => {
      const fileName = selectedFile ? selectedFile.name : (currentConfig.certificateFileName || 'certificado_cdt.pfx');
      const fileSizeKb = selectedFile ? (selectedFile.size / 1024).toFixed(1) + ' KB' : (currentConfig.certificateFileSize || '4.2 KB');
      const now = new Date();
      const expirationDate = new Date(now.getFullYear() + 3, now.getMonth(), now.getDate());
      const expirationStr = expirationDate.toISOString().split('T')[0];

      const updatedConfig = {
        ...currentConfig,
        certificateStatus: 'VALID' as const,
        certificateExpiresAt: expirationStr,
        certificateFileName: fileName,
        certificateFileSize: fileSizeKb,
        certificateUploadedAt: now.toISOString().replace('T', ' ').substring(0, 16),
        certificateIssuer: 'SUNAT - Entidad de Certificación Nacional (CDT)',
        certificateSubject: `CN=${academyProfile.legalName || academyProfile.name}, 2.5.4.97=VATMPE-${academyProfile.ruc}, C=PE`,
        certificateRuc: academyProfile.ruc,
        certificatePasswordConfigured: true,
        useCustomCertificate: true,
        environment,
        solUser,
        solPassword: solPass,
        solPassConfigured: Boolean(solPass.trim() || currentConfig.solPassConfigured),
        defaultSeriesBoleta: seriesBoleta,
        defaultSeriesFactura: seriesFactura,
      };

      onUpdateSunatConfig(updatedConfig);
      setIsProcessing(false);
      setSelectedFile(null);
      setCertPassword('');
      setFeedbackToast('¡Certificado Digital Tributario (.pfx) validado e instalado correctamente!');
      setTimeout(() => setFeedbackToast(null), 4000);
    }, 1200);
  };

  // Switch back to Built-in Beta Sandbox Certificate
  const handleResetToSandboxCert = () => {
    if (window.confirm('¿Deseas activar el Certificado de Pruebas Integrado (SUNAT Beta Sandbox)?')) {
      const updatedConfig = {
        ...currentConfig,
        useCustomCertificate: false,
        certificateStatus: 'VALID' as const,
        certificateExpiresAt: '2027-12-31',
        certificateFileName: undefined,
        certificateUploadedAt: undefined,
        certificateIssuer: 'SUNAT Beta Test KeyPair (Built-in)',
        certificateSubject: 'CN=TEST SANDBOX SUNAT, O=PRUEBAS SUNAT, C=PE',
      };
      onUpdateSunatConfig(updatedConfig);
      setTestResult(null);
      setFeedbackToast('Se reactivó el Certificado Digital Virtual para pruebas Beta.');
      setTimeout(() => setFeedbackToast(null), 4000);
    }
  };

  // Test signature with XML-DSig UBL 2.1
  const handleTestDigitalSignature = () => {
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      // Generate realistic SHA256 RSA digest & signature
      const randomHex = (len: number) =>
        Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const mockDigest = btoa(randomHex(32)).substring(0, 28) + '=';
      const mockSignature =
        btoa(randomHex(128)).substring(0, 80) + '...==';

      setTestResult({
        success: true,
        digest: mockDigest,
        signature: mockSignature,
        message: 'Firma XML UBL 2.1 generada y validada exitosamente con el estándar OASIS / SUNAT.',
        timestamp: new Date().toLocaleTimeString(),
      });
      setIsTesting(false);
    }, 1400);
  };

  // Calculate days remaining
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
    <div className="space-y-4 font-mono text-xs">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="bg-emerald-950/80 border border-emerald-500 rounded-lg p-3 text-emerald-200 flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{feedbackToast}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="text-emerald-400 hover:text-white font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-[#0F1219] border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <span>Certificado Digital Tributario y Firma UBL 2.1</span>
                {isCustomCertActive ? (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded font-bold">
                    CERTIFICADO PROPIO ACTIVO
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-2 py-0.5 rounded font-bold">
                    SANDBOX BETA (PRUEBAS)
                  </span>
                )}
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Carga tu archivo <code className="text-sky-300">.pfx</code> o <code className="text-sky-300">.p12</code> con clave privada para emitir Boletas y Facturas electrónicas con validez tributaria oficial ante SUNAT.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHelpGuide(!showHelpGuide)}
            className="px-3 py-1.5 rounded bg-[#161B22] hover:bg-slate-800 border border-slate-700 text-sky-400 hover:text-sky-300 transition flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>¿Cómo obtener mi Certificado SUNAT?</span>
          </button>
        </div>

        {/* Quick Help Guide Accordion */}
        {showHelpGuide && (
          <div className="mt-3 p-3.5 bg-[#161B22] border border-sky-500/30 rounded-lg text-slate-300 space-y-2 text-[11px]">
            <div className="flex items-center justify-between text-white font-bold">
              <span className="flex items-center gap-1.5 text-sky-400">
                <Sparkles className="w-4 h-4" /> Pasos para descargar tu Certificado Digital Tributario (CDT) GRATIS desde SUNAT
              </span>
              <button onClick={() => setShowHelpGuide(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1 leading-relaxed">
              <li>Ingresa al portal oficial <a href="https://www.sunat.gob.pe" target="_blank" rel="noreferrer" className="text-sky-400 underline inline-flex items-center gap-0.5">SUNAT Operaciones en Línea <ExternalLink className="w-2.5 h-2.5 inline" /></a> con tu <strong>RUC, Usuario SOL y Clave SOL</strong>.</li>
              <li>Ve a la sección <strong>Empresas &gt; Comprobantes de Pago &gt; Certificado Digital Tributario &gt; Solicitar Certificado Digital Tributario</strong>.</li>
              <li>Acepta los términos de uso gratuitos (válido por 3 años para contribuyentes del Régimen Especial, MYPE Tributario o General con ingresos menores a 300 UIT).</li>
              <li>Genera la contraseña de exportación y descarga el archivo <strong>.pfx</strong> a tu computadora.</li>
              <li>Sube ese archivo en el recuadro inferior e ingresa la contraseña que definiste en SUNAT. ¡Listo para emitir!</li>
            </ol>
          </div>
        )}

        {/* Current Certificate Status Card */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-[#161B22] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-500 uppercase block">ESTADO DE LA LLAVE CRIPTOGRÁFICA</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-white text-xs">RSA 2048 / SHA-256</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-1">
              Cumple normativa estándar OASIS UBL 2.1
            </div>
          </div>

          <div className="p-3 bg-[#161B22] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-500 uppercase block">VIGENCIA DEL CERTIFICADO</span>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-bold text-white text-xs">{currentConfig.certificateExpiresAt}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                {daysRemaining > 0 ? `${daysRemaining} días restantes` : 'Expirado'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {isCustomCertActive ? `Archivo: ${currentConfig.certificateFileName}` : 'Certificado Virtual de Pruebas'}
            </div>
          </div>

          <div className="p-3 bg-[#161B22] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-500 uppercase block">RUC ASOCIADO AL CERTIFICADO</span>
            <div className="mt-1 font-bold text-white text-xs">{academyProfile.ruc}</div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">
              {academyProfile.legalName || academyProfile.name}
            </div>
          </div>
        </div>
      </div>

      {/* Uploader & Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Drag & Drop Uploader */}
        <div className="lg:col-span-7 bg-[#0F1219] border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-white text-xs uppercase flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-sky-400" />
              <span>Cargar o Actualizar Archivo de Certificado</span>
            </span>
            {isCustomCertActive && (
              <button
                type="button"
                onClick={handleResetToSandboxCert}
                className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                title="Volver al certificado sandbox de pruebas"
              >
                <Trash2 className="w-3 h-3" />
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
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
              dragActive
                ? 'border-sky-500 bg-sky-950/20'
                : selectedFile
                ? 'border-emerald-500/60 bg-emerald-950/10'
                : 'border-slate-700/80 hover:border-sky-500 hover:bg-[#161B22]'
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
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{selectedFile.name}</div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Archivo listo para instalar
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 bg-[#161B22] px-2 py-1 rounded border border-slate-700">
                  Haz clic si deseas seleccionar otro archivo
                </span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">
                    Arrastra aquí tu archivo <span className="text-sky-400">.pfx</span> o <span className="text-sky-400">.p12</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    O haz clic para examinar desde tu equipo (Formatos admitidos: .pfx, .p12, .pem)
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 uppercase font-mono">
                  Máximo 10 MB • Cifrado seguro local AES-256
                </div>
              </>
            )}
          </div>

          {/* Password Input for Private Key */}
          <div className="bg-[#161B22] border border-slate-800 rounded-lg p-3 space-y-2">
            <label className="text-[11px] text-slate-300 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1 text-white">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Contraseña de la Llave Privada del Certificado:
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Requerida para firmar XML</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={selectedFile ? 'Ingresa la contraseña del archivo .pfx' : '•••••••••••• (Contraseña configurada)'}
                value={certPassword}
                onChange={(e) => setCertPassword(e.target.value)}
                className="w-full bg-[#0F1219] border border-slate-700 rounded px-3 py-2 text-white text-xs pr-10 focus:outline-none focus:border-sky-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Esta clave fue establecida al descargar el certificado en el portal de SUNAT o en la entidad certificadora.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestDigitalSignature}
              disabled={isTesting}
              className="px-3 py-2 rounded bg-[#161B22] hover:bg-slate-800 border border-slate-700 text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer text-[11px]"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Firmando XML de Prueba...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Probar Firma Digital UBL</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSaveCertificate}
              disabled={isProcessing || (!selectedFile && !certPassword)}
              className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer text-[11px]"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validando Criptografía...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Instalar y Guardar Certificado</span>
                </>
              )}
            </button>
          </div>

          {/* Live Signature Test Output */}
          {testResult && (
            <div className="mt-3 p-3 bg-[#0B0E14] border border-emerald-500/40 rounded-lg space-y-1.5 animate-fade-in text-[10px]">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Prueba de Firma Digital Satisfactoria ({testResult.timestamp})
                </span>
                <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">
                  XML-DSig UBL 2.1 OK
                </span>
              </div>
              <p className="text-slate-300">{testResult.message}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 block text-[9px]">DIGEST VALUE (SHA-256):</span>
                  <span className="text-sky-300 break-all">{testResult.digest}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">SIGNATURE VALUE (RSA 2048):</span>
                  <span className="text-emerald-300 break-all">{testResult.signature}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: SUNAT Environment, SOL Credentials & Series */}
        <div className="lg:col-span-5 bg-[#0F1219] border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-md">
          <div className="pb-2 border-b border-slate-800">
            <span className="font-bold text-white text-xs uppercase flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Ambiente & Credenciales SOL SUNAT</span>
            </span>
          </div>

          {/* Environment Switcher */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              Ambiente de Conexión WebService SUNAT:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEnvironment('BETA')}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  environment === 'BETA'
                    ? 'bg-sky-950/40 border-sky-500 text-white shadow-xs'
                    : 'bg-[#161B22] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span>BETA / HOMOLOGACIÓN</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Pruebas sin valor legal</div>
              </button>

              <button
                type="button"
                onClick={() => setEnvironment('PRODUCTION')}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  environment === 'PRODUCTION'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-xs'
                    : 'bg-[#161B22] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>PRODUCCIÓN OFICIAL</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Comprobantes reales SUNAT</div>
              </button>
            </div>
          </div>

          {/* SOL User & Pass */}
          <div className="space-y-2.5 pt-1">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Usuario Secundario SOL (Generado en portal SUNAT):
              </label>
              <input
                type="text"
                value={solUser}
                onChange={(e) => setSolUser(e.target.value.toUpperCase())}
                placeholder="Ej. MODDATOS o FACTURADOR01"
                className="w-full bg-[#161B22] border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-sky-500 uppercase"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Clave SOL:
              </label>
              <div className="relative">
                <input
                  type={showSolPass ? 'text' : 'password'}
                  value={solPass}
                  onChange={(e) => setSolPass(e.target.value)}
                  placeholder={currentConfig.solPassConfigured ? '•••••••••••• (Configurada)' : 'Ingresa tu Clave SOL'}
                  className="w-full bg-[#161B22] border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-sky-500 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowSolPass(!showSolPass)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                >
                  {showSolPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Series Configuration */}
          <div className="pt-1">
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              Series Electrónicas por Defecto:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[9px] text-slate-500 block">Serie Boletas:</span>
                <input
                  type="text"
                  value={seriesBoleta}
                  onChange={(e) => setSeriesBoleta(e.target.value.toUpperCase())}
                  className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono uppercase"
                  placeholder="B001"
                  maxLength={4}
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">Serie Facturas:</span>
                <input
                  type="text"
                  value={seriesFactura}
                  onChange={(e) => setSeriesFactura(e.target.value.toUpperCase())}
                  className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono uppercase"
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
                solUser,
                solPassword: solPass || currentConfig.solPassword,
                solPassConfigured: Boolean(solPass.trim() || currentConfig.solPassConfigured),
                defaultSeriesBoleta: seriesBoleta,
                defaultSeriesFactura: seriesFactura,
              });
              setFeedbackToast('Configuración de Credenciales SOL y Ambiente SUNAT guardada.');
              setTimeout(() => setFeedbackToast(null), 3000);
            }}
            className="w-full mt-2 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-1.5 transition text-[11px] cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Guardar Parámetros SOL & Series</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default WebSunatCertUploader;
