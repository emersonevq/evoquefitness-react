import os

# Este arquivo permite visualizar/centralizar configurações.
# Os valores são lidos do ambiente para evitar expor segredos no repositório.
# Defina as variáveis no ambiente do servidor (ou MCP) e elas serão refletidas aqui.

DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")
DB_SSL_CA = os.getenv("DB_SSL_CA")
