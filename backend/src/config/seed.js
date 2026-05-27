require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);

async function seed() {
  const client = await pool.connect();
  try {
    // Verifica se já foi populado
    const check = await client.query('SELECT COUNT(*) FROM partidos');
    if (parseInt(check.rows[0].count) > 0) {
      console.log('ℹ️  Banco já populado, seed ignorado.');
      return;
    }

    console.log('🌱 Populando banco de dados...');
    await client.query('BEGIN');

    // Partidos
    await client.query(`
      INSERT INTO partidos (sigla, nome) VALUES
        ('PT','Partido dos Trabalhadores'),
        ('MDB','Movimento Democrático Brasileiro'),
        ('PSD','Partido Social Democrático'),
        ('PP','Progressistas'),
        ('Republicanos','Republicanos'),
        ('PDT','Partido Democrático Trabalhista'),
        ('PSB','Partido Socialista Brasileiro'),
        ('PSDB','Partido da Social Democracia Brasileira'),
        ('UNIÃO','União Brasil'),
        ('PL','Partido Liberal')
      ON CONFLICT (sigla) DO NOTHING
    `);

    // Tipos de matéria
    await client.query(`
      INSERT INTO tipos_materia (nome, sigla) VALUES
        ('Projeto de Lei','PL'),
        ('Requerimento','REQ'),
        ('Indicação','IND'),
        ('Moção','MOÇ'),
        ('Resolução','RES'),
        ('Decreto Legislativo','DL'),
        ('Emenda à Lei Orgânica','ELO')
      ON CONFLICT DO NOTHING
    `);

    // Legislatura
    const legRes = await client.query(`
      INSERT INTO legislaturas (numero, ano_inicio, ano_fim, ativa)
      VALUES (1, 2021, 2024, false),
             (2, 2025, 2028, true)
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    const legId = legRes.rows[0]?.id || 2;

    // Hash de senha padrão
    const senhaHash = await bcrypt.hash('Admin@123', 12);

    // Usuários
    await client.query(`
      INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES
        ('Presidente da Câmara','presidente@camara.gov.br','${senhaHash}','presidente'),
        ('Secretaria Geral','secretaria@camara.gov.br','${senhaHash}','secretario'),
        ('Vereador Teste','vereador@camara.gov.br','${senhaHash}','vereador'),
        ('Aline Souza','aline@camara.gov.br','${senhaHash}','vereador'),
        ('Carlos Mota','carlos@camara.gov.br','${senhaHash}','presidente'),
        ('Deise Lima','deise@camara.gov.br','${senhaHash}','vereador'),
        ('Eduardo Neves','eduardo@camara.gov.br','${senhaHash}','vereador'),
        ('Fábio Reis','fabio@camara.gov.br','${senhaHash}','vereador'),
        ('Graça Torres','graca@camara.gov.br','${senhaHash}','vereador'),
        ('Hugo Castro','hugo@camara.gov.br','${senhaHash}','vereador'),
        ('Isa Correia','isa@camara.gov.br','${senhaHash}','vereador'),
        ('Júlio Moraes','julio@camara.gov.br','${senhaHash}','vereador'),
        ('Kátia Pinto','katia@camara.gov.br','${senhaHash}','vereador')
      ON CONFLICT (email) DO NOTHING
    `);

    // Busca IDs de usuários e partidos
    const usuarios = await client.query('SELECT id, email FROM usuarios');
    const partidos = await client.query('SELECT id, sigla FROM partidos');
    const uMap = {};
    const pMap = {};
    usuarios.rows.forEach(u => { uMap[u.email] = u.id; });
    partidos.rows.forEach(p => { pMap[p.sigla] = p.id; });

    const vereadores = [
      { nome:'Aline Souza', partido:'PT', cargo:'Vereadora', email:'aline@camara.gov.br' },
      { nome:'Carlos Mota', partido:'MDB', cargo:'Presidente', email:'carlos@camara.gov.br' },
      { nome:'Deise Lima', partido:'PSD', cargo:'1ª Vice-Presidente', email:'deise@camara.gov.br' },
      { nome:'Eduardo Neves', partido:'PP', cargo:'Vereador', email:'eduardo@camara.gov.br' },
      { nome:'Fábio Reis', partido:'Republicanos', cargo:'Vereador', email:'fabio@camara.gov.br' },
      { nome:'Graça Torres', partido:'PDT', cargo:'Vereadora', email:'graca@camara.gov.br' },
      { nome:'Hugo Castro', partido:'PSB', cargo:'Vereador', email:'hugo@camara.gov.br' },
      { nome:'Isa Correia', partido:'PSDB', cargo:'Vereadora', email:'isa@camara.gov.br' },
      { nome:'Júlio Moraes', partido:'UNIÃO', cargo:'Vereador', email:'julio@camara.gov.br' },
      { nome:'Kátia Pinto', partido:'PT', cargo:'Vereadora', email:'katia@camara.gov.br' },
      { nome:'Lúcio Braga', partido:'MDB', cargo:'Vereador', email:'secretaria@camara.gov.br' },
      { nome:'Marina Luz', partido:'PSD', cargo:'Vereadora', email:'vereador@camara.gov.br' },
      { nome:'Nilton Paz', partido:'PL', cargo:'Vereador', email:'presidente@camara.gov.br' },
    ];

    for (const v of vereadores) {
      await client.query(`
        INSERT INTO vereadores (usuario_id, nome, partido_id, cargo, email)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING`,
        [uMap[v.email] || null, v.nome, pMap[v.partido] || null, v.cargo, v.email]
      );
    }

    // Sessão atual
    const verRes = await client.query('SELECT id FROM vereadores WHERE cargo = \'Presidente\' LIMIT 1');
    const presidenteId = verRes.rows[0]?.id || 1;

    const sessaoRes = await client.query(`
      INSERT INTO sessoes (legislatura_id, numero, tipo, data_sessao, hora_inicio, status, presidente_id, quorum_minimo)
      VALUES ($1, 9, 'ordinaria', CURRENT_DATE, '09:00', 'agendada', $2, 7)
      RETURNING id`,
      [legId, presidenteId]
    );
    const sessaoId = sessaoRes.rows[0].id;

    // Pauta inicial
    const tipoRes = await client.query('SELECT id, sigla FROM tipos_materia');
    const tMap = {};
    tipoRes.rows.forEach(t => { tMap[t.sigla] = t.id; });

    await client.query(`
      INSERT INTO materias (sessao_id, tipo_id, numero, ementa, autor, ordem) VALUES
        ($1, $2, 'PL 010/2025', 'Institui o Fundo Municipal de Habitação Popular de Serrinha', 'Aline Souza', 1),
        ($1, $3, 'REQ 042/2025', 'Requer informações sobre obras na Av. Central', 'Carlos Mota', 2),
        ($1, $4, 'IND 015/2025', 'Indica instalação de lombada eletrônica na Rua das Flores', 'Deise Lima', 3),
        ($1, $2, 'PL 012/2025', 'Cria o Programa Municipal de Incentivo ao Esporte', 'Eduardo Neves', 4)`,
      [sessaoId, tMap['PL'], tMap['REQ'], tMap['IND']]
    );

    // Presença inicial (todos presentes)
    const verTodos = await client.query('SELECT id FROM vereadores');
    for (const v of verTodos.rows) {
      await client.query(`
        INSERT INTO presencas (sessao_id, vereador_id, presente)
        VALUES ($1, $2, true) ON CONFLICT DO NOTHING`,
        [sessaoId, v.id]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Seed concluído!');
    console.log('');
    console.log('👤 Usuários criados:');
    console.log('   presidente@camara.gov.br  |  Admin@123  |  Presidente');
    console.log('   secretaria@camara.gov.br  |  Admin@123  |  Secretaria');
    console.log('   vereador@camara.gov.br    |  Admin@123  |  Vereador');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro no seed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
