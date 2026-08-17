
import logging
import sys

class ReadableFormatter(logging.Formatter):
    COLORS = {
        logging.DEBUG: "\x1b[90m",
        logging.INFO: "\x1b[32m",
        logging.WARNING: "\x1b[33m",
        logging.ERROR: "\x1b[31m",
        logging.CRITICAL: "\x1b[31m",
    }
    RESET = "\x1b[0m"
    DIM = "\x1b[2m"

    def _use_color(self) -> bool:
        return hasattr(sys.stderr, "isatty") and sys.stderr.isatty()

    def format(self, record: logging.LogRecord) -> str:
        timestamp = self.formatTime(record, "%H:%M:%S")
        level = record.levelname.upper().ljust(5)
        name = record.name
        message = record.getMessage()

        if self._use_color():
            color = self.COLORS.get(record.levelno, "")
            timestamp = f"{self.DIM}{timestamp}{self.RESET}"
            level = f"{color}{level}{self.RESET}"
            name = f"\x1b[35m[{name}]{self.RESET}"
        else:
            name = f"[{name}]"

        line = f"{timestamp}  {level}  {name}  {message}"

        if record.exc_info and record.exc_info[0] is not None:
            traceback = self.formatException(record.exc_info)
            line = f"{line}\n{traceback}"

        return line

def configure_logging(level: int = logging.INFO) -> None:
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(ReadableFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)
