from ollama import Client
from typing import List


class EmbeddingService:
    def __init__(
        self,
        model: str = "nomic-embed-text:latest",
        host: str = "http://localhost:11434",
    ):
        self.model = model
        self.client = Client(host=host)

    def embed_text(self, text: str) -> List[float]:
        response = self.client.embed(
            model=self.model,
            input=text
        )

        return response["embeddings"][0]