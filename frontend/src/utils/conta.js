// Funções de apoio para mostrar o utilizador (sidebar e modal da conta)

// "Pedro Almeida" -> "PA"
export const iniciais = (nome) =>
  String(nome || '?').trim().split(/\s+/).filter(Boolean).map((p) => p[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join('').toUpperCase();

export const nomeCargo = (perfis = []) => {
  const p = perfis.map((x) => String(x).toLowerCase());
  if (p.includes('administrador')) return 'Administrador';
  if (p.includes('rececionista')) return 'Rececionista';
  if (p.includes('fisioterapeuta')) return 'Fisioterapeuta';
  if (p.includes('paciente')) return 'Paciente';
  return '';
};