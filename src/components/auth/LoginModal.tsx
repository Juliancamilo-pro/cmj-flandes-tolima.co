/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  X,
  Lock,
  Mail,
  ShieldAlert,
  KeyRound,
  UserCheck,
  Building2,
  FileText,
  Camera,
  Share2,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, setupAdminPassword, registerWithCode } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'setup-admin'>('login');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Secretary Password Setup Form
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  // Register form
  const [regCode, setRegCode] = useState('cmj-flandes');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regParty, setRegParty] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regPhotoUrl, setRegPhotoUrl] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regInstagram, setRegInstagram] = useState('');
  const [regFacebook, setRegFacebook] = useState('');
  const [regCommission, setRegCommission] = useState('com_01');

  // Accessible Anti-Bot Challenge
  const [captchaNum1, setCaptchaNum1] = useState(3);
  const [captchaNum2, setCaptchaNum2] = useState(4);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCaptcha = () => {
    const n1 = Math.floor(Math.random() * 6) + 2;
    const n2 = Math.floor(Math.random() * 5) + 1;
    setCaptchaNum1(n1);
    setCaptchaNum2(n2);
    setCaptchaAnswer('');
  };

  useEffect(() => {
    if (isOpen) {
      refreshCaptcha();
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const validateAntiBot = (): boolean => {
    if (honeypot.trim() !== '') {
      setError('Verificación de seguridad no superada.');
      return false;
    }
    const expected = captchaNum1 + captchaNum2;
    if (parseInt(captchaAnswer.trim(), 10) !== expected) {
      setError(`Verificación de seguridad incorrecta. Calcule: ${captchaNum1} + ${captchaNum2}`);
      return false;
    }
    return true;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!validateAntiBot()) return;

    setIsLoading(true);

    try {
      await login(loginEmail.trim(), loginPassword);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Verifique sus credenciales.');
      refreshCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!setupEmail.trim()) {
      setError('Por favor ingrese su correo de acceso administrativo.');
      return;
    }

    if (!setupPassword || setupPassword.length < 6) {
      setError('La nueva contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    if (setupPassword !== setupPasswordConfirm) {
      setError('Las contraseñas no coinciden. Por favor verifíquelas.');
      return;
    }

    if (!validateAntiBot()) return;

    setIsLoading(true);
    try {
      const res = await setupAdminPassword(setupEmail.trim(), setupPassword);
      setSuccessMsg(res.message || 'Contraseña configurada con éxito. Sesión iniciada.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error al configurar la contraseña de Secretario.');
      refreshCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (regCode.trim().toLowerCase() !== 'cmj-flandes') {
      setError('El código institucional es incorrecto. Debe ingresar exactamente "cmj-flandes".');
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setError('Las contraseñas ingresadas no coinciden.');
      return;
    }

    if (regPassword.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    if (!validateAntiBot()) return;

    setIsLoading(true);
    try {
      const res = await registerWithCode({
        name: regName,
        email: regEmail,
        password: regPassword,
        code: regCode,
        politicalParty: regParty,
        bio: regBio,
        photoUrl: regPhotoUrl,
        phone: regPhone,
        commissionId: regCommission,
        socialLinks: {
          instagram: regInstagram,
          facebook: regFacebook,
        },
      });

      setSuccessMsg(res.message || '¡Cuenta de consejero creada exitosamente!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error al registrar la cuenta de consejero.');
      refreshCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-auth-title">
      <div className="relative w-full max-w-lg my-8 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 overflow-hidden">
        {/* Top Header Accent with Colombian Tricolor Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex" aria-hidden="true">
          <div className="h-full w-1/2 bg-[#FCD116]" />
          <div className="h-full w-1/4 bg-[#003893]" />
          <div className="h-full w-1/4 bg-[#CE1126]" />
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-900 dark:text-red-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 id="modal-auth-title" className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                Consejo Municipal de Juventud Flandes
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Acceso oficial, gestión de credenciales y acreditación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar ventana de acceso"
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex mt-4 border-b border-stone-200 dark:border-stone-800 overflow-x-auto text-xs font-bold" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'login'}
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
            className={`flex-1 py-2.5 px-2 text-center whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'login'
                ? 'border-red-900 dark:border-red-500 text-red-900 dark:text-red-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'setup-admin'}
            onClick={() => {
              setActiveTab('setup-admin');
              setError(null);
            }}
            className={`flex-1 py-2.5 px-2 text-center whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'setup-admin'
                ? 'border-red-900 dark:border-red-500 text-red-900 dark:text-red-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Configurar Clave Secretario
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'register'}
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
            className={`flex-1 py-2.5 px-2 text-center whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'register'
                ? 'border-red-900 dark:border-red-500 text-red-900 dark:text-red-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Acreditación Consejeros
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300" role="alert">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300" role="status">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Iniciar Sesión */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
            {/* Honeypot field for anti-bot protection */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                name="institutional_fax_number"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Correo Electrónico de Acceso
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900 dark:focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(p => !p)}
                  className="text-[11px] text-stone-500 hover:text-red-900 dark:hover:text-red-400"
                >
                  {showLoginPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900 dark:focus:ring-red-500"
                />
              </div>
            </div>

            {/* Anti-Bot Challenge */}
            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-900 dark:text-red-400" />
                  <span>Verificación Anti-Bot: ¿Cuánto es {captchaNum1} + {captchaNum2}?</span>
                </label>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  title="Cambiar operación matemática"
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="number"
                required
                value={captchaAnswer}
                onChange={e => setCaptchaAnswer(e.target.value)}
                placeholder="Resultado numérico"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-red-900 hover:bg-red-950 dark:bg-red-800 dark:hover:bg-red-900 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-block animate-spin mr-1">⏳</span>
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>Ingresar al Portal Institucional</span>
            </button>

            <div className="flex flex-col gap-2 pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('setup-admin');
                  setError(null);
                }}
                className="text-xs text-red-900 dark:text-red-400 hover:underline font-medium"
              >
                ¿Eres el Secretario? Establece o cambia tu contraseña aquí
              </button>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Los consejeros nuevos pueden registrarse con el código oficial <span className="font-mono font-bold text-stone-700 dark:text-stone-300">cmj-flandes</span>.
              </p>
            </div>
          </form>
        )}

        {/* Tab 2: Configurar Clave de Secretario (Administrador Principal) */}
        {activeTab === 'setup-admin' && (
          <form onSubmit={handleSetupAdminSubmit} className="mt-5 space-y-4">
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-red-900 dark:text-red-300 mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Procedimiento Seguro para el Secretario</span>
              </div>
              <p>
                Configure su clave personal sin exponer contraseñas en el código ni en la pantalla. Su contraseña se procesará con cifrado criptográfico unidireccional (bcrypt) y su sesión quedará autenticada de inmediato.
              </p>
            </div>

            {/* Honeypot */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                tabIndex={-1}
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Correo de Acceso Administrativo *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  required
                  value={setupEmail}
                  onChange={e => setSetupEmail(e.target.value)}
                  placeholder="Ingrese el correo administrativo registrado"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900 dark:focus:ring-red-500"
                />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Use el correo administrativo previamente asignado a la Secretaría General.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Nueva Contraseña *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSetupPassword(p => !p)}
                    className="text-[11px] text-stone-500 hover:text-red-900"
                  >
                    {showSetupPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type={showSetupPassword ? 'text' : 'password'}
                    required
                    value={setupPassword}
                    onChange={e => setSetupPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type={showSetupPassword ? 'text' : 'password'}
                    required
                    value={setupPasswordConfirm}
                    onChange={e => setSetupPasswordConfirm(e.target.value)}
                    placeholder="Repita la contraseña"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900"
                  />
                </div>
              </div>
            </div>

            {/* Anti-Bot Challenge */}
            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-900 dark:text-red-400" />
                  <span>Verificación de Seguridad: ¿Cuánto es {captchaNum1} + {captchaNum2}?</span>
                </label>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="number"
                required
                value={captchaAnswer}
                onChange={e => setCaptchaAnswer(e.target.value)}
                placeholder="Resultado numérico"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-red-900 hover:bg-red-950 dark:bg-red-800 dark:hover:bg-red-900 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-block animate-spin mr-1">⏳</span>
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>Guardar Contraseña e Iniciar Sesión</span>
            </button>
          </form>
        )}

        {/* Tab 3: Registro con Código (Consejeros) */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {/* Honeypot */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                tabIndex={-1}
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
              />
            </div>

            {/* Institutional Secret Code */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl">
              <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
                Código de Registro Institucional *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={regCode}
                  onChange={e => setRegCode(e.target.value)}
                  placeholder="cmj-flandes"
                  className="w-full px-3 py-1.5 text-sm font-mono font-bold tracking-wider rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-1">
                Código oficial de acreditación: <span className="font-bold font-mono">cmj-flandes</span>
              </p>
            </div>

            {/* Name and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Ej. Andrés Camilo Rojas"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900"
                  />
                </div>
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={regPasswordConfirm}
                  onChange={e => setRegPasswordConfirm(e.target.value)}
                  placeholder="Repetir contraseña"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900"
                />
              </div>
            </div>

            {/* Political Party / Organization & Commission */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Sector o Colectivo Juvenil *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={regParty}
                    onChange={e => setRegParty(e.target.value)}
                    placeholder="Ej. Juventudes Independientes"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Comisión de Trabajo
                </label>
                <select
                  value={regCommission}
                  onChange={e => setRegCommission(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900"
                >
                  <option value="com_01">Educación, Ciencia y Cultura</option>
                  <option value="com_02">Medio Ambiente y Río Magdalena</option>
                  <option value="com_03">Salud Integral y Deporte</option>
                  <option value="com_04">Emprendimiento y Empleo</option>
                  <option value="com_05">Derechos Humanos y Paz</option>
                </select>
              </div>
            </div>

            {/* Biography */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Biografía y Trayectoria Juvenil
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                <textarea
                  rows={2}
                  value={regBio}
                  onChange={e => setRegBio(e.target.value)}
                  placeholder="Cuéntanos sobre tu liderazgo en Flandes, tus metas y trabajo comunitario..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900"
                />
              </div>
            </div>

            {/* Photo & Social Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  URL de Fotografía Real (opcional)
                </label>
                <div className="relative">
                  <Camera className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="url"
                    value={regPhotoUrl}
                    onChange={e => setRegPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Instagram
                </label>
                <div className="relative">
                  <Share2 className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={regInstagram}
                    onChange={e => setRegInstagram(e.target.value)}
                    placeholder="@usuario"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  placeholder="300 123 4567"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900"
                />
              </div>
            </div>

            {/* Anti-Bot Challenge */}
            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-900 dark:text-red-400" />
                  <span>Verificación de Seguridad: ¿Cuánto es {captchaNum1} + {captchaNum2}?</span>
                </label>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="number"
                required
                value={captchaAnswer}
                onChange={e => setCaptchaAnswer(e.target.value)}
                placeholder="Resultado numérico"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-900"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-2.5 px-4 text-sm font-semibold text-white bg-red-900 hover:bg-red-950 dark:bg-red-800 dark:hover:bg-red-900 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-block animate-spin mr-2">⏳</span>
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              <span>Crear mi Cuenta de Consejero(a) Oficial</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
