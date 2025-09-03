import os

# Este arquivo centraliza configurações, lendo SEMPRE do ambiente.
# Evitamos commitar segredos diretamente em código.

# Banco de Dados MySQL Azure
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")
DB_SSL_CA = os.getenv("DB_SSL_CA")  # caminho opcional para CA (ex.: DigiCertGlobalRootCA.crt.pem)

# Aplicação (legado Flask, útil para compatibilidade de configs)
SECRET_KEY = os.getenv("SECRET_KEY")
FLASK_ENV = os.getenv("FLASK_ENV")
FLASK_DEBUG = os.getenv("FLASK_DEBUG")

# Microsoft Graph / Email
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
TENANT_ID = os.getenv("TENANT_ID")
USER_ID = os.getenv("USER_ID")

# E-mail SMTP
EMAIL_SISTEMA = os.getenv("EMAIL_SISTEMA")
EMAIL_TI = os.getenv("EMAIL_TI")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = os.getenv("SMTP_PORT")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS")

# Segurança
MAX_LOGIN_ATTEMPTS = os.getenv("MAX_LOGIN_ATTEMPTS")
SESSION_TIMEOUT = os.getenv("SESSION_TIMEOUT")
PASSWORD_MIN_LENGTH = os.getenv("PASSWORD_MIN_LENGTH")

# Logs
LOG_LEVEL = os.getenv("LOG_LEVEL")
LOG_FILE_PATH = os.getenv("LOG_FILE_PATH")

# Backup
BACKUP_PATH = os.getenv("BACKUP_PATH")
BACKUP_RETENTION_DAYS = os.getenv("BACKUP_RETENTION_DAYS")

# Upload
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER")
MAX_CONTENT_LENGTH = os.getenv("MAX_CONTENT_LENGTH")

# Timezone
TIMEZONE = os.getenv("TIMEZONE")

# Cache
CACHE_TYPE = os.getenv("CACHE_TYPE")
CACHE_DEFAULT_TIMEOUT = os.getenv("CACHE_DEFAULT_TIMEOUT")
