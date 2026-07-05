from app.core.messages import translate_backend_message


class ServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        self.message = translate_backend_message(message)
        self.status_code = status_code
        super().__init__(self.message)
