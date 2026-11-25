import { useState } from 'react';
import { useStore } from '../context/StoreContext';

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export function CategoryManager({ selected, onSelect }: Props) {
  const { categories, saveCategory, deleteCategory } = useStore();
  const [form, setForm] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState('');
  const current = categories.find(category => category.id === selected);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    try {
      const category = await saveCategory(form.id, form.name);
      onSelect(category.id);
      setForm(null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar a categoria.');
    }
  }

  async function remove() {
    if (!current || !confirm(`Excluir a categoria "${current.name}"?`)) return;
    try {
      await deleteCategory(current.id);
      onSelect('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir a categoria.');
    }
  }

  return (
    <section className="space-y-3 border-b border-gray-800 pb-4 text-sm text-white">
      <label className="block font-bold" htmlFor="admin-category">Categorias do cardápio</label>
      <div className="flex flex-wrap items-center gap-4">
        <select id="admin-category" className="rounded bg-gray-800 p-2" value={selected}
          onChange={event => { onSelect(event.target.value); setForm(null); setError(''); }}>
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => { setForm({ id: '', name: '' }); setError(''); }}>Nova categoria</button>
        {current && <>
          <button onClick={() => { setForm(current); setError(''); }}>Editar categoria</button>
          <button onClick={remove}>Excluir categoria</button>
        </>}
      </div>
      {form && <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
        <label>Nome da categoria <input required className="rounded bg-gray-800 p-2" value={form.name}
          onChange={event => setForm({ ...form, name: event.target.value })} /></label>
        <button type="submit">Salvar categoria</button>
        <button type="button" onClick={() => { setForm(null); setError(''); }}>Cancelar</button>
      </form>}
      {error && <p role="alert" className="text-red-300">{error}</p>}
    </section>
  );
}
