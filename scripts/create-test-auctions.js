#!/usr/bin/env node

/**
 * Script para criar 4 leilões de teste
 * Uso: node scripts/create-test-auctions.js
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Função para criar um leilão
async function createAuction(auctionData) {
  const url = `${API_BASE_URL}/api/v1/admin/auctions`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Nota: Em um ambiente real, você precisaria do token de admin
        // 'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`,
      },
      body: JSON.stringify(auctionData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`❌ Erro ao criar leilão "${auctionData.titulo}":`, error.message);
    throw error;
  }
}

// Função principal
async function createTestAuctions() {
  const now = new Date();
  
  const testAuctions = [
    {
      creator_id: 1,
      tipo_de_ensaio: "Fotografia",
      titulo: "Ensaio Artístico em Estúdio - Conceito Minimalista",
      descricao: "Ensaio fotográfico profissional em estúdio com conceito minimalista. Inclui 20 fotos editadas em alta resolução, 2 horas de sessão e direção artística especializada.",
      preco_inicial: 25000, // R$ 250,00 em centavos
      lance_minimo: 5000,   // R$ 50,00 em centavos
      duracao_do_leilao: 24, // 24 horas
      data_prevista: new Date(now.getTime() + 5 * 60 * 1000).toISOString(), // Inicia em 5 minutos
    },
    {
      creator_id: 2,
      tipo_de_ensaio: "Ensaio Externo",
      titulo: "Sessão Fotográfica Golden Hour - Parque da Cidade",
      descricao: "Ensaio ao ar livre durante o horário dourado. Locação no Parque da Cidade com cenários naturais. Inclui 30 fotos editadas, 3 horas de sessão e acessórios básicos.",
      preco_inicial: 35000, // R$ 350,00
      lance_minimo: 7500,   // R$ 75,00
      duracao_do_leilao: 36, // 36 horas
      data_prevista: new Date(now.getTime() + 8 * 60 * 1000).toISOString(), // Inicia em 8 minutos
    },
    {
      creator_id: 3,
      tipo_de_ensaio: "Ensaio Temático",
      titulo: "Ensaio Pin-up Vintage - Década de 50",
      descricao: "Ensaio temático inspirado na década de 50 com figurino pin-up. Inclui cenário vintage, maquiagem retrô, 25 fotos editadas e consultoria de estilo completa.",
      preco_inicial: 45000, // R$ 450,00
      lance_minimo: 10000,  // R$ 100,00
      duracao_do_leilao: 48, // 48 horas
      data_prevista: new Date(now.getTime() + 12 * 60 * 1000).toISOString(), // Inicia em 12 minutos
    },
    {
      creator_id: 4,
      tipo_de_ensaio: "Ensaio Profissional",
      titulo: "Book Profissional para Portfolio - Alta Costura",
      descricao: "Ensaio profissional para criação de portfolio. Foco em alta costura com múltiplos looks. Inclui 40 fotos editadas, 4 horas de sessão, styling e produção completa.",
      preco_inicial: 60000, // R$ 600,00
      lance_minimo: 15000,  // R$ 150,00
      duracao_do_leilao: 72, // 72 horas
      data_prevista: new Date(now.getTime() + 15 * 60 * 1000).toISOString(), // Inicia em 15 minutos
    }
  ];

  console.log('🎯 Iniciando criação de leilões de teste...');
  console.log(`📅 Data atual: ${now.toLocaleString('pt-BR')}`);
  console.log('🌐 API Base URL:', API_BASE_URL);
  console.log('');

  const createdAuctions = [];
  
  for (let i = 0; i < testAuctions.length; i++) {
    const auction = testAuctions[i];
    const startTime = new Date(auction.data_prevista);
    
    console.log(`\n📝 Criando leilão ${i + 1}/4:`);
    console.log(`   Título: ${auction.titulo}`);
    console.log(`   Preço inicial: R$ ${(auction.preco_inicial / 100).toFixed(2)}`);
    console.log(`   Lance mínimo: R$ ${(auction.lance_minimo / 100).toFixed(2)}`);
    console.log(`   Inicia em: ${startTime.toLocaleString('pt-BR')}`);
    console.log(`   Duração: ${auction.duracao_do_leilao} horas`);
    
    try {
      const result = await createAuction(auction);
      createdAuctions.push(result);
      console.log(`   ✅ Criado com sucesso! ID: ${result.auction?.id || 'N/A'}`);
    } catch (error) {
      console.log(`   ❌ Falha na criação: ${error.message}`);
    }
    
    // Pequena pausa entre as criações
    if (i < testAuctions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n📊 Resumo:');
  console.log(`   Total criados: ${createdAuctions.length}/${testAuctions.length}`);
  
  if (createdAuctions.length > 0) {
    console.log('\n🎉 Leilões criados com sucesso!');
    console.log('   Você pode visualizá-los na página de leilões do admin.');
  } else {
    console.log('\n⚠️ Nenhum leilão foi criado.');
    console.log('   Verifique se a API está rodando e se você tem as permissões necessárias.');
  }
}

// Executar o script
if (require.main === module) {
  createTestAuctions()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro fatal:', error.message);
      process.exit(1);
    });
}

module.exports = { createTestAuctions };