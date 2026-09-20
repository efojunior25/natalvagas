interface Env {
  DB?: any;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json().catch(() => null) as any;

    if (!body || !body.title || !body.companyName || !body.description || !body.applicationTarget) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Preencha todos os campos obrigatórios da vaga.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const rawTarget = String(body.applicationTarget || '').trim();
    const lowerTarget = rawTarget.toLowerCase();
    const isSafeTarget = lowerTarget.startsWith('http://') || lowerTarget.startsWith('https://')
      || lowerTarget.startsWith('mailto:') || lowerTarget.startsWith('tel:')
      || lowerTarget.startsWith('wa.me/') || lowerTarget.startsWith('api.whatsapp.com/')
      || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawTarget)
      || /^\+?[0-9\s()\-./]{8,25}$/.test(rawTarget);

    if (!isSafeTarget || lowerTarget.startsWith('javascript:') || lowerTarget.startsWith('data:')) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Canal de candidatura inválido. Insira um link HTTPS, e-mail ou WhatsApp válido.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanTitle = String(body.title).trim();
    const cleanCompany = String(body.companyName).trim();
    const baseSlug = `${cleanTitle}-${cleanCompany}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Se o banco D1 estiver vinculado, pode registrar no histórico de vagas submetidas
    if (context.env.DB) {
      try {
        await context.env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS submitted_jobs (
            id TEXT PRIMARY KEY,
            slug TEXT UNIQUE,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            data TEXT NOT NULL,
            is_featured INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
          )
        `).run();

        await context.env.DB.prepare(`
          INSERT INTO submitted_jobs (id, slug, title, company, data, is_featured, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          `job_${Date.now()}`,
          slug,
          cleanTitle,
          cleanCompany,
          JSON.stringify(body),
          body.isFeatured ? 1 : 0,
          new Date().toISOString()
        ).run();
      } catch (dbErr) {
        console.warn('Registro no D1 falhou, prosseguindo com sucesso:', dbErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      slug,
      message: 'Vaga cadastrada com sucesso! Ela passará pela curadoria e estará no mural.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Erro interno ao processar a vaga.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
