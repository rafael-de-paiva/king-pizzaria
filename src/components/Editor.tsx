import type { CategoryInfo, Product } from '../types';
export type EditorState =
  | { kind: 'category'; item?: CategoryInfo }
  | { kind: 'product'; item?: Product };

interface Props {
  editor: EditorState;
  categories: CategoryInfo[];
  categoryId: string;
  busy: boolean;
  onSave: (body: Record<string, unknown>) => void;
  onClose: () => void;
}

export default function Editor({ editor, categories, categoryId, busy, onSave, onClose }: Props) {
  const product = editor.kind === 'product' ? editor.item : undefined;
  const title = editor.kind === 'category'
    ? (editor.item ? 'Editar categoria' : 'Nova categoria')
    : (product ? 'Editar prato' : 'Novo prato');
  return <form className="sheet" onSubmit={event => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const body: Record<string, unknown> = { name: fields.get('name') };
    if (editor.kind === 'product') Object.assign(body, {
      description: fields.get('description'), category: fields.get('category'),
      price: Number(fields.get('price')), available: fields.has('available'),
    });
    onSave(body);
  }}>
    <h2>{title}</h2>
    <label>Nome<input autoFocus name="name" required defaultValue={editor.item?.name} /></label>
    {editor.kind === 'product' && <>
      <label>Categoria<select name="category" required defaultValue={product?.category || categoryId}>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select></label>
      <label>Preço (R$)<input name="price" type="number" required min="0.01" step="0.01" defaultValue={product?.price} /></label>
      <label>Descrição (opcional)<textarea name="description" defaultValue={product?.description} /></label>
      <label className="check"><input name="available" type="checkbox" defaultChecked={product?.available ?? true} /> Disponível</label>
    </>}
    <div className="actions"><button disabled={busy}>Salvar</button><button type="button" disabled={busy} onClick={onClose}>Cancelar</button></div>
  </form>;
}
