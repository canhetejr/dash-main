'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  Users, Search, Shield, CheckCircle, XCircle,
  Edit3, Save, X, ToggleLeft, ToggleRight, BookOpen
} from 'lucide-react';
import { adminUpdateUserAction } from '@/app/actions/profile';
import { ROLE_LABELS } from '@/types/profile';
import type { Profile, ProfileWithEmail, AppRole } from '@/types/profile';

interface Props {
  initialProfiles: (Profile & { email?: string | null })[];
  callerRole: string;
}

const ROLES: AppRole[] = ['admin', 'gestor', 'analista', 'viewer'];
const ROLE_COLORS: Record<AppRole, string> = {
  admin:    'bg-red-50 text-red-700 border-red-200',
  gestor:   'bg-amber-50 text-amber-700 border-amber-200',
  analista: 'bg-blue-50 text-blue-700 border-blue-200',
  viewer:   'bg-surface-100 text-surface-600 border-surface-200',
};

export function AdminUsuariosClient({ initialProfiles, callerRole }: Props) {
  const [profiles, setProfiles] = useState<(Profile & { email?: string | null })[]>(initialProfiles);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Profile>>({});
  const [isPending, startTransition] = useTransition();
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = callerRole === 'admin';

  // Busca filtrada
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.moodle_id?.toLowerCase().includes(q) ||
        p.role.includes(q)
    );
  }, [profiles, search]);

  function startEdit(p: Profile) {
    setEditingId(p.id);
    setEditValues({ full_name: p.full_name ?? '', role: p.role, moodle_id: p.moodle_id ?? '', is_active: p.is_active });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({});
  }

  function showToast(type: 'success' | 'error', text: string) {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3500);
  }

  async function saveEdit(userId: string) {
    startTransition(async () => {
      const result = await adminUpdateUserAction(userId, {
        full_name: editValues.full_name ?? undefined,
        role: editValues.role as AppRole,
        is_active: editValues.is_active,
        moodle_id: editValues.moodle_id ?? undefined,
      });

      if (result.error) {
        showToast('error', result.error);
        return;
      }

      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, ...editValues } : p))
      );
      setEditingId(null);
      showToast('success', 'Usuário atualizado com sucesso!');
    });
  }

  async function toggleActive(p: Profile) {
    startTransition(async () => {
      const result = await adminUpdateUserAction(p.id, { is_active: !p.is_active });
      if (result.error) { showToast('error', result.error); return; }
      setProfiles((prev) =>
        prev.map((u) => (u.id === p.id ? { ...u, is_active: !u.is_active } : u))
      );
      showToast('success', `Usuário ${!p.is_active ? 'ativado' : 'desativado'} com sucesso.`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg border transition-all ${
            toastMsg.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {toastMsg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-unicive-green" />
            Gestão de Usuários
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            {profiles.length} {profiles.length === 1 ? 'usuário' : 'usuários'} no sistema
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
        <input
          type="text"
          placeholder="Buscar por nome, role ou ID Moodle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-surface-200 bg-white pl-10 pr-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-unicive-green focus:border-transparent shadow-sm transition"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-100">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-100">
                {['Usuário', 'E-mail', 'Role', 'ID Moodle', 'Status', 'Ações'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-surface-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-surface-400">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isEditing = editingId === p.id;
                  const initials = (p.full_name ?? 'U').charAt(0).toUpperCase();

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${isEditing ? 'bg-unicive-green-pale/30' : 'hover:bg-surface-50/60'}`}
                    >
                      {/* Usuário */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: 'linear-gradient(135deg, #005941 0%, #7EBD73 100%)' }}
                          >
                            {initials}
                          </div>
                          <div>
                            {isEditing ? (
                              <input
                                value={editValues.full_name ?? ''}
                                onChange={(e) => setEditValues((v) => ({ ...v, full_name: e.target.value }))}
                                className="rounded-lg border border-surface-200 bg-white px-2 py-1 text-sm text-surface-900 focus:outline-none focus:ring-1 focus:ring-unicive-green"
                              />
                            ) : (
                              <p className="text-sm font-medium text-surface-800">{p.full_name || '—'}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-2.5">
                        <span className="text-sm text-surface-600">{p.email ?? <span className="text-surface-400 italic">—</span>}</span>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-2.5">
                        {isEditing ? (
                          <select
                            value={editValues.role}
                            onChange={(e) => setEditValues((v) => ({ ...v, role: e.target.value as AppRole }))}
                            disabled={!isAdmin && editValues.role === 'admin'}
                            className="rounded-lg border border-surface-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-unicive-green"
                          >
                            {ROLES.filter((r) => isAdmin || r !== 'admin').map((r) => (
                              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[p.role as AppRole]}`}>
                            <Shield className="h-3 w-3" />
                            {ROLE_LABELS[p.role as AppRole] ?? p.role}
                          </span>
                        )}
                      </td>

                      {/* Moodle ID */}
                      <td className="px-4 py-2.5">
                        {isEditing ? (
                          <input
                            value={editValues.moodle_id ?? ''}
                            onChange={(e) => setEditValues((v) => ({ ...v, moodle_id: e.target.value }))}
                            placeholder="ex: 1234"
                            className="rounded-lg border border-surface-200 bg-white px-2 py-1 text-sm text-surface-900 w-28 focus:outline-none focus:ring-1 focus:ring-unicive-green"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 text-sm text-surface-600">
                            <BookOpen className="h-3.5 w-3.5 text-surface-400 shrink-0" />
                            {p.moodle_id ?? <span className="text-surface-400 italic">—</span>}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.is_active ? 'bg-green-50 text-green-700' : 'bg-surface-100 text-surface-500'
                        }`}>
                          {p.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {p.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(p.id)}
                                disabled={isPending}
                                className="flex items-center gap-1 rounded-lg bg-unicive-green px-2.5 py-1.5 text-xs font-medium text-white hover:bg-unicive-green/90 disabled:opacity-60 transition"
                              >
                                {isPending ? <span className="h-3 w-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-3 w-3" />}
                                Salvar
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-50 transition"
                              >
                                <X className="h-3 w-3" /> Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(p)}
                                title="Editar"
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 hover:text-surface-900 transition"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => toggleActive(p)}
                                disabled={isPending}
                                title={p.is_active ? 'Desativar' : 'Ativar'}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 hover:text-surface-900 disabled:opacity-40 transition"
                              >
                                {p.is_active
                                  ? <ToggleRight className="h-3.5 w-3.5 text-green-600" />
                                  : <ToggleLeft className="h-3.5 w-3.5" />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-surface-100 px-5 py-2.5 text-xs text-surface-400">
          Exibindo {filtered.length} de {profiles.length} usuários
        </div>
      </div>
    </div>
  );
}
