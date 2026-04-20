'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, LogOut,
  PanelLeftClose, PanelLeftOpen, UserCircle, Users,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/app/actions/auth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { AppRole } from '@/types/profile';

// ─── Navigation definitions ───────────────────────────────────────────────────

const NAV_MAIN = [
  { href: '/dashboard',              label: 'Visão Geral',           icon: LayoutDashboard, exact: true },
  { href: '/dashboard/comentarios',  label: 'Análise de Comentários', icon: MessageSquare,   exact: false },
];

const NAV_ACCOUNT = [
  { href: '/profile', label: 'Meu Perfil', icon: UserCircle },
];

const NAV_ADMIN = [
  { href: '/admin/usuarios', label: 'Gestão de Usuários', icon: Users },
];

const ROLE_LABELS: Record<AppRole, string> = {
  admin:    'Administrador',
  gestor:   'Gestor',
  analista: 'Analista',
  viewer:   'Visualizador',
};

interface SidebarProps {
  userEmail?: string;
  userRole?: AppRole;
  userFullName?: string;
}

// ─── NavItem ─────────────────────────────────────────────────────────────────

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  isCollapsed: boolean;
  isActive: boolean;
  mounted: boolean;
}

function NavItem({ href, label, icon: Icon, isCollapsed, isActive, mounted }: NavItemProps) {
  const link = (
    <Link
      href={href}
      className={cn(
        'relative flex items-center rounded-lg transition-all duration-150',
        isCollapsed ? 'justify-center h-9 w-9 mx-auto' : 'gap-3 px-3 py-2',
        isActive
          ? 'bg-unicive-green text-white shadow-sm shadow-unicive-green/20'
          : 'text-surface-500 hover:bg-surface-100 hover:text-surface-900'
      )}
    >
      <Icon
        className={cn(
          'shrink-0 transition-transform duration-150',
          isCollapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4',
          isActive ? 'text-white' : 'text-surface-400 group-hover:text-surface-700'
        )}
        aria-hidden
      />
      {!isCollapsed && (
        <span className={cn('text-[13px] font-medium truncate', isActive ? 'text-white' : '')}>
          {label}
        </span>
      )}
    </Link>
  );

  if (isCollapsed && mounted) {
    return (
      <Tooltip key={href}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={14} className="text-xs font-medium">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) {
    return <div className="my-1 h-px bg-surface-100 mx-2" aria-hidden />;
  }
  return (
    <p className="mt-3.5 mb-1 px-3 text-[9px] font-bold uppercase tracking-[0.1em] text-surface-300 select-none">
      {label}
    </p>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export function Sidebar({ userEmail, userRole = 'viewer', userFullName }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('unicive_sidebar_collapsed');
      if (saved !== null) setIsCollapsed(saved === 'true');
    } catch { /* SSR / private browsing — safe to ignore */ }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('unicive_sidebar_collapsed', String(next)); } catch { /* ignore */ }
      return next;
    });
  };

  // Avatar: initial from name → email → 'U'
  const avatarChar = (userFullName || userEmail || 'U').charAt(0).toUpperCase();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'sticky top-0 z-50 flex h-screen flex-col border-r border-surface-100 bg-white transition-[width] duration-200 ease-in-out',
          isCollapsed ? 'w-[64px]' : 'w-[220px]'
        )}
      >
        {/* ── Brand ─────────────────────────────────────────────── */}
        <div className={cn(
          'flex h-14 shrink-0 items-center border-b border-surface-100',
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}>
          {/* Logo oficial Unicive */}
          <div className="flex items-center">
            <Image
              src="https://unicive.com/wp-content/uploads/2020/12/LOGOMARCA-UNICIVE.webp"
              alt="Unicive"
              width={isCollapsed ? 32 : 110}
              height={32}
              className="object-contain h-8 w-auto transition-all duration-200"
              priority
              unoptimized
            />
          </div>

          {/* Toggle button — apenas quando expandido */}
          {!isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="flex h-6 w-6 items-center justify-center rounded-md text-surface-300 hover:bg-surface-100 hover:text-surface-600 transition-colors"
              title="Recolher menu"
              aria-label="Recolher menu"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ── Navigation ────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5" aria-label="Navegação principal">

          {/* Expand button — só quando collapsed */}
          {isCollapsed && (
            <div className="flex justify-center mb-2">
              <button
                onClick={toggleSidebar}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
                title="Expandir menu"
                aria-label="Expandir menu"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Principal */}
          {!isCollapsed && <SectionLabel label="Principal" collapsed={isCollapsed} />}
          {NAV_MAIN.map(({ href, label, icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <NavItem
                key={href}
                href={href}
                label={label}
                icon={icon}
                isCollapsed={isCollapsed}
                isActive={isActive}
                mounted={mounted}
              />
            );
          })}

          {/* Conta */}
          <SectionLabel label="Conta" collapsed={isCollapsed} />
          {NAV_ACCOUNT.map(({ href, label, icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <NavItem
                key={href}
                href={href}
                label={label}
                icon={icon}
                isCollapsed={isCollapsed}
                isActive={isActive}
                mounted={mounted}
              />
            );
          })}

          {/* Admin — apenas admin/gestor */}
          {(userRole === 'admin' || userRole === 'gestor') && (
            <>
              <SectionLabel label="Administração" collapsed={isCollapsed} />
              {NAV_ADMIN.map(({ href, label, icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <NavItem
                    key={href}
                    href={href}
                    label={label}
                    icon={icon}
                    isCollapsed={isCollapsed}
                    isActive={isActive}
                    mounted={mounted}
                  />
                );
              })}
            </>
          )}
        </nav>

        {/* ── Footer: User card + Logout ────────────────────────── */}
        <div className="shrink-0 border-t border-surface-100 p-2">
          <div className={cn(
            'flex items-center rounded-xl',
            isCollapsed ? 'flex-col gap-2 py-2' : 'gap-2.5 px-2 py-2'
          )}>
            {/* Avatar */}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white uppercase select-none"
              style={{ background: 'linear-gradient(135deg, #005941 0%, #7EBD73 100%)' }}
            >
              {avatarChar}
            </div>

            {/* Name + role */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-surface-800 truncate leading-tight">
                  {userFullName || userEmail || 'Usuário'}
                </p>
                <p className="text-[10px] text-surface-400 leading-tight mt-0.5">
                  {ROLE_LABELS[userRole]}
                </p>
              </div>
            )}

            {/* Logout */}
            {isCollapsed && mounted ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <form action={logoutAction} className="w-full">
                    <button
                      type="submit"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-red-50 hover:text-red-600 transition-colors mx-auto"
                      aria-label="Sair do sistema"
                    >
                      <LogOut className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </form>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={14} className="text-xs">Sair</TooltipContent>
              </Tooltip>
            ) : (
              <form action={logoutAction}>
                <button
                  type="submit"
                  title="Sair do sistema"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
                  aria-label="Sair do sistema"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                </button>
              </form>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
