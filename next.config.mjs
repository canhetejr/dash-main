/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Evita problemas específicos de permissão no Windows dentro de `./.next`.
  // Em produção (Docker/Coolify) o filesystem é limpo, então não afeta o deploy,
  // mas nos permite validar o build localmente com segurança.
  distDir: '.next-prod',
};

export default nextConfig;
