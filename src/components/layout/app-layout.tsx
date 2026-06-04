"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  CalendarDays,
  Trophy,
  BookOpen,
  ShieldAlert,
  LogOut,
  User,
  Menu,
  X,
  Sun,
  Moon,
  Plus,
  ChevronDown,
  AlertCircle,
  Building2,
  ArrowRight,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { setActiveLeague, joinNewLeague } from "@/app/actions/league";
import { updateUserImage, changeUserPassword } from "@/app/actions/user";
import { CustomDialog } from "@/components/ui/custom-dialog";

interface LeagueItem {
  leagueId: string;
  leagueName: string;
  isActive: boolean;
  department: string;
  role?: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
  memberships: LeagueItem[];
}

export function AppLayout({ children, memberships = [] }: AppLayoutProps) {
  const pathname = usePathname();
  const { data: session, update } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Estado para diálogos/modales custom
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error" | "confirm";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const triggerAlert = (
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info"
  ) => {
    setDialogConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  // Estados y refs para la foto de perfil
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isPendingUpload, setIsPendingUpload] = useState(false);
  const [, startTransition] = React.useTransition();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user?.image) {
      setUserImage(session.user.image);
    }
  }, [session?.user?.image]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPendingUpload(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

        startTransition(async () => {
          const res = await updateUserImage(dataUrl);
          setIsPendingUpload(false);
          if (res.success) {
            setUserImage(dataUrl);
            await update();
          } else {
            triggerAlert("Error al actualizar foto", res.error || "Ocurrió un error al subir la imagen", "error");
          }
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const activeLeague = memberships.find((m) => m.isActive);


  const handleSwitchLeague = async (leagueId: string) => {
    const res = await setActiveLeague(leagueId);
    if (res.success) {
      window.location.reload();
    } else {
      triggerAlert("Error al cambiar liga", res.error || "Ocurrió un error al cambiar de liga", "error");
    }
  };

  const handleJoinLeagueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    setJoining(true);
    setJoinError(null);

    const res = await joinNewLeague(inviteCodeInput);
    setJoining(false);
    if (res.success) {
      setShowJoinModal(false);
      setInviteCodeInput("");
      window.location.reload();
    } else {
      setJoinError(res.error);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== "undefined") {
        const currentScrollY = window.scrollY;
        if (mobileMenuOpen) return;
        
        if (currentScrollY > lastScrollY && currentScrollY > 80) {
          setShowHeader(false);
        } else {
          setShowHeader(true);
        }
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY, mobileMenuOpen]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  };

  const isAdmin = session?.user?.role === "ADMIN";
  const isCollaborator = activeLeague?.role === "COLLABORATOR";

  const navigation = [
    { name: "Inicio", href: "/dashboard", icon: LayoutDashboard },
    { name: "Pronósticos", href: "/predictions", icon: CalendarDays },
    { name: "Rankings", href: "/ranking", icon: Trophy },
    { name: "Reglas", href: "/rules", icon: BookOpen },
  ];

  if (isCollaborator) {
    navigation.push({ name: "Control de Pagos", href: "/collaborator", icon: ShieldCheck });
  }

  if (isAdmin) {
    navigation.push({ name: "Administración", href: "/admin", icon: ShieldAlert });
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-all">
      {/* --- SIDEBAR PARA ESCRITORIO --- */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border z-20">
        {/* Header / Logo */}
        <div className="flex justify-center items-center py-6 border-b border-border">
          <img src="/images/fifa-logo.jpg" alt="FIFA Logo" className="w-20 h-20 object-contain rounded-xl drop-shadow" />
        </div>

        {/* Selector de Liga */}
        {memberships.length > 0 && (
          <div className="px-4 mb-2">
            <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 ml-1">Mi Liga Activa</label>
            <div className="relative">
              <select
                value={activeLeague?.leagueId || ""}
                onChange={(e) => {
                  if (e.target.value === "JOIN_NEW") {
                    setShowJoinModal(true);
                  } else {
                    handleSwitchLeague(e.target.value);
                  }
                }}
                className="w-full pl-3 pr-8 py-2 bg-slate-900/50 hover:bg-slate-900 border border-border focus:border-primary rounded-xl text-foreground text-xs outline-none appearance-none cursor-pointer font-semibold transition-all"
              >
                {memberships.map((m) => (
                  <option key={m.leagueId} value={m.leagueId}>
                    {m.leagueName}
                  </option>
                ))}
                <option value="JOIN_NEW" className="text-primary font-bold">
                  + Unirse a otra liga...
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>
        )}

        {/* Tarjeta de Sector */}
        {activeLeague && (
          <div className="px-4 mb-2">
            <div className="p-3 bg-slate-900/30 border border-border/40 rounded-xl flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-bold">Mi Sector</span>
                <span className="text-xs font-semibold text-primary truncate block">
                  {activeLeague.department || "No asignado"}
                </span>
              </div>
              <Building2 className="w-4 h-4 text-slate-555 flex-shrink-0" />
            </div>
          </div>
        )}

        {/* Links de Navegación */}
        <nav className="flex-1 px-4 space-y-1 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all hover-scale ${
                  isActive
                    ? "btn-premium-nav font-bold"
                    : "text-slate-400 hover:text-foreground hover:bg-slate-900/50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Botón salir */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* --- TOP BAR PARA MÓVIL --- */}
      <header className={`md:hidden flex items-center justify-between px-6 py-2 bg-card/90 backdrop-blur-md border-b border-border fixed top-0 inset-x-0 z-30 transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center gap-3">
          <img src="/images/fifa-logo.jpg" alt="FIFA Logo" className="w-16 h-16 object-contain rounded-lg drop-shadow" />
          <span className="font-black tracking-wider text-xl leading-tight uppercase">
            FIFA <span className="text-gradient">WORLD CUP 2026</span>
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-foreground transition-all cursor-pointer border border-border/40"
            title={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-foreground outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Menú desplegable móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[80px] bg-background/95 backdrop-blur-md z-20 flex flex-col p-6 animate-fade-in border-b border-border overflow-y-auto">
          {/* Perfil del Usuario en Móvil */}
          <div className="p-4 mb-4 rounded-xl bg-slate-900/30 border border-border/40 flex items-center gap-3 relative">
            <div
              onClick={handleAvatarClick}
              className="group relative w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-primary overflow-hidden flex-shrink-0 cursor-pointer"
              title="Cambiar foto de perfil"
            >
              {isPendingUpload ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : userImage ? (
                <img src={userImage} alt={session?.user?.name || "Usuario"} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <span className="text-[8px] font-bold text-white uppercase tracking-wider">Subir</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{session?.user?.name || "Usuario"}</p>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowPasswordModal(true);
                  }}
                  className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-foreground border border-border/20 cursor-pointer"
                  title="Cambiar Contraseña"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 capitalize truncate">
                {isAdmin ? "Administrador" : "Jugador"}
              </p>
            </div>
          </div>

          {/* Selector de Liga Móvil */}
          {memberships.length > 0 && (
            <div className="mb-2">
              <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 ml-1">Mi Liga Activa</label>
              <div className="relative">
                <select
                  value={activeLeague?.leagueId || ""}
                  onChange={(e) => {
                    if (e.target.value === "JOIN_NEW") {
                      setShowJoinModal(true);
                      setMobileMenuOpen(false);
                    } else {
                      handleSwitchLeague(e.target.value);
                    }
                  }}
                  className="w-full pl-3 pr-8 py-2.5 bg-slate-900 border border-border focus:border-primary rounded-xl text-foreground text-sm outline-none appearance-none cursor-pointer font-semibold transition-all"
                >
                  {memberships.map((m) => (
                    <option key={m.leagueId} value={m.leagueId}>
                      {m.leagueName}
                    </option>
                  ))}
                  <option value="JOIN_NEW" className="text-primary font-bold">
                    + Unirse a otra liga...
                  </option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 text-[10px]">
                  ▼
                </div>
              </div>
            </div>
          )}

          {/* Tarjeta de Sector Móvil */}
          {activeLeague && (
            <div className="mb-4">
              <div className="p-3 bg-slate-900/30 border border-border/40 rounded-xl flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-bold">Mi Sector</span>
                  <span className="text-xs font-semibold text-primary truncate block">
                    {activeLeague.department || "No asignado"}
                  </span>
                </div>
                <Building2 className="w-4 h-4 text-slate-555 flex-shrink-0" />
              </div>
            </div>
          )}

          <nav className="space-y-2 flex-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 text-base font-semibold rounded-xl transition-all ${
                    isActive
                      ? "btn-premium-nav"
                      : "text-slate-400 hover:text-foreground hover:bg-slate-900/50"
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-3 py-3.5 mt-8 bg-red-500/10 text-red-400 font-bold rounded-xl border border-red-500/20"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      )}

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen pt-[80px] md:pt-0">
        {/* Header superior de escritorio */}
        <header className="hidden md:flex items-center justify-between px-8 h-16 border-b border-border bg-card/30 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-[28px] font-extrabold tracking-wider leading-tight uppercase">
              FIFA <span className="text-gradient">WORLD CUP 2026 PRODE</span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Perfil del Usuario en Header (PC) */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <p className="text-sm font-semibold text-foreground leading-tight">{session?.user?.name || "Usuario"}</p>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-foreground transition-all border border-border/20 cursor-pointer"
                    title="Cambiar Contraseña"
                  >
                    <Lock className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 capitalize leading-none mt-0.5">
                  {isAdmin ? "Administrador" : "Jugador"}
                </p>
              </div>
              <div
                onClick={handleAvatarClick}
                className="group relative w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-primary overflow-hidden flex-shrink-0 cursor-pointer"
                title="Cambiar foto de perfil"
              >
                {isPendingUpload ? (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : userImage ? (
                  <img src={userImage} alt={session?.user?.name || "Usuario"} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-slate-400" />
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <span className="text-[8px] font-bold text-white uppercase tracking-wider">Subir</span>
                </div>
              </div>
            </div>

            <span className="h-6 w-px bg-border/80" aria-hidden="true" />

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-foreground transition-all cursor-pointer border border-border/20"
              title={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>
        </header>

        <div className="flex-1 px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8">
          {children}
        </div>

        {/* --- NAVEGACIÓN INFERIOR PARA MÓVIL (TIPO APP MÓVIL) --- */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card/90 backdrop-blur-lg border-t border-border flex justify-around items-center py-2 px-2 z-10">
          {navigation.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all text-xs font-semibold ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-slate-500 hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </main>

      {/* Modal - Unirse a otra liga */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-panel border border-border rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => {
                setShowJoinModal(false);
                setJoinError(null);
                setInviteCodeInput("");
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-foreground rounded-lg hover:bg-slate-800/50 transition-all outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Unirme a otra Liga</h3>
            </div>

            {joinError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                {joinError}
              </div>
            )}

            <form onSubmit={handleJoinLeagueSubmit} className="space-y-4">
              <div>
                <label htmlFor="modalInviteCode" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Código de Invitación de Liga
                </label>
                <input
                  id="modalInviteCode"
                  type="text"
                  required
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  placeholder="Ej: DEPORTES2026"
                  className="w-full px-3 py-2 bg-slate-900/50 hover:bg-slate-900 border border-border focus:border-primary rounded-xl text-foreground placeholder-slate-500 transition-all text-sm outline-none uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={joining}
                className="w-full py-3 btn-premium text-xs"
              >
                {joining ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Confirmar y Unirme
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      {/* Modal - Cambiar Contraseña del Usuario */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-panel border border-border rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordError(null);
                setPasswordSuccess(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-foreground rounded-lg hover:bg-slate-800/50 transition-all outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Cambiar Contraseña</h3>
            </div>

            {passwordError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-semibold">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs text-center font-semibold">
                {passwordSuccess}
              </div>
            )}

            <form
              action={async (formData) => {
                setPasswordError(null);
                setPasswordSuccess(null);
                const res = await changeUserPassword(null, formData);
                if (res.success) {
                  setPasswordSuccess("Contraseña cambiada con éxito.");
                  setTimeout(() => {
                    setShowPasswordModal(false);
                    setPasswordSuccess(null);
                  }, 1500);
                } else {
                  setPasswordError(res.error);
                }
              }}
              className="space-y-4"
            >
              {/* Contraseña Actual */}
              {session?.user && (
                <div>
                  <label htmlFor="currentPassword" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Contraseña Actual
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-900/50 hover:bg-slate-900 border border-border focus:border-primary rounded-xl text-foreground placeholder-slate-500 transition-all text-sm outline-none"
                  />
                </div>
              )}

              {/* Nueva Contraseña */}
              <div>
                <label htmlFor="newPassword" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nueva Contraseña (mín. 6 caracteres)
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-900/50 hover:bg-slate-900 border border-border focus:border-primary rounded-xl text-foreground placeholder-slate-500 transition-all text-sm outline-none"
                />
              </div>

              {/* Confirmar Nueva Contraseña */}
              <div>
                <label htmlFor="confirmPassword" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-900/50 hover:bg-slate-900 border border-border focus:border-primary rounded-xl text-foreground placeholder-slate-500 transition-all text-sm outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 btn-premium text-xs"
              >
                Guardar Contraseña
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom dialog alert/confirm dialog */}
      <CustomDialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
      />
    </div>
  );
}
