from __future__ import annotations

import logging

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .rag.chatbot import AIAdvisorConfigurationError, AIAdvisorRAGError, generate_answer
from .rag.errors import AIAdvisorVectorStoreError
from .serializers import ChatRequestSerializer

logger = logging.getLogger(__name__)


class ChatAPIView(APIView):
    """POST endpoint for TerraMind's agricultural RAG assistant."""

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = generate_answer(serializer.validated_data["message"])
        except AIAdvisorConfigurationError as exc:
            logger.exception("AI Advisor misconfigured")
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except AIAdvisorVectorStoreError as exc:
            logger.exception("AI Advisor vector store is unavailable")
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except AIAdvisorRAGError as exc:
            logger.exception("AI Advisor RAG request failed")
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception:
            logger.exception("Unexpected AI Advisor failure")
            return Response(
                {"detail": "Unable to answer right now. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(result, status=status.HTTP_200_OK)
