"""
ADK FunctionTools for the Deep Research process.

This module defines tools that provide specific, non-LLM capabilities to ADK agents:
- `web_search_tool`: Performs web searches using Brave Search and scrapes content
  using Firecrawl.
- `image_generation_tool`: Generates images based on text prompts using TogetherAI's
  image generation API (currently mocked with httpx, intended for direct API call or SDK).
- `s3_upload_tool`: Downloads an image from a URL and uploads it to an S3 bucket.

These tools are designed to be invoked by ADK agents and are configured with
necessary parameters and API key handling. Mock implementations for some external
libraries are included for environment independence during initial development.
"""
from adk.tools import FunctionTool
from typing import List, Dict, Any, Optional
import asyncio

from .config import BRAVE_API_KEY, FIRECRAWL_API_KEY, TOGETHER_API_KEY, S3_UPLOAD_BUCKET, S3_UPLOAD_REGION
from .schemas import SearchResult as AdkSearchResult

# Mocking external libraries for development if not installed.
# In a production environment, these should be actual imports and installed dependencies.
try:
    import httpx # For Brave Search and potentially Firecrawl if not using its SDK directly
except ImportError:
    print("httpx library not found. Mocking for Brave search.")
    class MockClient:
        async def get(self, url, headers):
            print(f"Mock HTTPX GET: {url}")
            return MockResponse()
        async def post(self, url, json_data, headers):
            print(f"Mock HTTPX POST: {url}")
            return MockResponse()
        async def __aenter__(self): return self
        async def __aexit__(self, exc_type, exc, tb): pass

    class MockResponse:
        status_code = 200
        def json(self): return {"web": {"results": [{"title": "Mock Result", "url": "https://mock.example.com", "meta_url": {"favicon": ""}}]}}
        def raise_for_status(self): pass
        async def read(self): return b"mock image data"

    httpx = MockClient()


try:
    from firecrawl import FirecrawlApp # Using mendable/firecrawl-js in TS, assuming Python equivalent
except ImportError:
    print("FirecrawlApp library not found. Mocking.")
    class MockFirecrawlApp:
        def __init__(self, apiKey):
            self.apiKey = apiKey
        async def scrape_url(self, url, params): # Adjusted for async
            print(f"Mock Firecrawl scrape_url: {url}")
            # Returning a structure similar to what searchOnWeb expects
            return {"success": True, "markdown": f"Mocked markdown content for {url}", "error": None}
    FirecrawlApp = MockFirecrawlApp

try:
    import boto3 # For S3
except ImportError:
    print("boto3 library not found. Mocking for S3.")
    class MockS3Client:
        def __init__(self, region_name): self.region_name = region_name
        def put_object(self, Bucket, Key, Body, ContentType):
            print(f"Mock S3 PutObject: Bucket={Bucket}, Key={Key}")
    class MockBoto3Session:
        def client(self, service_name, region_name): return MockS3Client(region_name=region_name)

    class MockBoto3:
        def Session(self): return MockBoto3Session()

    boto3 = MockBoto3()


# --- Web Search Tool ---
async def _search_on_web_implementation(query: str, brave_api_key: Optional[str] = None, firecrawl_api_key: Optional[str] = None) -> List[AdkSearchResult]:
    """
    Internal implementation for searching the web.
    1. Uses Brave Search for initial results.
    2. Uses Firecrawl to scrape and get content for each result.
    """
    _brave_api_key = brave_api_key or BRAVE_API_KEY
    _firecrawl_api_key = firecrawl_api_key or FIRECRAWL_API_KEY

    if not _brave_api_key:
        raise ValueError("Brave API Key is required.")
    if not _firecrawl_api_key:
        print("Warning: Firecrawl API Key not provided. Scraping will be mocked or limited.")
        # Allow to proceed with mock if that's the desired behavior when key is missing

    search_results_raw = []
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(
                f"https://api.search.brave.com/res/v1/web/search?q={query}&count=5&result_filter=web",
                headers={
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip",
                    "X-Subscription-Token": _brave_api_key,
                }
            )
            res.raise_for_status()
            response_json = res.json()

            # Basic parsing, assuming structure from original TS code
            if response_json and "web" in response_json and "results" in response_json["web"]:
                for r in response_json["web"]["results"]:
                    search_results_raw.append({
                        "title": r.get("title", "N/A"),
                        "link": r.get("url", ""),
                        # Add other fields if necessary, e.g. favicon
                    })
        except Exception as e:
            print(f"Error during Brave Search API call: {e}")
            return [] # Return empty list on error

    # Scrape each result with Firecrawl
    scraped_results: List[AdkSearchResult] = []
    firecrawl_app = FirecrawlApp(apiKey=_firecrawl_api_key)

    async def scrape_task(sr):
        try:
            # Assuming FirecrawlApp().scrape_url is async or can be run in executor
            # The JS version is promise-based, Python SDK might be async or sync.
            # If sync, it needs to be run in an executor for an async tool function.
            # For now, assuming it's async or we mock it as async.
            scrape_response = await firecrawl_app.scrape_url(sr["link"], params={"pageOptions": {"onlyMainContent": True}}) # Example param

            if scrape_response and scrape_response.get("success"):
                content = scrape_response.get("markdown", "") # Or other formats
                # Simple strip_urls_from_markdown (basic version)
                # A more robust markdown cleaner might be needed
                content = content.replace(f"![{sr['title']}]({sr['link']})", "") # Basic image link removal
                content = content.replace(f"[{sr['title']}]({sr['link']})", sr['title']) # Basic link replacement
                return AdkSearchResult(title=sr["title"], link=sr["link"], content=content[:80000])
            else:
                print(f"Firecrawl failed for {sr['link']}: {scrape_response.get('error')}")
                return None
        except Exception as e:
            print(f"Error scraping {sr['link']} with Firecrawl: {e}")
            return None

    tasks = [scrape_task(sr) for sr in search_results_raw if sr["link"]]
    results = await asyncio.gather(*tasks)

    scraped_results = [r for r in results if r is not None and r.content]

    if not scraped_results:
        print("No content successfully scraped from search results.")
        return []

    return scraped_results

web_search_tool = FunctionTool(
    fn=_search_on_web_implementation,
    name="web_search",
    description="Performs a web search using Brave Search and scrapes content using Firecrawl to answer a query.",
    parameters_schema={
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "The search query."},
            "brave_api_key": {"type": "string", "description": "Optional Brave API Key."},
            "firecrawl_api_key": {"type": "string", "description": "Optional Firecrawl API Key."},
        },
        "required": ["query"],
    },
    returns_schema={
        "type": "array",
        "items": AdkSearchResult.model_json_schema()
    }
)


# --- Image Generation Tool ---
async def _generate_image_implementation(prompt: str, together_api_key: Optional[str] = None, width: int = 1024, height: int = 768, steps: int = 30) -> Dict[str, Any]:
    """
    Internal implementation for generating an image using Together AI.
    Returns a dictionary with image URL or error.
    """
    _together_api_key = together_api_key or TOGETHER_API_KEY
    if not _together_api_key:
        raise ValueError("Together API Key is required for image generation.")

    # Using httpx to call Together AI image generation endpoint
    # This is a simplified representation. The actual Together Python SDK might be different.
    # Assuming a generic API structure if SDK is not used directly or for flexibility.
    # The original code used `togetheraiWithKey(apiKey).images.create({...})`
    # We'll mock a direct API call for now.

    headers = {
        "Authorization": f"Bearer {_together_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "prompt": prompt,
        "model": "black-forest-labs/FLUX.1-dev", # From original TS
        "width": width,
        "height": height,
        "steps": steps,
        # Add other parameters if the API supports them e.g., n, response_format
    }

    image_url = None
    error_message = None

    # This is a placeholder for the actual API call to Together AI's image generation
    # The official Together AI Python library should be used if available and suitable.
    # For now, mocking the interaction:
    print(f"Mock Image Generation Call to Together AI with prompt: {prompt}")
    # Simulate API call and response
    await asyncio.sleep(1) # Simulate network delay

    # Mocked successful response structure based on original TS code:
    # `generatedImage.data[0].url`
    mock_api_response_data = {
        "data": [{"url": f"https://mock.together.ai/images/generated_image_{hash(prompt)}.jpg"}]
    }

    if mock_api_response_data.get("data") and len(mock_api_response_data["data"]) > 0:
        image_url = mock_api_response_data["data"][0].get("url")
    else:
        error_message = "Failed to generate image or parse response."
        print(f"Image generation failed: {error_message}")

    if image_url:
        # In a real scenario, we might want to download the image data if S3 upload is next
        # For now, just returning the URL.
        return {"image_url": image_url, "prompt_used": prompt}
    else:
        return {"error": error_message or "Unknown error during image generation", "prompt_used": prompt}


image_generation_tool = FunctionTool(
    fn=_generate_image_implementation,
    name="generate_image",
    description="Generates an image based on a textual prompt using Together AI.",
    parameters_schema={
        "type": "object",
        "properties": {
            "prompt": {"type": "string", "description": "The textual prompt for image generation."},
            "together_api_key": {"type": "string", "description": "Optional Together API Key."},
            "width": {"type": "integer", "description": "Image width.", "default": 1024},
            "height": {"type": "integer", "description": "Image height.", "default": 768},
            "steps": {"type": "integer", "description": "Number of generation steps.", "default": 30},
        },
        "required": ["prompt"],
    },
    returns_schema={ # Define what this tool returns
        "type": "object",
        "properties": {
            "image_url": {"type": "string", "description": "URL of the generated image."},
            "error": {"type": "string", "description": "Error message if generation failed."},
            "prompt_used": {"type": "string", "description": "The prompt that was used."}
        }
    }
)

# --- S3 Upload Tool (Optional, could be direct Boto3 calls in agent logic) ---
# For simplicity, agent logic can directly use Boto3. If it were more complex or reused, a tool would be good.
# For now, we'll assume direct Boto3 usage in the agent that handles image generation.

async def _upload_image_to_s3_implementation(image_url: str, object_key: str, bucket_name: Optional[str] = None, region_name: Optional[str] = None) -> Dict[str, str]:
    """
    Downloads an image from a URL and uploads it to S3.
    Returns the S3 URL of the uploaded image.
    """
    _bucket_name = bucket_name or S3_UPLOAD_BUCKET
    _region_name = region_name or S3_UPLOAD_REGION

    if not _bucket_name or not _region_name:
        raise ValueError("S3 bucket name and region are required.")

    try:
        # 1. Download the image
        async with httpx.AsyncClient() as client:
            response = await client.get(image_url)
            response.raise_for_status()
            image_data = await response.read() # Get image as bytes

        # 2. Upload to S3
        # Boto3 S3 client operations are typically synchronous.
        # To use in async code, run in a thread pool executor.
        loop = asyncio.get_event_loop()
        s3_client = await loop.run_in_executor(None, lambda: boto3.Session().client('s3', region_name=_region_name))

        await loop.run_in_executor(None, s3_client.put_object,
            Bucket=_bucket_name,
            Key=object_key,
            Body=image_data,
            ContentType='image/jpeg' # Assuming JPEG, adjust if needed
        )

        s3_url = f"https_url_scheme://{_bucket_name}.s3.{_region_name}.amazonaws.com/{object_key}" # Replace https_url_scheme
        s3_url = f"https://{_bucket_name}.s3.{_region_name}.amazonaws.com/{object_key}"


        return {"s3_url": s3_url, "status": "success"}
    except Exception as e:
        print(f"Error uploading image to S3: {e}")
        return {"error": str(e), "status": "failure"}

s3_upload_tool = FunctionTool(
    fn=_upload_image_to_s3_implementation,
    name="upload_image_to_s3",
    description="Downloads an image from a URL and uploads it to an S3 bucket.",
    parameters_schema={
        "type": "object",
        "properties": {
            "image_url": {"type": "string", "description": "The URL of the image to download and upload."},
            "object_key": {"type": "string", "description": "The desired S3 object key (e.g., 'research_covers/image.jpg')."},
            "bucket_name": {"type": "string", "description": "Optional S3 bucket name."},
            "region_name": {"type": "string", "description": "Optional S3 region name."},
        },
        "required": ["image_url", "object_key"],
    },
    returns_schema={
        "type": "object",
        "properties": {
            "s3_url": {"type": "string", "description": "The S3 URL of the uploaded image."},
            "status": {"type": "string", "description": "'success' or 'failure'"},
            "error": {"type": "string", "description": "Error message if upload failed."}
        }
    }
)


# List of all tools for easy import
all_tools = [web_search_tool, image_generation_tool, s3_upload_tool]

if __name__ == '__main__':
    # Example of how to test a tool function (if needed)
    async def test_search():
        results = await _search_on_web_implementation(query="latest AI research trends")
        for res in results:
            print(f"Title: {res.title}, URL: {res.link}, Content Sample: {res.content[:100]}...")

    async def test_image_gen():
        result = await _generate_image_implementation(prompt="A futuristic cityscape")
        print(result)

    async def test_s3_upload():
        # This would require a live image URL and valid S3 credentials in config
        # For example:
        # result = await _upload_image_to_s3_implementation(
        #     image_url="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png", # A real image URL
        #     object_key="test_uploads/google_logo.png"
        # )
        # print(result)
        if not S3_UPLOAD_BUCKET or "YOUR_S3_BUCKET" in S3_UPLOAD_BUCKET :
             print("Skipping S3 upload test: S3_UPLOAD_BUCKET not configured.")
        else:
            print("S3 Upload test would run here if a public image_url was provided and S3 config is valid.")


    # To run tests:
    # asyncio.run(test_search())
    # asyncio.run(test_image_gen())
    # asyncio.run(test_s3_upload())
    pass
