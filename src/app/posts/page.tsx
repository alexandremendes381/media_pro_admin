'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/lib/api';
import SimpleImage from '@/components/SimpleImage';

interface Post {
  id: number;
  titulo: string;
  categoria: string;
  texto?: string;
  creator_id: number;
  creator_name: string;
  creator_email: string;
  created_at: string;
  updated_at: string;
  imagens?: Array<{
    id: number;
    imagem_base64: string;
    posicao: number;
  }>;
}

interface PostsStats {
  total_posts: number;
  posts_hoje: number;
  total_creators_com_posts: number;
  categorias_populares: Array<{ categoria: string; count: number }>;
}

export default function PostsManagement() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchCreatorId, setSearchCreatorId] = useState<string>('');
  const [searchCategoria, setSearchCategoria] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const queryClient = useQueryClient();
  const postsPerPage = 20;

  // Query para estatísticas dos posts
  const { data: stats } = useQuery<PostsStats>({
    queryKey: ['posts-stats'],
    queryFn: api.posts.getPostsStats,
  });

  // Query para listar posts com filtros
  const { 
    data: postsData, 
    isLoading: loadingPosts, 
    error: postsError 
  } = useQuery({
    queryKey: ['posts', searchCreatorId, searchCategoria, currentPage],
    queryFn: () => api.posts.getAllPosts({
      creator_id: searchCreatorId ? parseInt(searchCreatorId) : undefined,
      categoria: searchCategoria || undefined,
      skip: currentPage * postsPerPage,
      limit: postsPerPage,
    }),
  });

  // Query para obter detalhes de um post específico
  const { data: postDetails } = useQuery({
    queryKey: ['post-details', selectedPost?.id],
    queryFn: () => selectedPost ? api.posts.getPost(selectedPost.id) : null,
    enabled: !!selectedPost,
  });

  // Mutation para deletar post
  const deletePostMutation = useMutation({
    mutationFn: (postId: number) => api.posts.deletePost(postId),
    onSuccess: (data) => {
      setMessage({ 
        type: 'success', 
        text: `Post "${data.titulo}" deletado com sucesso! ${data.images_deletadas} imagens foram removidas.` 
      });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts-stats'] });
      setSelectedPost(null);
    },
    onError: (error) => {
      setMessage({ 
        type: 'error', 
        text: `Erro ao deletar post: ${error.message}` 
      });
    },
  });

  // Mutation para deletar imagem específica
  const deleteImageMutation = useMutation({
    mutationFn: ({ postId, imageId }: { postId: number; imageId: number }) => 
      api.posts.deletePostImage(postId, imageId),
    onSuccess: (data) => {
      setMessage({ 
        type: 'success', 
        text: `Imagem deletada! Restam ${data.images_restantes} imagens no post.` 
      });
      queryClient.invalidateQueries({ queryKey: ['post-details', data.post_id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      setMessage({ 
        type: 'error', 
        text: `Erro ao deletar imagem: ${error.message}` 
      });
    },
  });

  const handleSearch = () => {
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setSearchCreatorId('');
    setSearchCategoria('');
    setCurrentPage(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const totalPages = Math.ceil((postsData?.total || 0) / postsPerPage);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Posts dos Creators</h1>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_posts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Posts Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.posts_hoje}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Creators Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.total_creators_com_posts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Categorias Populares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {stats.categorias_populares.slice(0, 3).map((cat, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="truncate">{cat.categoria}</span>
                    <span className="font-semibold">{cat.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="creatorId">ID do Creator</Label>
              <Input
                id="creatorId"
                type="number"
                placeholder="Digite o ID do creator..."
                value={searchCreatorId}
                onChange={(e) => setSearchCreatorId(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                placeholder="Digite a categoria..."
                value={searchCategoria}
                onChange={(e) => setSearchCategoria(e.target.value)}
              />
            </div>
            
            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="flex-1">
                Buscar
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Posts */}
      <Card>
        <CardHeader>
          <CardTitle>
            Posts ({postsData?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPosts && (
            <div className="text-center py-4">Carregando posts...</div>
          )}
          
          {postsError && (
            <Alert className="border-red-500 bg-red-50">
              <AlertDescription className="text-red-700">
                Erro ao carregar posts: {postsError.message}
              </AlertDescription>
            </Alert>
          )}
          
          {postsData?.posts && postsData.posts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum post encontrado com os filtros aplicados.
            </div>
          )}
          
          <div className="space-y-4">
            {postsData?.posts?.map((post: Post) => (
              <Card key={post.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{post.titulo}</h3>
                        <Badge variant="secondary">{post.categoria}</Badge>
                        {post.imagens && post.imagens.length > 0 && (
                          <Badge variant="outline">{post.imagens.length} imagens</Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Creator:</strong> {post.creator_name} (ID: {post.creator_id})</p>
                        <p><strong>Email:</strong> {post.creator_email}</p>
                        <p><strong>Criado em:</strong> {formatDate(post.created_at)}</p>
                        {post.texto && (
                          <p><strong>Texto:</strong> {post.texto.substring(0, 100)}{post.texto.length > 100 ? '...' : ''}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => setSelectedPost(post)}
                        variant="outline"
                      >
                        Ver Detalhes
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => deletePostMutation.mutate(post.id)}
                        variant="destructive"
                        disabled={deletePostMutation.isPending}
                      >
                        {deletePostMutation.isPending ? 'Deletando...' : 'Deletar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                variant="outline"
                size="sm"
              >
                Anterior
              </Button>
              
              <span className="px-4 py-2 text-sm">
                Página {currentPage + 1} de {totalPages}
              </span>
              
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                variant="outline"
                size="sm"
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Post */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto w-full">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Detalhes do Post: {selectedPost.titulo}</CardTitle>
                <Button
                  onClick={() => setSelectedPost(null)}
                  variant="outline"
                  size="sm"
                >
                  Fechar
                </Button>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>Categoria:</strong> {selectedPost.categoria}
                  </div>
                  <div>
                    <strong>Creator:</strong> {selectedPost.creator_name} (ID: {selectedPost.creator_id})
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedPost.creator_email}
                  </div>
                  <div>
                    <strong>Criado em:</strong> {formatDate(selectedPost.created_at)}
                  </div>
                </div>
                
                {selectedPost.texto && (
                  <div>
                    <strong>Texto:</strong>
                    <p className="mt-1 p-3 bg-gray-50 rounded">{selectedPost.texto}</p>
                  </div>
                )}
                
                {/* Imagens do Post */}
                {postDetails?.imagens && postDetails.imagens.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Imagens ({postDetails.imagens.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {postDetails.imagens
                        .sort((a: any, b: any) => a.posicao - b.posicao)
                        .map((imagem: any) => (
                        <div key={imagem.id} className="relative">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <SimpleImage
                              base64Data={imagem.imagem_base64}
                              alt={`Imagem ${imagem.posicao}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-600">Posição: {imagem.posicao}</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteImageMutation.mutate({
                                postId: selectedPost.id,
                                imageId: imagem.id
                              })}
                              disabled={deleteImageMutation.isPending}
                            >
                              {deleteImageMutation.isPending ? 'Deletando...' : 'Deletar'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {(!postDetails?.imagens || postDetails.imagens.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    Este post não possui imagens.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}