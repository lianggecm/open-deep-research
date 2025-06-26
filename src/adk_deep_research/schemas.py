from typing import List, Optional, Literal, Union, Any
from pydantic import BaseModel, Field

# Schemas mirroring TypeScript zod schemas

class ResearchPlan(BaseModel):
    queries: List[str] = Field(description="A list of search queries to thoroughly research the topic")

class SearchResult(BaseModel):
    title: str = Field(description="The title of the search result")
    link: str = Field(description="The URL of the search result") # Consider HttpUrl type
    content: str = Field(description="The content of the web page")
    summary: Optional[str] = Field(None, description="The summary of the web page")

class ResearchState(BaseModel):
    topic: str = Field(description="The topic of the research")
    all_queries: List[str] = Field(default_factory=list, description="A list of all queries used in the research")
    search_results: List[SearchResult] = Field(default_factory=list, description="A list of search results")
    budget: int = Field(description="The budget for the research")
    iteration: int = Field(description="The current iteration of the research")
    # session_id and together_api_key will be passed in context or constructor
    # rather than being part of the serializable state managed by ADK state itself.

# Stream Event Schemas
class BaseEvent(BaseModel):
    type: str
    timestamp: int # milliseconds
    iteration: Optional[int] = None

class PlanningStartedEvent(BaseEvent):
    type: Literal["planning_started"] = "planning_started"
    topic: str

class PlanningCompletedEvent(BaseEvent):
    type: Literal["planning_completed"] = "planning_completed"
    plan: Optional[str] = None
    queries: List[str]

class SearchStartedEvent(BaseEvent):
    type: Literal["search_started"] = "search_started"
    query: str
    iteration: int

class SearchCompletedEvent(BaseEvent):
    type: Literal["search_completed"] = "search_completed"
    query: str
    urls: List[str]
    result_count: int
    iteration: int

class ContentProcessingEvent(BaseEvent):
    type: Literal["content_processing"] = "content_processing"
    url: str
    title: str
    query: str
    content: Optional[str] = None # Original content can be large

class ContentSummarizedEvent(BaseEvent):
    type: Literal["content_summarized"] = "content_summarized"
    url: str
    title: str
    query: str
    summary_first_hundred_chars: Optional[str] = None

class EvaluationStartedEvent(BaseEvent):
    type: Literal["evaluation_started"] = "evaluation_started"
    total_results: int
    iteration: int

class EvaluationCompletedEvent(BaseEvent):
    type: Literal["evaluation_completed"] = "evaluation_completed"
    needs_more: bool
    reasoning: Optional[str] = None
    additional_queries: Optional[List[str]] = Field(default_factory=list)
    iteration: int

class CoverGenerationStartedEvent(BaseEvent):
    type: Literal["cover_generation_started"] = "cover_generation_started"
    prompt: str

class CoverGenerationCompletedEvent(BaseEvent):
    type: Literal["cover_generation_completed"] = "cover_generation_completed"
    cover_image: str # URL

class ReportStartedEvent(BaseEvent):
    type: Literal["report_started"] = "report_started"

class ReportGeneratingEvent(BaseEvent):
    type: Literal["report_generating"] = "report_generating"
    partial_report: str

class ReportGeneratedEvent(BaseEvent):
    type: Literal["report_generated"] = "report_generated"
    report: Optional[str] = None

class IterationCompletedEvent(BaseEvent):
    type: Literal["iteration_completed"] = "iteration_completed"
    iteration: int
    total_results: int

class ResearchCompletedEvent(BaseEvent):
    type: Literal["research_completed"] = "research_completed"
    final_result_count: int
    total_iterations: int

class ErrorEvent(BaseEvent):
    type: Literal["error"] = "error"
    message: str
    step: str
    iteration: Optional[int] = None

StreamEvent = Union[
    PlanningStartedEvent,
    PlanningCompletedEvent,
    SearchStartedEvent,
    SearchCompletedEvent,
    ContentProcessingEvent,
    ContentSummarizedEvent,
    EvaluationStartedEvent,
    EvaluationCompletedEvent,
    CoverGenerationStartedEvent,
    CoverGenerationCompletedEvent,
    ReportStartedEvent,
    ReportGeneratingEvent,
    ReportGeneratedEvent,
    IterationCompletedEvent,
    ResearchCompletedEvent,
    ErrorEvent,
]
