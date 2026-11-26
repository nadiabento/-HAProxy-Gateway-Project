import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import './Autocomplete.css';

// ---------------------------------------------------------------
// Campo de pesquisa com sugestões por baixo (ex.: escolher um paciente).
// Só aceita uma das opções da lista: se o texto não corresponder a uma
// opção escolhida, o formulário não deixa submeter.
//
// <Autocomplete
//   opcoes={[{ value: 1, label: 'João Manuel', detalhe: 'joao@prc.pt · 913447634' }]}
//   value={pacienteId}
//   onChange={(id) => ...}
// />
// ---------------------------------------------------------------

// Ignora acentos e maiúsculas na pesquisa ("joao" encontra "João")
const normalizar = (t) =>
  String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export default function Autocomplete({
  opcoes,
  value,
  onChange,
  id,
  placeholder = 'Escreva para pesquisar...',
  required = false,
  disabled = false,
  semResultados = 'Nenhum resultado encontrado.',
  mensagemInvalida = 'Escolha uma opção da lista.',
  maxResultados = 8,
}) {
  const selecionada = opcoes.find((o) => String(o.value) === String(value));
  const [texto, setTexto] = useState(selecionada ? selecionada.label : '');
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const campoRef = useRef(null);
  const inputRef = useRef(null);
  const listaRef = useRef(null);

  // Se o valor mudar por fora (ex.: limpar o formulário), atualiza o texto
  const [valorAnterior, setValorAnterior] = useState(value);
  if (String(value) !== String(valorAnterior)) {
    const anterior = opcoes.find((o) => String(o.value) === String(valorAnterior));
    setValorAnterior(value);
    if (selecionada) setTexto(selecionada.label);
    else if (anterior && texto === anterior.label) setTexto(''); // limpo por fora, não pelo utilizador
  }

  const termo = normalizar(texto);
  const filtradas = (termo && !(selecionada && texto === selecionada.label)
    ? opcoes.filter((o) => normalizar(`${o.label} ${o.detalhe || ''}`).includes(termo))
    : opcoes
  ).slice(0, maxResultados);

  // Validação nativa do formulário: só passa com uma opção escolhida
  useEffect(() => {
    if (!inputRef.current) return;
    const valido = !required && !texto ? true : !!selecionada && texto === selecionada.label;
    inputRef.current.setCustomValidity(valido ? '' : mensagemInvalida);
  }, [texto, selecionada, required, mensagemInvalida]);

  // Posiciona a lista por baixo do campo (fica por cima do modal)
  useLayoutEffect(() => {
    if (!aberto) return undefined;
    const posicionar = () => {
      const r = campoRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 6, left: r.left, width: r.width });
    };
    posicionar();
    window.addEventListener('resize', posicionar);
    window.addEventListener('scroll', posicionar, true);
    return () => {
      window.removeEventListener('resize', posicionar);
      window.removeEventListener('scroll', posicionar, true);
    };
  }, [aberto]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!aberto) return undefined;
    const clicarFora = (e) => {
      if (!campoRef.current?.contains(e.target) && !listaRef.current?.contains(e.target)) setAberto(false);
    };
    document.addEventListener('mousedown', clicarFora);
    return () => document.removeEventListener('mousedown', clicarFora);
  }, [aberto]);

  const escolher = (opcao) => {
    setTexto(opcao.label);
    onChange(opcao.value);
    setAberto(false);
  };

  const escrever = (e) => {
    setTexto(e.target.value);
    setAtivo(0);
    setAberto(true);
    if (value !== '' && value !== null && value !== undefined) onChange('');
  };

  const limpar = () => {
    setTexto('');
    onChange('');
    setAtivo(0);
    setAberto(true);
    inputRef.current?.focus();
  };

  const tecla = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAberto(true);
      setAtivo((a) => Math.min(a + 1, filtradas.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAtivo((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && aberto && filtradas[ativo]) {
      e.preventDefault(); // não submete o formulário, só escolhe
      escolher(filtradas[ativo]);
    } else if (e.key === 'Escape') {
      setAberto(false);
    }
  };

  // Ao sair do campo sem escolher, se o texto corresponder a uma só opção, escolhe-a
  const sair = () => {
    if (selecionada && texto === selecionada.label) return;
    const exatas = opcoes.filter((o) => normalizar(o.label) === termo);
    if (termo && exatas.length === 1) escolher(exatas[0]);
  };

  return (
    <div className="ac" ref={campoRef}>
      <Search size={18} className="ac-lupa" />
      <input
        ref={inputRef}
        id={id}
        className="input ac-input"
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={aberto}
        placeholder={placeholder}
        value={texto}
        onChange={escrever}
        onFocus={() => setAberto(true)}
        onClick={() => setAberto(true)}
        onKeyDown={tecla}
        onBlur={sair}
        required={required}
        disabled={disabled}
      />
      {texto && !disabled && (
        <button type="button" className="ac-limpar" onClick={limpar} tabIndex={-1} aria-label="Limpar">
          <X size={16} />
        </button>
      )}

      {aberto && !disabled && createPortal(
        <ul
          className="ac-lista"
          ref={listaRef}
          role="listbox"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {filtradas.length === 0 ? (
            <li className="ac-vazio">{semResultados}</li>
          ) : (
            filtradas.map((o, i) => (
              <li
                key={o.value}
                role="option"
                aria-selected={String(o.value) === String(value)}
                className={`ac-opcao${i === ativo ? ' ativo' : ''}${String(o.value) === String(value) ? ' escolhida' : ''}`}
                onMouseEnter={() => setAtivo(i)}
                onClick={() => escolher(o)}
              >
                <span className="ac-label">{o.label}</span>
                {o.detalhe && <span className="ac-detalhe">{o.detalhe}</span>}
              </li>
            ))
          )}
        </ul>,
        document.body
      )}
    </div>
  );
}