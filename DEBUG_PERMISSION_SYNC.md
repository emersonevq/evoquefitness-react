# 🔧 Debugando Sincronização de Permissões

Se as permissões não estão sincronizando em tempo real, siga este guia para identificar o problema.

## 1️⃣ Verificar se Socket.IO está conectado

Abra o **Console do navegador** (F12 → Console) e execute:

```javascript
__PERM_DEBUG__.printStatus();
```

Você deverá ver algo como:

```
=== PERMISSION SYNC STATUS ===
Socket.IO: 🟢 Connected
Recent events:
  🔌 14:32:15: Socket.IO connected
```

**Se disser "🔴 Disconnected":**

- Socket.IO não está conectando
- Vá para a seção "Socket.IO não conecta" abaixo

---

## 2️⃣ Teste manual de sincronização

### No painel de Admin:

1. Abra DevTools (F12)
2. Vá para a aba "Network"
3. Edite um usuário e adicione um novo setor
4. Clique "Salvar"

**Procure por:**

- Um request `PUT /api/usuarios/{id}` → status 200 ✓
- Um request `POST /api/usuarios/{id}/test-refresh` (opcional para teste)

### No console do usuário:

1. Abra o Console (F12)
2. Procure por mensagens como:
   ```
   [AUTH] ⟳ Refreshing user data for id 5
   [AUTH] ✓ Updated user with setores: ["TI", "Compras"]
   ```

**Se NÃO aparecer nada:**

- O evento `auth:refresh` não foi recebido
- Vá para "Evento não está sendo recebido" abaixo

---

## 3️⃣ Teste direto do Socket.IO

No **Console do navegador**, execute:

```javascript
// Verificar se socket existe
window.__APP_SOCK__;

// Deve retorgar algo como:
// Socket {id: 'UlQmjKs...', io: Manager, ...}

// Se retornar undefined, socket não foi inicializado
```

---

## 4️⃣ Forçar teste de sincronização

Você pode forçar um teste de sincronização sem precisar editar um usuário:

### Passo 1: Identifique seu user_id

No console, execute:

```javascript
JSON.parse(
  localStorage.getItem("evoque-fitness-auth") ||
    sessionStorage.getItem("evoque-fitness-auth"),
).id;
// Deve retornar algo como: 5
```

### Passo 2: Chame o endpoint de teste

```javascript
fetch("/api/usuarios/5/test-refresh", { method: "POST" })
  .then((r) => r.json())
  .then((d) => console.log("Teste enviado:", d));
```

### Passo 3: Verifique o console

Você deve ver mensagens como:

```
[AUTH] ⟳ Refreshing user data for id 5
[AUTH] ✓ Updated user with setores: [...]
```

---

## 🔍 Possíveis Problemas e Soluções

### ❌ Socket.IO não conecta

**Sintomas:**

- Console mostra: `🔴 Disconnected`
- Backend não mostra: `[SIO] ✓ Socket connected`

**Soluções:**

1. Verifique se o backend está rodando:

   ```bash
   npm run dev  # na raiz do projeto
   ```

2. Verifique a porta:
   - Frontend tenta conectar a `window.location.origin + "/socket.io"`
   - Se está em `localhost:3000`, deve tentar `localhost:3000/socket.io`
   - Se o backend está em outra porta (8000), precisa de proxy

3. Procure por erros de CORS:
   - Abra DevTools → Network → WS (WebSocket)
   - Procure por requests a `/socket.io`
   - Se houver erro, pode ser CORS

4. Verifique se python-socketio está instalado no backend:
   ```bash
   cd backend && pip list | grep socketio
   # Deve mostrar: python-socketio==5.11.4
   ```

---

### ❌ Evento não está sendo recebido

**Sintomas:**

- Socket.IO conecta (🟢)
- Mas console não mostra `[AUTH] Refreshing...` após editar usuário

**Debug:**

1. No backend, procure por logs como:

   ```
   [API] atualizar_usuario called for user_id=5
   [API] Starting thread to emit auth:refresh for user_id=5
   [SIO] emitting auth:refresh to room=user:5
   ```

2. Se não aparecer, é possível que:
   - A atualização falhou silenciosamente
   - O thread não foi criado corretamente
   - O evento não foi emitido

3. Teste forçando via endpoint:
   ```javascript
   fetch("/api/usuarios/5/test-refresh", { method: "POST" });
   ```

---

### ❌ Dados antigos no Storage

**Sintomas:**

- O refresh é chamado, mas setores continuam iguais

**Solução:**

1. Abra DevTools → Application → Storage
2. Procure por `evoque-fitness-auth` em **localStorage** e **sessionStorage**
3. Verifique se o campo `setores` contém os valores antigos
4. Se sim, limpe o storage:
   ```javascript
   localStorage.removeItem("evoque-fitness-auth");
   sessionStorage.removeItem("evoque-fitness-auth");
   location.reload();
   ```

---

### ❌ Backend não sincroniza

**Sintomas:**

- PUT `/api/usuarios/{id}` retorna 200
- Mas evento Socket.IO não é emitido

**Verifique:**

1. Se `core.realtime` está sendo importado corretamente
2. Se o Socket.IO server está inicializado em `main.py`:

   ```python
   from core.realtime import mount_socketio
   app = mount_socketio(_http)
   ```

3. Se há erro no thread de emissão:
   ```python
   # No backend, procure por logs:
   [SIO] emitting auth:refresh to room=user:5
   [SIO] emit_refresh_sync completed for user_id=5
   ```

---

## 📊 Monitoramento em Tempo Real

No Console, você pode monitorar eventos em tempo real:

```javascript
// Ver todos os eventos auth:refresh
window.addEventListener("auth:refresh", () => {
  console.log("✓ auth:refresh recebido!");
});

// Ver todas as chamadas da API de refresh
const originalFetch = window.fetch;
window.fetch = function (...args) {
  if (args[0].includes("/api/usuarios/") && !args[0].includes("test-refresh")) {
    console.log("📡 API call:", args[0]);
  }
  return originalFetch.apply(this, args);
};
```

---

## 🚀 Fallback: Polling Manual

Se Socket.IO não funcionar, há um **polling automático a cada 15 segundos** como fallback. Isso significa:

- Mesmo sem Socket.IO, permissões serão sincronizadas dentro de 15 segundos
- Se a sincronização levar 15+ segundos, é o polling funcionando
- Pode ser acelerado no código em `frontend/src/hooks/useAuth.ts` (linha ~320)

---

## 💬 Logs Esperados

Quando tudo funciona, você deve ver uma sequência assim:

**Frontend Console:**

```
[SIO] ✓ Socket connected with ID UlQmjKs...
[SIO] ✓ Identify emitted for user 5
[SIO] ✓ Received auth:refresh event from server {user_id: 5}
[AUTH] ⟳ Refreshing user data for id 5
[AUTH] ✓ Updated user with setores: ["TI", "Compras"]
```

**Backend Logs:**

```
[API] atualizar_usuario called for user_id=5
[API] Starting thread to emit auth:refresh for user_id=5
[SIO] emitting auth:refresh to room=user:5
[SIO] emit_refresh_sync completed for user_id=5
```

---

## 📞 Se o problema persistir

1. Cole os logs do Console (F12) aqui
2. Cole os logs do Backend aqui
3. Teste com o endpoint de teste:
   ```javascript
   fetch("/api/usuarios/5/test-refresh", { method: "POST" })
     .then((r) => r.json())
     .then(console.log);
   ```
4. Verifique se há alguma mensagem de erro

---

## 🔄 Fallback Automático

Se Socket.IO não funcionar mas você precisar de sincronização:

- Há um **polling a cada 15 segundos** como fallback
- Permissões sincronizarão, mas com até 15 segundos de delay
- Você pode forçar um refresh imediato fazendo logout e login
