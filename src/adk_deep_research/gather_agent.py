"""
ADK Agents for the iterative gathering phase of the Deep Research process.

This module defines agents responsible for:
- Performing web searches for a list of queries and summarizing results (`PerformSearchAndSummarizeAgent`).
- Evaluating the completeness of research based on gathered results and generating new queries (`EvaluateResearchAgent`).
- Orchestrating a single iteration of search, summarization, and evaluation (`GatherIterationAgent`).
- Managing the overall iterative loop until research goals are met or budget is exhausted (`GatherLoopAgent`).

These agents heavily use `context.state` for passing data between steps and rely on `AdkEventService`
for emitting progress events.
"""
from adk.agents import SequentialAgent, LoopAgent, BaseAgent, InvocationContext
from adk.events import Event # For creating custom events or for conditions

from .llm_agents import content_summarizer_agent, evaluation_agent, evaluation_parser_agent # Import specific agents
from .tools import web_search_tool
from .schemas import (
    ResearchState, SearchResult as AdkSearchResult,
    EvaluationCompletedEvent, ContentSummarizedEvent, SearchCompletedEvent,
    SearchStartedEvent, EvaluationStartedEvent, ContentProcessingEvent, IterationCompletedEvent
)
from .event_service import AdkEventService
from .config import RESEARCH_CONFIG

# Helper function to decide which summarizer to use based on content length
# This logic might be better placed elsewhere or handled by a dedicated "smart summarizer" agent
def get_summarizer_for_content(content: str):
    # from .llm_agents import long_page_summarization_llm, summarization_llm
    # if len(content) > 100000: # Threshold from original TS
    #     content_summarizer_agent.llm = long_page_summarization_llm # This direct mutation might not be ideal ADK practice.
    # else:
    #     content_summarizer_agent.llm = summarization_llm
    # It's often better to have two separate agents or pass model choice in context if ADK supports it.
    # For now, content_summarizer_agent uses the default model.
    # A more robust solution would be needed here.
    return content_summarizer_agent


class PerformSearchAndSummarizeAgent(SequentialAgent):
    """
    An agent that takes a list of queries, performs web searches,
    and summarizes the results.
    Updates context.state.search_results and context.state.all_queries
    """
    def __init__(self, event_service_provider, **kwargs):
        self.event_service_provider = event_service_provider # Callable that returns AdkEventService

        # Define the sequence of operations for each query
        # This agent will be invoked by the LoopAgent for a batch of queries per iteration.
        # The actual iteration over queries within a batch might need to be handled by this agent's logic
        # or by how the LoopAgent passes data to it.

        # For simplicity, this agent will process a list of queries passed in `user_content` or `context.state.current_queries`
        # It will then use tools and LLM agents.
        # ADK's SequentialAgent runs sub-agents or tools in order.
        # The challenge is that web_search_tool is called for multiple queries,
        # and summarization is called for multiple results.

        # This agent might be better as a custom BaseAgent if complex iteration logic is needed internally.
        # For now, let's assume it receives one query at a time, and the LoopAgent handles iterating through queries.
        # OR, it receives a list of queries and processes them.
        # Let's go with: it receives a list of queries in context.state.current_iteration_queries

        super().__init__(
            name="PerformSearchAndSummarizeIterativeAgent",
            description="Performs web searches for a list of queries and summarizes the results.",
            # Sub-agents/tools are not statically defined here as it's more dynamic.
            # We'll use the _run_async_impl method for custom logic.
            sub_agents=[], # Will be dynamically called
            **kwargs
        )

    async def _run_async_impl(self, context: InvocationContext, **kwargs) -> Event:
        session_id = context.session.id
        event_service: AdkEventService = self.event_service_provider(session_id)

        current_iteration = context.state.get("iteration", 0)
        queries_for_this_iteration: list[str] = context.state.get("current_iteration_queries", [])

        all_new_results_for_iteration: list[AdkSearchResult] = []

        for query in queries_for_this_iteration:
            event_service.add_event(SearchStartedEvent(query=query, iteration=current_iteration, timestamp=0), current_iteration) # Timestamp will be set by service

            # 1. Perform web search for the current query
            search_tool_event = await self.invoke_tool_async(
                context,
                tool_name=web_search_tool.name, # web_search_tool should be in this agent's toolset or globally available
                user_content={"query": query} # Parameters for the tool
            )

            # search_tool_event.content should contain List[AdkSearchResult]
            # The actual structure depends on how FunctionTool output is wrapped in an Event.
            # Assuming search_tool_event.get_tool_outputs()[0].content gives the list of AdkSearchResult
            search_results_for_query: list[AdkSearchResult] = []
            if search_tool_event.get_tool_outputs() and search_tool_event.get_tool_outputs()[0].content:
                 # Need to parse this correctly based on ADK FunctionTool output
                raw_results = search_tool_event.get_tool_outputs()[0].content
                if isinstance(raw_results, list): # Assuming it's already a list of AdkSearchResult objects
                    search_results_for_query = [AdkSearchResult(**r) if isinstance(r, dict) else r for r in raw_results]


            event_service.add_event(SearchCompletedEvent(
                query=query,
                urls=[res.link for res in search_results_for_query],
                result_count=len(search_results_for_query),
                iteration=current_iteration,
                timestamp=0
            ), current_iteration)

            # 2. Summarize each search result
            summarized_results_for_query: list[AdkSearchResult] = []
            for res_idx, search_result in enumerate(search_results_for_query):
                # Emit ContentProcessingEvent (as in original TS)
                event_service.add_event(ContentProcessingEvent( # Make sure ContentProcessingEvent is imported from .schemas
                    url=search_result.link,
                    title=search_result.title or "",
                    query=query,
                    content=search_result.content, # Sending full content, can be large
                    timestamp=0
                ), current_iteration)

                # Select summarizer (simplified for now)
                # summarizer_agent_to_use = get_summarizer_for_content(search_result.content)
                summarizer_agent_to_use = content_summarizer_agent # Using default

                # Invoke summarization LLM agent
                # The PROMPTS['rawContentSummarizerPrompt'] is a system prompt.
                # The user message should contain the query (as topic) and the raw content.
                context.state["user_content"] = {
                    "research_topic_for_summary": query, # Using a distinct key to avoid collision
                    "raw_content_for_summary": search_result.content
                }
                # The instruction_provider for content_summarizer_agent needs to be adjusted
                # OR LlmAgent needs to be smart enough to format user_content based on prompt's placeholders.
                # For now, assume LlmAgent sends user_content as the user message, and the system prompt
                # from PROMPTS['rawContentSummarizerPrompt'] guides the LLM.
                # The prompt itself contains placeholders like <Research Topic> and <Raw Content>.
                # This means the LlmAgent or the TogetherAIAdapter needs to perform this substitution.
                # A simpler approach for now: LlmAgent's instruction_provider directly formats it if it's a lambda.
                # Let's adjust the content_summarizer_agent's instruction_provider in llm_agents.py later if needed.
                # For now, assuming the user_content is passed as user message.

                summary_event = await self.invoke_agent_async(
                    context,
                    agent_name=summarizer_agent_to_use.name # Summarizer agent
                )

                # summary_event.content.text should have the summary
                summary_text = summary_event.content.text if summary_event.content else "Summary not available."

                # Update the search result with its summary
                # search_result.summary = summary_text # This mutates the object from tool output, might be ok
                # Or create a new one:
                summarized_search_result = AdkSearchResult(
                    title=search_result.title,
                    link=search_result.link,
                    content=search_result.content, # Keep original content
                    summary=summary_text
                )
                summarized_results_for_query.append(summarized_search_result)

                event_service.add_event(ContentSummarizedEvent(
                    url=search_result.link,
                    title=search_result.title,
                    query=query,
                    summary_first_hundred_chars=summary_text[:100],
                    timestamp=0
                ), current_iteration)

            all_new_results_for_iteration.extend(summarized_results_for_query)

        # Update global state (or pass results back)
        # This depends on how LoopAgent handles state between iterations.
        # Let's assume we update a key in context.state that the main orchestrator will use.
        current_overall_results = context.state.get("search_results", [])
        current_overall_results.extend(all_new_results_for_iteration)
        context.state["search_results"] = current_overall_results

        # Also update all_queries used so far
        current_all_queries = context.state.get("all_queries", [])
        current_all_queries.extend(queries_for_this_iteration)
        context.state["all_queries"] = list(set(current_all_queries)) # Deduplicate

        # This agent's "result" is the side effect on context.state.
        # It should return an Event indicating its completion.
        return Event(
            self.name,
            content={"status": "Search and Summarization for iteration complete", "results_count_this_iteration": len(all_new_results_for_iteration)}
        )


class EvaluateResearchAgent(SequentialAgent):
    """
    An agent that evaluates the current set of search results
    and determines if more research is needed, outputting new queries.
    """
    def __init__(self, event_service_provider, **kwargs):
        self.event_service_provider = event_service_provider
        super().__init__(
            name="EvaluateResearchAgent",
            description="Evaluates research completeness and generates new queries if needed.",
            sub_agents=[evaluation_agent, evaluation_parser_agent], # Run these in sequence
            **kwargs
        )
        # The evaluation_agent will read from context.state (topic, search_results, all_queries)
        # Its text output will be implicitly passed to evaluation_parser_agent if they are chained correctly
        # or via context.state (e.g., context.state['last_eval_text'] = eval_output.text)

    async def _run_async_impl(self, context: InvocationContext, **kwargs) -> Event:
        session_id = context.session.id
        event_service: AdkEventService = self.event_service_provider(session_id)
        current_iteration = context.state.get("iteration", 0)

        event_service.add_event(EvaluationStartedEvent(
            total_results=len(context.state.get("search_results", [])),
            iteration=current_iteration,
            timestamp=0
        ), current_iteration)

        # 1. Invoke the evaluation LLM agent
        # The PROMPTS['evaluationPrompt'] (system prompt) expects <Research Topic>, <Search Queries Used>, <Current Search Results>.
        # Prepare these in user_content.
        formatted_results_for_eval = "\n\n".join([
            f"- {sr.title}\n{sr.summary or sr.content[:200]}..." # Truncate content for prompt
            for sr in context.state.get("search_results", [])
        ])
        formatted_queries_for_eval = "\n".join([f"- {q}" for q in context.state.get("all_queries", [])])

        context.state["user_content"] = {
            "research_topic_for_eval": context.state.get("research_topic", ""),
            "search_queries_used_for_eval": formatted_queries_for_eval,
            "current_search_results_for_eval": formatted_results_for_eval
        }
        # Similar to summarizer, evaluation_agent's instruction_provider might need adjustment
        # or rely on LlmAgent formatting user_content into the user message, and the system prompt
        # (PROMPTS['evaluationPrompt']) using placeholders.

        eval_text_event = await self.invoke_agent_async(context, agent_name=evaluation_agent.name)

        # The raw evaluation text needs to be passed to the parser agent
        current_eval_text = eval_text_event.content.text if eval_text_event.content else ""
        context.state["current_eval_text"] = current_eval_text # For event logging

        # 2. Invoke the evaluation parsing LLM agent
        # Its prompt PROMPTS['evaluationParsingPrompt'] is a system prompt.
        # The user message should be the evaluation_text.
        context.state["user_content"] = {"evaluation_text_to_parse": current_eval_text}
        parsed_eval_event = await self.invoke_agent_async(context, agent_name=evaluation_parser_agent.name)

        # parsed_eval_event.content should be a ResearchPlan object (due to output_schema)
        additional_queries = []
        if parsed_eval_event.content and hasattr(parsed_eval_event.content, "queries"):
            additional_queries = parsed_eval_event.content.queries

        # Determine if more research is needed
        needs_more = len(additional_queries) > 0

        # Store evaluation results in context.state for the LoopAgent's condition
        context.state["needs_more_research"] = needs_more
        context.state["additional_queries"] = additional_queries[:RESEARCH_CONFIG["maxQueries"]] # Apply maxQueries cap

        event_service.add_event(EvaluationCompletedEvent(
            needs_more=needs_more,
            reasoning=context.state["current_eval_text"][:500], # Full reasoning can be long
            additional_queries=context.state["additional_queries"],
            iteration=current_iteration,
            timestamp=0
        ), current_iteration)

        return Event(
            self.name,
            content={"needs_more": needs_more, "additional_queries_found": len(additional_queries)}
        )


class GatherIterationAgent(SequentialAgent):
    """
    Represents one full iteration of gathering:
    1. Perform Search and Summarize for current queries
    2. Evaluate results and generate new queries
    """
    def __init__(self, event_service_provider, **kwargs):
        # Note: Instantiating agents here means they share the same instance if GatherIterationAgent is reused.
        # This is usually fine for ADK agents as their state is in the `context`.
        self.event_service_provider = event_service_provider # Store for use in _run_async_impl
        self.perform_search_summarize_agent = PerformSearchAndSummarizeAgent(event_service_provider)
        self.evaluate_research_agent = EvaluateResearchAgent(event_service_provider)

        super().__init__(
            name="GatherIterationAgent",
            description="A single iteration of searching, summarizing, and evaluating research.",
            sub_agents=[
                self.perform_search_summarize_agent,
                self.evaluate_research_agent,
            ],
            **kwargs
        )
        # This agent will be used inside the LoopAgent.
        # It expects `context.state.current_iteration_queries` to be set before it runs.

    async def _run_async_impl(self, context: InvocationContext, **kwargs) -> Event:
        # First, run the sub-agents (PerformSearchAndSummarize, then EvaluateResearch)
        result_event = await super()._run_async_impl(context, **kwargs)

        # After sub-agents complete for the iteration, emit IterationCompletedEvent
        # This happens regardless of whether the loop will continue or not, as long as the iteration itself didn't error out.
        if result_event.event_type != "error": # Check if the sequential execution was successful
            session_id = context.session.id
            event_service: AdkEventService = self.event_service_provider(session_id)
            current_iteration = context.state.get("iteration", 0)
            total_results = len(context.state.get("search_results", []))

            event_service.add_event(IterationCompletedEvent(
                iteration=current_iteration,
                total_results=total_results,
                timestamp=0
            ), current_iteration)

        return result_event


# --- Main Gather Agent (Looping) ---
class GatherLoopAgent(LoopAgent):
    """
    Orchestrates the iterative process of gathering search results.
    Loops until budget is exhausted or evaluation deems research complete.
    """
    def __init__(self, event_service_provider, **kwargs):
        self.event_service_provider = event_service_provider

        # The agent to run in each iteration of the loop
        iteration_agent = GatherIterationAgent(event_service_provider)

        super().__init__(
            name="IterativeGatherAgent",
            description="Manages the iterative search, summarization, and evaluation process.",
            iteration_agent=iteration_agent,
            # loop_condition_fn determines if the loop should continue
            # max_iterations can also be set directly if preferred
            **kwargs
        )

    def _prepare_iteration_context(self, context: InvocationContext) -> None:
        """Called before each iteration to set up context for the iteration_agent."""
        current_iter = context.state.get("iteration", 0) # LoopAgent might manage its own iteration count

        if current_iter == 0: # First iteration
            # Initial queries should have been set by the main_agent in context.state.initial_queries
            context.state["current_iteration_queries"] = context.state.get("initial_queries", [])
        else:
            # Subsequent iterations use additional_queries from the previous evaluation
            context.state["current_iteration_queries"] = context.state.get("additional_queries", [])

        # Update budget (if LoopAgent doesn't do it automatically based on max_iterations)
        # budget = context.state.get("budget", RESEARCH_CONFIG["budget"])
        # context.state["budget"] = budget -1 # This might be better handled by LoopAgent's max_iterations

        # The LoopAgent itself might update an iteration counter in context.state.
        # We ensure our 'iteration' key is aligned if needed.
        context.state["iteration"] = current_iter # Ensure our state key matches

    def _loop_condition_fn(self, context: InvocationContext) -> bool:
        """
        Determines if the loop should continue.
        Accesses context.state updated by the iteration_agent (specifically by EvaluateResearchAgent).
        """
        current_iter = context.state.get("iteration", 0) # LoopAgent might provide this
        max_iterations = context.state.get("max_budget_iterations", RESEARCH_CONFIG["budget"]) # Max iterations based on budget

        if current_iter >= max_iterations:
            print(f"Loop condition: Max iterations ({max_iterations}) reached.")
            return False # Budget exhausted

        needs_more = context.state.get("needs_more_research", False)
        additional_queries = context.state.get("additional_queries", [])

        if not needs_more:
            print("Loop condition: Evaluation indicates no more research needed.")
            return False
        if not additional_queries:
            print("Loop condition: Evaluation wants more, but no new queries were generated.")
            return False

        print(f"Loop condition: Continuing to iteration {current_iter + 1}. Needs more: {needs_more}, New Queries: {len(additional_queries)}")
        return True

    async def _run_async_impl(self, context: InvocationContext, **kwargs) -> Event:
        """
        Override _run_async_impl to set initial state for the loop,
        then call super()._run_async_impl() for LoopAgent's logic.
        """
        # Initial setup for the loop
        # The LoopAgent needs to know the max number of iterations.
        # This can be set via a parameter to LoopAgent or read from context.state.
        # Let's assume it's managed by `max_iterations` parameter of LoopAgent or
        # the loop_condition_fn handles it. We will ensure `max_budget_iterations` is in state.
        context.state["max_budget_iterations"] = context.state.get("budget", RESEARCH_CONFIG["budget"])
        context.state.setdefault("iteration", 0) # Ensure iteration starts at 0 if not set

        # Initial queries must be set in context.state.initial_queries by the calling agent (main_agent)
        if "initial_queries" not in context.state:
            print("Error: 'initial_queries' not found in context state for GatherLoopAgent.")
            # Return an error event or raise exception
            return Event(self.name, content={"error": "Initial queries not provided"}, event_type="error")

        # Call the LoopAgent's main execution logic
        loop_result_event = await super()._run_async_impl(context, **kwargs)

        # After loop finishes, context.state.search_results will contain all results.
        # The "result" of this looping agent is effectively the updated state.
        print(f"GatherLoopAgent finished. Final iteration count: {context.state.get('iteration')}")
        print(f"Total search results collected: {len(context.state.get('search_results', []))}")

        return Event(self.name, content={"status": "Iterative gathering complete.", "final_results": context.state.get("search_results", [])})


# For direct testing of agents if ADK environment was fully set up
if __name__ == '__main__':
    print("ADK Gather Agent (Looping structure) defined.")
    # To test this, one would need to:
    # 1. Instantiate AdkEventService (mock or real)
    # 2. Set up an InvocationContext with initial state (e.g., topic, initial_queries, budget)
    # 3. Instantiate GatherLoopAgent
    # 4. Run `agent.run(context)`
    pass
