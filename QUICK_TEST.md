# ⚡ Quick Test: Sincronização de Permissões

## Antes de testar

Certifique-se de que:

1. ✓ Backend está rodando em porta 8000
2. ✓ Frontend está rodando em porta 3000
3. ✓ Você tem 2 abas abertas (uma para admin, outra para usuário)

**Para iniciar tudo:**

```bash
npm run dev  # na raiz do projeto
```

---

## 🧪 Teste Prático (Recomendado)

### ABA 1 - Admin (http://localhost:3000)

1. Login como admin
2. Ir para `/setor/ti/admin/usuarios`
3. Procurar por um usuário
4. Clique no botão "Editar" (ícone lápis)

### ABA 2 - Usuário (http://localhost:3000)

1. Login como um usuário comum
2. Ficar na página inicial `/`

### De Volta na ABA 1 (Admin)

1. No formulário de edição:
   - Vá para a seção **"Setores"**
   - **Adicione um novo setor** que o usuário não tem acesso (ex: "Compras" ou "Financeiro")
   - Clique em **"Salvar"**

### Observar ABA 2 (Usuário)

Você deve ver:

- ✓ **Notificação verde**: "Suas permissões foram atualizadas!"
- ✓ **Novo card de setor** aparece na grid
- ✓ **Novo setor** aparece no dropdown "Escolher Setor"

---

## 🔍 Debug com Console

### Se NÃO funcionar, abra o Console (F12) e veja:

**Na ABA 2 (Usuário):**

```javascript
// Verifique o status do Socket.IO
__PERM_DEBUG__.printStatus();

// Procure por mensagens como:
// [AUTH] ⟳ Refreshing user data
// [AUTH] ✓ Updated user with setores
```

**Na ABA 1 (Admin):**
Verifique o terminal backend por logs como:

```
[API] atualizar_usuario called for user_id=5
[API] Starting threads to emit auth:refresh
[SIO] emitting auth:refresh to room=user:5
```

---

## 🚀 Teste com Endpoint Automático

Se quer testar **sem editar usuário**:

```javascript
// No console da ABA 2 (Usuário):

// 1. Obtenha seu user_id
const userId = JSON.parse(
  localStorage.getItem("evoque-fitness-auth") ||
    sessionStorage.getItem("evoque-fitness-auth"),
).id;
console.log("Seu ID:", userId);

// 2. Chame o endpoint de teste
fetch(`/api/usuarios/${userId}/test-refresh`, { method: "POST" })
  .then((r) => r.json())
  .then((d) => {
    console.log("✓ Teste enviado:", d);
    console.log("Verifique os logs acima para confirmação");
  });
```

---

## 📊 O Que Esperar

### ✅ Funcionando

- [x] Notificação aparece imediatamente
- [x] Novo setor visível em 1-2 segundos
- [x] Sem necessidade de logout
- [x] Logs aparecem no console
- [x] Backend mostra "[SIO] emitting auth:refresh"

### ❌ Não funcionando

- [ ] Nenhuma notificação aparece
- [ ] Setor continua apagado
- [ ] Nenhum log no console
- [ ] Precisa fazer logout/login
- [ ] Backend não mostra logs de Socket.IO

---

## 🔧 Se Não Funcionar

1. **Verifique Socket.IO:**

   ```javascript
   window.__APP_SOCK__; // Deve existir
   window.__APP_SOCK__.connected; // Deve ser true
   ```

2. **Verifique a API:**

   ```javascript
   // Tente chamar a API diretamente
   const userId = 5; // ou seu ID
   fetch(`/api/usuarios/${userId}`)
     .then((r) => r.json())
     .then((d) => {
       console.log("Setores do servidor:", d.setores);
       console.log(
         "Seu storage:",
         JSON.parse(localStorage.getItem("evoque-fitness-auth")).setores,
       );
     });
   ```

3. **Teste o Fallback:**
   - Mesmo sem Socket.IO, deve sincronizar em até 15 segundos (polling)
   - Se mudou após 15s, o polling funciona ✓

4. **Verifique Logs do Backend:**
   - Terminal backend deve mostrar `[API]`, `[SIO]` prefixes
   - Se não houver, backend pode estar com erro

---

## 📝 Próximos Passos

Se tudo funciona: ✅ **SUCESSO!**

Se não funciona:

1. Envie os logs do console (F12)
2. Envie os logs do backend (terminal)
3. Execute `__PERM_DEBUG__.printStatus()` e copie a saída
4. Com esses dados posso debugar o problema específico

---

## 💡 Nota Técnica

Implementei:

1. **Socket.IO Setup Melhorado** - Conexão mais robusta
2. **Polling Automático** - Fallback a 15s se Socket.IO falhar
3. **Múltiplos Listeners** - Captura de eventos em cascata
4. **Debugger Integrado** - `__PERM_DEBUG__` para fácil rastreamento
5. **Emissão Dual** - Imediato + Delay (200ms) no backend

Isso deve resolver 99% dos problemas. Se ainda não funcionar, pode ser um problema específico de setup/configuração que preciso investigar com os logs.
