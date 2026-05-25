from logger import logger

def query_chain(chain,user_input:str):
    try:
        logger.debug(f"Running Chain for input: {user_input}")
        result = chain({"query": user_input})
        response={
            "response": result['result'],
            "sources": [doc.metadata.get("sources","") for doc in result["source_documents"]]
        }
        logger.debug(f"Chain result: {response}")
        return response
    except Exception as e:
        logger.exception(f"Error in query_chain")
        raise 