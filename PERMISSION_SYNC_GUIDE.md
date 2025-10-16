# Sincronização de Permissões em Tempo Real - Guia de Teste

## ✅ O que foi implementado

O sistema agora sincroniza as permissões de usuários em tempo real, sem necessidade de logout/login.

### Fluxo completo:

1. **Admin atualiza permissões** → `PUT /api/usuarios/{user_id}`
2. **Backend emite evento** → Socket.IO emite `auth:refresh`
3. **Frontend recebe evento** → Dispara refresh automático
4. **Frontend sincroniza** → Busca dados atualizados de `/api/usuarios/{user_id}`
5. **UI atualiza** → Novos setores aparecem imediatamente

---

## 🧪 Como testar

### Pré-requisitos

- Ter 2 abas do navegador abertas (Admin em uma, Usuário em outra)
- Estar logado como admin em uma aba
- Estar logado como usuário comum em outra aba

### Passo 1: Preparar as abas

```
ABA 1 (Admin):  http://localhost:3000/setor/ti/admin/usuarios
ABA 2 (Usuário): http://localhost:3000
```

### Passo 2: No painel de Admin (ABA 1)

1. Localize o usuário que deseja dar acesso a novos setores
2. Clique no botão "Editar" (ícone de lápis)
3. Na seção "Setores", adicione um novo setor (ex: "Compras")
4. Clique "Salvar"

### Passo 3: Na página do Usuário (ABA 2)

1. **Observe a notificação verde** que aparecerá:
   - ✓ "Suas permissões foram atualizadas!"
   - ✓ "Permissões sincronizadas"

2. **Verifique os setores atualizados**:
   - Os novos setores aparecem imediatamente no dropdown "Escolher Setor"
   - Os novos cartões de setor aparecem na grade "Nossos setores"
   - O setor que era "desabilitado" agora fica acessível

### Passo 4: Verificar os logs

Abra o console do navegador (F12) e procure por mensagens como:

```
[AUTH] Refreshing user data for id [número]
[AUTH] Updated user with setores: [lista de setores]
[SIO] auth:refresh for user [número] - refreshing permissions
[LAYOUT] Permission update detected
[REQUIRE_LOGIN] auth:refresh received, syncing permissions
```

---

## 🔄 Como funciona no Backend

### 1. API de Atualização de Usuário

- Endpoint: `PUT /api/usuarios/{user_id}`
- Função: `atualizar_usuario()` em `backend/ti/api/usuarios.py`
- O que faz:
  - Atualiza os dados do usuário no banco
  - **Emite evento Socket.IO** para o usuário
  - Log: `[API] Starting thread to emit auth:refresh for user_id={id}`

### 2. Socket.IO - Realtime

- Arquivo: `backend/core/realtime.py`
- Função: `emit_refresh_sync(user_id)`
- O que faz:
  - Envia evento `auth:refresh` para a sala do usuário
  - Log: `[SIO] emitting auth:refresh to room=user:{id}`

### 3. Frontend - Sincronização

- Arquivo: `frontend/src/hooks/useAuth.ts`
- Listeners de eventos:
  - Socket.IO: `socket.on("auth:refresh", ...)`
  - CustomEvent: `window.addEventListener("auth:refresh", ...)`
- O que faz:
  - Busca dados atualizados de `/api/usuarios/{id}`
  - Atualiza o contexto de autenticação
  - Dispara re-render em todas as páginas

---

## 📱 Atualizações no Frontend

### Index.tsx

- Mostra notificação verde quando permissões são atualizadas
- Re-renderiza automaticamente para mostrar novos setores

### Layout.tsx

- Mostra notificação no canto superior direito
- Atualiza a lista de setores disponíveis no menu

### RequireLogin.tsx

- Sincroniza permissões quando o usuário navega para um setor
- Verifica acesso em tempo real

### Sector.tsx

- Re-renderiza quando permissões mudam
- Verifica acesso atualizado

---

## 🐛 Se não funcionar

### Verificar Socket.IO

1. Abra o console do navegador (F12)
2. Verifique se há logs como:

   ```
   [SIO] connect: [ID]
   [SIO] identify emitted for user [ID]
   ```

3. Se não houver logs de conexão, verifique:
   - Backend está rodando: `npm run dev`
   - Socket.IO está no `/socket.io`
   - Sem erros de CORS

### Verificar Permissões

1. Verifique se o usuário realmente foi atualizado no banco
2. Acesse a API diretamente:
   ```
   GET /api/usuarios/{id}
   ```
   Verifique se retorna o campo `setores` atualizado

### Debug

Ative logs mais verbosos observando:

```
Backend: [API] [SIO] logs
Frontend: [AUTH] [LAYOUT] [REQUIRE_LOGIN] logs
```

---

## ✨ Melhorias Implementadas

1. **Socket.IO integrado** - Conexão em tempo real com o servidor
2. **Event-driven sync** - Permissões sincronizam imediatamente via eventos
3. **Visual feedback** - Notificações ao usuário indicam atualização
4. **Múltiplas abas** - Sincronização funciona em qualquer aberta
5. **Sem cache** - Sempre busca dados frescos do servidor
6. **Tratamento de erros** - Logs detalhados para debugging

---

## 📊 Fluxo visual

```
┌──────────────────────────────────��──────────────────────┐
│ ADMIN: Atualiza permissões do usuário                   │
│ PUT /api/usuarios/5 { setores: ["TI", "Compras"] }     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Backend verifica que user  │
        │ foi alterado e emite       │
        │ Socket.IO event            │
        └────────────┬───────────────┘
                     │
                     ▼ Socket.IO 🔄
        ┌────────────────────────────┐
        │ FRONTEND recebe evento     │
        │ auth:refresh for user 5    │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Frontend busca dados novos │
        │ GET /api/usuarios/5        │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Atualiza contexto auth     │
        │ e re-renderiza páginas     │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ USUÁRIO vê novos setores   │
        │ ✓ Notificação exibida      │
        │ ✓ Dropdown atualizado      │
        │ ✓ Cards atualizados        │
        └────────────────────────────┘
```
