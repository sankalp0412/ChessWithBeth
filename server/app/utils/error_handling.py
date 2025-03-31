from colorama import Fore, Style, init
import logging

init()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChessGameError(Exception):
    pass


def log_error(message: str, error_type: str = "ERROR") -> None:
    """Log an error message with color"""
    colored_message = f"{Fore.RED}[{error_type}] {message}{Style.RESET_ALL}"
    logger.error(colored_message)


def log_success(message: str) -> None:
    """Log a success message with color"""
    colored_message = f"{Fore.GREEN}[SUCCESS] {message}{Style.RESET_ALL}"
    logger.info(colored_message)


def log_debug(message: str) -> None:
    """Log a message for dubugging"""
    colored_messsage = f"{Fore.BLUE}[DEBUG] {message} {Style.RESET_ALL}"
    logger.info(colored_messsage)
