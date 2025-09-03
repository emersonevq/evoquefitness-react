from datetime import datetime
import pytz

BRAZIL_TZ = pytz.timezone("America/Sao_Paulo")

def now_brazil_naive() -> datetime:
    dt = datetime.now(BRAZIL_TZ)
    # salvar como naive no timezone do Brasil (compatível com modelo legado)
    return dt.replace(tzinfo=None)
