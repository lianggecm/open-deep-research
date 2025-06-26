"""
ADK LlmAgents for various stages of the Deep Research process.

This module defines specialized LlmAgents that interact with Large Language Models
(via the `LiteLLMAdapter`) to perform tasks such as:
- Research planning and query generation.
- Parsing LLM outputs into structured data.
- Summarizing web content.
- Evaluating research completeness.
- Generating final research reports.
- Creating image generation prompts.

Each agent is configured with specific models, prompts, and potentially output schemas.
The `LiteLLMAdapter` is a custom ADK `BaseLlm` implementation that uses the LiteLLM
library to interact with various LLM providers, including TogetherAI.
"""
from typing import Optional # Added for api_key in LiteLLMAdapter
from adk.agents import LlmAgent
from adk.llms import BaseLlm # Interface for LLM configuration
# from adk.llms.generic import GenericLlm # Potentially for future use or if ADK has it

from .config import MODEL_CONFIG, PROMPTS, get_current_date_context, TOGETHER_API_KEY, RESEARCH_CONFIG
from .schemas import ResearchPlan # For output schema of planning agent

# Import LiteLLM
try:
    import litellm
except ImportError:
    # This is a fallback for environments where litellm might not be installed during conceptual generation.
    # In a real deployment, ensure litellm is in requirements.txt
    print("LiteLLM library not found. LLM calls will be mocked if this proceeds without LiteLLM.")
    # Mock litellm for conceptual functionality if not present
    class MockLiteLLMResponseContent:
        def __init__(self, content_text):
            self.content = content_text
    class MockLiteLLMResponseChoice:
        def __init__(self, content_text):
            self.message = MockLiteLLMResponseContent(content_text)
    class MockLiteLLMResponse:
        def __init__(self, content_text="Mocked LiteLLM Response"):
            self.choices = [MockLiteLLMResponseChoice(content_text)]
            self.usage = {"total_tokens": 0} # Example usage data
        def __getitem__(self, key): # To allow response['choices']
             return getattr(self, key)

    class MockLiteLLM:
        async def acompletion(self, model, messages, api_key=None, **kwargs):
            print(f"Mock LiteLLM acompletion call: Model={model}, Messages={messages[:1]}...")
            # Simulate model-specific responses for parsing agents
            if model == MODEL_CONFIG["jsonModel"]:
                 return MockLiteLLMResponse(ResearchPlan(queries=["mock query 1 from litellm", "mock query 2 from litellm"]).model_dump_json())
            return MockLiteLLMResponse(f"Mocked response from LiteLLM for model {model}")

    litellm = MockLiteLLM()


class LiteLLMAdapter(BaseLlm):
    """
    Adapter for using various LLM providers via LiteLLM, conforming to ADK's BaseLlm interface.

    This adapter uses LiteLLM to make asynchronous calls to the specified model.
    It handles formatting the model name for LiteLLM (e.g., prefixing for TogetherAI)
    and passing API keys if provided.

    Attributes:
        model_identifier (str): The model name, potentially including a provider prefix
                                 (e.g., "together_ai/Qwen/Qwen2.5-72B-Instruct-Turbo").
        api_key (Optional[str]): API key for the LLM provider. If None, LiteLLM
                                 will try to use corresponding environment variables.
    """
    def __init__(self, model_name: str, api_key: Optional[str] = None, **kwargs):
        super().__init__(model_name=model_name, **kwargs)
        self.model_identifier = model_name
        self.api_key = api_key

        print(f"LiteLLMAdapter initialized for model: {self.model_identifier}")

    async def generate_content(self, request: dict, **kwargs) -> dict:
        """
        Makes an API call using LiteLLM's acompletion.
        `request` is assumed to be a dictionary-like object from ADK's LlmAgent,
        containing a 'messages' field.
        """
        messages = request.get("messages")
        if not messages:
            return {"text": "Error: No messages provided in the request."}

        max_tokens = request.get("max_tokens", RESEARCH_CONFIG.get("maxTokens", 4096))
        temperature = request.get("temperature", 0.7)

        # Construct the model string for LiteLLM, which might need a prefix
        # for specific providers like TogetherAI if not automatically inferred.
        # For TogetherAI, LiteLLM expects "together_ai/" + model_name_from_together.
        # Example: "together_ai/mistralai/Mistral-7B-Instruct-v0.1"
        # We assume self.model_identifier is already correctly formatted for LiteLLM (e.g. includes provider prefix if needed by litellm)
        # Or, we can add it here if MODEL_CONFIG only has the base model names.
        # For TogetherAI, if MODEL_CONFIG.planningModel = "Qwen/Qwen2.5-72B-Instruct-Turbo",
        # then litellm_model_name should be "together_ai/Qwen/Qwen2.5-72B-Instruct-Turbo"

        # Check if model_identifier already has a provider prefix
        if "/" not in self.model_identifier or not self.model_identifier.startswith("together_ai/"):
            # Assuming it's a TogetherAI model if no other provider is specified
            litellm_model_name = f"together_ai/{self.model_identifier}"
        else: # Already includes provider, e.g. "openai/gpt-3.5-turbo"
            litellm_model_name = self.model_identifier

        # LiteLLM uses environment variables for API keys (e.g., TOGETHER_API_KEY).
        # If self.api_key is provided, pass it directly.
        litellm_api_key = self.api_key or TOGETHER_API_KEY # Prioritize instance key, then config/env
        if "YOUR_TOGETHER_API_KEY" in litellm_api_key: # Check if it's still the placeholder
             print(f"Error: Valid API key for {litellm_model_name} is missing.")
             return {"text": f"Error: API key not configured for {litellm_model_name}"}


        print(f"Calling LiteLLM: Model={litellm_model_name}, Messages={messages[:1]}..., MaxTokens={max_tokens}")
        try:
            response = await litellm.acompletion(
                model=litellm_model_name,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                api_key=litellm_api_key if "together_ai/" in litellm_model_name else None, # Only pass if it's for the specific provider
                # Add other parameters as needed by LiteLLM or the specific model
            )

            # Extract content from LiteLLM response
            # LiteLLM standard response format is similar to OpenAI's
            if response.choices and response.choices[0].message and response.choices[0].message.content:
                content = response.choices[0].message.content
                return {"text": content.strip()}
            else:
                print(f"Error: Unexpected response structure from LiteLLM for model {litellm_model_name}: {response}")
                return {"text": "Error: Could not parse LLM response from LiteLLM."}
        except Exception as e:
            # LiteLLM can raise various exceptions, catch broadly or specific ones
            print(f"Error calling LiteLLM API for model {litellm_model_name}: {e}")
            # import traceback; traceback.print_exc() # For more detailed error during dev
            return {"text": f"Error during LiteLLM API call: {str(e)}"}

    async def close(self):
        """LiteLLM doesn't typically require explicit client closing in the same way as httpx."""
        print(f"LiteLLMAdapter for model {self.model_identifier} closed (no-op).")
        pass

    # TODO: Implement stream_content using litellm.acompletion(..., stream=True)
    # async def stream_content(self, request, **kwargs):
    #     # ... setup ...
    #     # response_stream = await litellm.acompletion(..., stream=True)
    #     # async for chunk in response_stream:
    #     #    yield chunk ... (formatted as ADK expects)
    #     pass

# Update LLM instantiations to use LiteLLMAdapter
# The api_key passed to LiteLLMAdapter is optional if TOGETHER_API_KEY env var is set.
# For clarity, we can pass it from config.
planning_llm = LiteLLMAdapter(model_name=MODEL_CONFIG["planningModel"], api_key=TOGETHER_API_KEY)
planning_agent = LlmAgent(
    name="ResearchPlannerAgent",
    description="Generates a research plan and initial search queries based on a topic.",
    llm=planning_llm,
    instruction_provider=lambda ctx: f"{get_current_date_context()}\n{PROMPTS['planningPrompt']}",
)

plan_parsing_llm = LiteLLMAdapter(model_name=MODEL_CONFIG["jsonModel"], api_key=TOGETHER_API_KEY)
plan_parser_agent = LlmAgent(
    name="ResearchPlanParserAgent",
    description="Parses a research plan text to extract structured search queries.",
    llm=plan_parsing_llm,
    instruction_provider=lambda ctx: f"{get_current_date_context()}\n{PROMPTS['planParsingPrompt']}",
    output_schema=ResearchPlan.model_json_schema(),
)

summarization_llm = LiteLLMAdapter(model_name=MODEL_CONFIG["summaryModel"], api_key=TOGETHER_API_KEY)
long_page_summarization_llm = LiteLLMAdapter(model_name=MODEL_CONFIG["summaryModelLongPages"], api_key=TOGETHER_API_KEY)

# This agent would be called per search result.
# The decision to use normal or long page model can be done before calling,
# or the agent itself could have logic if ADK allows such dynamic model switching per call.
# For simplicity, we might have two distinct agents or pass model choice in context.
# Let's assume the calling logic selects the appropriate summarizer.
content_summarizer_agent = LlmAgent(
    name="ContentSummarizerAgent",
    description="Summarizes provided web content in relation to a research query.",
    llm=summarization_llm, # Default model
    instruction_provider=lambda ctx: (
        f"{get_current_date_context()}\n"
        f"{PROMPTS['rawContentSummarizerPrompt']}"
        .replace("<Research Topic>", ctx.state.get("user_content", {}).get("research_topic_for_summary", "Missing Topic"))
        .replace("<Raw Content>", ctx.state.get("user_content", {}).get("raw_content_for_summary", "Missing Content"))
    ),
    # Input: research query and raw content are now expected in ctx.state.user_content by instruction_provider
    # Output: summarized text
)

# --- Evaluation Agent ---
# Evaluates research completeness and suggests new queries.
evaluation_llm = TogetherAIAdapter(model_name=MODEL_CONFIG["planningModel"], api_key=TOGETHER_API_KEY)
evaluation_agent = LlmAgent(
    name="ResearchEvaluatorAgent",
    description="Evaluates current research results and determines if more information is needed, suggesting new queries.",
    llm=evaluation_llm,
    instruction_provider=lambda ctx: (
        f"{get_current_date_context()}\n"
        f"{PROMPTS['evaluationPrompt']}"
        .replace("<Research Topic>", ctx.state.get("user_content", {}).get("research_topic_for_eval", "Missing Topic"))
        .replace("<Search Queries Used>", ctx.state.get("user_content", {}).get("search_queries_used_for_eval", "Missing Queries Used"))
        .replace("<Current Search Results>", ctx.state.get("user_content", {}).get("current_search_results_for_eval", "Missing Results"))
    ),
    # Input: topic, current results, queries used are now expected in ctx.state.user_content by instruction_provider
    # Output: evaluation text (reasoning and new queries)
)

evaluation_parser_llm = TogetherAIAdapter(model_name=MODEL_CONFIG["jsonModel"], api_key=TOGETHER_API_KEY)
evaluation_parser_agent = LlmAgent(
    name="EvaluationParserAgent",
    description="Parses evaluation text to extract additional search queries.",
    llm=evaluation_parser_llm,
    # The prompt for evaluationParsingPrompt is static but expects the evaluation text as the user message.
    instruction_provider=lambda ctx: f"{get_current_date_context()}\n{PROMPTS['evaluationParsingPrompt']}",
    # user_content for this agent will be set by EvaluateResearchAgent to {"evaluation_text_to_parse": current_eval_text}
    output_schema=ResearchPlan.model_json_schema(), # Reusing ResearchPlan for list of queries
)

# --- Final Report Generation Agent ---
report_generation_llm = TogetherAIAdapter(model_name=MODEL_CONFIG["answerModel"], api_key=TOGETHER_API_KEY)
report_generator_agent = LlmAgent(
    name="ReportGeneratorAgent",
    description="Generates a comprehensive final research report from all gathered and summarized search results.",
    llm=report_generation_llm,
    instruction_provider=lambda ctx: (
        f"{get_current_date_context()}\n"
        f"{PROMPTS['answerPrompt']}"
        # The PROMPTS['answerPrompt'] is a system prompt.
        # The user message will contain the topic and search results.
        # In main_agent.py, user_content is set like:
        # context.state["user_content"] = {
        #     "topic": context.state.get("research_topic", self.initial_topic),
        #     "search_results_text": formatted_search_results_for_prompt
        # }
        # So, the LlmAgent will form a user message from this, and the system prompt is static here.
        # This is correct if LlmAgent combines system prompt from instruction_provider
        # and user message from context.state.user_content.
        # No replacement needed in the system prompt itself if it's designed to be general.
        # The original TS code had answerPrompt as system, and topic+results as user message.
        # This lambda provides the system part. ADK handles user message from context.state.user_content.
    ),
    # Input: topic and formatted search_results_text are expected in ctx.state.user_content
    # Output: final report text (Markdown)
    # This agent might support streaming if ADK and TogetherAIAdapter handle it.
    # generate_content_config={"stream": True} # If ADK supports this
)

# --- Image Prompt Generation Agent ---
image_prompt_llm = TogetherAIAdapter(model_name=MODEL_CONFIG["summaryModel"], api_key=TOGETHER_API_KEY) # Using summaryModel as per original TS
image_prompt_generator_agent = LlmAgent(
    name="ImagePromptGeneratorAgent",
    description="Generates a textual prompt for creating a cover image for the research report.",
    llm=image_prompt_llm,
    instruction_provider=lambda ctx: f"{get_current_date_context()}\n{PROMPTS['dataVisualizerPrompt']}",
    # Input: research topic (via context.state)
    # Output: image generation prompt text
)


# Plan Summary Agent (used in original code for UI updates)
plan_summary_llm = TogetherAIAdapter(model_name=MODEL_CONFIG["summaryModel"], api_key=TOGETHER_API_KEY)
plan_summary_agent = LlmAgent(
    name="PlanSummarizerAgent",
    description="Summarizes a detailed research plan into a single short sentence.",
    llm=plan_summary_llm,
    instruction_provider=lambda ctx: f"{get_current_date_context()}\n{PROMPTS['planSummaryPrompt']}",
    # Input: Full plan text (from planning_agent output)
    # Output: Short summary string
)


# Collection of all LLM agents for easy import/management if needed
all_llm_agents = {
    "planner": planning_agent,
    "plan_parser": plan_parser_agent,
    "summarizer": content_summarizer_agent,
    # "long_page_summarizer": would be another instance with long_page_summarization_llm
    "evaluator": evaluation_agent,
    "evaluation_parser": evaluation_parser_agent,
    "report_generator": report_generator_agent,
    "image_prompt_generator": image_prompt_generator_agent,
    "plan_summarizer": plan_summary_agent,
}

# Note: The actual instantiation and usage of these agents will be in main_agent.py and gather_agent.py
# The `llm` parameter in LlmAgent needs a concrete, ADK-compatible LLM instance.
# The TogetherAIAdapter is a conceptual placeholder for how this might be achieved.
# If ADK has a more direct way to use arbitrary model endpoints (e.g., via a generic REST LLM connector),
# that would be preferred.
# The `instruction_provider` can be a simple string or a function that takes context.
# Using a lambda with `get_current_date_context()` ensures prompts are fresh.
# `output_schema` uses Pydantic model's `.model_json_schema()` method, assuming ADK can consume this.

if __name__ == '__main__':
    # This section would be for testing individual agent definitions,
    # but requires a running ADK environment and proper LLM setup.
    print("ADK LLM Agents defined (conceptually).")
    # Example:
    # print(planning_agent.name)
    # print(planning_agent.description)
    # print(ResearchPlan.model_json_schema())
    pass
