"""LangGraph workflow assembly for TerraMind AI Advisor."""

from __future__ import annotations

import logging
from collections.abc import Callable
from functools import lru_cache
from typing import Any

try:
    from langgraph.graph import END, START, StateGraph
except ModuleNotFoundError:  # pragma: no cover - local fallback for environments without langgraph
    START = "__start__"
    END = "__end__"

    class _CompiledWorkflow:
        """Minimal workflow runtime used when LangGraph is unavailable."""

        def __init__(self, nodes, edges, conditional_edges):
            self._nodes = nodes
            self._edges = edges
            self._conditional_edges = conditional_edges

        def invoke(self, initial_state):
            state = dict(initial_state)
            current = START

            while True:
                if current == END:
                    return state

                if current == START:
                    next_nodes = self._edges.get(START, [])
                    current = next_nodes[0] if next_nodes else END
                    continue

                node = self._nodes[current]
                result = node(state)
                if isinstance(result, dict):
                    state.update(result)

                if current in self._conditional_edges:
                    route_fn, routing_map = self._conditional_edges[current]
                    route = route_fn(state)
                    current = routing_map.get(route, END)
                    continue

                next_nodes = self._edges.get(current, [])
                current = next_nodes[0] if next_nodes else END

    class StateGraph:  # type: ignore[override]
        """Small subset of the LangGraph API used by this project."""

        def __init__(self, state_type):
            self._state_type = state_type
            self._nodes: dict[str, Callable[[dict[str, Any]], dict[str, Any]]] = {}
            self._edges: dict[str, list[str]] = {}
            self._conditional_edges: dict[str, tuple[Callable[[dict[str, Any]], str], dict[str, str]]] = {}

        def add_node(self, name, node):
            self._nodes[name] = node

        def add_edge(self, source, target):
            self._edges.setdefault(source, []).append(target)

        def add_conditional_edges(self, source, route_fn, mapping):
            self._conditional_edges[source] = (route_fn, mapping)

        def compile(self):
            return _CompiledWorkflow(self._nodes, self._edges, self._conditional_edges)

from ..agents.farm_agent import farm_agent_node
from ..agents.rag_agent import rag_agent_node
from ..agents.weather_agent import weather_agent_node
from ..rag.errors import AIAdvisorRAGError
from .state import AIAdvisorState
from .supervisor import route_supervisor, supervisor_node

logger = logging.getLogger(__name__)

AgentNode = Callable[[AIAdvisorState], dict[str, Any]]

AGENT_NODE_REGISTRY: dict[str, AgentNode] = {}
AGENT_ROUTE_REGISTRY: dict[str, str] = {}
AGENT_TERMINAL_NODES: set[str] = set()


def register_agent_node(name: str, node: AgentNode, *, route_name: str | None = None, terminal: bool = True) -> None:
    """Register an agent node so the graph can be extended without refactoring.

    Parameters
    ----------
    name:
        Internal node name used by the workflow.
    node:
        Callable that mutates and returns the shared LangGraph state.
    route_name:
        Optional routing label returned by the supervisor. Defaults to ``name``.
    terminal:
        When ``True``, the workflow will add an edge from the agent to ``END``.
    """

    AGENT_NODE_REGISTRY[name] = node
    AGENT_ROUTE_REGISTRY[name] = route_name or name
    if terminal:
        AGENT_TERMINAL_NODES.add(name)
    else:
        AGENT_TERMINAL_NODES.discard(name)


register_agent_node("farm_agent", farm_agent_node, terminal=False)
register_agent_node("weather_agent", weather_agent_node, terminal=False)
register_agent_node("rag_agent", rag_agent_node, terminal=True)


def build_workflow() -> Any:
    """Build the compiled workflow for the advisor."""

    logger.debug("Building TerraMind AI Advisor workflow")
    graph = StateGraph(AIAdvisorState)
    graph.add_node("supervisor", supervisor_node)

    for node_name, node_callable in AGENT_NODE_REGISTRY.items():
        graph.add_node(node_name, node_callable)

    graph.add_edge(START, "supervisor")
    graph.add_conditional_edges("supervisor", route_supervisor, AGENT_ROUTE_REGISTRY)
    graph.add_edge("farm_agent", "weather_agent")
    graph.add_edge("weather_agent", "rag_agent")

    for terminal_node in AGENT_TERMINAL_NODES:
        graph.add_edge(terminal_node, END)

    return graph.compile()


@lru_cache(maxsize=1)
def get_advisor_workflow() -> Any:
    """Return a cached compiled workflow instance."""

    return build_workflow()


def invoke_advisor_workflow(message: str, user_id: int | None = None) -> dict[str, Any]:
    """Run the workflow and return the final response payload."""

    result_state = get_advisor_workflow().invoke({"user_query": message, "request_user_id": user_id})
    final_response = result_state.get("final_response")

    if not isinstance(final_response, dict):
        logger.error("Workflow completed without a final response")
        raise AIAdvisorRAGError("Unable to generate an answer right now.")

    return final_response
