'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      id="btn-login"
      disabled={pending}
      className="group w-full mt-2 rounded-lg bg-[#005941] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#004f38] active:bg-[#00422f] disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Entrando...
        </>
      ) : (
        'Entrar'
      )}
    </button>
  );
}
