/**
 * Layout para /admin/usuarios — sem guard pois /admin/layout.tsx já protege.
 */
export default function AdminUsuariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
