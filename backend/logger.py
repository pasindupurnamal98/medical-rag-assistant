import logging

def setup_logger(name="MedicalAssistant"):
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    # Create console handler
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)

    # Create formatter and add it to the handlers
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    ch.setFormatter(formatter)

    if not logger.hasHandlers():
        logger.addHandler(ch)

    return logger

logger = setup_logger()

logger.info("RAG Process started.")
logger.debug("Debugging")
logger.error("Failed to load")
logger.critical("Critical error occurred!")
                 