# Configurações do Banco de Dados MySQL Azure
DB_HOST=evoque-database.mysql.database.azure.com
DB_USER=infra
DB_PASSWORD=Evoque12@
DB_NAME=infra
DB_PORT=3306

# Configurações da Aplicação Flask
SECRET_KEY=evoque_secret_key_2024_muito_segura_para_producao
FLASK_ENV=development
FLASK_DEBUG=True

# Configurações do Microsoft Graph API (Email)
CLIENT_ID=bc90db46-3e94-476d-8f37-bb818eeb4690
CLIENT_SECRET=4lg8Q~Np6rsPirXWNnlTtgIPfauxbXEVFdK6ocwN
TENANT_ID=9f45f492-87a3-4214-862d-4c0d080aa136
USER_ID=no-reply@academiaevoque.com.br

# Configurações de Email
EMAIL_SISTEMA=sistema@evoquefitness.com
EMAIL_TI=ti@academiaevoque.com.br
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=True

# Configurações de Segurança
MAX_LOGIN_ATTEMPTS=5
SESSION_TIMEOUT=30
PASSWORD_MIN_LENGTH=6

# Configurações de Logs
LOG_LEVEL=INFO
LOG_FILE_PATH=logs/app.log

# Configurações de Backup
BACKUP_PATH=backups/
BACKUP_RETENTION_DAYS=30

# Configurações de Upload
UPLOAD_FOLDER=uploads/
MAX_CONTENT_LENGTH=16777216

# Configurações de Timezone
TIMEZONE=America/Sao_Paulo

# Configurações de Cache
CACHE_TYPE=simple
CACHE_DEFAULT_TIMEOUT=300
