// Teste rápido das APIs de leilões expirados
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

console.log('🧪 Testando APIs de leilões...');
console.log('🌐 API Base URL:', API_BASE_URL);

async function testExpiredAuctions() {
  try {
    console.log('\n📋 1. Testando listagem de leilões expirados...');
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/auctions/expired`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Nota: Em produção, seria necessário o token de autenticação
        // 'Authorization': `Bearer ${token}`
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log(`❌ Erro HTTP ${response.status}:`, data);
      return;
    }

    console.log('✅ API de leilões expirados respondeu com sucesso:');
    console.log('📊 Total de leilões expirados:', data.total_expired_auctions || 0);
    console.log('📈 Resumo:', data.summary);
    
    if (data.auctions && data.auctions.length > 0) {
      console.log('\n📝 Leilões encontrados:');
      data.auctions.forEach((auction, index) => {
        console.log(`${index + 1}. ${auction.titulo}`);
        console.log(`   ID: ${auction.auction_id}`);
        console.log(`   Status: ${auction.status}`);
        console.log(`   Tem vencedor: ${auction.has_winner ? 'Sim' : 'Não'}`);
        console.log(`   Total de lances: ${auction.financial?.total_bids || 0}`);
        console.log(`   Pode finalizar: ${auction.can_be_finalized ? 'Sim' : 'Não'}`);
        console.log('');
      });
    } else {
      console.log('📭 Nenhum leilão expirado encontrado.');
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar API:', error.message);
    console.log('ℹ️ Isso pode acontecer se a API backend não estiver rodando.');
    console.log('ℹ️ Para testes completos, inicie o servidor backend em http://localhost:8000');
  }
}

async function testAuctionsList() {
  try {
    console.log('\n📋 2. Testando listagem geral de leilões...');
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/auctions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log(`❌ Erro HTTP ${response.status}:`, data);
      return;
    }

    console.log('✅ API de leilões gerais respondeu com sucesso:');
    console.log('📊 Total de leilões:', Array.isArray(data) ? data.length : 0);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('\n📝 Leilões encontrados:');
      data.slice(0, 3).forEach((auction, index) => {
        console.log(`${index + 1}. ${auction.titulo || auction.title || 'Sem título'}`);
        console.log(`   ID: ${auction.id}`);
        console.log(`   Status: ${auction.status}`);
        console.log('');
      });
      
      if (data.length > 3) {
        console.log(`   ... e mais ${data.length - 3} leilões.`);
      }
    } else {
      console.log('📭 Nenhum leilão encontrado.');
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar API geral:', error.message);
  }
}

// Executar testes
console.log('🚀 Iniciando testes das APIs...\n');
testExpiredAuctions()
  .then(() => testAuctionsList())
  .then(() => {
    console.log('\n✅ Testes concluídos!');
    console.log('ℹ️ Para usar as funcionalidades completas:');
    console.log('  1. Certifique-se de que o backend está rodando');
    console.log('  2. Faça login como admin');
    console.log('  3. Use a interface web em http://localhost:3000/transferir-mediacoins');
    console.log('  4. Para criar leilões use: http://localhost:3000/criar-leiloes');
  });