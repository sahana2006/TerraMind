from __future__ import annotations

from django.test import SimpleTestCase
from langchain_core.documents import Document

from apps.ai_advisor.agents import rag_agent


class _FailingChain:
    def invoke(self, payload):
        raise RuntimeError("boom")


class RagAgentTests(SimpleTestCase):
    def test_build_response_falls_back_when_generation_fails(self):
        document = Document(
            page_content="Useful agronomy guidance for the retrieved answer.",
            metadata={
                "source_filename": "guide.pdf",
                "source_path": "guide.pdf",
                "category": "crop",
                "page_number": 3,
            },
        )

        original_retrieve_documents = rag_agent.retrieve_documents
        original_get_rag_chain = rag_agent.get_rag_chain
        try:
            rag_agent.retrieve_documents = lambda question: [document]
            rag_agent.get_rag_chain = lambda: _FailingChain()

            documents, context, response = rag_agent._build_response("How do I improve yield?")
        finally:
            rag_agent.retrieve_documents = original_retrieve_documents
            rag_agent.get_rag_chain = original_get_rag_chain

        self.assertEqual(documents, [document])
        self.assertIn("Chunk 1", context)
        self.assertIn("I found relevant source material", response["answer"])
        self.assertEqual(response["sources"], [
            {
                "source_filename": "guide.pdf",
                "source_path": "guide.pdf",
                "category": "crop",
                "page_number": 3,
            }
        ])

    def test_format_context_truncates_large_documents(self):
        document = Document(
            page_content="x" * (rag_agent.MAX_DOCUMENT_CHARS + 500),
            metadata={
                "source_filename": "guide.pdf",
                "source_path": "guide.pdf",
                "category": "crop",
                "page_number": 1,
            },
        )

        context = rag_agent._format_context([document])

        self.assertLessEqual(len(context), rag_agent.MAX_CONTEXT_CHARS + len("\n\n[context truncated]"))
        self.assertIn("[truncated]", context)
