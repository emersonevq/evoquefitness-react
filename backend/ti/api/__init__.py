from .chamados import router as chamados_router
from .chamados import router as chamados_router
from .usuarios import router as usuarios_router
from .unidades import router as unidades_router
from .problemas import router as problemas_router
from .notifications import router as notifications_router
from .email_debug import router as email_debug_router
__all__ = ["chamados_router", "usuarios_router", "unidades_router", "problemas_router", "notifications_router", "email_debug_router"]
