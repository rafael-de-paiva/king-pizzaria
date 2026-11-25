import { useEffect, useState } from 'react';
import { api } from './services/api';
import Editor, { type EditorState } from './components/Editor';
import type { CategoryInfo, Product } from './types';

type Catalog = { categories: CategoryInfo[]; products: Product[] };
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function App() {
  const [catalog, setCatalog] = useState<Catalog>({ categories: [], products: [] });
  const [loading, setLoading] = useState(true);
  const [selected, select] = useState('');
  const [token, setToken] = useState('');
  const [auth, setAuth] = useState<'login' | 'setup' | null>(null);
  const [editor, edit] = useState<EditorState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const category = catalog.categories.find(c => c.id === selected) || catalog.categories[0];
  const dishes = catalog.products.filter(p => p.category === category?.id);

  async function refresh() { setCatalog(await api<Catalog>('store')); }
  async function perform(action: () => Promise<void>) {
    setError('');
    setBusy(true);
    try { await action(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Falha ao acessar o cardápio.'); }
    finally { setBusy(false); }
  }
  useEffect(() => { void perform(refresh).finally(() => setLoading(false)); }, []);

  function save(body: Record<string, unknown>) {
    if (!editor) return;
    const path = editor.kind === 'category' ? 'categories' : 'products';
    const id = editor.item?.id;
    void perform(async () => {
      const result = await api<{ category?: CategoryInfo; product?: Product }>(
        'admin/' + path + (id ? '/' + encodeURIComponent(id) : ''), id ? 'PUT' : 'POST', body, token);
      edit(null);
      select(result.category?.id || result.product!.category);
      await refresh();
    });
  }
  function remove(path: string, item: CategoryInfo | Product) {
    if (!window.confirm('Excluir “' + item.name + '”?')) return;
    void perform(async () => {
      await api('admin/' + path + '/' + encodeURIComponent(item.id), 'DELETE', undefined, token);
      await refresh();
    });
  }
  function openEditor(next: EditorState) { setError(''); edit(next); }

  return <>
    <header><div className="wrap mast"><span className="brand">King Pizzaria</span>
      <button disabled={busy} onClick={() => void perform(async () => {
        if (token) {
          await api('admin/logout', 'POST', undefined, token);
          setToken(''); edit(null);
        } else {
          const status = await api<{ requiresSetup: boolean }>('admin/auth-status');
          setAuth(status.requiresSetup ? 'setup' : 'login');
        }
      })}>{token ? 'Sair da administração' : 'Administrar'}</button>
    </div></header>
    <main className="wrap"><h1>{token ? 'Administrar cardápio' : 'Cardápio'}</h1>
      {error && <p role="alert">{error}</p>}
      {auth ? <form className="sheet" onSubmit={event => {
        event.preventDefault();
        const password = new FormData(event.currentTarget).get('password');
        void perform(async () => {
          const result = await api<{ token: string }>('admin/' + auth, 'POST', { password });
          setToken(result.token); setAuth(null);
        });
      }}>
        <h2>{auth === 'setup' ? 'Criar senha de administrador' : 'Acesso administrativo'}</h2>
        <label>Senha<input name="password" type="password" autoFocus required minLength={auth === 'setup' ? 4 : 1} /></label>
        <div className="actions"><button disabled={busy}>{auth === 'setup' ? 'Criar senha' : 'Entrar'}</button>
          <button type="button" onClick={() => { setAuth(null); setError(''); }}>Cancelar</button></div>
      </form> : editor ? <Editor editor={editor} categories={catalog.categories} categoryId={category?.id || ''}
        busy={busy} onSave={save} onClose={() => { edit(null); setError(''); }} />
      : loading ? <p>Carregando cardápio…</p> : <>
        <div className="bar"><h2>Categorias</h2>{token && <button disabled={busy} onClick={() => openEditor({ kind: 'category' })}>Nova categoria</button>}</div>
        <nav aria-label="Categorias">{catalog.categories.map(c => <button key={c.id} aria-pressed={c.id === category?.id}
          onClick={() => { select(c.id); setError(''); }}>{c.name}</button>)}</nav>
        {category ? <section>
          <div className="bar"><h2>{category.name}</h2>{token && <div className="actions">
            <button disabled={busy} onClick={() => openEditor({ kind: 'product' })}>Novo prato</button>
            <button disabled={busy} onClick={() => openEditor({ kind: 'category', item: category })}>Editar categoria</button>
            <button disabled={busy} onClick={() => remove('categories', category)}>Excluir categoria</button>
          </div>}</div>
          {dishes.map(p => <article key={p.id}><div className="bar"><h3>{p.name}</h3><strong>{money.format(p.price)}</strong></div>
            {p.description && <p>{p.description}</p>}{!p.available && <p><b>Indisponível</b></p>}
            {token && <div className="actions"><button disabled={busy} onClick={() => openEditor({ kind: 'product', item: p })}>Editar prato</button>
              <button disabled={busy} onClick={() => remove('products', p)}>Excluir prato</button></div>}
          </article>)}
          {!dishes.length && <p>Nenhum prato cadastrado nesta categoria.</p>}
        </section> : <p>Nenhuma categoria cadastrada.</p>}
      </>}
    </main>
  </>;
}
