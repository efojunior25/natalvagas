# File: categories.ts
- **Original Path:** `frontend/functions/api/categories.ts`
- **Language / Type:** `typescript`
- **Lines of Code:** 21

---

```typescript
export const onRequestGet: PagesFunction = async () => {
  const categories = [
    { id: 1, name: 'Administrativo & Financeiro', slug: 'administrativo' },
    { id: 2, name: 'Atendimento & Vendas', slug: 'vendas' },
    { id: 3, name: 'Saúde, Clínica & Farmácia', slug: 'saude' },
    { id: 4, name: 'Tecnologia, TI & Design', slug: 'tecnologia' },
    { id: 5, name: 'Logística, Estoque & Operacional', slug: 'logistica' },
    { id: 6, name: 'Educação & Estágio', slug: 'estagios' },
    { id: 7, name: 'Gastronomia, Bares & Restaurantes', slug: 'gastronomia' },
    { id: 8, name: 'Construção Civil & Manutenção', slug: 'construcao' },
    { id: 9, name: 'Serviços Gerais & Segurança', slug: 'servicos-gerais' },
    { id: 10, name: 'Outros Setores', slug: 'outros' }
  ];

  return new Response(JSON.stringify(categories), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400'
    }
  });
};

```
