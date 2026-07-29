import chromadb


class VectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(path="./chroma_db")

        self.collection = self.client.get_or_create_collection(
            name="meetings"
        )

    def add_chunk(
        self,
        meeting_id: str,
        chunk_id: str,
        text: str,
        embedding: list[float],
    ):
        self.collection.add(
            ids=[chunk_id],
            embeddings=[embedding],
            documents=[text],
            metadatas=[{"meeting_id": meeting_id}],
        )

    def search(
        self,
        meeting_id: str,
        embedding: list[float],
        k: int = 3,
    ):
        result = self.collection.query(
            query_embeddings=[embedding],
            n_results=k,
            where={"meeting_id": meeting_id},
        )

        return result

    # أضف الدالة هنا
    def delete_meeting(self, meeting_id: str):
        """
        Delete all chunks belonging to a meeting.
        """
        try:
            results = self.collection.get(
                where={"meeting_id": meeting_id}
            )

            ids = results.get("ids", [])

            if ids:
                self.collection.delete(ids=ids)

        except Exception as e:
            print(f"Failed to delete meeting vectors: {e}")