import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import './DatePicker.css';

// ---------------------------------------------------------------
// Seletor de datas do PRC (substitui o calendário nativo do browser).
//
// <DatePicker value="1998-03-15" onChange={(v) => ...} />
//   value / onChange usam o formato 'AAAA-MM-DD' (igual ao <input type="date">)
//
// <DateTimePicker value="2026-11-27T10:00" onChange={(v) => ...} />
//   value / onChange usam o formato 'AAAA-MM-DDTHH:mm' (igual ao datetime-local)
//
// Pode escrever-se a data à mão (ddmmaaaa, as barras entram sozinhas)
// ou escolher no calendário, com listas de mês e ano para saltar depressa.
// ---------------------------------------------------------------

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS_SEMANA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; // começa à segunda-feira

const pad = (n) => String(n).padStart(2, '0');
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const parseIso = (iso) => {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
};

const isoToTexto = (iso) => {
  const d = parseIso(iso);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : '';
};

// Converte o que o utilizador escreve (ex.: "15031998") em "15/03/1998"
const formatarDigitos = (texto) => {
  const dig = texto.replace(/\D/g, '').slice(0, 8);
  if (dig.length <= 2) return dig;
  if (dig.length <= 4) return `${dig.slice(0, 2)}/${dig.slice(2)}`;
  return `${dig.slice(0, 2)}/${dig.slice(2, 4)}/${dig.slice(4)}`;
};

const textoToIso = (texto) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return null;
  const dia = Number(m[1]);
  const mes = Number(m[2]) - 1;
  const ano = Number(m[3]);
  const d = new Date(ano, mes, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== mes || d.getDate() !== dia) return null;
  return toIso(d);
};

const vistaPorOmissao = (value, max, anoSugerido) => {
  const atual = parseIso(value);
  if (atual) return atual;
  if (anoSugerido) return new Date(anoSugerido, 0, 1);
  return parseIso(max) || new Date();
};

export default function DatePicker({
  value,
  onChange,
  id,
  required = false,
  disabled = false,
  placeholder = 'dd/mm/aaaa',
  min,          // 'AAAA-MM-DD' – dias antes ficam desativados
  max,          // 'AAAA-MM-DD' – dias depois ficam desativados (ex.: hoje, para nascimento)
  minYear = 1920,
  maxYear = new Date().getFullYear() + 5,
  anoSugerido, // ano em que o calendário abre quando o campo está vazio (ex.: 1990 para nascimento)
}) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState(isoToTexto(value));
  const [vista, setVista] = useState(() => vistaPorOmissao(value, max, anoSugerido));
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const campoRef = useRef(null);
  const popRef = useRef(null);

  // Mantém o texto alinhado quando o valor muda por fora (ex.: abrir modal de edição)
  const [valorAnterior, setValorAnterior] = useState(value);
  if (value !== valorAnterior) {
    setValorAnterior(value);
    if (textoToIso(texto) !== value) setTexto(isoToTexto(value));
  }

  const abrir = () => {
    if (disabled) return;
    setVista(vistaPorOmissao(value, max, anoSugerido));
    setAberto(true);
  };

  // Posiciona o calendário por baixo do campo (ou por cima, se não houver espaço)
  useLayoutEffect(() => {
    if (!aberto) return undefined;
    const posicionar = () => {
      const r = campoRef.current?.getBoundingClientRect();
      const alturaPop = popRef.current?.offsetHeight || 360;
      if (!r) return;
      const espacoAbaixo = window.innerHeight - r.bottom;
      const top = espacoAbaixo < alturaPop + 12 && r.top > alturaPop + 12
        ? r.top - alturaPop - 6
        : r.bottom + 6;
      const left = Math.min(r.left, window.innerWidth - 336);
      setPos({ top, left: Math.max(8, left) });
    };
    posicionar();
    window.addEventListener('resize', posicionar);
    window.addEventListener('scroll', posicionar, true);
    return () => {
      window.removeEventListener('resize', posicionar);
      window.removeEventListener('scroll', posicionar, true);
    };
  }, [aberto, vista]);

  // Fecha ao clicar fora ou ao carregar em Escape
  useEffect(() => {
    if (!aberto) return undefined;
    const clicarFora = (e) => {
      if (!campoRef.current?.contains(e.target) && !popRef.current?.contains(e.target)) setAberto(false);
    };
    const tecla = (e) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', clicarFora);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', clicarFora);
      document.removeEventListener('keydown', tecla);
    };
  }, [aberto]);

  const minD = parseIso(min);
  const maxD = parseIso(max);
  const foraDoLimite = (d) => (minD && d < minD) || (maxD && d > maxD);

  const escolher = (d) => {
    if (foraDoLimite(d)) return;
    onChange(toIso(d));
    setAberto(false);
  };

  const escrever = (e) => {
    const novo = formatarDigitos(e.target.value);
    setTexto(novo);
    if (novo === '') onChange('');
    const iso = textoToIso(novo);
    if (iso && !foraDoLimite(parseIso(iso))) {
      onChange(iso);
      setVista(parseIso(iso));
    }
  };

  // Ao sair do campo, se o texto não for uma data válida, repõe o último valor bom
  const sair = () => {
    if (texto && !textoToIso(texto)) setTexto(isoToTexto(value));
  };

  // Evita que o campo perca o foco ao clicar nos dias/setas do calendário.
  // Nos <select> de mês e ano NÃO se pode bloquear, senão a lista não abre.
  const manterFoco = (e) => {
    if (e.target.closest('select')) return;
    e.preventDefault();
  };

  const mudarMes = (delta) => setVista(new Date(vista.getFullYear(), vista.getMonth() + delta, 1));

  // Grelha do mês (6 semanas, começa à segunda-feira)
  const primeiro = new Date(vista.getFullYear(), vista.getMonth(), 1);
  const desvio = (primeiro.getDay() + 6) % 7;
  const dias = Array.from({ length: 42 }, (_, i) => new Date(vista.getFullYear(), vista.getMonth(), i - desvio + 1));

  const hojeIso = toIso(new Date());
  const anoMax = maxD ? Math.min(maxYear, maxD.getFullYear()) : maxYear;
  const anoMin = minD ? Math.max(minYear, minD.getFullYear()) : minYear;
  const anos = [];
  for (let a = anoMax; a >= anoMin; a -= 1) anos.push(a);

  return (
    <div className="dp" ref={campoRef}>
      <input
        id={id}
        className="input dp-input"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={texto}
        onChange={escrever}
        onFocus={abrir}
        onClick={abrir}
        onBlur={sair}
        required={required}
        disabled={disabled}
      />
      <button type="button" className="dp-icon" onClick={() => (aberto ? setAberto(false) : abrir())} disabled={disabled} tabIndex={-1} aria-label="Abrir calendário">
        <Calendar size={18} />
      </button>

      {aberto && createPortal(
        <div className="dp-popover" ref={popRef} style={{ top: pos.top, left: pos.left }} onMouseDown={manterFoco}>
          <div className="dp-header">
            <button type="button" className="dp-nav" onClick={() => mudarMes(-1)} aria-label="Mês anterior"><ChevronLeft size={18} /></button>
            <select className="dp-select mes" value={vista.getMonth()} onChange={(e) => setVista(new Date(vista.getFullYear(), Number(e.target.value), 1))}>
              {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select className="dp-select" value={vista.getFullYear()} onChange={(e) => setVista(new Date(Number(e.target.value), vista.getMonth(), 1))}>
              {!anos.includes(vista.getFullYear()) && <option value={vista.getFullYear()}>{vista.getFullYear()}</option>}
              {anos.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button type="button" className="dp-nav" onClick={() => mudarMes(1)} aria-label="Mês seguinte"><ChevronRight size={18} /></button>
          </div>

          <div className="dp-grid">
            {DIAS_SEMANA.map((d, i) => <span key={i} className="dp-weekday">{d}</span>)}
            {dias.map((d) => {
              const iso = toIso(d);
              const classes = ['dp-day'];
              if (d.getMonth() !== vista.getMonth()) classes.push('outside');
              if (iso === hojeIso) classes.push('today');
              if (iso === value?.slice(0, 10)) classes.push('selected');
              return (
                <button type="button" key={iso} className={classes.join(' ')} disabled={foraDoLimite(d)} onClick={() => escolher(d)}>
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="dp-footer">
            <button type="button" className="dp-link" onClick={() => { onChange(''); setAberto(false); }}>Limpar</button>
            {!foraDoLimite(parseIso(hojeIso)) && (
              <button type="button" className="dp-link" onClick={() => escolher(new Date())}>Hoje</button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Data + hora lado a lado. A hora escolhe-se numa lista de 15 em 15 minutos.
export function DateTimePicker({
  value,
  onChange,
  required = false,
  disabled = false,
  horaInicio = 7,
  horaFim = 21,
  passoMinutos = 15,
  ...resto
}) {
  const [data, hora] = (value || '').split('T');
  const horaAtual = (hora || '').slice(0, 5);

  const horas = [];
  for (let h = horaInicio; h <= horaFim; h += 1) {
    for (let m = 0; m < 60; m += passoMinutos) {
      if (h === horaFim && m > 0) break;
      horas.push(`${pad(h)}:${pad(m)}`);
    }
  }
  if (horaAtual && !horas.includes(horaAtual)) horas.push(horaAtual);
  horas.sort();

  const juntar = (novaData, novaHora) => {
    if (!novaData) return onChange('');
    onChange(`${novaData}T${novaHora || horaAtual || horas[0]}`);
  };

  return (
    <div className="dp-datetime">
      <DatePicker value={data || ''} onChange={(d) => juntar(d, horaAtual)} required={required} disabled={disabled} {...resto} />
      <select className="input dp-time" value={horaAtual} required={required} disabled={disabled} onChange={(e) => juntar(data || toIso(new Date()), e.target.value)}>
        <option value="" disabled>Hora</option>
        {horas.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  );
}