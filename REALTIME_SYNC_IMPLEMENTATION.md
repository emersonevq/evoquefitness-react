# Sincronização em Tempo Real de Permissões

## Problema Resolvido

Quando um administrador alterava as permissões de um usuário no painel admin, o usuário precisava fazer logout/login para ver as mudanças refletidas no frontend. Agora, as permissões são sincronizadas automaticamente em tempo real.

## Arquitetura da Solução

### Backend (Python/FastAPI)

**Arquivo: `backend/core/realtime.py`**

- Socket.IO é usado para comunicação em tempo real
- Quando um usuário faz login, ele entra em uma sala com ID `user:{user_id}`
- Quando permissões são alteradas via API PUT `/api/usuarios/{user_id}`, o backend emite um evento `auth:refresh` para essa sala
- Os eventos são enviados usando `sio.emit()` que é thread-safe

**Arquivo: `backend/ti/api/usuarios.py`**

- No endpoint `PUT /api/usuarios/{user_id}`, após atualizar o usuário:
  - Imediatamente emite `auth:refresh` via `emit_refresh_sync()`
  - Envia novamente com 200ms de delay para garantir que o cliente está pronto

```python
# Notify the specific user their permissions/profile changed
try:
    from core.realtime import emit_refresh_sync
    print(f"[API] Sending refresh event immediately...")
    emit_refresh_sync(updated.id)

    # Also send after a short delay to ensure client is ready
    def delayed_emit():
        time.sleep(0.2)
        emit_refresh_sync(updated.id)

    t = threading.Thread(target=delayed_emit, daemon=True)
    t.start()
except Exception as ex:
    print(f"[API] failed to emit auth:refresh: {ex}")
```

### Frontend (React/TypeScript)

**Arquivo: `frontend/src/hooks/useAuth.ts`**

- WebSocket é estabelecido automaticamente ao carregar a aplicação
- Quando o evento `auth:refresh` é recebido, a função `refresh()` é chamada
- `refresh()` faz uma chamada GET `/api/usuarios/{user_id}` para obter dados atualizados
- Se as permissões mudaram, os eventos `user:data-updated` são disparados
- Polling de fallback executa a cada 10 segundos como garantia

```typescript
// Socket.IO connection on auth:refresh event
socket.on("auth:refresh", (data: any) => {
  console.debug("[SIO] ✓ Received auth:refresh event from server", data);
  if (curr && curr.id && uid === curr.id) {
    window.dispatchEvent(new CustomEvent("auth:refresh"));
  }
});

// Polling fallback: periodically check for permission updates (every 10 seconds)
const setupPolling = () => {
  console.debug("[AUTH] Setting up polling fallback (10s interval)");
  pollInterval = setInterval(() => {
    if (mounted) {
      refresh().catch(() => {});
    }
  }, 10000);
};
```

**Arquivo: `frontend/src/components/layout/RequireLogin.tsx`**

- Quando o usuário está em uma página de setor (`/setor/:slug`), ativa polling agressivo a cada 5 segundos
- Isso garante que mudanças de permissão sejam refletidas imediatamente

```typescript
// Aggressive polling on sector pages to ensure permissions are up-to-date
let sectorPollInterval: ReturnType<typeof setInterval> | null = null;
if (shouldCheckNow() && !user?.nivel_acesso?.includes("Administrador")) {
  console.debug(
    "[REQUIRE_LOGIN] Setting up aggressive polling on sector page (5s)",
  );
  sectorPollInterval = setInterval(() => {
    if (mounted && !abort) {
      fetchRemote().catch(() => {});
    }
  }, 5000);
}
```

**Arquivo: `frontend/src/pages/Index.tsx` e `frontend/src/pages/Sector.tsx`**

- Escutam os eventos `auth:refresh` e `user:data-updated`
- Forçam re-render quando permissões mudam
- Mostram notificação visual ao usuário sobre atualização de permissões

## Fluxo Completo

1. **Administrador altera permissões** no painel admin e clica "Salvar"
2. **Frontend envia PUT** para `/api/usuarios/{user_id}` com novo array de setores
3. **Backend recebe** e atualiza o banco de dados
4. **Backend emite** `auth:refresh` para sala `user:{user_id}` via WebSocket
5. **Cliente recebe** o evento `auth:refresh`
6. **Cliente faz GET** para `/api/usuarios/{user_id}` para buscar dados atualizados
7. **Cliente detecta** que `setores` mudaram e dispara `user:data-updated`
8. **Componentes** que escutam `auth:refresh`/`user:data-updated` fazem re-render
9. **Acesso é verificado** e usuário é redirecionado se perdeu permissão
10. **Ou página é atualizada** se ganhou permissão

## Cenários Cobertos

### ✅ Permissão Adicionada

- Usuário abre painel admin e adiciona setor ao usuário
- Usuário vê setor aparecer na página inicial imediatamente
- Clica no setor e tem acesso instantaneamente

### ✅ Permissão Removida

- Usuário está em um setor quando admin remove sua permissão
- Após sincronização, é automaticamente redirecionado com "Acesso negado"
- Página inicial é atualizada e setor desaparece

### ✅ WebSocket Falha

- Se o WebSocket cair, o polling de 10 segundos mantém sincronização
- Se em página de setor, polling de 5 segundos garante sincronização rápida

### ✅ Múltiplos Setores

- Suporta múltiplos setores por usuário (array `setores`)
- Normalização de setores (remove acentos) garante matching correto
- Aliases de setor mapeados corretamente (TI, Compras, etc.)

## Melhorias Implementadas

1. **Thread-safe Socket.IO**: Corrigido uso de `asyncio.run()` que causava erro quando já havia event loop ativo. Agora usa `sio.emit()` direto.

2. **Múltiplos eventos de sincronização**: Enviados imediatamente e com 200ms de delay para garantir captura do cliente.

3. **Polling adaptativo**:
   - 10 segundos de fallback geral
   - 5 segundos em páginas de setor
   - Garante sincronização rápida sem sobrecarregar servidor

4. **Event handlers robustos**: Adicionados try-catch e logging em todos os handlers de eventos.

5. **Visual feedback**: Mostra notificação quando permissões são atualizadas (em `Layout.tsx` e `Index.tsx`).

## Dependências Adicionadas

Nenhuma dependência novo foi adicionada. A solução usa:

- **Backend**: `python-socketio` (já existente)
- **Frontend**: `socket.io-client` (já existente)

## Testes Recomendados

1. **Teste de adicionar permissão**:
   - Faça login com usuário
   - Como admin, adicione um setor ao usuário
   - Verifique que o setor aparece na página inicial do usuário
   - Clique no setor e verifique acesso imediato

2. **Teste de remover permissão**:
   - Usuário acessa um setor
   - Admin remove o setor
   - Verifique que usuário é redirecionado com "Acesso negado"

3. **Teste de WebSocket desconectado**:
   - Abra DevTools e desconecte WebSocket
   - Admin altera permissões
   - Aguarde 10 segundos
   - Verifique que sincronização aconteceu

## Logs de Debug

Ativar console do navegador para ver logs com prefixo:

- `[AUTH]` - Hooks de autenticação
- `[SIO]` - Socket.IO
- `[LAYOUT]` - Layout component
- `[INDEX]` - Index page
- `[SECTOR]` - Sector page
- `[REQUIRE_LOGIN]` - Permission checking component
