class AIAdvisorError(Exception):
    """Base error for the AI Advisor pipeline."""


class AIAdvisorConfigurationError(AIAdvisorError):
    """Raised when required configuration is missing."""


class AIAdvisorDataError(AIAdvisorError):
    """Raised when the document corpus cannot be loaded."""


class AIAdvisorVectorStoreError(AIAdvisorError):
    """Raised when Chroma loading or embedding retrieval fails."""


class AIAdvisorRAGError(AIAdvisorError):
    """Raised when the chat pipeline cannot answer a request."""
