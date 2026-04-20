'use client';

import { useState, useTransition } from 'react';
import { User, Mail, Shield, BookOpen, Camera, Save, CheckCircle, AlertCircle, BarChart2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { updateProfileAction } from '@/app/actions/profile';
import { ROLE_LABELS } from '@/types/profile';
import type { Profile, AppRole } from '@/types/profile';

interface Props {
  profile: Profile | null;
  email: string;
}

export function ProfilePageClient({ profile, email }: Props) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');

  const role = (profile?.role ?? 'viewer') as AppRole;
  const initials = (profile?.full_name ?? email).charAt(0).toUpperCase();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus('idle');
    startTransition(async () => {
      const result = await updateProfileAction(fd);
      if (result?.error) {
        setStatus('error');
        setErrorMsg(result.error);
      } else {
        setStatus('success');
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Meu Perfil</h1>
        <p className="text-sm text-surface-500 mt-1">Gerencie suas informações pessoais e preferências</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Avatar card ── */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6 flex flex-col items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-24 w-24 rounded-full object-cover ring-4 ring-unicive-green-pale"
              />
            ) : (
              <div
                className="h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white ring-4 ring-unicive-green-pale"
                style={{ background: 'linear-gradient(135deg, #005941 0%, #7EBD73 100%)' }}
              >
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white border border-surface-100 flex items-center justify-center shadow-sm">
              <Camera className="h-3.5 w-3.5 text-surface-400" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold text-surface-900">{profile?.full_name || email}</p>
            <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              role === 'admin' ? 'bg-red-50 text-red-700' :
              role === 'gestor' ? 'bg-amber-50 text-amber-700' :
              role === 'analista' ? 'bg-blue-50 text-blue-700' :
              'bg-surface-100 text-surface-600'
            }`}>
              <Shield className="h-3 w-3" />
              {ROLE_LABELS[role]}
            </span>
          </div>

          {/* Informações somente leitura */}
          <div className="w-full space-y-3 pt-4 border-t border-surface-100">
            <InfoRow icon={Mail} label="Email" value={email} />
            <InfoRow
              icon={BookOpen}
              label="ID Moodle"
              value={profile?.moodle_id ?? '—'}
            />
            <InfoRow
              icon={User}
              label="Status"
              value={profile?.is_active ? 'Ativo' : 'Inativo'}
              valueClass={profile?.is_active ? 'text-green-700' : 'text-red-600'}
            />
          </div>
        </div>

        {/* ── Edit form ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-surface-800 mb-5">Editar informações</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-surface-700 mb-1.5">
                Nome completo
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-unicive-green focus:border-transparent transition"
              />
            </div>

            {/* Avatar URL */}
            <div>
              <label htmlFor="avatar_url" className="block text-sm font-medium text-surface-700 mb-1.5">
                URL do Avatar
              </label>
              <input
                id="avatar_url"
                name="avatar_url"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-unicive-green focus:border-transparent transition"
              />
              <p className="mt-1 text-xs text-surface-400">Insira a URL de uma imagem pública (JPG, PNG ou WebP)</p>
            </div>

            {/* Campos somente leitura */}
            <div className="rounded-xl border border-surface-100 bg-surface-50/60 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">Campos gerenciados pelo sistema</p>
              <ReadOnlyField label="E-mail" value={email} />
              <ReadOnlyField label="Função (Role)" value={ROLE_LABELS[role]} />
              <ReadOnlyField label="ID Moodle" value={profile?.moodle_id ?? 'Não vinculado'} />
            </div>

            {/* Status feedback */}
            {status === 'success' && (
              <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Perfil atualizado com sucesso!
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-unicive-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-unicive-green/90 disabled:opacity-60 transition-all"
            >
              {isPending ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isPending ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Moodle integration card (BLOCO 1) ── */}
      <div className={`rounded-2xl border p-5 flex items-start gap-4 ${
        profile?.moodle_id
          ? 'bg-unicive-green-pale border-unicive-green/20'
          : 'bg-surface-50 border-surface-200'
      }`}>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          profile?.moodle_id ? 'bg-unicive-green text-white' : 'bg-surface-200 text-surface-400'
        }`}>
          <BarChart2 className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-surface-900">
            {profile?.moodle_id ? 'Análise personalizada disponível' : 'Moodle ID não configurado'}
          </p>
          <p className="text-xs text-surface-500 mt-0.5">
            {profile?.moodle_id
              ? `ID: ${profile.moodle_id} — Filtre o dashboard pelos dados da sua turma no Moodle.`
              : 'Solicite ao administrador que vincule seu ID Moodle para habilitar análises personalizadas.'}
          </p>
        </div>
        {profile?.moodle_id && (
          <Link
            href="/dashboard?externalId=mine"
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-unicive-green px-3.5 py-2 text-xs font-semibold text-white hover:bg-unicive-green/90 transition-colors whitespace-nowrap"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Ver minha turma
          </Link>
        )}
      </div>
    </div>
  );
}


function InfoRow({
  icon: Icon,
  label,
  value,
  valueClass = 'text-surface-700',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-surface-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-surface-400">{label}</p>
        <p className={`text-sm font-medium ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-surface-500">{label}</span>
      <span className="text-sm font-medium text-surface-700">{value}</span>
    </div>
  );
}
